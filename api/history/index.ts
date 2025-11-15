import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { HistoryLog } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const connection = await db();
    try {
        // FIX: Untyped function calls may not accept type arguments.
        const [logs] = await connection.query('SELECT * FROM history_logs ORDER BY timestamp DESC');
        
        const formattedLogs: HistoryLog[] = logs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp).toISOString(),
            undone: !!log.undone,
            // JSON fields are automatically parsed by mysql2
        }));

        return res.status(200).json(formattedLogs);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}