import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db.js';
import { HistoryLog } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const connection = db;
    try {
        const [logs]: any[] = await connection.query('SELECT * FROM history_logs ORDER BY timestamp DESC');
        
        const formattedLogs: HistoryLog[] = logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp).toISOString(),
            undone: !!log.undone,
            // JSON fields are automatically parsed by mysql2
        }));

        return res.status(200).json(formattedLogs);
    } catch (error: any) {
        console.error("[API_ERROR] in GET /api/history:", error);
        return res.status(500).json({ message: error.message });
    }
}
