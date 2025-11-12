import type { Raffle, Sale, Cost, HistoryLog, HistoryLogActionType } from '../types';

const RAFFLES_STORAGE_KEY = 'raffles_data_v2';
const HISTORY_STORAGE_KEY = 'raffles_history_v1';

// Helper to format currency for log messages
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


// --- Sample Data ---
const getSampleData = (): Raffle[] => [
    {
        id: "sample-1",
        title: "Rifa de São Jorge",
        category: "Caboclo",
        date: "2025-04-23T03:00:00.000Z",
        ticketPrice: 10,
        isFinalized: true,
        sales: [
            { id: crypto.randomUUID(), quantity: 10, amount: 100, description: "Fulano de Tal" },
            { id: crypto.randomUUID(), quantity: 5, amount: 40, description: "Pagamento parcial" }
        ],
        costs: [
            { id: crypto.randomUUID(), description: "Compra dos prêmios", amount: 150, isReimbursement: true, reimbursedDate: "2025-04-20T03:00:00.000Z", reimbursementNotes: "Reembolsado via Pix" },
            { id: crypto.randomUUID(), description: "Velas e incensos", amount: 30, date: "2025-04-22T03:00:00.000Z" },
            { id: crypto.randomUUID(), description: "Flores (Doação)", amount: 50, isDonation: true }
        ]
    },
    {
        id: "sample-2",
        title: "Festa de Cosme e Damião",
        category: "Crianças",
        date: "2025-09-27T03:00:00.000Z",
        ticketPrice: 5,
        isFinalized: false,
        sales: [
            { id: crypto.randomUUID(), quantity: 20, amount: 100, description: "" },
            { id: crypto.randomUUID(), quantity: 30, amount: 150, description: "Pix da Maria" }
        ],
        costs: [
            { id: crypto.randomUUID(), description: "Doces e balas", amount: 120, isReimbursement: true, date: "2025-09-20T03:00:00.000Z", notes: "Comprado no Atacadão da esquina" },
            { id: crypto.randomUUID(), description: "Decoração", amount: 80 }
        ]
    },
    {
        id: "sample-5",
        title: "Festa de Iemanjá",
        category: "Praia",
        date: "2025-08-15T03:00:00.000Z", // August
        ticketPrice: 20,
        isFinalized: false,
        sales: [
            { id: crypto.randomUUID(), quantity: 10, amount: 200, description: "Venda online" }
        ],
        costs: [
            { id: crypto.randomUUID(), description: "Barco e oferendas", amount: 150, isReimbursement: false }
        ]
    },
];

// --- Data Helpers ---
const getRafflesFromStorage = (): Raffle[] => {
    try {
        const data = localStorage.getItem(RAFFLES_STORAGE_KEY);
        if (!data) {
            const sampleData = getSampleData();
            saveRafflesToStorage(sampleData);
            return sampleData;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return [];
    }
};

const saveRafflesToStorage = (raffles: Raffle[]): void => {
    try {
        localStorage.setItem(RAFFLES_STORAGE_KEY, JSON.stringify(raffles, null, 2));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};

// --- History Helpers ---
const getHistoryFromStorage = (): HistoryLog[] => {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading history from localStorage", error);
        return [];
    }
};

const saveHistoryToStorage = (history: HistoryLog[]): void => {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error("Error writing history to localStorage", error);
    }
};

const logAction = (
    actionType: HistoryLogActionType,
    description: string,
    raffleId: string,
    raffleTitle: string,
    details: { entityId?: string; beforeState?: any; afterState?: any }
) => {
    const history = getHistoryFromStorage();
    const newLog: HistoryLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actionType,
        description,
        raffleId,
        raffleTitle,
        ...details,
        undone: false,
    };
    const updatedHistory = [newLog, ...history];
    saveHistoryToStorage(updatedHistory);
};

// Mock async behavior
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Public API ---

export const getRaffles = async (): Promise<Raffle[]> => {
    await delay(200);
    return getRafflesFromStorage();
};

export const getHistory = async (): Promise<HistoryLog[]> => {
    await delay(100);
    return getHistoryFromStorage();
};

export const saveRaffle = async (raffleData: Omit<Raffle, 'id' | 'sales' | 'costs'>): Promise<Raffle> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    const newRaffle: Raffle = {
        ...raffleData,
        id: crypto.randomUUID(),
        sales: [],
        costs: [],
        isFinalized: false,
    };
    const updatedRaffles = [...raffles, newRaffle];
    saveRafflesToStorage(updatedRaffles);

    logAction('CREATE_RAFFLE', `Rifa criada`, newRaffle.id, newRaffle.title, { afterState: newRaffle });

    return newRaffle;
};

