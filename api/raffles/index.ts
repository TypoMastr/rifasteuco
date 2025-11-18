import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db.js';
import { createHistoryLog } from '../_lib/history.js';
import { Raffle, Sale, Cost } from '../../types';

async function handleGet(req: VercelRequest, res: VercelResponse) {
    let connection;
    try {
        connection = await db.getConnection();
        const [raffles]: any[] = await connection.query('SELECT * FROM raffles ORDER BY date DESC, title ASC');
        const [sales]: any[] = await connection.query('SELECT * FROM sales');
        const [costs]: any[] = await connection.query('SELECT * FROM costs');

        const rafflesWithDetails: Raffle[] = raffles.map((raffle: any) => ({
            ...raffle,
            isFinalized: !!raffle.isFinalized,
            sales: sales.filter((s: any) => s.raffleId === raffle.id),
            costs: costs.filter((c: any) => c.raffleId === raffle.id).map((cost: any) => ({
                ...cost,
                isDonation: !!cost.isDonation,
                isReimbursement: !!cost.isReimbursement
            })),
        }));

        return res.status(200).json(rafflesWithDetails);
    } catch (error: any) {
        console.error("[API_ERROR] in GET /api/raffles:", error);
        return res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    const { title, category, date, ticketPrice } = req.body;
    
    if (!title || !category || !date || ticketPrice === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const newRaffleId = crypto.randomUUID();
        const newRaffleData: Omit<Raffle, 'sales' | 'costs'> = {
            id: newRaffleId,
            title,
            category,
            date,
            ticketPrice,
            isFinalized: false
        };

        await connection.query('INSERT INTO raffles (id, title, category, date, ticketPrice, isFinalized) VALUES (?, ?, ?, ?, ?, ?)', [
            newRaffleData.id,
            newRaffleData.title,
            newRaffleData.category,
            newRaffleData.date,
            newRaffleData.ticketPrice,
            newRaffleData.isFinalized
        ]);

        const newRaffle: Raffle = {
            ...newRaffleData,
            sales: [],
            costs: []
        };
        
        await createHistoryLog(connection, {
            actionType: 'CREATE_RAFFLE',
            raffleId: newRaffle.id,
            raffleTitle: newRaffle.title,
            description: `Rifa "${newRaffle.title}" foi criada.`,
            afterState: newRaffle,
        });

        await connection.commit();
        return res.status(201).json(newRaffle);
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("[API_ERROR] in POST /api/raffles:", error);
        return res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    switch (req.method) {
        case 'GET':
            return handleGet(req, res);
        case 'POST':
            return handlePost(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}