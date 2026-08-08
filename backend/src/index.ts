import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';
import { calculateBookingPrice } from './services/pricingEngine';

dotenv.config();
const PORT = process.env.PORT || 5001;

pool.getConnection()
  .then(async (connection) => {
    console.log('Successfully connected to MySQL database!');
    try {
      await connection.execute("ALTER TABLE specializations ADD COLUMN seniority_level ENUM('junior', 'senior', 'lead_specialist') DEFAULT 'senior'");
    } catch (_e) { /* Column already exists */ }
    try {
      await connection.execute("ALTER TABLE specializations ADD COLUMN tier_multiplier DECIMAL(3,2) DEFAULT 1.15");
    } catch (_e) { /* Column already exists */ }
    try {
      await connection.execute("UPDATE provider_profiles SET tier_multiplier = 1.00 WHERE seniority_level = 'junior'");
      await connection.execute("UPDATE provider_profiles SET tier_multiplier = 1.15 WHERE seniority_level = 'senior'");
      await connection.execute("UPDATE provider_profiles SET tier_multiplier = 1.30 WHERE seniority_level = 'lead_specialist'");
    } catch (_e) {
      // Ignore if table not created yet
    }
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

// POST create new category
app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const cleanName = name.trim();
    const cleanDesc = description ? String(description).trim() : null;
    const cleanIcon = icon && String(icon).trim() ? String(icon).trim() : 'event';

    const [existing]: any = await pool.execute('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [cleanName]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [cleanName, cleanDesc, cleanIcon]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id: result.insertId,
        name: cleanName,
        description: cleanDesc,
        icon: cleanIcon
      }
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid category id' });

    const [result]: any = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET specializations (optional category filter)
app.get('/api/specializations', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    let query = 'SELECT s.*, c.name AS category_name FROM specializations s LEFT JOIN categories c ON s.category_id = c.id';
    const params: any[] = [];
    if (categoryId && !isNaN(categoryId)) {
      query += ' WHERE s.category_id = ?';
      params.push(categoryId);
    }
    query += ' ORDER BY s.id ASC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST create new specialization
app.post('/api/specializations', async (req: Request, res: Response) => {
  try {
    const { category_id, categoryId, name, seniority_level } = req.body;
    const catId = Number(category_id || categoryId);
    if (!catId || isNaN(catId)) return res.status(400).json({ error: 'Valid category_id is required' });
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Specialization name is required' });
    }
    const cleanName = name.trim();
    const level = seniority_level || 'senior';
    const validLevels: Record<string, number> = { junior: 1.00, senior: 1.15, lead_specialist: 1.30 };
    const multiplier = validLevels[level] || 1.15;

    let result: any;
    try {
      const [resArr]: any = await pool.execute(
        'INSERT INTO specializations (category_id, name, seniority_level, tier_multiplier) VALUES (?, ?, ?, ?)',
        [catId, cleanName, level, multiplier]
      );
      result = resArr;
    } catch (_e) {
      const [resArr]: any = await pool.execute(
        'INSERT INTO specializations (category_id, name) VALUES (?, ?)',
        [catId, cleanName]
      );
      result = resArr;
    }

    res.status(201).json({
      message: 'Specialization created successfully',
      specialization: { id: result.insertId, category_id: catId, name: cleanName, seniority_level: level, tier_multiplier: multiplier }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// PUT update specialization seniority tier and multiplier
app.put('/api/specializations/:id/seniority', async (req: Request, res: Response) => {
  try {
    const specId = Number(req.params.id);
    const { seniority_level } = req.body;

    if (!specId || isNaN(specId)) return res.status(400).json({ error: 'Invalid specialization ID' });

    const validLevels: Record<string, number> = { junior: 1.00, senior: 1.15, lead_specialist: 1.30 };
    if (!seniority_level || !validLevels[seniority_level]) {
      return res.status(400).json({ error: 'Invalid seniority_level. Must be junior, senior, or lead_specialist' });
    }

    const multiplier = validLevels[seniority_level];

    // Update specialization row
    const [result]: any = await pool.execute(
      'UPDATE specializations SET seniority_level = ?, tier_multiplier = ? WHERE id = ?',
      [seniority_level, multiplier, specId]
    );

    // Sync all provider profiles linked to this specialization
    await pool.execute(
      'UPDATE provider_profiles SET seniority_level = ?, tier_multiplier = ? WHERE specialization_id = ?',
      [seniority_level, multiplier, specId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Specialization not found' });
    }

    res.json({
      message: 'Specialization fixed tier updated successfully',
      specId,
      seniority_level,
      tier_multiplier: multiplier
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// DELETE specialization
app.delete('/api/specializations/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid specialization id' });
    const [result]: any = await pool.execute('DELETE FROM specializations WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Specialization not found' });
    res.json({ message: 'Specialization deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET services (optional category filter)
app.get('/api/services', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    let query = 'SELECT s.*, c.name AS category_name, sp.name AS specialization_name FROM services s LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN specializations sp ON s.specialization_id = sp.id';
    const params: any[] = [];

    if (categoryId && !isNaN(categoryId)) {
      query += ' WHERE s.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY s.id ASC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST create new service
app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const { category_id, categoryId, specialization_id, specializationId, title, base_price, basePrice, duration_minutes, durationMinutes } = req.body;
    const catId = Number(category_id || categoryId);
    const specId = (specialization_id || specializationId) ? Number(specialization_id || specializationId) : null;
    const price = Number(base_price ?? basePrice);
    const duration = Number(duration_minutes ?? durationMinutes);

    if (!catId || isNaN(catId)) return res.status(400).json({ error: 'Valid category_id is required' });
    if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Service title is required' });
    if (isNaN(price) || price < 0) return res.status(400).json({ error: 'Valid non-negative base_price is required' });
    if (!duration || isNaN(duration) || duration <= 0) return res.status(400).json({ error: 'Valid positive duration_minutes is required' });

    const cleanTitle = title.trim();

    const [result]: any = await pool.execute(
      'INSERT INTO services (category_id, specialization_id, title, base_price, duration_minutes) VALUES (?, ?, ?, ?, ?)',
      [catId, specId, cleanTitle, price, duration]
    );

    res.status(201).json({
      message: 'Service created successfully',
      service: {
        id: result.insertId,
        category_id: catId,
        specialization_id: specId,
        title: cleanTitle,
        base_price: price,
        duration_minutes: duration
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// DELETE service
app.delete('/api/services/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid service id' });
    const [result]: any = await pool.execute('DELETE FROM services WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
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

const updateSeniorityHandler = async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.id);
    const { seniority_level } = req.body;

    if (!providerId || isNaN(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    const validLevels: Record<string, number> = {
      junior: 1.00,
      senior: 1.15,
      lead_specialist: 1.30
    };

    if (!seniority_level || !validLevels[seniority_level]) {
      return res.status(400).json({ error: 'Invalid seniority_level. Must be junior, senior, or lead_specialist' });
    }

    const multiplier = validLevels[seniority_level];

    const [result]: any = await pool.execute(
      'UPDATE provider_profiles SET seniority_level = ?, tier_multiplier = ? WHERE user_id = ?',
      [seniority_level, multiplier, providerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    res.json({
      message: 'Provider seniority updated successfully',
      providerId,
      seniority_level,
      tier_multiplier: multiplier
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.put('/api/providers/:id/seniority', updateSeniorityHandler);
app.put('/api/doctors/:id/seniority', updateSeniorityHandler);

const addProviderHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, category_id, specialization_id, seniority_level, consultation_fee, bio } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!category_id || isNaN(Number(category_id))) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Check if email already exists
    const [existing]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const providerRole = (role === 'provider' || role === 'doctor') ? role : 'doctor';
    const userPassword = password && password.trim() ? password.trim() : 'doctor123';

    // Insert user
    const [userResult]: any = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), userPassword, providerRole]
    );

    const userId = userResult.insertId;

    // Calculate seniority tier multiplier
    const validLevels: Record<string, number> = {
      junior: 1.00,
      senior: 1.15,
      lead_specialist: 1.30
    };
    const sLevel = (seniority_level && validLevels[seniority_level]) ? seniority_level : 'senior';
    const multiplier = validLevels[sLevel];
    const fee = consultation_fee !== undefined && !isNaN(Number(consultation_fee)) ? Number(consultation_fee) : 100.00;
    const specId = specialization_id && !isNaN(Number(specialization_id)) ? Number(specialization_id) : null;

    // Insert provider profile
    await pool.execute(
      'INSERT INTO provider_profiles (user_id, category_id, specialization_id, seniority_level, tier_multiplier, bio, consultation_fee) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, Number(category_id), specId, sLevel, multiplier, bio || null, fee]
    );

    res.status(201).json({
      message: 'Doctor / Staff member added successfully',
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: providerRole,
      category_id: Number(category_id),
      specialization_id: specId,
      seniority_level: sLevel,
      tier_multiplier: multiplier,
      consultation_fee: fee,
      bio: bio || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.post('/api/providers', addProviderHandler);
app.post('/api/doctors', addProviderHandler);

const deleteProviderHandler = async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.id);
    if (!providerId || isNaN(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }

    const [result]: any = await pool.execute(
      "DELETE FROM users WHERE id = ? AND role IN ('provider', 'doctor')",
      [providerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Doctor / Staff record not found' });
    }

    res.json({ message: 'Doctor / Staff member removed successfully', id: providerId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.delete('/api/providers/:id', deleteProviderHandler);
app.delete('/api/doctors/:id', deleteProviderHandler);

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

app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (role && (role === 'admin' || role === 'provider' || role === 'doctor')) {
      return res.status(400).json({
        error: 'Public registration is restricted to Client accounts only. Admin and Provider accounts must be created by an Administrator.'
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const [existing]: any = await pool.execute('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [cleanName, cleanEmail, password, 'client']
    );

    const userId = result.insertId;

    res.status(201).json({
      message: 'Client registration successful!',
      token: `jwt-token-${userId}`,
      role: 'client',
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: 'client'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed. Internal server error.' });
  }
});

app.get('/api/add-ons', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;
    let query = 'SELECT ao.*, c.name AS category_name FROM add_ons ao LEFT JOIN categories c ON ao.category_id = c.id';
    const params: any[] = [];

    if (serviceId && !isNaN(serviceId)) {
      const [svcRows]: any = await pool.execute('SELECT category_id FROM services WHERE id = ?', [serviceId]);
      if (svcRows && svcRows.length > 0 && svcRows[0].category_id) {
        query += ' WHERE ao.category_id = ? OR ao.category_id IS NULL';
        params.push(svcRows[0].category_id);
      }
    } else if (categoryId && !isNaN(categoryId)) {
      query += ' WHERE ao.category_id = ? OR ao.category_id IS NULL';
      params.push(categoryId);
    }

    query += ' ORDER BY ao.id ASC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST create new add-on
app.post('/api/add-ons', async (req: Request, res: Response) => {
  try {
    const { category_id, categoryId, title, description, price, duration_minutes, durationMinutes } = req.body;
    const catId = (category_id || categoryId) ? Number(category_id || categoryId) : null;
    const itemPrice = Number(price);
    const duration = (duration_minutes ?? durationMinutes) ? Number(duration_minutes ?? durationMinutes) : 0;

    if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Add-on title is required' });
    if (isNaN(itemPrice) || itemPrice < 0) return res.status(400).json({ error: 'Valid non-negative price is required' });

    const cleanTitle = title.trim();
    const cleanDesc = description ? String(description).trim() : null;

    let insertId: number;
    try {
      const [result]: any = await pool.execute(
        'INSERT INTO add_ons (category_id, title, description, price) VALUES (?, ?, ?, ?)',
        [catId, cleanTitle, cleanDesc, itemPrice]
      );
      insertId = result.insertId;
    } catch (_err: any) {
      const [result]: any = await pool.execute(
        'INSERT INTO add_ons (category_id, title, description, price, duration_minutes) VALUES (?, ?, ?, ?, ?)',
        [catId, cleanTitle, cleanDesc, itemPrice, duration]
      );
      insertId = result.insertId;
    }

    res.status(201).json({
      message: 'Add-on created successfully',
      addOn: {
        id: insertId,
        category_id: catId,
        title: cleanTitle,
        description: cleanDesc,
        price: itemPrice
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// DELETE add-on
app.delete('/api/add-ons/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid add-on id' });
    const [result]: any = await pool.execute('DELETE FROM add_ons WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Add-on not found' });
    res.json({ message: 'Add-on deleted successfully' });
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

