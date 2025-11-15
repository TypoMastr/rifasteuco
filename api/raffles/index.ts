import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { createHistoryLog } from '../_lib/history';
import { Raffle, Sale, Cost } from '../../types';

async function handleGet(req: VercelRequest, res: VercelResponse) {
    const connection = await db();
    try {
        // FIX: Untyped function calls may not accept type arguments.
        const [raffles] = await connection.query('SELECT * FROM raffles ORDER BY date DESC, title ASC');
        // FIX: Untyped function calls may not accept type arguments.
        const [sales] = await connection.query('SELECT * FROM sales');
        // FIX: Untyped function calls may not accept type arguments.
        const [costs] = await connection.query('SELECT * FROM costs');

        const rafflesWithDetails: Raffle[] = raffles.map(raffle => ({
            ...raffle,
            isFinalized: !!raffle.isFinalized,
            sales: sales.filter(s => s.raffleId === raffle.id),
            costs: costs.filter(c => c.raffleId === raffle.id).map(cost => ({
                ...cost,
                isDonation: !!cost.isDonation,
                isReimbursement: !!cost.isReimbursement
            })),
        }));

        return res.status(200).json(rafflesWithDetails);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    const { title, category, date, ticketPrice } = req.body;
    
    if (!title || !category || !date || ticketPrice === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const connection = await db();
    try {
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
        await connection.rollback();
        return res.status(500).json({ message: error.message });
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