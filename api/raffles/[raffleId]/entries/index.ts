
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../_lib/db';
import { createHistoryLog } from '../../../_lib/history';
import { Sale, Cost } from '../../../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { raffleId } = req.query;
    const { type, ...entryData } = req.body;

    if (!raffleId || !type || !['sale', 'cost'].includes(type)) {
        return res.status(400).json({ message: 'Missing raffleId or invalid entry type' });
    }
    
    const connection = await db();
    try {
        await connection.beginTransaction();

        const [raffles]: any[] = await connection.query('SELECT title FROM raffles WHERE id = ?', [raffleId]);
        if (raffles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Raffle not found' });
        }
        const raffleTitle = raffles[0].title;

        const newEntryId = crypto.randomUUID();
        let newEntry: Sale | Cost;

        if (type === 'sale') {
            const { description, quantity, amount } = entryData as Omit<Sale, 'id'>;
            newEntry = { id: newEntryId, description, quantity, amount };
            await connection.query(
                'INSERT INTO sales (id, raffleId, description, quantity, amount) VALUES (?, ?, ?, ?, ?)',
                [newEntryId, raffleId, description, quantity, amount]
            );
            await createHistoryLog(connection, {
                actionType: 'ADD_SALE',
                raffleId: String(raffleId),
                raffleTitle,
                entityId: newEntryId,
                description: `Venda de ${quantity} número(s) adicionada à rifa "${raffleTitle}".`,
                afterState: newEntry
            });
        } else { // cost
            const { description, amount, date, isDonation, isReimbursement, notes } = entryData as Omit<Cost, 'id'>;
            newEntry = { id: newEntryId, description, amount, date, isDonation, isReimbursement, notes };
            await connection.query(
                'INSERT INTO costs (id, raffleId, description, amount, date, isDonation, isReimbursement, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [newEntryId, raffleId, description, amount, date || null, isDonation, isReimbursement, notes]
            );
             await createHistoryLog(connection, {
                actionType: 'ADD_COST',
                raffleId: String(raffleId),
                raffleTitle,
                entityId: newEntryId,
                description: `Custo "${description}" adicionado à rifa "${raffleTitle}".`,
                afterState: newEntry,
            });
        }

        await connection.commit();
        return res.status(201).json(newEntry);

    } catch (error: any) {
        await connection.rollback();
        return res.status(500).json({ message: error.message });
    }
}
