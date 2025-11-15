import React from 'react';
import type { Raffle, Sale, Cost } from '../types';
import { 
    ArrowUturnLeftIcon, 
    PencilIcon,
    TrashIcon,
    PlusIcon
} from './icons';
import InlineEntryForm from './InlineEntryForm';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

interface RaffleDetailPageProps {
    raffle: Raffle;
    onBack: () => void;
    onAddEntry: (raffleId: string, type: 'sale' | 'cost', entry: Omit<Sale, 'id'> | Omit<Cost, 'id'>) => void;
    onOpenDeleteConfirmation: (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost) => void;
    onDeleteRaffleClick: (raffle: Raffle) => void;
    onEditRaffle: (raffle: Raffle) => void;
    onOpenEditEntryModal: (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost) => void;
    onUpdateEntry: (type: 'sale' | 'cost', entry: Sale | Cost) => void;
    onOpenReimburseModal: (raffleId: string, cost: Cost) => void;
    onFinalizeRaffleClick: (raffle: Raffle) => void;
}

const SaleList: React.FC<{
    sales: Sale[],
    ticketPrice: number,
    onDelete: (sale: Sale) => void,
    onEdit: (sale: Sale) => void,
    onSave: (entry: Omit<Sale, 'id'>) => void,
    isFinalized?: boolean;
}> = ({ sales, ticketPrice, onDelete, onEdit, onSave, isFinalized }) => {
    const [showForm, setShowForm] = React.useState(false);
    const total = sales.reduce((sum, entry) => sum + entry.amount, 0);
    const totalQuantity = sales.reduce((sum, entry) => sum + entry.quantity, 0);

    const handleSave = (entry: Omit<Sale, 'id'>) => {
        onSave(entry);
        setShowForm(false);
    };

    return (
        <div className="bg-surface p-4 rounded-xl border border-stroke shadow-subtle">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-success">Vendas ({totalQuantity})</h3>
                <span className="font-bold text-lg text-success">{formatCurrency(total)}</span>
            </div>
            <ul className="space-y-2">
                {sales.length > 0 ? sales.map(sale => (
                    <li key={sale.id} className="flex justify-between items-start bg-slate-100 p-2.5 rounded-md text-sm group hover:bg-slate-200 transition-colors">
                        <button className="flex-1 text-left pr-2" onClick={() => onEdit(sale)}>
                           <p className="text-text-primary group-hover:text-primary">{sale.quantity} número(s)</p>
                           {sale.description && <p className="text-xs text-text-secondary">{sale.description}</p>}
                        </button>
                        <div className="flex items-center space-x-3">
                            <span className="font-semibold text-text-secondary w-24 text-right">{formatCurrency(sale.amount)}</span>
                             <button onClick={(e) => { e.stopPropagation(); onDelete(sale); }} className="text-slate-400 hover:text-danger transition-colors">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </li>
                )) : <p className="text-text-secondary text-center text-xs py-3">Nenhum lançamento.</p>}
            </ul>
             {!isFinalized && (showForm ? (
                <InlineEntryForm type="sale" ticketPrice={ticketPrice} onSave={handleSave} onCancel={() => setShowForm(false)} />
            ) : (
                <button onClick={() => setShowForm(true)} className="w-full mt-3 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm flex items-center justify-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar Venda</span>
                </button>
            ))}
        </div>
    );
};

