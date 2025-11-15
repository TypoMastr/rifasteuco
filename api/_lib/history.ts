import type { Connection } from 'mysql2/promise';
import { HistoryLogActionType } from '../../types';

interface LogData {
    actionType: HistoryLogActionType;
    raffleId: string;
    raffleTitle: string;
    description: string;
    entityId?: string;
    beforeState?: any;
    afterState?: any;
}

export const createHistoryLog = async (connection: Connection, logData: LogData): Promise<void> => {
    const newLogId = crypto.randomUUID();
    const {
        actionType,
        raffleId,
        raffleTitle,
        description,
        entityId,
        beforeState,
        afterState,
    } = logData;

    await connection.query(
        `INSERT INTO history_logs (id, actionType, raffleId, raffleTitle, description, entityId, beforeState, afterState)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            newLogId,
            actionType,
            raffleId,
            raffleTitle,
            description,
            entityId || null,
            beforeState ? JSON.stringify(beforeState) : null,
            afterState ? JSON.stringify(afterState) : null,
        ]
    );
};
