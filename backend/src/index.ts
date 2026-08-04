import http, { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import pool from './config/db';
import { calculateBookingPrice } from './services/pricingEngine';

dotenv.config();
const PORT = process.env.PORT || 5001;



// Test database connection
pool.getConnection()
  .then((connection) => {
    console.log(' Successfully connected to MySQL database!');
    connection.release();
  })
  .catch((err) => {
    console.error(' Database connection failed:', err.message);
  });

const parseBody = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); } 
            catch (error) { reject(error); }
        });
    });
};

const sendJSON = (res: ServerResponse, statusCode: number, data: any) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
};

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const url = req.url || '';
    const method = req.method || '';

    try {
        if (url === '/api/services' && method === 'GET') {
            const [rows] = await pool.execute('SELECT * FROM services');
            
            return sendJSON(res, 200, rows);
        }

        if (url === '/api/doctors' && method === 'GET') {
            const [rows] = await pool.execute("SELECT id, name, email FROM users WHERE role = 'doctor'");
            return sendJSON(res, 200, rows);
        }

        if (url.startsWith('/api/appointments/admin') && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT a.id, a.start_time, a.end_time, a.status, a.total_amount, 
                       c.name AS client_name, d.name AS doctor_name, s.title AS service_title 
                FROM appointments a 
                JOIN users c ON a.client_id = c.id 
                JOIN users d ON a.doctor_id = d.id 
                JOIN services s ON a.service_id = s.id 
                ORDER BY a.start_time DESC
            `);
            return sendJSON(res, 200, rows);
        }

        if (url.startsWith('/api/appointments/doctor') && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT a.id, a.start_time, a.end_time, a.status, a.total_amount, 
                       u.name AS client_name, s.title AS service_title 
                FROM appointments a 
                JOIN users u ON a.client_id = u.id 
                JOIN services s ON a.service_id = s.id 
                ORDER BY a.start_time DESC
            `);
            return sendJSON(res, 200, rows);
        }

        if (url.startsWith('/api/appointments/client') && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT a.id, a.start_time, a.end_time, a.status, a.total_amount, 
                       u.name AS doctor_name, s.title AS service_title 
                FROM appointments a 
                JOIN users u ON a.doctor_id = u.id 
                JOIN services s ON a.service_id = s.id 
                ORDER BY a.start_time DESC
            `);
            return sendJSON(res, 200, rows);
        }

        if (url === '/api/appointments/status' && method === 'POST') {
            const body = await parseBody(req);
            const { appointmentId, status } = body;
            await pool.execute(
                'UPDATE appointments SET status = ? WHERE id = ?',
                [status, appointmentId]
            );
            return sendJSON(res, 200, { message: 'Appointment status updated successfully' });
        }
        
        if (url === '/api/login' && method === 'POST') {
            const body = await parseBody(req);
            console.log('Login attempt received:', body); // Add this line
            const { email, password } = body;

            const [rows]: any = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return sendJSON(res, 401, { error: 'Invalid email or password' });
            }

            const user = rows[0];
            const storedPassword = user.password ?? user.password_hash ?? '';
            const passwordMatches = password === storedPassword;

            if (!passwordMatches) {
                return sendJSON(res, 401, { error: 'Invalid email or password' });
            }

            // Return token, role, and user details
            return sendJSON(res, 200, {
                token: `jwt-token-${user.id}`,
                role: user.role,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        if (url === '/api/calculate-price' && method === 'POST') {
            const body = await parseBody(req);
            const pricing = await calculateBookingPrice(body.serviceId, body.startTime);
            return sendJSON(res, 200, pricing);
        }

        if (url === '/api/appointments' && method === 'POST') {
            const body = await parseBody(req);
            const { clientId, doctorId, serviceId, startTime, baseAmount, taxAmount, totalAmount, status } = body;

            const start = new Date(startTime);
            const end = new Date(start.getTime() + 60 * 60000); // 1-hour slot default
            const endTimeStr = end.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = start.toISOString().slice(0, 19).replace('T', ' ');
            const initialStatus = status || 'pending';

            const [result]: any = await pool.execute(
                `INSERT INTO appointments (client_id, doctor_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [clientId, doctorId, serviceId, startTimeStr, endTimeStr, baseAmount, taxAmount, totalAmount, initialStatus]
            );

            return sendJSON(res, 201, { message: 'Appointment booked successfully', appointmentId: result.insertId, status: initialStatus });
        }

        sendJSON(res, 404, { error: 'Route not found' });

    } catch (error: any) {
        sendJSON(res, 500, { error: error.message || 'Internal Server Error' });
    }
});

server.listen(PORT, () => {
    console.log(`Pure Node.js server running on http://localhost:${PORT}`);
});