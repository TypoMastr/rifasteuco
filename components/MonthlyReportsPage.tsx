import React, { useState, useMemo } from 'react';
import type { Raffle } from '../types';
import { ArrowUturnLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './icons';

// --- Reused helpers ---
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

interface MonthlyReportsPageProps {
    raffles: Raffle[];
    onBack: () => void;
    onSelectRaffle: (id: string) => void;
}

const MonthlyReportsPage: React.FC<MonthlyReportsPageProps> = ({ raffles, onBack, onSelectRaffle }) => {
    const [currentYear, setCurrentYear] = useState(new Date(2025, 1, 1).getFullYear());
    const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

    const changeYear = (amount: number) => {
        setCurrentYear(prev => prev + amount);
        setExpandedMonthKey(null); // Collapse months when year changes
    };

    const toggleMonth = (key: string) => {
        setExpandedMonthKey(prevKey => (prevKey === key ? null : key));
    };

    const allReports = useMemo(() => {
        const byMonth: { [key: string]: { sales: number; costs: number; raffles: Raffle[] } } = {};

        raffles.forEach(raffle => {
            const date = new Date(raffle.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            if (!byMonth[monthKey]) byMonth[monthKey] = { sales: 0, costs: 0, raffles: [] };
            
            byMonth[monthKey].sales += raffle.sales.reduce((s, c) => s + c.amount, 0);
            byMonth[monthKey].costs += raffle.costs.filter(c => !c.isDonation).reduce((s, c) => s + c.amount, 0);
            byMonth[monthKey].raffles.push(raffle);
        });

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const formatMonthKey = (key: string) => {
            const [year, month] = key.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        };

        return Object.entries(byMonth)
            .map(([key, data]) => ({ 
                label: formatMonthKey(key), 
                originalKey: key, 
                sales: data.sales,
                costs: data.costs,
                profit: data.sales - data.costs,
                raffles: data.raffles
            }))
            .sort((a, b) => b.originalKey.localeCompare(a.originalKey));

    }, [raffles]);
    
    const reportsForYear = allReports.filter(report => report.originalKey.startsWith(String(currentYear)));

    return (
        <div className="animate-fade-in">
            <header className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary font-semibold px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    <span>Voltar</span>
                </button>
                <h2 className="text-2xl font-extrabold text-primary tracking-tight">Histórico Mensal</h2>
            </header>

            <div className="bg-surface p-3 border border-stroke rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-center">
                    <button onClick={() => changeYear(-1)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-lg text-text-primary">{currentYear}</span>
                    <button onClick={() => changeYear(1)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ChevronRightIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                 <ul className="space-y-2">
                    {reportsForYear.length > 0 ? (
                        reportsForYear.map(item => {
                            const isExpanded = expandedMonthKey === item.originalKey;
                            const profitMarginPercentage = item.sales > 0 ? (item.profit / item.sales) * 100 : 0;
                            const clampedProfitMargin = Math.max(0, Math.min(profitMarginPercentage, 100));

                            return (
                               <li key={item.originalKey} className="bg-surface p-3 rounded-lg border border-stroke shadow-subtle">
                                    <div className="cursor-pointer" onClick={() => toggleMonth(item.originalKey)}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="pr-4">
                                                        <p className="font-semibold text-text-primary text-base leading-tight">{item.label}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-text-secondary">Lucro</p>
                                                        <p className={`font-bold ${item.profit >= 0 ? 'text-text-primary' : 'text-danger'} text-base`}>{formatCurrency(item.profit)}</p>
                                                    </div>
                                                </div>
                                                
                                                {item.profit < 0 ? (
                                                    <div className="w-full bg-danger rounded-full h-2" title={`Prejuízo de ${formatCurrency(Math.abs(item.profit))}`}></div>
                                                ) : (
                                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                                        <div className="bg-success h-2 rounded-full" style={{ width: `${clampedProfitMargin}%` }}></div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-success">Vendas: {formatCurrency(item.sales)}</span>
                                                    <span className="text-danger">Custos: {formatCurrency(item.costs)}</span>
                                                </div>
                                            </div>
                                            <ChevronDownIcon className={`h-5 w-5 text-text-secondary transition-transform ml-4 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-stroke animate-fade-in">
                                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Rifas do Mês</h4>
                                            <ul className="space-y-2">
                                                {item.raffles.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(raffle => (
                                                <li key={raffle.id}>
                                                    <button onClick={() => onSelectRaffle(raffle.id)} className="w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold text-text-primary text-sm">{raffle.title}</p>
                                                                <p className="text-xs text-text-secondary">{formatDate(raffle.date)}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            );
                        })
                    ) : (
                         <div className="text-center py-16 border-2 border-dashed border-stroke rounded-lg bg-slate-50 mt-8">
                            <h3 className="mt-4 text-lg font-semibold text-text-primary">Nenhum dado encontrado</h3>
                            <p className="text-text-secondary mt-2">Não há rifas registradas para o ano de {currentYear}.</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default MonthlyReportsPage;