const CostList: React.FC<{
    costs: Cost[],
    onDelete: (cost: Cost) => void,
    onEdit: (cost: Cost) => void,
    onSave: (entry: Omit<Cost, 'id'>) => void,
    isFinalized?: boolean;
}> = ({ costs, onDelete, onEdit, onSave, isFinalized }) => {
    const [showForm, setShowForm] = React.useState(false);
    const total = costs.filter(c => !c.isDonation).reduce((sum, entry) => sum + entry.amount, 0);

    const handleSave = (entry: Omit<Cost, 'id'>) => {
        onSave(entry);
        setShowForm(false);
    };

    return (
        <div className="bg-surface p-4 rounded-xl border border-stroke shadow-subtle">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-danger">Custos</h3>
                <span className="font-bold text-lg text-danger">{formatCurrency(total)}</span>
            </div>
            <ul className="space-y-2">
                {costs.length > 0 ? costs.map(cost => (
                    <li key={cost.id} className="flex justify-between items-start bg-slate-100 p-2.5 rounded-md text-sm group hover:bg-slate-200 transition-colors">
                        <button className="flex-1 text-left pr-2" onClick={() => onEdit(cost)}>
                            <p className="text-text-primary group-hover:text-primary">{cost.description}</p>
                            {cost.notes && <p className="text-xs text-text-secondary italic mt-0.5">Obs. Custo: "{cost.notes}"</p>}
                            {cost.reimbursementNotes && <p className="text-xs text-text-secondary italic mt-0.5">Obs. Reembolso: "{cost.reimbursementNotes}"</p>}
                            {cost.date && <p className="text-xs text-text-secondary mt-0.5">{formatDate(cost.date)}</p>}
                            <div className="flex items-center space-x-2 mt-1">
                                {cost.isDonation && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Doação</span>}
                                {cost.isReimbursement && (
                                    cost.reimbursedDate
                                    ? <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">Reembolsado</span>
                                    : <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Reembolsável</span>
                                )}
                            </div>
                        </button>
                        <div className="flex items-center space-x-3">
                            <span className="font-semibold text-text-secondary w-24 text-right">{formatCurrency(cost.amount)}</span>
                             <button onClick={(e) => { e.stopPropagation(); onDelete(cost); }} className="text-slate-400 hover:text-danger transition-colors">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </li>
                )) : <p className="text-text-secondary text-center text-xs py-3">Nenhum lançamento.</p>}
            </ul>
             {!isFinalized && (showForm ? (
                <InlineEntryForm type="cost" onSave={handleSave} onCancel={() => setShowForm(false)} />
            ) : (
                <button onClick={() => setShowForm(true)} className="w-full mt-3 py-2 px-4 bg-danger text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar Custo</span>
                </button>
            ))}
        </div>
    );
};

