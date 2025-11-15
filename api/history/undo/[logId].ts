
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../_lib/db';
import { HistoryLog, Raffle, Sale, Cost } from '../../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { logId } = req.query;
    if (!logId) {
        return res.status(400).json({ message: 'Log ID is required' });
    }

    const connection = await db();
    try {
        await connection.beginTransaction();

        const [logs]: any[] = await connection.query('SELECT * FROM history_logs WHERE id = ?', [logId]);
        if (logs.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Log not found' });
        }
        const log: HistoryLog = logs[0];

        if (log.undone) {
            await connection.rollback();
            return res.status(400).json({ message: 'Action already undone' });
        }

        switch (log.actionType) {
            case 'CREATE_RAFFLE':
                await connection.query('DELETE FROM raffles WHERE id = ?', [log.raffleId]);
                break;
            case 'DELETE_RAFFLE':
                const raffleToRestore = log.beforeState as Raffle;
                await connection.query('INSERT INTO raffles (id, title, category, date, ticketPrice, isFinalized) VALUES (?, ?, ?, ?, ?, ?)',
                    [raffleToRestore.id, raffleToRestore.title, raffleToRestore.category, raffleToRestore.date, raffleToRestore.ticketPrice, raffleToRestore.isFinalized]);
                for (const sale of raffleToRestore.sales) {
                    await connection.query('INSERT INTO sales (id, raffleId, description, quantity, amount) VALUES (?, ?, ?, ?, ?)',
                        [sale.id, raffleToRestore.id, sale.description, sale.quantity, sale.amount]);
                }
                for (const cost of raffleToRestore.costs) {
                    await connection.query('INSERT INTO costs (id, raffleId, description, amount, date, isDonation, isReimbursement, notes, reimbursedDate, reimbursementNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [cost.id, raffleToRestore.id, cost.description, cost.amount, cost.date, cost.isDonation, cost.isReimbursement, cost.notes, cost.reimbursedDate, cost.reimbursementNotes]);
                }
                break;
            case 'UPDATE_RAFFLE':
            case 'TOGGLE_FINALIZE_RAFFLE':
                const raffleToRevert = log.beforeState as Omit<Raffle, 'sales' | 'costs'>;
                await connection.query('UPDATE raffles SET title = ?, category = ?, date = ?, ticketPrice = ?, isFinalized = ? WHERE id = ?',
                    [raffleToRevert.title, raffleToRevert.category, raffleToRevert.date, raffleToRevert.ticketPrice, raffleToRevert.isFinalized, log.raffleId]);
                break;
            case 'ADD_SALE':
            case 'ADD_COST':
                const tableToAdd = log.actionType === 'ADD_SALE' ? 'sales' : 'costs';
                await connection.query(`DELETE FROM ${tableToAdd} WHERE id = ?`, [log.entityId]);
                break;
            case 'DELETE_SALE':
                const saleToRestore = log.beforeState as Sale;
                await connection.query('INSERT INTO sales (id, raffleId, description, quantity, amount) VALUES (?, ?, ?, ?, ?)',
                    [saleToRestore.id, log.raffleId, saleToRestore.description, saleToRestore.quantity, saleToRestore.amount]);
                break;
            case 'DELETE_COST':
                const costToRestore = log.beforeState as Cost;
                await connection.query('INSERT INTO costs (id, raffleId, description, amount, date, isDonation, isReimbursement, notes, reimbursedDate, reimbursementNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [costToRestore.id, log.raffleId, costToRestore.description, costToRestore.amount, costToRestore.date, costToRestore.isDonation, costToRestore.isReimbursement, costToRestore.notes, costToRestore.reimbursedDate, costToRestore.reimbursementNotes]);
                break;
            case 'UPDATE_SALE':
                const saleToRevert = log.beforeState as Sale;
                await connection.query('UPDATE sales SET description = ?, quantity = ?, amount = ? WHERE id = ?',
                    [saleToRevert.description, saleToRevert.quantity, saleToRevert.amount, log.entityId]);
                break;
            case 'UPDATE_COST':
            case 'ADD_REIMBURSEMENT':
            case 'DELETE_REIMBURSEMENT':
                 const costToRevert = log.beforeState as Cost;
                await connection.query('UPDATE costs SET description = ?, amount = ?, date = ?, isDonation = ?, isReimbursement = ?, notes = ?, reimbursedDate = ?, reimbursementNotes = ? WHERE id = ?',
                    [costToRevert.description, costToRevert.amount, costToRevert.date, costToRevert.isDonation, costToRevert.isReimbursement, costToRevert.notes, costToRevert.reimbursedDate, costToRevert.reimbursementNotes, log.entityId]);
                break;
            default:
                await connection.rollback();
                return res.status(400).json({ message: 'Unsupported action type for undo' });
        }
        
        await connection.query('UPDATE history_logs SET undone = 1 WHERE id = ?', [logId]);
        
        await connection.commit();
        return res.status(204).end();

    } catch (error: any) {
        await connection.rollback();
        return res.status(500).json({ message: error.message });
    }
}
