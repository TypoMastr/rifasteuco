import React, { useState, useMemo } from 'react';
import type { Raffle, Cost } from '../types';
import { 
    ArrowUturnLeftIcon, 
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    BanknotesIcon
} from './icons';

// Helper types from ReimbursementsPage
type ReimbursementItem = Cost & {
    raffleId: string;
    raffleTitle: string;
    raffleCategory: string;
    raffleDate: string;
};

// Helper functions from ReimbursementsPage
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const formatRaffleDateForFilter = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const month = monthNames[date.getUTCMonth()];
    const year = String(date.getUTCFullYear()).slice(-2);
    return `(${month}/${year})`;
};

const CATEGORIES = ["Todas", "Caboclo", "Preto Velho", "Exú", "Crianças", "Mata", "Praia", "Outro"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface ReimbursementHistoryPageProps {
    raffles: Raffle[];
    onBack: () => void;
    onSelectRaffle: (raffleId: string) => void;
}

const ReimbursementHistoryPage: React.FC<ReimbursementHistoryPageProps> = ({ raffles, onBack, onSelectRaffle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRaffleId, setSelectedRaffleId] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10));
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    
    const sortedRaffles = useMemo(() => {
        return [...raffles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    const filteredHistory = useMemo(() => {
        return completedReimbursements.filter(cost => {
            const reimbursedDate = new Date(cost.reimbursedDate!);
            
            const searchMatch = !searchTerm || cost.description.toLowerCase().includes(searchTerm.toLowerCase()) || cost.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || cost.reimbursementNotes?.toLowerCase().includes(searchTerm.toLowerCase());
            const raffleMatch = selectedRaffleId === 'all' || cost.raffleId === selectedRaffleId;
            const categoryMatch = selectedCategory === 'Todas' || cost.raffleCategory === selectedCategory;
            const yearMatch = reimbursedDate.getFullYear() === currentDate.getFullYear();
            const monthMatch = selectedMonth === 'all' || reimbursedDate.getMonth() === selectedMonth;
            
            return searchMatch && raffleMatch && categoryMatch && yearMatch && monthMatch;
        });
    }, [completedReimbursements, searchTerm, selectedRaffleId, selectedCategory, currentDate, selectedMonth]);

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

    return (
        <div className="animate-fade-in">
            <header className="flex items-center justify-between mb-6">
                 <button onClick={onBack} className="flex items-center space-x-2 text-primary font-semibold px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    <span>Voltar</span>
                </button>
                <h2 className="text-2xl font-extrabold text-primary tracking-tight">Histórico Completo</h2>
            </header>

            <div className="space-y-4 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por descrição ou observação..."
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
            </div>
            
            <div className="space-y-3">
                 {filteredHistory.length > 0 ? (
                    filteredHistory.map(cost => (
                        <div key={cost.id} 
                            onClick={() => onSelectRaffle(cost.raffleId)}
                            className="bg-surface p-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-stroke"
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
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-stroke rounded-lg bg-slate-50 mt-8">
                        <BanknotesIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-lg font-semibold text-text-primary">Nenhum reembolso encontrado</h3>
                        <p className="text-text-secondary mt-2">Tente ajustar os filtros para encontrar o que procura.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReimbursementHistoryPage;
