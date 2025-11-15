import React, { useMemo, useState, useEffect } from 'react';
import type { Raffle } from '../types';
import { 
    CurrencyDollarIcon, 
    ArrowTrendingDownIcon, 
    ArrowTrendingUpIcon,
    ChevronDownIcon,
    BanknotesIcon,
    ChevronRightIcon,
    LogoutIcon,
    FingerprintIcon,
} from './icons';
import { 
    isBiometricSupportAvailable,
    isBiometricRegistered,
    registerBiometricCredential,
    unregisterBiometricCredential
} from '../services/biometrics';


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

// --- Child Components ---

const FinancialCard: React.FC<{ title: string; value: string; icon: React.ReactElement<React.ComponentProps<'svg'>>, colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-surface p-3 rounded-lg border border-stroke shadow-subtle flex items-center space-x-2">
        <div className={`p-2 rounded-full ${colorClass}`}>
             {React.cloneElement(icon, { className: "h-5 w-5 text-white" })}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary font-medium">{title}</p>
            <p className="text-base font-bold text-text-primary truncate">{value}</p>
        </div>
    </div>
);


const ReimbursementSummaryCard: React.FC<{ raffles: Raffle[] }> = ({ raffles }) => {
    const summary = useMemo(() => {
        let totalReimbursable = 0;
        let totalReimbursed = 0;

        raffles.forEach(raffle => {
            raffle.costs.forEach(cost => {
                if (cost.isReimbursement) {
                    totalReimbursable += cost.amount;
                    if (cost.reimbursedDate) {
                        totalReimbursed += cost.amount;
                    }
                }
            });
        });
        
        const percentage = totalReimbursable > 0 ? (totalReimbursed / totalReimbursable) * 100 : 100;
        const pending = totalReimbursable - totalReimbursed;

        return { totalReimbursable, totalReimbursed, pending, percentage };
    }, [raffles]);

    return (
         <div className="bg-surface p-4 rounded-lg border border-stroke shadow-subtle">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                     <div className="p-2 rounded-full bg-amber-100">
                        <BanknotesIcon className="h-5 w-5 text-amber-600"/>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-md font-bold text-text-primary">Resumo de Reembolsos</h3>
                        <p className="text-sm font-bold text-amber-600">{formatCurrency(summary.pending)} pendente</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-3">
                <div className="w-full bg-amber-200 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `${summary.percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mt-1.5">
                    <span>Reembolsado: {formatCurrency(summary.totalReimbursed)}</span>
                    <span>Total: {formatCurrency(summary.totalReimbursable)}</span>
                </div>
            </div>
        </div>
    );
};


const ReportAccordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-surface rounded-lg border border-stroke shadow-subtle overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3"
            >
                <h3 className="text-md font-bold text-text-primary">{title}</h3>
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

const ReportRow: React.FC<{ label: string; date?: string; sales: number; costs: number; profit: number }> = ({ label, date, sales, costs, profit }) => {
    const profitMarginPercentage = sales > 0 ? (profit / sales) * 100 : 0;
    // Clamp between 0 and 100 for a clean visual representation.
    const clampedProfitMargin = Math.max(0, Math.min(profitMarginPercentage, 100));

    return (
        <li className="p-3 bg-slate-100 rounded-lg space-y-2">
            {/* Top Line: Title and Profit */}
            <div className="flex justify-between items-start">
                <div className="pr-4">
                    <p className="font-semibold text-text-primary text-sm leading-tight">{label}</p>
                    {date && <p className="text-xs text-text-secondary">{formatDate(date)}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                     <p className="text-xs text-text-secondary">Lucro</p>
                     <p className={`font-bold ${profit >= 0 ? 'text-text-primary' : 'text-danger'} text-sm`}>{formatCurrency(profit)}</p>
                </div>
            </div>

            {/* Bar/Graph */}
            {profit < 0 ? (
                <div className="w-full bg-danger rounded-full h-2" title={`Prejuízo de ${formatCurrency(Math.abs(profit))}`}></div>
            ) : (
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `${clampedProfitMargin}%` }}></div>
                </div>
            )}


            {/* Bottom Line: Sales and Costs values */}
            <div className="flex justify-between text-xs font-medium">
                <span className="text-success">Vendas: {formatCurrency(sales)}</span>
                <span className="text-danger">Custos: {formatCurrency(costs)}</span>
            </div>
        </li>
    );
};

