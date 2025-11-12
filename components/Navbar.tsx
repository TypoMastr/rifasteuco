import React, { useState, useRef, useEffect } from 'react';
import { TicketIcon, DocumentTextIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, PlusIcon, BanknotesIcon, ClockIcon } from './icons';

// The full page type from App.tsx
type Page = 'list' | 'reports' | 'detail' | 'reimbursements' | 'monthlyReports' | 'reimbursementHistory' | 'history';

// The type for our navigation sections
type NavPage = 'list' | 'reimbursements' | 'reports' | 'history';

interface NavbarProps {
    onNavigate: (page: 'list' | 'reports' | 'history') => void;
    onOpenRaffleModal: () => void;
    onOpenGlobalEntryModal: (type: 'sale' | 'cost') => void;
    onNavigateToReimbursements: () => void;
    currentPage: Page;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenRaffleModal, onOpenGlobalEntryModal, onNavigateToReimbursements, currentPage }) => {
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);

    // Determine which nav section is active based on the current page
    const navPage: NavPage =
        (currentPage === 'list' || currentPage === 'detail') ? 'list'
        : (currentPage === 'reimbursements' || currentPage === 'reimbursementHistory') ? 'reimbursements'
        : (currentPage === 'history') ? 'history'
        : 'reports'; // 'reports' and 'monthlyReports' fall here.

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setIsFabMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFabClick = (action: () => void) => {
        action();
        setIsFabMenuOpen(false);
    }
    
    const NavButton: React.FC<{
        page: NavPage;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
    }> = ({ page, label, icon, onClick }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center space-y-1 h-14 rounded-xl transition-all duration-200 ${navPage === page ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-primary hover:bg-primary/5'}`}
        >
            {icon}
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );

    // Updated FAB menu items
    const menuItems = [
        { label: 'Criar Nova Rifa', action: onOpenRaffleModal, icon: <TicketIcon className="h-6 w-6 mr-4 text-primary"/> },
        { label: 'Adicionar Venda', action: () => onOpenGlobalEntryModal('sale'), icon: <ArrowUpOnSquareIcon className="h-6 w-6 mr-4 text-success"/> },
        { label: 'Adicionar Custo', action: () => onOpenGlobalEntryModal('cost'), icon: <ArrowDownOnSquareIcon className="h-6 w-6 mr-4 text-danger"/> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-sm border-t border-stroke z-40">
            <div className="flex items-center h-full max-w-md mx-auto px-1">
                 <div className="flex-1 flex items-center gap-1">
                    <NavButton page="list" label="Rifas" icon={<TicketIcon className="h-6 w-6" />} onClick={() => onNavigate('list')} />
                    <NavButton page="reimbursements" label="Reembolsos" icon={<BanknotesIcon className="h-6 w-6" />} onClick={onNavigateToReimbursements} />
                 </div>
                 
                 {/* This spacer creates the gap for the FAB */}
                 <div className="w-16 flex-shrink-0" />

                 <div className="flex-1 flex items-center gap-1">
                    <NavButton page="reports" label="Relatórios" icon={<DocumentTextIcon className="h-6 w-6" />} onClick={() => onNavigate('reports')} />
                    <NavButton page="history" label="Log" icon={<ClockIcon className="h-6 w-6" />} onClick={() => onNavigate('history')} />
                 </div>
            </div>

            {/* FAB and Menu */}
            <div ref={fabRef} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[65%]">
                 <div
                    className={`absolute bottom-full mb-4 w-72 left-1/2 -translate-x-1/2 transition-all duration-300 ease-out
                        ${isFabMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                >
                    <div className="bg-surface/90 backdrop-blur-lg rounded-2xl shadow-fab-menu border border-stroke overflow-hidden divide-y divide-stroke">
                        {menuItems.map((item, index) => (
                             <button
                                key={item.label}
                                onClick={() => handleFabClick(item.action)}
                                className={`flex items-center text-left w-full py-3 px-4 text-text-primary font-semibold text-base hover:bg-slate-100/80 transition-all duration-300 ease-out
                                    ${isFabMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setIsFabMenuOpen(prev => !prev)}
                    className={`h-14 w-14 rounded-full ${isFabMenuOpen ? 'bg-primary-dark' : 'bg-primary'} text-white shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-100`}
                    aria-label="Adicionar item"
                >
                    <div className={`transform transition-transform duration-300 ${isFabMenuOpen ? 'rotate-45' : 'rotate-0'}`}>
                       <PlusIcon className="h-7 w-7" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Navbar;