const ReimbursementSection: React.FC<{ 
    costs: Cost[], 
    onSelectPending: (cost: Cost) => void,
    onSelectCompleted: (cost: Cost) => void,
}> = ({ costs, onSelectPending, onSelectCompleted }) => {
    const pending = costs.filter(c => c.isReimbursement && !c.reimbursedDate);
    const completed = costs.filter(c => c.isReimbursement && c.reimbursedDate);

    if (pending.length === 0 && completed.length === 0) {
        return null; // Don't render the section if there's nothing to show
    }

    return (
        <div className="bg-surface p-4 rounded-xl border border-stroke shadow-subtle">
            <h3 className="text-lg font-bold text-text-primary mb-3">Reembolsos</h3>
            
            {pending.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-amber-700 mb-2">Pendentes</h4>
                    <ul className="space-y-2">
                        {pending.map(cost => (
                            <li key={cost.id} className="grid grid-cols-3 items-center bg-slate-100 p-2.5 rounded-md text-sm hover:bg-slate-200 cursor-pointer transition-colors" onClick={() => onSelectPending(cost)}>
                                <span className="text-text-primary col-span-2">{cost.description}</span>
                                <span className="font-semibold text-text-secondary text-right">{formatCurrency(cost.amount)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {completed.length > 0 && (
                 <div className={pending.length > 0 ? "mt-4 pt-4 border-t border-stroke" : ""}>
                    <h4 className="text-sm font-semibold text-slate-600 mb-2">Efetuados</h4>
                    <ul className="space-y-2">
                        {completed.map(cost => (
                            <li key={cost.id} className="bg-slate-100 p-2.5 rounded-md text-sm hover:bg-slate-200 cursor-pointer transition-colors" onClick={() => onSelectCompleted(cost)}>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-primary">{cost.description}</span>
                                    <span className="font-semibold text-text-secondary text-right">{formatCurrency(cost.amount)}</span>
                                </div>
                                <p className="text-xs text-text-secondary mt-1">Reembolsado em: {formatDate(cost.reimbursedDate!)}</p>
                                {cost.reimbursementNotes && <p className="text-xs text-text-secondary mt-1">Obs: {cost.reimbursementNotes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


const RaffleDetailPage: React.FC<RaffleDetailPageProps> = ({ raffle, onBack, onAddEntry, onOpenDeleteConfirmation, onDeleteRaffleClick, onEditRaffle, onOpenEditEntryModal, onUpdateEntry, onOpenReimburseModal, onFinalizeRaffleClick }) => {
    const totalSales = raffle.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCosts = raffle.costs.filter(c => !c.isDonation).reduce((sum, cost) => sum + cost.amount, 0);
    const profit = totalSales - totalCosts;

    const handleSaveSale = (entry: Omit<Sale, 'id'>) => {
        onAddEntry(raffle.id, 'sale', entry);
    }
     const handleSaveCost = (entry: Omit<Cost, 'id'>) => {
        onAddEntry(raffle.id, 'cost', entry);
    }

    return (
        <div className="animate-fade-in pb-20">
            <header className="flex items-center justify-between mb-4">
                 <button onClick={onBack} className="flex items-center space-x-2 text-primary font-semibold px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    <span>Voltar</span>
                </button>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => onFinalizeRaffleClick(raffle)}
                        className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            raffle.isFinalized
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-700 text-white hover:bg-slate-800'
                        }`}
                    >
                        {raffle.isFinalized ? 'Reabrir Rifa' : 'Finalizar Rifa'}
                    </button>
                    {!raffle.isFinalized && (
                        <>
                            <button onClick={() => onEditRaffle(raffle)} className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-colors">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onDeleteRaffleClick(raffle)} className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-colors">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </header>
            
             {raffle.isFinalized && (
                <div className="bg-slate-100 text-slate-700 text-center p-3 rounded-lg border border-slate-200 mb-6 text-sm font-semibold">
                    Esta rifa está finalizada e arquivada.
                </div>
            )}

            <div className="bg-surface p-5 rounded-xl border border-stroke shadow-subtle mb-6">
                <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">{raffle.title}</h2>
                <div className="flex justify-between items-baseline mt-1">
                    <p className="text-sm text-text-secondary">{formatDate(raffle.date)}</p>
                    <p className="text-xs font-medium text-pill-inactive-text bg-pill-inactive-bg px-2 py-1 rounded-full">{raffle.category}</p>
                </div>
                 <p className="text-sm text-text-primary font-semibold mt-2">{formatCurrency(raffle.ticketPrice)} por número</p>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <p className="text-xs text-emerald-800 font-medium">Vendas</p>
                    <p className="font-bold text-emerald-900 text-base md:text-lg">{formatCurrency(totalSales)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                    <p className="text-xs text-red-800 font-medium">Custos</p>
                    <p className="font-bold text-red-900 text-base md:text-lg">{formatCurrency(totalCosts)}</p>
                </div>
                 <div className={`${profit >= 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'} p-4 rounded-xl border`}>
                    <p className={`text-xs ${profit >= 0 ? 'text-blue-800' : 'text-red-800'} font-medium`}>Lucro</p>
                    <p className={`font-bold ${profit >= 0 ? 'text-blue-900' : 'text-red-900'} text-base md:text-lg`}>{formatCurrency(profit)}</p>
                </div>
            </div>

             {/* Entries */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SaleList 
                        sales={raffle.sales} 
                        ticketPrice={raffle.ticketPrice}
                        onDelete={(sale) => onOpenDeleteConfirmation(raffle.id, 'sale', sale)}
                        onEdit={(sale) => onOpenEditEntryModal(raffle.id, 'sale', sale)}
                        onSave={handleSaveSale}
                        isFinalized={raffle.isFinalized}
                    />
                     <CostList 
                        costs={raffle.costs} 
                        onDelete={(cost) => onOpenDeleteConfirmation(raffle.id, 'cost', cost)} 
                        onEdit={(cost) => onOpenEditEntryModal(raffle.id, 'cost', cost)}
                        onSave={handleSaveCost}
                        isFinalized={raffle.isFinalized}
                    />
                </div>
                <ReimbursementSection 
                    costs={raffle.costs} 
                    onSelectPending={(cost) => onOpenReimburseModal(raffle.id, cost)} 
                    onSelectCompleted={(cost) => onOpenEditEntryModal(raffle.id, 'cost', cost)}
                />
            </div>
        </div>
    );
};

export default RaffleDetailPage;