const BiometricSettings = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const support = isBiometricSupportAvailable();
        setIsSupported(support);
        if (support) {
            setIsEnabled(isBiometricRegistered());
        }
    }, []);

    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const shouldEnable = e.target.checked;
        setStatusMessage('');

        if (shouldEnable) {
            const success = await registerBiometricCredential();
            if (success) {
                setIsEnabled(true);
                setStatusMessage('Biometria ativada com sucesso neste dispositivo.');
            } else {
                setStatusMessage('Falha ao ativar a biometria. Tente novamente.');
                // Ensure toggle returns to off state
                e.target.checked = false; 
            }
        } else {
            unregisterBiometricCredential();
            setIsEnabled(false);
            setStatusMessage('Biometria desativada.');
        }

        setTimeout(() => setStatusMessage(''), 4000);
    };

    if (!isSupported) {
        return null; // Don't show the component if the browser doesn't support WebAuthn
    }

    return (
        <div className="bg-surface p-4 rounded-lg border border-stroke shadow-subtle">
            <div className="flex items-start">
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h3 className="text-md font-bold text-text-primary">Login com Biometria</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={handleToggle}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                        Ative para entrar no aplicativo usando sua impressão digital ou reconhecimento facial, sem precisar digitar a senha.
                    </p>
                    {statusMessage && <p className="text-xs font-semibold text-primary mt-2">{statusMessage}</p>}
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
interface RelatoriosPageProps {
    raffles: Raffle[];
    onNavigateToMonthlyReports: () => void;
    onNavigateToReimbursements: () => void;
    onLogout: () => void;
}

const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ raffles, onNavigateToMonthlyReports, onNavigateToReimbursements, onLogout }) => {

    const financialSummary = useMemo(() => {
        const totalSales = raffles.reduce((total, raffle) => 
            total + raffle.sales.reduce((sum, sale) => sum + sale.amount, 0), 0);
        
        const totalCosts = raffles.reduce((total, raffle) =>
            total + raffle.costs.filter(c => !c.isDonation).reduce((sum, cost) => sum + cost.amount, 0), 0);

        return {
            totalSales,
            totalCosts,
            totalProfit: totalSales - totalCosts
        };
    }, [raffles]);
    
    const reports = useMemo(() => {
        const byCategory: { [key: string]: { sales: number; costs: number } } = {};
        const byMonth: { [key: string]: { sales: number; costs: number } } = {};
        const byYear: { [key: string]: { sales: number; costs: number } } = {};

        raffles.forEach(raffle => {
            // By Category
            if (!byCategory[raffle.category]) byCategory[raffle.category] = { sales: 0, costs: 0 };
            byCategory[raffle.category].sales += raffle.sales.reduce((s, c) => s + c.amount, 0);
            byCategory[raffle.category].costs += raffle.costs.filter(c => !c.isDonation).reduce((s, c) => s + c.amount, 0);
            
            // By Month & Year
            const date = new Date(raffle.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const yearKey = String(year);
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // use month+1 for correct sorting
            
            if (!byYear[yearKey]) byYear[yearKey] = { sales: 0, costs: 0 };
            if (!byMonth[monthKey]) byMonth[monthKey] = { sales: 0, costs: 0 };
            
            const raffleSales = raffle.sales.reduce((s, c) => s + c.amount, 0);
            const raffleCosts = raffle.costs.filter(c => !c.isDonation).reduce((s, c) => s + c.amount, 0);

            byYear[yearKey].sales += raffleSales;
            byYear[yearKey].costs += raffleCosts;
            byMonth[monthKey].sales += raffleSales;
            byMonth[monthKey].costs += raffleCosts;
        });

        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const formatMonthKey = (key: string) => {
            const [year, month] = key.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`; // month-1 for array index
        }
        
        return {
            byCategory: Object.entries(byCategory).map(([label, data]) => ({ label, ...data, profit: data.sales - data.costs })).sort((a, b) => b.profit - a.profit),
            byMonth: Object.entries(byMonth).map(([key, data]) => ({ label: formatMonthKey(key), originalKey: key, ...data, profit: data.sales - data.costs })).sort((a, b) => b.originalKey.localeCompare(a.originalKey)),
            byYear: Object.entries(byYear).map(([label, data]) => ({ label, ...data, profit: data.sales - data.costs })).sort((a, b) => parseInt(b.label) - parseInt(a.label)),
        };

    }, [raffles]);

    const recentMonthlyReports = reports.byMonth.slice(0, 3);

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-3">
            <header className="mb-4 text-center relative">
                <h2 className="text-3xl font-extrabold text-primary tracking-tight">Relatórios Gerais</h2>
                <p className="text-text-secondary mt-1">Um resumo financeiro de todas as suas rifas.</p>
                <button 
                    onClick={onLogout} 
                    className="absolute top-0 right-0 p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors md:hidden"
                    aria-label="Sair do aplicativo"
                    title="Sair"
                >
                    <LogoutIcon className="h-7 w-7" />
                </button>
            </header>

            <div className="grid grid-cols-2 gap-2">
                <FinancialCard 
                    title="Arrecadado" 
                    value={formatCurrency(financialSummary.totalSales)} 
                    icon={<CurrencyDollarIcon />}
                    colorClass="bg-success"
                />
                <FinancialCard 
                    title="Custos" 
                    value={formatCurrency(financialSummary.totalCosts)} 
                    icon={<CurrencyDollarIcon />}
                    colorClass="bg-danger"
                />
                <div className="col-span-2">
                     <div className={`bg-surface p-3 rounded-lg border border-stroke shadow-subtle flex items-center justify-between ${financialSummary.totalProfit >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-danger/5 border-danger/20'}`}>
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${financialSummary.totalProfit >= 0 ? "bg-primary" : "bg-danger"}`}>
                                <CurrencyDollarIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${financialSummary.totalProfit >= 0 ? 'text-primary-dark' : 'text-danger'}`}>Lucro Total</p>
                                <p className={`font-bold text-xl ${financialSummary.totalProfit >= 0 ? 'text-primary-dark' : 'text-danger'}`}>{formatCurrency(financialSummary.totalProfit)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onClick={onNavigateToReimbursements} className="w-full text-left transition-transform duration-200 ease-in-out hover:shadow-card hover:-translate-y-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group">
                <ReimbursementSummaryCard raffles={raffles} />
            </button>

             <ReportAccordion title="Desempenho por Mês" defaultOpen>
                 <ul className="space-y-1.5">
                    {recentMonthlyReports.length > 0 ? recentMonthlyReports.map(item => <ReportRow key={item.label} {...item} />)
                    : <p className="text-text-secondary text-sm text-center py-4">Nenhum dado mensal para exibir.</p>}
                </ul>
                <div className="mt-4">
                    <button 
                        onClick={onNavigateToMonthlyReports}
                        className="w-full text-center py-2 px-4 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors text-sm"
                    >
                        Veja Mais
                    </button>
                </div>
            </ReportAccordion>

            <ReportAccordion title="Desempenho por Ano" defaultOpen>
                 <ul className="space-y-1.5">
                    {reports.byYear.length > 0 ? reports.byYear.map(item => <ReportRow key={item.label} {...item} />)
                    : <p className="text-text-secondary text-sm text-center py-4">Nenhum dado anual para exibir.</p>}
                </ul>
            </ReportAccordion>

            <ReportAccordion title="Desempenho por Categoria">
                 <ul className="space-y-1.5">
                    {reports.byCategory.length > 0 ? reports.byCategory.map(item => <ReportRow key={item.label} {...item} />)
                    : <p className="text-text-secondary text-sm text-center py-4">Nenhuma categoria para exibir.</p>}
                </ul>
            </ReportAccordion>
            
            <div className="pt-2">
                 <BiometricSettings />
            </div>

        </div>
    );
};

export default RelatoriosPage;
