
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../_lib/db';
import { createHistoryLog } from '../../_lib/history';
import { Raffle } from '../../../types';

async function handlePut(req: VercelRequest, res: VercelResponse) {
    const { raffleId } = req.query;
    const { id, title, category, date, ticketPrice, isFinalized } = req.body;

    if (!raffleId || raffleId !== id) {
        return res.status(400).json({ message: 'Invalid raffle ID' });
    }

    const connection = await db();
    try {
        await connection.beginTransaction();

        const [existingRaffles]: any[] = await connection.query('SELECT * FROM raffles WHERE id = ?', [raffleId]);
        if (existingRaffles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Raffle not found' });
        }
        const beforeState = { ...existingRaffles[0], isFinalized: !!existingRaffles[0].isFinalized };

        await connection.query(
            'UPDATE raffles SET title = ?, category = ?, date = ?, ticketPrice = ?, isFinalized = ? WHERE id = ?',
            [title, category, date, ticketPrice, isFinalized, raffleId]
        );

        const afterState: Omit<Raffle, 'sales' | 'costs'> = { id, title, category, date, ticketPrice, isFinalized };
        
        const wasFinalizedToggled = beforeState.isFinalized !== afterState.isFinalized;
        
        await createHistoryLog(connection, {
            actionType: wasFinalizedToggled ? 'TOGGLE_FINALIZE_RAFFLE' : 'UPDATE_RAFFLE',
            raffleId: String(raffleId),
            raffleTitle: afterState.title,
            description: wasFinalizedToggled
                ? `Rifa "${afterState.title}" foi marcada como ${afterState.isFinalized ? 'Finalizada' : 'Ativa'}.`
                : `Dados da rifa "${afterState.title}" foram atualizados.`,
            beforeState: beforeState,
            afterState: afterState,
        });

        await connection.commit();
        return res.status(200).json(afterState);

    } catch (error: any) {
        await connection.rollback();
        return res.status(500).json({ message: error.message });
    }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
    const { raffleId } = req.query;
    
    if (!raffleId) {
        return res.status(400).json({ message: 'Raffle ID is required' });
    }

    const connection = await db();
    try {
        await connection.beginTransaction();

        const [raffles]: any[] = await connection.query('SELECT * FROM raffles WHERE id = ?', [raffleId]);
        if (raffles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Raffle not found' });
        }
        const [sales]: any[] = await connection.query('SELECT * FROM sales WHERE raffleId = ?', [raffleId]);
        const [costs]: any[] = await connection.query('SELECT * FROM costs WHERE raffleId = ?', [raffleId]);
        
        const beforeState = { ...raffles[0], sales, costs };

        await connection.query('DELETE FROM raffles WHERE id = ?', [raffleId]); // CASCADE will handle sales and costs

        await createHistoryLog(connection, {
            actionType: 'DELETE_RAFFLE',
            raffleId: String(raffleId),
            raffleTitle: beforeState.title,
            description: `Rifa "${beforeState.title}" foi excluída.`,
            beforeState: beforeState,
        });

        await connection.commit();
        return res.status(204).end();
    } catch (error: any) {
        await connection.rollback();
        return res.status(500).json({ message: error.message });
    }
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    switch (req.method) {
        case 'PUT':
            return handlePut(req, res);
        case 'DELETE':
            return handleDelete(req, res);
        default:
            res.setHeader('Allow', ['PUT', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
