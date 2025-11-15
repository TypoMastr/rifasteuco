import type { Raffle, Sale, Cost, HistoryLog } from '../types';

// O URL base para a sua API de backend.
// Você precisará substituir isso pela URL real do seu backend implantado.
const API_BASE_URL = '/api'; 

// Função auxiliar para lidar com as respostas do fetch
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Ocorreu um erro desconhecido');
    }
    // Retorna um objeto vazio para respostas 204 No Content
    if (response.status === 204) {
        return {};
    }
    return response.json();
};

// --- API Pública ---

export const getRaffles = async (): Promise<Raffle[]> => {
    const response = await fetch(`${API_BASE_URL}/raffles`);
    return handleResponse(response);
};

export const getHistory = async (): Promise<HistoryLog[]> => {
    const response = await fetch(`${API_BASE_URL}/history`);
    return handleResponse(response);
};

export const saveRaffle = async (raffleData: Omit<Raffle, 'id' | 'sales' | 'costs'>): Promise<Raffle> => {
    const response = await fetch(`${API_BASE_URL}/raffles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raffleData),
    });
    return handleResponse(response);
};

export const updateRaffle = async (updatedRaffleData: Omit<Raffle, 'sales' | 'costs'>): Promise<Raffle> => {
    const response = await fetch(`${API_BASE_URL}/raffles/${updatedRaffleData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRaffleData),
    });
    return handleResponse(response);
};

export const deleteRaffle = async (raffleId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/raffles/${raffleId}`, {
        method: 'DELETE',
    });
    await handleResponse(response);
};

export const addEntry = async (raffleId: string, type: 'sale' | 'cost', entryData: Omit<Sale, 'id'> | Omit<Cost, 'id'>): Promise<Raffle> => {
    const response = await fetch(`${API_BASE_URL}/raffles/${raffleId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...entryData }),
    });
    return handleResponse(response);
};

export const updateEntry = async (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost): Promise<Raffle> => {
    const response = await fetch(`${API_BASE_URL}/raffles/${raffleId}/entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...entry }),
    });
    return handleResponse(response);
};

export const deleteEntry = async (raffleId: string, type: 'sale' | 'cost', entryId: string): Promise<Raffle> => {
     const response = await fetch(`${API_BASE_URL}/raffles/${raffleId}/entries/${entryId}?type=${type}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

export const undoAction = async (logId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/history/undo/${logId}`, {
        method: 'POST',
    });
    await handleResponse(response);
};
