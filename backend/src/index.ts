import http, { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import pool from './config/db';
import { calculateBookingPrice } from './services/pricingEngine';

dotenv.config();
const PORT = process.env.PORT || 5000;

// Helper to read incoming JSON payloads from the frontend
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

// Helper to send JSON responses back with CORS headers enabled
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
    // Handle CORS preflight check
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
        // Route 1: Get list of available services
        if (url === '/api/services' && method === 'GET') {
            const [rows] = await pool.execute('SELECT * FROM services');
            return sendJSON(res, 200, rows);
        }

        // Route 2: Calculate price dynamically based on user choices
        if (url === '/api/calculate-price' && method === 'POST') {
            const body = await parseBody(req);
            const pricing = await calculateBookingPrice(body.serviceId, body.startTime);
            return sendJSON(res, 200, pricing);
        }

        // Route 3: Save final appointment booking to MySQL
        if (url === '/api/appointments' && method === 'POST') {
            const body = await parseBody(req);
            const { clientId, serviceId, startTime, baseAmount, taxAmount, totalAmount } = body;

            const start = new Date(startTime);
            const end = new Date(start.getTime() + 60 * 60000); // 1-hour slot default
            const endTimeStr = end.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = start.toISOString().slice(0, 19).replace('T', ' ');

            const [result]: any = await pool.execute(
                `INSERT INTO appointments (client_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
                [clientId, serviceId, startTimeStr, endTimeStr, baseAmount, taxAmount, totalAmount]
            );

            return sendJSON(res, 201, { message: 'Appointment booked successfully', appointmentId: result.insertId });
        }

        sendJSON(res, 404, { error: 'Route not found' });

    } catch (error: any) {
        sendJSON(res, 500, { error: error.message || 'Internal Server Error' });
    }
});

server.listen(PORT, () => {
    console.log(`Pure Node.js server running on http://localhost:${PORT}`);
});