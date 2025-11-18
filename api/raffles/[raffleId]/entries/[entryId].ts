import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../_lib/db.js';
import { createHistoryLog } from '../../../_lib/history.js';
import { Sale, Cost, HistoryLogActionType } from '../../../../types';

async function handlePut(req: VercelRequest, res: VercelResponse) {
    const { raffleId, entryId } = req.query;
    const { type, ...entryData } = req.body;
    const table = type === 'sale' ? 'sales' : 'costs';

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [raffles]: any[] = await connection.query('SELECT title FROM raffles WHERE id = ?', [raffleId]);
        if (raffles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Raffle not found' });
        }
        const raffleTitle = raffles[0].title;
        
        const [existingEntries]: any[] = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [entryId]);
        if (existingEntries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Entry not found' });
        }
        
        const beforeStateRaw = existingEntries[0];
        let beforeState: Sale | Cost;

        if (type === 'sale') {
            beforeState = {
                ...beforeStateRaw,
                quantity: parseInt(beforeStateRaw.quantity, 10),
                amount: parseFloat(beforeStateRaw.amount)
            } as Sale;
        } else { // cost
            beforeState = {
                ...beforeStateRaw,
                amount: parseFloat(beforeStateRaw.amount),
                isDonation: !!beforeStateRaw.isDonation,
                isReimbursement: !!beforeStateRaw.isReimbursement
            } as Cost;
        }
        
        let actionType: HistoryLogActionType = 'UPDATE_COST';
        let description = '';

        if (type === 'sale') {
            const { description: saleDesc, quantity, amount } = entryData as Sale;
            await connection.query(
                'UPDATE sales SET description = ?, quantity = ?, amount = ? WHERE id = ?',
                [saleDesc, quantity, amount, entryId]
            );
            actionType = 'UPDATE_SALE';
            description = `Venda na rifa "${raffleTitle}" foi atualizada.`;
        } else { // cost
            const { description: costDesc, amount, date, isDonation, isReimbursement, notes, reimbursedDate, reimbursementNotes } = entryData as Cost;
            await connection.query(
                'UPDATE costs SET description = ?, amount = ?, date = ?, isDonation = ?, isReimbursement = ?, notes = ?, reimbursedDate = ?, reimbursementNotes = ? WHERE id = ?',
                [costDesc, amount, date || null, isDonation, isReimbursement, notes, reimbursedDate || null, reimbursementNotes, entryId]
            );
            
            const wasReimbursed = !(beforeState as Cost).reimbursedDate && reimbursedDate;
            const wasUnreimbursed = (beforeState as Cost).reimbursedDate && !reimbursedDate;

            if (wasReimbursed) {
                actionType = 'ADD_REIMBURSEMENT';
                description = `Reembolso para "${costDesc}" foi registrado na rifa "${raffleTitle}".`;
            } else if (wasUnreimbursed) {
                actionType = 'DELETE_REIMBURSEMENT';
                description = `Registro de reembolso para "${costDesc}" foi removido na rifa "${raffleTitle}".`;
            } else {
                 actionType = 'UPDATE_COST';
                 description = `Custo "${costDesc}" na rifa "${raffleTitle}" foi atualizado.`;
            }
        }
        
        await createHistoryLog(connection, {
            actionType,
            raffleId: String(raffleId),
            raffleTitle,
            entityId: String(entryId),
            description,
            beforeState: beforeState,
            afterState: entryData
        });

        await connection.commit();
        return res.status(200).json(entryData);

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error(`[API_ERROR] in PUT /api/raffles/${raffleId}/entries/${entryId}:`, error);
        return res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
    const { raffleId, entryId, type } = req.query;
    if (!type || !['sale', 'cost'].includes(String(type))) {
        return res.status(400).json({ message: 'Type query parameter is required' });
    }
    const table = type === 'sale' ? 'sales' : 'costs';

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [raffles]: any[] = await connection.query('SELECT title FROM raffles WHERE id = ?', [raffleId]);
        if (raffles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Raffle not found' });
        }
        const raffleTitle = raffles[0].title;

        const [existingEntries]: any[] = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [entryId]);
        if (existingEntries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Entry not found' });
        }
        
        const beforeStateRaw = existingEntries[0];
        let beforeState: any;

        if (type === 'sale') {
            beforeState = {
                ...beforeStateRaw,
                quantity: parseInt(beforeStateRaw.quantity, 10),
                amount: parseFloat(beforeStateRaw.amount)
            };
        } else { // cost
            beforeState = {
                ...beforeStateRaw,
                amount: parseFloat(beforeStateRaw.amount)
            };
        }
        
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [entryId]);
        
        await createHistoryLog(connection, {
            actionType: type === 'sale' ? 'DELETE_SALE' : 'DELETE_COST',
            raffleId: String(raffleId),
            raffleTitle,
            entityId: String(entryId),
            description: type === 'sale'
                ? `Venda de ${beforeState.quantity} número(s) foi excluída da rifa "${raffleTitle}".`
                : `Custo "${beforeState.description}" foi excluído da rifa "${raffleTitle}".`,
            beforeState: beforeState,
        });

        await connection.commit();
        return res.status(204).end();
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error(`[API_ERROR] in DELETE /api/raffles/${raffleId}/entries/${entryId}:`, error);
        return res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
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