export const updateRaffle = async (updatedRaffleData: Omit<Raffle, 'sales' | 'costs'>): Promise<Raffle> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    let foundRaffle: Raffle | undefined;
    const beforeState = raffles.find(r => r.id === updatedRaffleData.id);
    if (!beforeState) throw new Error("Raffle not found");

    const updatedRaffles = raffles.map(raffle => {
        if (raffle.id === updatedRaffleData.id) {
            foundRaffle = { ...raffle, ...updatedRaffleData };
            return foundRaffle;
        }
        return raffle;
    });

    saveRafflesToStorage(updatedRaffles);

    let actionType: HistoryLogActionType = 'UPDATE_RAFFLE';
    let description = `Dados gerais da rifa atualizados.`;
    if (beforeState.isFinalized !== foundRaffle!.isFinalized) {
        actionType = 'TOGGLE_FINALIZE_RAFFLE';
        description = foundRaffle!.isFinalized ? `Rifa finalizada.` : `Rifa reaberta.`;
    }
    logAction(actionType, description, foundRaffle!.id, foundRaffle!.title, { beforeState, afterState: foundRaffle });
    
    return foundRaffle!;
};

export const deleteRaffle = async (raffleId: string): Promise<void> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    const raffleToDelete = raffles.find(r => r.id === raffleId);
    if (!raffleToDelete) return;
    
    const updatedRaffles = raffles.filter(raffle => raffle.id !== raffleId);
    saveRafflesToStorage(updatedRaffles);

    logAction('DELETE_RAFFLE', `Rifa excluída.`, raffleId, raffleToDelete.title, { beforeState: raffleToDelete });
};

export const addEntry = async (raffleId: string, type: 'sale' | 'cost', entryData: Omit<Sale, 'id'> | Omit<Cost, 'id'>): Promise<Raffle> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    let updatedRaffle: Raffle | undefined;
    let newEntry: Sale | Cost | undefined;
    
    const newId = crypto.randomUUID();

    const updatedRaffles = raffles.map(raffle => {
        if (raffle.id === raffleId) {
            updatedRaffle = { ...raffle };
            // FIX: Create a correctly typed local variable for the new sale or cost to avoid pushing a union type `Sale | Cost` into an array that expects a specific type.
            if (type === 'sale') {
                const saleEntry: Sale = { ...(entryData as Omit<Sale, 'id'>), id: newId };
                newEntry = saleEntry;
                updatedRaffle.sales.push(saleEntry);
            } else {
                const costEntry: Cost = { ...(entryData as Omit<Cost, 'id'>), id: newId };
                newEntry = costEntry;
                updatedRaffle.costs.push(costEntry);
            }
            return updatedRaffle;
        }
        return raffle;
    });

    if (!updatedRaffle || !newEntry) throw new Error("Raffle not found");

    saveRafflesToStorage(updatedRaffles);

    if (type === 'sale') {
        const sale = newEntry as Sale;
        logAction('ADD_SALE', `Venda de ${sale.quantity} número(s) adicionada.`, raffleId, updatedRaffle.title, { entityId: sale.id, afterState: sale });
    } else {
        const cost = newEntry as Cost;
        logAction('ADD_COST', `Custo "${cost.description}" adicionado.`, raffleId, updatedRaffle.title, { entityId: cost.id, afterState: cost });
    }

    return updatedRaffle;
};

// FIX: Refactored to use if/else block for type safety and clarity.
export const updateEntry = async (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost): Promise<Raffle> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    let updatedRaffle: Raffle | undefined;
    const raffleForLog = raffles.find(r => r.id === raffleId);
    if (!raffleForLog) throw new Error("Raffle not found");

    const beforeState = type === 'sale'
        ? raffleForLog.sales.find(s => s.id === entry.id)
        : raffleForLog.costs.find(c => c.id === entry.id);

    const updatedRaffles = raffles.map(raffle => {
        if (raffle.id === raffleId) {
            if (type === 'sale') {
                // FIX: Assert entry type to Sale before the map callback to help TypeScript's type inference.
                const saleEntry = entry as Sale;
                const newSales = raffle.sales.map(s => s.id === saleEntry.id ? saleEntry : s);
                updatedRaffle = { ...raffle, sales: newSales };
                return updatedRaffle;
            } else {
                const costEntry = entry as Cost;
                const newCosts = raffle.costs.map(c => c.id === costEntry.id ? costEntry : c);
                updatedRaffle = { ...raffle, costs: newCosts };
                return updatedRaffle;
            }
        }
        return raffle;
    });

    if (!updatedRaffle) throw new Error("Entry not found");
    saveRafflesToStorage(updatedRaffles);

    let actionType: HistoryLogActionType = type === 'sale' ? 'UPDATE_SALE' : 'UPDATE_COST';
    let description = '';
    
    if (type === 'cost') {
        const costBefore = beforeState as Cost;
        const costAfter = entry as Cost;
        description = `Custo "${costAfter.description}" atualizado.`
        // FIX: Added check for costBefore to prevent runtime error if entry not found.
        if (costBefore && !costBefore.reimbursedDate && costAfter.reimbursedDate) {
            actionType = 'ADD_REIMBURSEMENT';
            description = `Reembolso de ${formatCurrency(costAfter.amount)} para "${costAfter.description}" foi registrado.`
        } else if (costBefore && costBefore.reimbursedDate && !costAfter.reimbursedDate) {
            actionType = 'DELETE_REIMBURSEMENT';
            description = `Registro de reembolso para "${costAfter.description}" foi removido.`
        }
    } else {
        const saleEntry = entry as Sale;
        description = `Venda de ${saleEntry.quantity} número(s) atualizada.`
    }
    logAction(actionType, description, raffleId, updatedRaffle.title, { entityId: entry.id, beforeState, afterState: entry });

    return updatedRaffle;
};

