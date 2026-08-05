import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';
import { calculateBookingPrice } from './services/pricingEngine';

dotenv.config();
const PORT = process.env.PORT || 5001;

// Test database connection
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

app.get('/api/services', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM services');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/doctors', async (req: Request, res: Response) => {
  try {
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;
    let query = `
      SELECT u.id, u.name, u.email, dp.seniority_level, dp.tier_multiplier, sp.name AS specialization_name
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      LEFT JOIN specializations sp ON dp.specialization_id = sp.id
      WHERE u.role = 'doctor'
    `;
    const params: any[] = [];

    if (serviceId && !isNaN(serviceId)) {
      query += ` AND dp.specialization_id = (SELECT specialization_id FROM services WHERE id = ?)`;
      params.push(serviceId);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/appointments/admin', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.id, a.start_time, a.end_time, a.status, a.total_amount, 
             c.name AS client_name, d.name AS doctor_name, s.title AS service_title 
      FROM appointments a 
      JOIN users c ON a.client_id = c.id 
      JOIN users d ON a.doctor_id = d.id 
      JOIN services s ON a.service_id = s.id 
      ORDER BY a.start_time DESC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/appointments/doctor', async (req: Request, res: Response) => {
  try {
    const doctorId = req.query.doctorId;
    let query = `
      SELECT a.id, a.client_id, a.doctor_id, a.service_id, 
             DATE_FORMAT(a.start_time, '%Y-%m-%d %H:%i:%s') AS start_time, 
             DATE_FORMAT(a.end_time, '%Y-%m-%d %H:%i:%s') AS end_time, 
             a.status, 
             COALESCE(a.cancellation_reason, 'Cancelled by doctor due to schedule overlap') AS cancellation_reason, 
             a.clinical_notes, a.prescription,
             a.total_amount, a.base_amount, a.tax_amount,
             u.name AS client_name, u.email AS client_email, s.title AS service_title,
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
    `;
    const params: any[] = [];

    if (doctorId) {
      query += ` WHERE a.doctor_id = ?`;
      params.push(doctorId);
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
             u.name AS doctor_name, s.title AS service_title 
      FROM appointments a 
      JOIN users u ON a.doctor_id = u.id 
      JOIN services s ON a.service_id = s.id 
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
    const reason = status === 'cancelled' ? (cancellationReason || cancellation_reason || 'Cancelled by doctor') : null;
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

    // 1. Fetch appointment details
    const [appts]: any = await pool.execute(
      'SELECT service_id, doctor_id, start_time FROM appointments WHERE id = ?', 
      [appointmentId]
    );
    if (!appts || appts.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = appts[0];

    // 2. Fetch existing add-ons for this appointment
    const [existingAddOns]: any = await pool.execute(
      'SELECT add_on_id FROM appointment_add_ons WHERE appointment_id = ?', 
      [appointmentId]
    );
    const existingIds = existingAddOns.map((r: any) => Number(r.add_on_id));

    // Combine newly selected add-ons avoiding duplicates
    const newAddOnIds = addOnIds.map(Number).filter(id => !existingIds.includes(id));
    const allAddOnIds = Array.from(new Set([...existingIds, ...addOnIds.map(Number)]));

    // 3. Recalculate appointment dynamic pricing using pricing engine
    const pricing = await calculateBookingPrice({
      serviceId: appt.service_id,
      doctorId: appt.doctor_id,
      addOnIds: allAddOnIds,
      startTimeStr: appt.start_time
    });

    // 4. Insert new add-on rows
    for (const addOnId of newAddOnIds) {
      const [addOnRows]: any = await pool.execute('SELECT price FROM add_ons WHERE id = ?', [addOnId]);
      const price = addOnRows && addOnRows.length > 0 ? Number(addOnRows[0].price) : 0;
      await pool.execute(
        'INSERT INTO appointment_add_ons (appointment_id, add_on_id, price_applied) VALUES (?, ?, ?)',
        [appointmentId, addOnId, price]
      );
    }

    // 5. Update appointment amounts in MySQL
    await pool.execute(
      'UPDATE appointments SET base_amount = ?, tax_amount = ?, total_amount = ? WHERE id = ?',
      [pricing.subtotal, pricing.taxAmount, pricing.totalAmount, appointmentId]
    );

    res.json({ message: 'Add-ons attached successfully', pricing });
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

    // Strict Database Password Check
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

app.get('/api/add-ons', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM add_ons');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/calculate-price', async (req: Request, res: Response) => {
  try {
    const { serviceId, doctorId, addOnIds, startTime } = req.body;
    const pricing = await calculateBookingPrice({
      serviceId: Number(serviceId),
      doctorId: doctorId ? Number(doctorId) : undefined,
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
    const { clientId, doctorId, serviceId, addOnIds, startTime, status } = req.body;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60000); // 1-hour slot default
    const endTimeStr = end.toISOString().slice(0, 19).replace('T', ' ');
    const startTimeStr = start.toISOString().slice(0, 19).replace('T', ' ');

    // Validate doctor specialization against service requirement and calculate price
    const pricing = await calculateBookingPrice({
      serviceId: Number(serviceId),
      doctorId: Number(doctorId),
      addOnIds: Array.isArray(addOnIds) ? addOnIds.map(Number) : [],
      startTimeStr
    });

    const initialStatus = status || 'pending';

    const [result]: any = await pool.execute(
      `INSERT INTO appointments (client_id, doctor_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, doctorId, serviceId, startTimeStr, endTimeStr, pricing.subtotal, pricing.taxAmount, pricing.totalAmount, initialStatus]
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

    res.json({ message: 'Consultation marked as completed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/appointments/block-slot', async (req: Request, res: Response) => {
  try {
    const { doctorId, startTime, breakReason } = req.body;
    if (!doctorId || !startTime) return res.status(400).json({ error: 'Missing doctorId or startTime' });

    let startTimeStr = String(startTime).trim();
    if (startTimeStr.length === 10) {
      startTimeStr = `${startTimeStr} 09:00:00`;
    }
    const datePart = startTimeStr.slice(0, 10);
    const hourNum = parseInt(startTimeStr.slice(11, 13), 10);
    const endHourStr = (hourNum + 1).toString().padStart(2, '0');
    const endTimeStr = `${datePart} ${endHourStr}:00:00`;
    const reason = breakReason || 'Doctor Break / Off-Duty';

    // Insert blocked slot appointment record
    const [result]: any = await pool.execute(
      `INSERT INTO appointments (client_id, doctor_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status, cancellation_reason)
       VALUES (?, ?, 1, ?, ?, 0.00, 0.00, 0.00, 'blocked', ?)`,
      [doctorId, doctorId, startTimeStr, endTimeStr, reason]
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
    if (!clientId || isNaN(clientId)) return res.status(400).json({ error: 'Invalid or missing clientId' });

    const [rows] = await pool.execute(`
      SELECT a.id, 
             DATE_FORMAT(a.start_time, '%Y-%m-%d %H:%i:%s') AS start_time, 
             DATE_FORMAT(a.end_time, '%Y-%m-%d %H:%i:%s') AS end_time, 
             a.status, a.clinical_notes, a.prescription,
             a.cancellation_reason, a.total_amount,
             u.name AS doctor_name, s.title AS service_title,
             (
               SELECT GROUP_CONCAT(CONCAT(ao.title, ' ($', ao.price, ')') SEPARATOR ', ')
               FROM appointment_add_ons aao
               JOIN add_ons ao ON aao.add_on_id = ao.id
               WHERE aao.appointment_id = a.id
             ) AS add_ons_summary
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = ?
      ORDER BY a.start_time DESC
    `, [clientId]);

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
