export interface Cost {
  id: string;
  description: string;
  amount: number;
  date?: string;
  isDonation?: boolean;
  isReimbursement?: boolean;
  reimbursedDate?: string;
  reimbursementNotes?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  description: string; // Optional notes
  quantity: number;
  amount: number; // Final amount, can be manually overridden from quantity * ticketPrice
}

export interface Raffle {
  id:string;
  title: string;
  category: string;
  date: string; // ISO String date
  ticketPrice: number;
  sales: Sale[];
  costs: Cost[];
  isFinalized?: boolean;
}

export type HistoryLogActionType =
  | 'CREATE_RAFFLE'
  | 'UPDATE_RAFFLE'
  | 'DELETE_RAFFLE'
  | 'TOGGLE_FINALIZE_RAFFLE'
  | 'ADD_SALE'
  | 'UPDATE_SALE'
  | 'DELETE_SALE'
  | 'ADD_COST'
  | 'UPDATE_COST'
  | 'DELETE_COST'
  | 'ADD_REIMBURSEMENT'
  | 'DELETE_REIMBURSEMENT';

export interface HistoryLog {
  id: string;
  timestamp: string;
  actionType: HistoryLogActionType;
  description: string;
  raffleId: string;
  raffleTitle: string; // Denormalized for easier display
  entityId?: string; // For sales or costs
  beforeState?: any; // Could be Raffle, Sale, Cost
  afterState?: any; // Could be Raffle, Sale, Cost
  undone?: boolean;
}
