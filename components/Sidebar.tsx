import React from 'react';
import { TicketIcon, DocumentTextIcon, BanknotesIcon, ClockIcon, LogoutIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon } from './icons';

type Page = 'list' | 'reports' | 'detail' | 'reimbursements' | 'monthlyReports' | 'reimbursementHistory' | 'history';
type NavPage = 'list' | 'reimbursements' | 'reports' | 'history';

interface SidebarProps {
    onNavigate: (page: 'list' | 'reports' | 'history') => void;
    onOpenRaffleModal: () => void;
    onOpenGlobalEntryModal: (type: 'sale' | 'cost') => void;
    onNavigateToReimbursements: () => void;
    onLogout: () => void;
    currentPage: Page;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onOpenRaffleModal, onOpenGlobalEntryModal, onNavigateToReimbursements, onLogout, currentPage }) => {

    const navPage: NavPage =
        (currentPage === 'list' || currentPage === 'detail') ? 'list'
        : (currentPage === 'reimbursements' || currentPage === 'reimbursementHistory') ? 'reimbursements'
        : (currentPage === 'history') ? 'history'
        : 'reports';

    const NavButton: React.FC<{
        page: NavPage;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
    }> = ({ page, label, icon, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 ${navPage === page ? 'bg-primary text-white font-semibold' : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary'}`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-stroke p-4 space-y-4 fixed h-full">
            <div className="flex items-center space-x-3 px-2 pt-2 pb-4">
                <img 
                    src="https://teuco.com.br/rifas/icone_rifas.png" 
                    alt="Ícone Rifas TEUCO" 
                    className="w-10 h-10" 
                />
                <h1 className="text-xl font-bold text-primary">Rifas TEUCO</h1>
            </div>

            <div className="space-y-2">
                 <button
                    onClick={onOpenRaffleModal}
                    className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                    <TicketIcon className="h-5 w-5" />
                    <span>Criar Nova Rifa</span>
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onOpenGlobalEntryModal('sale')}
                        className="flex-1 py-2 px-2 bg-slate-100 text-text-secondary font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2 text-xs"
                    >
                         <ArrowUpOnSquareIcon className="h-4 w-4 text-success"/>
                         <span>Venda</span>
                    </button>
                     <button
                        onClick={() => onOpenGlobalEntryModal('cost')}
                        className="flex-1 py-2 px-2 bg-slate-100 text-text-secondary font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2 text-xs"
                    >
                         <ArrowDownOnSquareIcon className="h-4 w-4 text-danger"/>
                         <span>Custo</span>
                    </button>
                </div>
            </div>

            <nav className="flex-1 space-y-1 pt-4">
                <NavButton page="list" label="Rifas" icon={<TicketIcon className="h-5 w-5" />} onClick={() => onNavigate('list')} />
                <NavButton page="reimbursements" label="Reembolsos" icon={<BanknotesIcon className="h-5 w-5" />} onClick={onNavigateToReimbursements} />
                <NavButton page="reports" label="Relatórios" icon={<DocumentTextIcon className="h-5 w-5" />} onClick={() => onNavigate('reports')} />
                <NavButton page="history" label="Histórico" icon={<ClockIcon className="h-5 w-5" />} onClick={() => onNavigate('history')} />
            </nav>

            <div>
                 <button
                    onClick={onLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left text-text-secondary hover:bg-slate-100 hover:text-text-primary transition-colors"
                >
                    <LogoutIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;