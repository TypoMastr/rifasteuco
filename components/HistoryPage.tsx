import React, { useState, useMemo } from 'react';
import type { HistoryLog, HistoryLogActionType, Raffle } from '../types';
import { 
    ClockIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    CheckBadgeIcon, 
    BanknotesIcon,
    ArrowUturnLeftIcon,
    ArrowUpOnSquareIcon,
    ArrowDownOnSquareIcon,
    LogoutIcon,
} from './icons';

interface HistoryPageProps {
  history: HistoryLog[];
  raffles: Raffle[];
  onUndo: (logId: string) => void;
  onLogout: () => void;
  isReadOnly: boolean;
}

const actionTypeDetails: { [key in HistoryLogActionType]: { label: string; icon: React.FC<React.ComponentProps<'svg'>>; color: string } } = {
    CREATE_RAFFLE: { label: "Criação de Rifa", icon: PlusIcon, color: 'text-primary' },
    UPDATE_RAFFLE: { label: "Edição de Rifa", icon: PencilIcon, color: 'text-blue-600' },
    DELETE_RAFFLE: { label: "Exclusão de Rifa", icon: TrashIcon, color: 'text-danger' },
    TOGGLE_FINALIZE_RAFFLE: { label: "Status da Rifa", icon: CheckBadgeIcon, color: 'text-slate-600' },
    ADD_SALE: { label: "Venda Adicionada", icon: ArrowUpOnSquareIcon, color: 'text-success' },
    UPDATE_SALE: { label: "Venda Editada", icon: PencilIcon, color: 'text-green-600' },
    DELETE_SALE: { label: "Venda Excluída", icon: TrashIcon, color: 'text-danger' },
    ADD_COST: { label: "Custo Adicionado", icon: ArrowDownOnSquareIcon, color: 'text-red-500' },
    UPDATE_COST: { label: "Custo Editado", icon: PencilIcon, color: 'text-orange-600' },
    DELETE_COST: { label: "Custo Excluído", icon: TrashIcon, color: 'text-danger' },
    ADD_REIMBURSEMENT: { label: "Reembolso Adicionado", icon: BanknotesIcon, color: 'text-amber-600' },
    DELETE_REIMBURSEMENT: { label: "Reembolso Removido", icon: BanknotesIcon, color: 'text-amber-700' },
};

const formatTimestamp = (isoString: string) => {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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


const HistoryPage: React.FC<HistoryPageProps> = ({ history, raffles, onUndo, onLogout, isReadOnly }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<HistoryLogActionType | 'ALL'>('ALL');
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('ALL');

  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const searchMatch = searchTerm === '' || 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.raffleTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const actionTypeMatch = selectedActionType === 'ALL' || log.actionType === selectedActionType;
      
      const raffleMatch = selectedRaffleId === 'ALL' || log.raffleId === selectedRaffleId;

      return searchMatch && actionTypeMatch && raffleMatch;
    });
  }, [history, searchTerm, selectedActionType, selectedRaffleId]);

  const sortedRaffles = useMemo(() => {
    return [...raffles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [raffles]);

  return (
    <div className="animate-fade-in">
      <header className="mb-6 text-center relative">
        <h2 className="text-3xl font-extrabold text-primary tracking-tight">Histórico</h2>
        <p className="text-text-secondary mt-1">Todas as alterações feitas no sistema são registradas aqui.</p>
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
      <div className="space-y-4 mb-6 bg-surface p-4 rounded-xl border border-stroke shadow-subtle">
        <input
          type="text"
          placeholder="Buscar por descrição ou nome da rifa..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-stroke rounded-lg focus:ring-primary focus:border-primary bg-white"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedActionType}
            onChange={e => setSelectedActionType(e.target.value as any)}
            className="w-full px-3 py-2 border border-stroke rounded-lg focus:ring-primary focus:border-primary bg-white text-sm"
          >
            <option value="ALL">Todos os Tipos de Ação</option>
            {Object.entries(actionTypeDetails).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={selectedRaffleId}
            onChange={e => setSelectedRaffleId(e.target.value)}
            className="w-full px-3 py-2 border border-stroke rounded-lg focus:ring-primary focus:border-primary bg-white text-sm"
          >
            <option value="ALL">Todas as Rifas</option>
            {sortedRaffles.map(raffle => (
              <option key={raffle.id} value={raffle.id}>{`${raffle.title} ${formatRaffleDateForFilter(raffle.date)}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map(log => {
            const details = actionTypeDetails[log.actionType];
            const Icon = details.icon;
            const raffle = raffles.find(r => r.id === log.raffleId);
            const raffleDate = raffle ? ` ${formatRaffleDateForFilter(raffle.date)}` : '';

            return (
              <div key={log.id} className={`bg-surface p-3 rounded-xl border border-stroke shadow-subtle ${log.undone ? 'opacity-50 bg-slate-50' : ''}`}>
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 ${details.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{log.description}</p>
                    <p className="text-xs text-text-secondary">
                        Rifa: <span className="font-medium">{log.raffleTitle}{raffleDate}</span>
                    </p>
                    <p className="text-xs text-text-secondary">{formatTimestamp(log.timestamp)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => onUndo(log.id)}
                      disabled={log.undone || isReadOnly}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-slate-600 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      <span>{log.undone ? 'Desfeito' : 'Desfazer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-stroke rounded-lg bg-slate-50 mt-8">
            <ClockIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">Nenhuma atividade encontrada</h3>
            <p className="text-text-secondary mt-2">Tente ajustar os filtros ou realize uma ação no sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;