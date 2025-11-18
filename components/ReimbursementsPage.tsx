import React, { useState, useMemo } from 'react';
import type { Raffle, Cost } from '../types';
import { 
    ArrowUturnLeftIcon, 
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    BanknotesIcon,
    PencilIcon,
    LogoutIcon,
} from './icons';

// Helper types
type ReimbursementItem = Cost & {
    raffleId: string;
    raffleTitle: string;
    raffleCategory: string;
    raffleDate: string;
};

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Adjust for timezone offset to display the correct date
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const formatRaffleDateForFilter = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    // Using UTC methods to avoid timezone shifts from altering the month/year
    const month = monthNames[date.getUTCMonth()];
    const year = String(date.getUTCFullYear()).slice(-2);
    return `(${month}/${year})`;
};


const CATEGORIES = ["Todas", "Caboclo", "Preto Velho", "Exú", "Crianças", "Mata", "Praia", "Outro"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


const ReportAccordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean, count?: number }> = ({ title, children, defaultOpen = false, count }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-surface rounded-lg border border-stroke shadow-subtle overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3"
            >
                <div className="flex items-center space-x-2">
                    <h3 className="text-md font-bold text-text-primary">{title}</h3>
                    {count !== undefined && <span className="text-xs font-semibold text-white bg-slate-400 px-2 py-0.5 rounded-full">{count}</span>}
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-3 pb-3 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};


interface ReimbursementsPageProps {
    raffles: Raffle[];
    onBack: () => void;
    onOpenEditCostModal: (raffleId: string, type: 'cost', cost: Cost) => void;
    onSelectRaffle: (raffleId: string) => void;
    onOpenReimburseModal: (raffleId: string, cost: Cost) => void;
    onNavigateToHistory: () => void;
    onLogout: () => void;
    isReadOnly: boolean;
}

