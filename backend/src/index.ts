import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';
import { calculateBookingPrice } from './services/pricingEngine';

dotenv.config();
const PORT = process.env.PORT || 5001;

pool.getConnection()
  .then((connection) => {
    console.log('Successfully connected to MySQL database!');
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

const app = express();
app.use(cors());
app.use(express.json());

// GET all appointment categories
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET services (optional category filter)
app.get('/api/services', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    let query = 'SELECT * FROM services';
    const params: any[] = [];

    if (categoryId && !isNaN(categoryId)) {
      query += ' WHERE category_id = ?';
      params.push(categoryId);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET providers / specialists (optional categoryId or serviceId filter)
const getProvidersHandler = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;

    let query = `
      SELECT u.id, u.name, u.email, u.role, 
             pp.consultation_fee, pp.seniority_level, pp.tier_multiplier, pp.category_id, pp.specialization_id, 
             c.name AS category_name, c.icon AS category_icon, sp.name AS specialization_name
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN specializations sp ON pp.specialization_id = sp.id
      WHERE u.role IN ('provider', 'doctor')
    `;
    const params: any[] = [];

    if (serviceId && !isNaN(serviceId)) {
      const [svcRows]: any = await pool.execute('SELECT category_id, specialization_id FROM services WHERE id = ?', [serviceId]);
      if (svcRows && svcRows.length > 0) {
        const svc = svcRows[0];
        if (svc.specialization_id) {
          const [specProviders]: any = await pool.execute(query + ` AND pp.specialization_id = ?`, [svc.specialization_id]);
          if (specProviders && specProviders.length > 0) {
            return res.json(specProviders);
          }
        }
        if (svc.category_id) {
          query += ` AND pp.category_id = ?`;
          params.push(svc.category_id);
        }
      }
    } else if (categoryId && !isNaN(categoryId)) {
      query += ` AND pp.category_id = ?`;
      params.push(categoryId);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.get('/api/providers', getProvidersHandler);
app.get('/api/doctors', getProvidersHandler);

// GET provider's appointments for a given date (used for slot calculations)
const getProviderAppointmentsHandler = async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.id);
    const date = req.query.date as string; // expected YYYY-MM-DD
    if (!providerId) return res.status(400).json({ error: 'Invalid provider id' });
    if (!date) return res.status(400).json({ error: 'Missing date param' });

    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const [rows] = await pool.execute(
      `SELECT id, 
              DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') AS start_time, 
              DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') AS end_time, 
              status 
       FROM appointments 
       WHERE (provider_id = ? OR doctor_id = ?) AND start_time BETWEEN ? AND ?`,
      [providerId, providerId, startOfDay, endOfDay]
    );

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.get('/api/providers/:id/appointments', getProviderAppointmentsHandler);
app.get('/api/doctors/:id/appointments', getProviderAppointmentsHandler);

app.get('/api/appointments/admin', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.id, a.start_time, a.end_time, a.status, a.total_amount, 
             c.name AS client_name, p.name AS doctor_name, p.name AS provider_name, s.title AS service_title, cat.name AS category_name
      FROM appointments a 
      JOIN users c ON a.client_id = c.id 
      JOIN users p ON a.provider_id = p.id 
      JOIN services s ON a.service_id = s.id 
      LEFT JOIN categories cat ON a.category_id = cat.id
      ORDER BY a.start_time DESC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/appointments/doctor', async (req: Request, res: Response) => {
  try {
    const doctorId = req.query.doctorId || req.query.providerId;
    let query = `
      SELECT a.id, a.client_id, a.provider_id AS doctor_id, a.provider_id, a.service_id, a.category_id,
             DATE_FORMAT(a.start_time, '%Y-%m-%d %H:%i:%s') AS start_time, 
             DATE_FORMAT(a.end_time, '%Y-%m-%d %H:%i:%s') AS end_time, 
             a.status, 
             COALESCE(a.cancellation_reason, 'Cancelled by provider') AS cancellation_reason, 
             a.clinical_notes, a.prescription,
             a.total_amount, a.base_amount, a.tax_amount,
             u.name AS client_name, u.email AS client_email, s.title AS service_title, cat.name AS category_name,
             (
               SELECT GROUP_CONCAT(CONCAT(ao.title, ' ($', ao.price, ')') SEPARATOR ', ')
               FROM appointment_add_ons aao
               JOIN add_ons ao ON aao.add_on_id = ao.id
               WHERE aao.appointment_id = a.id
             ) AS add_ons_summary,
             (
               SELECT GROUP_CONCAT(aao.add_on_id)
               FROM appointment_add_ons aao
               WHERE aao.appointment_id = a.id
             ) AS attached_add_on_ids
      FROM appointments a 
      JOIN users u ON a.client_id = u.id 
      JOIN services s ON a.service_id = s.id 
      LEFT JOIN categories cat ON a.category_id = cat.id
    `;
    const params: any[] = [];

    if (doctorId) {
      query += ` WHERE (a.provider_id = ? OR a.doctor_id = ?)`;
      params.push(doctorId, doctorId);
    }

    query += ` ORDER BY a.start_time ASC`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/appointments/client', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.id, a.start_time, a.end_time, a.status, a.cancellation_reason, a.total_amount, 
             u.name AS doctor_name, u.name AS provider_name, s.title AS service_title, cat.name AS category_name, cat.icon AS category_icon
      FROM appointments a 
      JOIN users u ON a.provider_id = u.id 
      JOIN services s ON a.service_id = s.id 
      LEFT JOIN categories cat ON a.category_id = cat.id
      ORDER BY a.start_time DESC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments/status', async (req: Request, res: Response) => {
  try {
    const { appointmentId, status, cancellationReason, cancellation_reason } = req.body;
    const reason = status === 'cancelled' ? (cancellationReason || cancellation_reason || 'Cancelled by provider') : null;
    await pool.execute(
      'UPDATE appointments SET status = ?, cancellation_reason = ? WHERE id = ?', 
      [status, reason, appointmentId]
    );
    res.json({ message: 'Appointment status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments/add-ons', async (req: Request, res: Response) => {
  try {
    const { appointmentId, addOnIds } = req.body;

    if (!appointmentId || !Array.isArray(addOnIds) || addOnIds.length === 0) {
      return res.status(400).json({ error: 'Missing appointmentId or addOnIds' });
    }

    const [appts]: any = await pool.execute(
      "SELECT service_id, provider_id, doctor_id, DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') AS start_time FROM appointments WHERE id = ?", 
      [appointmentId]
    );
    if (!appts || appts.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = appts[0];

    const [existingAddOns]: any = await pool.execute(
      'SELECT add_on_id FROM appointment_add_ons WHERE appointment_id = ?', 
      [appointmentId]
    );
    const existingIds = existingAddOns.map((r: any) => Number(r.add_on_id));

    // Deduplicate incoming add-on IDs and exclude add-ons already attached to this appointment
    const uniqueIncomingIds = Array.from(new Set(addOnIds.map(Number)));
    const newAddOnIds = uniqueIncomingIds.filter(id => !existingIds.includes(id));

    if (newAddOnIds.length === 0) {
      return res.status(400).json({ error: 'Selected add-ons are already attached to this appointment' });
    }

    const allAddOnIds = Array.from(new Set([...existingIds, ...newAddOnIds]));

    const pricing = await calculateBookingPrice({
      serviceId: appt.service_id,
      providerId: appt.provider_id || appt.doctor_id,
      addOnIds: allAddOnIds,
      startTimeStr: appt.start_time
    });

    for (const addOnId of newAddOnIds) {
      const [addOnRows]: any = await pool.execute('SELECT price FROM add_ons WHERE id = ?', [addOnId]);
      const price = addOnRows && addOnRows.length > 0 ? Number(addOnRows[0].price) : 0;
      await pool.execute(
        'INSERT INTO appointment_add_ons (appointment_id, add_on_id, price_applied) VALUES (?, ?, ?)',
        [appointmentId, addOnId, price]
      );
    }

    await pool.execute(
      'UPDATE appointments SET base_amount = ?, tax_amount = ?, total_amount = ? WHERE id = ?',
      [pricing.subtotal, pricing.taxAmount, pricing.totalAmount, appointmentId]
    );

    const [updatedAddOns]: any = await pool.execute(
      `SELECT GROUP_CONCAT(CONCAT(ao.title, ' (₹', ao.price, ')') SEPARATOR ', ') AS add_ons_summary,
              GROUP_CONCAT(aao.add_on_id) AS attached_add_on_ids
       FROM appointment_add_ons aao
       JOIN add_ons ao ON aao.add_on_id = ao.id
       WHERE aao.appointment_id = ?`,
      [appointmentId]
    );

    const summary = updatedAddOns[0]?.add_ons_summary || null;
    const attachedIdsStr = updatedAddOns[0]?.attached_add_on_ids || allAddOnIds.join(',');

    res.json({ 
      message: 'Add-ons attached successfully', 
      pricing,
      attached_add_on_ids: attachedIdsStr,
      add_ons_summary: summary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt received:', { email });

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const [rows]: any = await pool.execute('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const storedPassword = user.password_hash ?? user.password ?? '';

    const passwordMatches = password === storedPassword;

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      token: `jwt-token-${user.id}`,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/add-ons', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;
    let query = 'SELECT * FROM add_ons';
    const params: any[] = [];

    if (serviceId && !isNaN(serviceId)) {
      const [svcRows]: any = await pool.execute('SELECT category_id FROM services WHERE id = ?', [serviceId]);
      if (svcRows && svcRows.length > 0 && svcRows[0].category_id) {
        query += ' WHERE category_id = ? OR category_id IS NULL';
        params.push(svcRows[0].category_id);
      }
    } else if (categoryId && !isNaN(categoryId)) {
      query += ' WHERE category_id = ? OR category_id IS NULL';
      params.push(categoryId);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/calculate-price', async (req: Request, res: Response) => {
  try {
    const { serviceId, providerId, doctorId, addOnIds, startTime } = req.body;
    const targetProviderId = providerId || doctorId;
    const pricing = await calculateBookingPrice({
      serviceId: Number(serviceId),
      providerId: targetProviderId ? Number(targetProviderId) : undefined,
      addOnIds: Array.isArray(addOnIds) ? addOnIds.map(Number) : [],
      startTimeStr: startTime
    });
    res.json(pricing);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const { clientId, providerId: pIdInput, doctorId: dIdInput, serviceId, categoryId: catIdInput, addOnIds, startTime, status } = req.body;
    const providerId = pIdInput || dIdInput;

    if (!clientId || !providerId || !serviceId || !startTime) {
      return res.status(400).json({ error: 'Missing required appointment details' });
    }

    // Resolve categoryId if not passed directly
    let categoryId = catIdInput ? Number(catIdInput) : null;
    if (!categoryId) {
      const [svcRows]: any = await pool.execute('SELECT category_id FROM services WHERE id = ?', [serviceId]);
      if (svcRows && svcRows.length > 0) {
        categoryId = svcRows[0].category_id;
      } else {
        categoryId = 1;
      }
    }

    const pricing = await calculateBookingPrice({
      serviceId: Number(serviceId),
      providerId: Number(providerId),
      addOnIds: Array.isArray(addOnIds) ? addOnIds.map(Number) : [],
      startTimeStr: String(startTime)
    });

    const durationMinutes = pricing.durationMinutes || 60;
    const start = new Date(String(startTime).includes('T') ? startTime : String(startTime).replace(' ', 'T'));
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startTimeStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}:${pad(start.getSeconds())}`;
    const endTimeStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`;

    // Enforce max 10 appointments quota per service per client
    const [quotaRows]: any = await pool.execute(
      `SELECT COUNT(*) AS activeCount FROM appointments 
       WHERE client_id = ? AND service_id = ? 
         AND status IN ('confirmed', 'pending', 'completed')`,
      [clientId, serviceId]
    );

    const activeCount = quotaRows[0]?.activeCount || 0;
    if (activeCount >= 10) {
      return res.status(400).json({ error: 'Max appt quota over' });
    }

    // Enforce double-booking validation
    const [existingRows]: any = await pool.execute(
      `SELECT id FROM appointments 
       WHERE (provider_id = ? OR doctor_id = ?) 
         AND status IN ('confirmed', 'pending', 'completed', 'blocked')
         AND (start_time < ? AND end_time > ?)`,
      [providerId, providerId, endTimeStr, startTimeStr]
    );

    if (existingRows && existingRows.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked for this specialist. Please select another slot.' });
    }

    const initialStatus = status || 'confirmed';

    const [result]: any = await pool.execute(
      `INSERT INTO appointments (client_id, provider_id, doctor_id, service_id, category_id, start_time, end_time, base_amount, tax_amount, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, providerId, providerId, serviceId, categoryId, startTimeStr, endTimeStr, pricing.subtotal, pricing.taxAmount, pricing.totalAmount, initialStatus]
    );

    const appointmentId = result.insertId;

    if (Array.isArray(addOnIds) && addOnIds.length > 0 && appointmentId) {
      for (const addOnId of addOnIds) {
        const [addOnRows]: any = await pool.execute('SELECT price FROM add_ons WHERE id = ?', [addOnId]);
        const price = addOnRows && addOnRows.length > 0 ? Number(addOnRows[0].price) : 0;
        await pool.execute(
          'INSERT INTO appointment_add_ons (appointment_id, add_on_id, price_applied) VALUES (?, ?, ?)',
          [appointmentId, addOnId, price]
        );
      }
    }

    res.status(201).json({ message: 'Appointment booked successfully', appointmentId, pricing, status: initialStatus });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation Error' });
  }
});

app.post('/api/appointments/complete', async (req: Request, res: Response) => {
  try {
    const { appointmentId, clinicalNotes, prescription } = req.body;
    if (!appointmentId) return res.status(400).json({ error: 'Missing appointmentId' });

    await pool.execute(
      'UPDATE appointments SET status = "completed", clinical_notes = ?, prescription = ? WHERE id = ?',
      [clinicalNotes || null, prescription || null, appointmentId]
    );

    res.json({ message: 'Session marked as completed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments/block-slot', async (req: Request, res: Response) => {
  try {
    const { doctorId, providerId, startTime, breakReason } = req.body;
    const targetProviderId = providerId || doctorId;
    if (!targetProviderId || !startTime) return res.status(400).json({ error: 'Missing providerId or startTime' });

    let startTimeStr = String(startTime).trim();
    if (startTimeStr.length === 10) {
      startTimeStr = `${startTimeStr} 09:00:00`;
    }
    const datePart = startTimeStr.slice(0, 10);
    const hourNum = parseInt(startTimeStr.slice(11, 13), 10);
    const endHourStr = (hourNum + 1).toString().padStart(2, '0');
    const endTimeStr = `${datePart} ${endHourStr}:00:00`;
    const reason = breakReason || 'Provider Break / Off-Duty';

    const [result]: any = await pool.execute(
      `INSERT INTO appointments (client_id, provider_id, doctor_id, service_id, category_id, start_time, end_time, base_amount, tax_amount, total_amount, status, cancellation_reason)
       VALUES (?, ?, ?, 1, 1, ?, ?, 0.00, 0.00, 0.00, 'blocked', ?)`,
      [targetProviderId, targetProviderId, targetProviderId, startTimeStr, endTimeStr, reason]
    );

    res.json({ message: 'Time slot blocked successfully', appointmentId: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments/unblock-slot', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ error: 'Missing appointmentId' });

    await pool.execute(
      'DELETE FROM appointments WHERE id = ? AND status = "blocked"',
      [appointmentId]
    );

    res.json({ message: 'Time slot unblocked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/patient/history', async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.query.clientId);
    const requestorId = req.query.requestorId ? Number(req.query.requestorId) : null;
    if (!clientId || isNaN(clientId)) return res.status(400).json({ error: 'Invalid or missing clientId' });

    let query = `
      SELECT a.id, a.service_id, 
             DATE_FORMAT(a.start_time, '%Y-%m-%d %H:%i:%s') AS start_time, 
             DATE_FORMAT(a.end_time, '%Y-%m-%d %H:%i:%s') AS end_time, 
             a.status, a.clinical_notes, a.prescription,
             a.cancellation_reason, a.total_amount,
             u.name AS doctor_name, u.name AS provider_name, s.title AS service_title,
             cat.id AS category_id, cat.name AS category_name, cat.icon AS category_icon,
             (
               SELECT GROUP_CONCAT(CONCAT(ao.title, ' ($', ao.price, ')') SEPARATOR ', ')
               FROM appointment_add_ons aao
               JOIN add_ons ao ON aao.add_on_id = ao.id
               WHERE aao.appointment_id = a.id
             ) AS add_ons_summary
      FROM appointments a
      JOIN users u ON a.provider_id = u.id
      JOIN services s ON a.service_id = s.id
      LEFT JOIN categories cat ON a.category_id = cat.id
      WHERE a.client_id = ?
    `;
    const params: any[] = [clientId];

    // If requested by a provider (requestorId != clientId), enforce completed-only & single-category isolation
    if (requestorId && requestorId !== clientId) {
      query += ` AND a.status = 'completed'`;
      const [provRows]: any = await pool.execute('SELECT category_id FROM provider_profiles WHERE user_id = ?', [requestorId]);
      if (provRows && provRows.length > 0) {
        const provCategory = provRows[0].category_id;
        query += ` AND a.category_id = ?`;
        params.push(provCategory);
      }
    }

    query += ` ORDER BY a.start_time DESC`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

