import React, { useState, useMemo } from 'react';
import type { Raffle } from '../types';
import { 
    TicketIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    LogoutIcon,
} from './icons';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

interface RaffleCardProps {
    raffle: Raffle;
    onSelect: () => void;
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle, onSelect }) => {
    const totalSales = raffle.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCosts = raffle.costs.filter(c => !c.isDonation).reduce((sum, cost) => sum + cost.amount, 0);
    const profit = totalSales - totalCosts;

    return (
        <div 
            onClick={onSelect}
            className={`bg-surface p-4 rounded-xl border border-stroke shadow-subtle hover:shadow-card hover:border-primary transition-all cursor-pointer group flex flex-col justify-between ${raffle.isFinalized ? 'opacity-60' : ''}`}
        >
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-text-primary group-hover:text-primary pr-2">{raffle.title}</h3>
                     <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                        {raffle.isFinalized && (
                            <p className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-1 rounded-full whitespace-nowrap">Finalizada</p>
                        )}
                        <p className="text-xs font-medium text-pill-inactive-text bg-pill-inactive-bg px-2 py-1 rounded-full whitespace-nowrap">{raffle.category}</p>
                    </div>
                </div>
                <p className="text-xs text-text-secondary mt-1">{formatDate(raffle.date)}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-stroke/80 flex justify-between items-center text-xs space-x-1">
                <div className="px-2 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">
                    {formatCurrency(totalSales)}
                </div>
                <div className="px-2 py-1 rounded-full font-bold bg-red-100 text-red-700">
                    {formatCurrency(totalCosts)}
                </div>
                <div className={`px-2 py-1 rounded-full font-bold ${profit >= 0 ? 'bg-pill-inactive-bg text-pill-inactive-text' : 'bg-red-100 text-red-700'}`}>
                    {formatCurrency(profit)}
                </div>
            </div>
        </div>
    );
};


interface RaffleListPageProps {
    raffles: Raffle[];
    onSelectRaffle: (id: string) => void;
    onLogout: () => void;
}

const CATEGORIES = ["Todos", "Caboclo", "Preto Velho", "Exú", "Crianças", "Mata", "Praia"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


const RaffleListPage: React.FC<RaffleListPageProps> = ({ raffles, onSelectRaffle, onLogout }) => {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10)); // Default to Nov 2025
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(10); // 10 = November
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const sortedAndFilteredRaffles = useMemo(() => {
        return raffles
            .filter(raffle => {
                const raffleDate = new Date(raffle.date);
                const categoryMatch = selectedCategory === 'Todos' || raffle.category === selectedCategory;
                const yearMatch = raffleDate.getFullYear() === currentDate.getFullYear();
                const monthMatch = selectedMonth === 'all' || raffleDate.getMonth() === selectedMonth;
                
                return categoryMatch && yearMatch && monthMatch;
            })
            .sort((a, b) => {
                // Sort finalized raffles to the bottom
                if (a.isFinalized !== b.isFinalized) {
                    return a.isFinalized ? 1 : -1;
                }
                // Then sort by date (most recent first)
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [raffles, selectedCategory, currentDate, selectedMonth]);


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
            <header className="mb-6 text-center relative">
                <h2 className="text-3xl font-extrabold text-primary tracking-tight">Controle de Rifas</h2>
                 <button 
                    onClick={onLogout} 
                    className="absolute top-0 right-0 p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors md:hidden"
                    aria-label="Sair do aplicativo"
                    title="Sair"
                >
                    <LogoutIcon className="h-7 w-7" />
                </button>
            </header>
            
            {/* Filters */}
            <div className="mb-6 space-y-4">
                 {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${selectedCategory === category ? 'bg-primary-dark text-white' : 'bg-pill-inactive-bg text-pill-inactive-text hover:bg-slate-200'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Date Picker */}
                <div className="relative">
                    <button 
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className="w-full flex justify-between items-center text-left bg-surface p-3 border border-stroke rounded-lg shadow-sm"
                    >
                        <span className="font-semibold text-text-primary">{currentFilterText}</span>
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

            {sortedAndFilteredRaffles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedAndFilteredRaffles.map(raffle => (
                        <RaffleCard key={raffle.id} raffle={raffle} onSelect={() => onSelectRaffle(raffle.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-stroke rounded-lg bg-slate-50 mt-8">
                    <TicketIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-text-primary">Nenhuma rifa encontrada</h3>
                    <p className="text-text-secondary mt-2">Tente ajustar os filtros ou crie uma nova rifa.</p>
                </div>
            )}
        </div>
    );
};

export default RaffleListPage;