export const deleteEntry = async (raffleId: string, type: 'sale' | 'cost', entryId: string): Promise<Raffle> => {
    await delay(200);
    const raffles = getRafflesFromStorage();
    let updatedRaffle: Raffle | undefined;
    const raffleForLog = raffles.find(r => r.id === raffleId);
    if (!raffleForLog) throw new Error("Raffle not found");

    const entryToDelete = type === 'sale'
        ? raffleForLog.sales.find(e => e.id === entryId)
        : raffleForLog.costs.find(e => e.id === entryId);

    const updatedRaffles = raffles.map(raffle => {
        if (raffle.id === raffleId) {
             const newSales = type === 'sale' ? raffle.sales.filter(e => e.id !== entryId) : raffle.sales;
            const newCosts = type === 'cost' ? raffle.costs.filter(e => e.id !== entryId) : raffle.costs;
            updatedRaffle = { ...raffle, sales: newSales, costs: newCosts };
            return updatedRaffle;
        }
        return raffle;
    });

     if (!updatedRaffle) throw new Error("Raffle not found");
    saveRafflesToStorage(updatedRaffles);

    if (type === 'sale') {
        logAction('DELETE_SALE', `Venda de ${(entryToDelete as Sale).quantity} número(s) excluída.`, raffleId, updatedRaffle.title, { entityId: entryId, beforeState: entryToDelete });
    } else {
        logAction('DELETE_COST', `Custo "${(entryToDelete as Cost).description}" excluído.`, raffleId, updatedRaffle.title, { entityId: entryId, beforeState: entryToDelete });
    }

    return updatedRaffle;
};

export const undoAction = async (logId: string): Promise<void> => {
    await delay(200);
    const history = getHistoryFromStorage();
    const raffles = getRafflesFromStorage();
    const logToUndo = history.find(log => log.id === logId);

    if (!logToUndo || logToUndo.undone) {
        throw new Error("Ação não encontrada ou já desfeita.");
    }

    let updatedRaffles = [...raffles];

    switch (logToUndo.actionType) {
        case 'CREATE_RAFFLE':
            updatedRaffles = raffles.filter(r => r.id !== logToUndo.raffleId);
            break;
        case 'DELETE_RAFFLE':
            updatedRaffles.push(logToUndo.beforeState as Raffle);
            break;
        case 'UPDATE_RAFFLE':
        case 'TOGGLE_FINALIZE_RAFFLE':
            updatedRaffles = raffles.map(r => r.id === logToUndo.raffleId ? (logToUndo.beforeState as Raffle) : r);
            break;
        case 'ADD_SALE':
        case 'ADD_COST':
            updatedRaffles = raffles.map(r => {
                if (r.id === logToUndo.raffleId) {
                    const updatedRaffle = { ...r };
                    if (logToUndo.actionType === 'ADD_SALE') {
                        updatedRaffle.sales = r.sales.filter(s => s.id !== logToUndo.entityId);
                    } else {
                        updatedRaffle.costs = r.costs.filter(c => c.id !== logToUndo.entityId);
                    }
                    return updatedRaffle;
                }
                return r;
            });
            break;
        case 'DELETE_SALE':
        case 'DELETE_COST':
             updatedRaffles = raffles.map(r => {
                if (r.id === logToUndo.raffleId) {
                    const updatedRaffle = { ...r };
                    if (logToUndo.actionType === 'DELETE_SALE') {
                        updatedRaffle.sales.push(logToUndo.beforeState as Sale);
                    } else {
                        updatedRaffle.costs.push(logToUndo.beforeState as Cost);
                    }
                    return updatedRaffle;
                }
                return r;
            });
            break;
        case 'UPDATE_SALE':
        case 'UPDATE_COST':
        case 'ADD_REIMBURSEMENT':
        case 'DELETE_REIMBURSEMENT':
             updatedRaffles = raffles.map(r => {
                if (r.id === logToUndo.raffleId) {
                    const updatedRaffle = { ...r };
                     if (logToUndo.actionType.includes('SALE')) {
                        updatedRaffle.sales = r.sales.map(s => s.id === logToUndo.entityId ? (logToUndo.beforeState as Sale) : s);
                    } else {
                        updatedRaffle.costs = r.costs.map(c => c.id === logToUndo.entityId ? (logToUndo.beforeState as Cost) : c);
                    }
                    return updatedRaffle;
                }
                return r;
            });
            break;
    }

    saveRafflesToStorage(updatedRaffles);

    const updatedHistory = history.map(log => log.id === logId ? { ...log, undone: true } : log);
    saveHistoryToStorage(updatedHistory);
};