const ReimbursementsPage: React.FC<ReimbursementsPageProps> = ({ raffles, onBack, onOpenEditCostModal, onSelectRaffle, onOpenReimburseModal, onNavigateToHistory, onLogout, isReadOnly }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRaffleId, setSelectedRaffleId] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10));
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    
    const sortedRaffles = useMemo(() => {
        return [...raffles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [raffles]);

    const pendingReimbursements = useMemo<ReimbursementItem[]>(() => {
        return raffles.flatMap(raffle => 
            raffle.costs
                .filter(cost => cost.isReimbursement && !cost.reimbursedDate)
                .map(cost => ({
                    ...cost,
                    raffleId: raffle.id,
                    raffleTitle: raffle.title,
                    raffleCategory: raffle.category,
                    raffleDate: raffle.date,
                }))
        );
    }, [raffles]);

    const completedReimbursements = useMemo<ReimbursementItem[]>(() => {
        return raffles.flatMap(raffle => 
            raffle.costs
                .filter(cost => cost.isReimbursement && cost.reimbursedDate)
                .map(cost => ({
                    ...cost,
                    raffleId: raffle.id,
                    raffleTitle: raffle.title,
                    raffleCategory: raffle.category,
                    raffleDate: raffle.date,
                }))
        ).sort((a, b) => new Date(b.reimbursedDate!).getTime() - new Date(a.reimbursedDate!).getTime());
    }, [raffles]);

    const filteredReimbursements = useMemo(() => {
        return pendingReimbursements.filter(cost => {
            const costDate = cost.date ? new Date(cost.date) : null;
            
            const searchMatch = !searchTerm || cost.description.toLowerCase().includes(searchTerm.toLowerCase());
            const raffleMatch = selectedRaffleId === 'all' || cost.raffleId === selectedRaffleId;
            const categoryMatch = selectedCategory === 'Todas' || cost.raffleCategory === selectedCategory;
            const yearMatch = !costDate || costDate.getFullYear() === currentDate.getFullYear();
            const monthMatch = !costDate || selectedMonth === 'all' || costDate.getMonth() === selectedMonth;
            
            return searchMatch && raffleMatch && categoryMatch && yearMatch && monthMatch;
        });
    }, [pendingReimbursements, searchTerm, selectedRaffleId, selectedCategory, currentDate, selectedMonth]);
    
    const historyToShow = completedReimbursements.slice(0, 5);


    const handleMonthSelect = (month: number | 'all') => {
        setSelectedMonth(month);
        setIsDatePickerOpen(false);
    };

    const changeYear = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setFullYear(newDate.getFullYear() + amount);
            return newDate;
        });
    };
    
    const currentFilterText = selectedMonth === 'all' 
        ? `Ano Inteiro / ${currentDate.getFullYear()}`
        : `${MONTHS[selectedMonth]} / ${currentDate.getFullYear()}`;

    const handleReimburseClick = (item: ReimbursementItem) => {
        onOpenReimburseModal(item.raffleId, item);
    };

    const handleEditClick = (item: ReimbursementItem) => {
        const { raffleId, raffleTitle, raffleCategory, raffleDate, ...originalCost } = item;
        onOpenEditCostModal(raffleId, 'cost', originalCost);
    };

    return (
        <div className="animate-fade-in">
            <header className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center space-x-2 text-primary font-semibold px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    <span>Voltar</span>
                </button>
                <h2 className="text-2xl font-extrabold text-primary tracking-tight">Reembolsos</h2>
                 <button 
                    onClick={onLogout} 
                    className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors md:hidden"
                    aria-label="Sair do aplicativo"
                    title="Sair"
                >
                    <LogoutIcon className="h-7 w-7" />
                </button>
            </header>

            <div className="space-y-4 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-stroke rounded-lg focus:ring-primary focus:border-primary bg-white"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        value={selectedRaffleId}
                        onChange={e => setSelectedRaffleId(e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:ring-primary focus:border-primary bg-white"
                    >
                        <option value="all">Todas as Rifas</option>
                        {sortedRaffles.map(raffle => <option key={raffle.id} value={raffle.id}>{`${raffle.title} ${formatRaffleDateForFilter(raffle.date)}`}</option>)}
                    </select>
                     <div className="relative">
                        <button 
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className="w-full flex justify-between items-center text-left bg-white px-3 py-2 border border-stroke rounded-lg shadow-sm"
                        >
                            <span className="font-semibold text-text-primary text-sm">{currentFilterText}</span>
                            <ChevronDownIcon className={`h-5 w-5 text-text-secondary transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDatePickerOpen && (
                            <div className="absolute top-full mt-2 w-full bg-surface border border-stroke rounded-lg shadow-lg z-10 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <button onClick={() => changeYear(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeftIcon className="h-5 w-5" /></button>
                                    <span className="font-bold text-lg">{currentDate.getFullYear()}</span>
                                    <button onClick={() => changeYear(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRightIcon className="h-5 w-5" /></button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {MONTHS.map((month, index) => (
                                        <button key={month} onClick={() => handleMonthSelect(index)} className={`p-2 rounded-md text-sm font-semibold text-center ${selectedMonth === index ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>
                                            {month}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => handleMonthSelect('all')} className={`mt-4 w-full p-2 rounded-md font-semibold text-sm ${selectedMonth === 'all' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                    Ano Inteiro
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${selectedCategory === category ? 'bg-primary-dark text-white' : 'bg-pill-inactive-bg text-pill-inactive-text hover:bg-slate-200'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filteredReimbursements.length > 0 ? filteredReimbursements.map(cost => (
                    <div key={cost.id} className="bg-surface p-4 rounded-xl border border-stroke shadow-subtle flex flex-col space-y-3">
                        {/* Raffle Info */}
                        <div className="flex justify-between items-baseline border-b border-stroke/80 pb-2">
                            <div>
                                <button onClick={() => onSelectRaffle(cost.raffleId)} className="font-semibold text-sm text-primary hover:underline text-left focus:outline-none focus:ring-2 focus:ring-primary/50 rounded">
                                    {cost.raffleTitle}
                                </button>
                                <p className="text-xs text-text-secondary">{formatDate(cost.raffleDate)}</p>
                            </div>
                        </div>

                        {/* Expense Info */}
                        <div className="flex justify-between items-start pt-1">
                            <div className="flex-1 pr-4">
                                <p className="font-bold text-text-primary text-base">{cost.description}</p>
                                {cost.notes && <p className="text-xs text-text-secondary italic mt-1">"{cost.notes}"</p>}
                                {cost.date && <p className="text-xs text-text-secondary mt-1">Data da Despesa: {formatDate(cost.date)}</p>}
                            </div>
                            <p className="font-bold text-lg text-amber-700 ml-2 whitespace-nowrap">{formatCurrency(cost.amount)}</p>
                        </div>

                        {/* Action Buttons */}
                        {!isReadOnly && (
                            <div className="flex items-center space-x-2 pt-2 border-t border-stroke/80">
                                <button
                                    onClick={() => handleEditClick(cost)}
                                    className="bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-lg hover:bg-slate-300 transition-colors text-sm flex-1 flex items-center justify-center space-x-2"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Editar</span>
                                </button>
                                <button
                                    onClick={() => handleReimburseClick(cost)}
                                    className="bg-amber-100 text-amber-800 font-bold py-2 px-3 rounded-lg hover:bg-amber-200 transition-colors text-sm flex-1 flex items-center justify-center space-x-2"
                                >
                                    <BanknotesIcon className="h-4 w-4" />
                                    <span>Reembolsar</span>
                                </button>
                            </div>
                        )}
                    </div>
                )) : (
                     <div className="text-center py-16 border-2 border-dashed border-stroke rounded-lg bg-slate-50 mt-8">
                        <BanknotesIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-lg font-semibold text-text-primary">Nenhum reembolso pendente</h3>
                        <p className="text-text-secondary mt-2">Parece que está tudo em dia! Tente ajustar os filtros se não encontrar o que procura.</p>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <ReportAccordion title="Histórico de Reembolsos" count={completedReimbursements.length}>
                    {completedReimbursements.length > 0 ? (
                        <>
                            <ul className="space-y-2 mt-2">
                                {historyToShow.map(cost => (
                                    <li key={cost.id} 
                                        onClick={() => onSelectRaffle(cost.raffleId)}
                                        className="bg-slate-100 p-3 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="pr-2">
                                                <p className="font-semibold text-text-primary text-sm">{cost.description}</p>
                                                {cost.notes && <p className="text-xs text-text-secondary italic mt-0.5">Obs. Custo: "{cost.notes}"</p>}
                                                {cost.reimbursementNotes && <p className="text-xs text-text-secondary italic mt-0.5">Obs. Reembolso: "{cost.reimbursementNotes}"</p>}
                                            </div>
                                            <p className="font-bold text-sm text-text-primary flex-shrink-0">{formatCurrency(cost.amount)}</p>
                                        </div>
                                        <div className="border-t border-slate-200 pt-2 mt-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-xs text-primary">{cost.raffleTitle}</p>
                                                    <p className="text-xs text-text-secondary">{formatDate(cost.raffleDate)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-xs text-primary">Reembolso:</p>
                                                    <p className="text-xs text-text-secondary">{formatDate(cost.reimbursedDate!)}</p>
                                                </div>
                                            </div>
                                            {cost.date && (
                                                <div className="text-xs text-text-secondary mt-1">
                                                    <p><span className="font-medium">Despesa:</span> {formatDate(cost.date)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                             {completedReimbursements.length > 0 && (
                                <div className="mt-4">
                                    <button 
                                        onClick={onNavigateToHistory}
                                        className="w-full text-center py-2 px-4 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors text-sm"
                                    >
                                        Ver Histórico Completo
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-text-secondary text-sm text-center py-4">Nenhum reembolso foi registrado ainda.</p>
                    )}
                </ReportAccordion>
            </div>
        </div>
    );
};

export default ReimbursementsPage;