import React, { useState, useEffect, useMemo } from 'react';
import type { Raffle, Sale, Cost, HistoryLog } from './types';
import * as api from './services/api';

import Navbar from './components/Navbar';
import RaffleListPage from './components/RaffleListPage';
import RelatoriosPage from './components/RelatoriosPage';
import RaffleDetailPage from './components/RaffleDetailPage';
import RaffleFormModal from './components/RaffleFormModal';
import GlobalEntryFormModal from './components/GlobalEntryFormModal';
import EditRaffleModal from './components/EditRaffleModal';
import EditSaleModal from './components/EditSaleModal';
import EditCostModal from './components/EditCostModal';
import ConfirmationModal from './components/ConfirmationModal';
import ReimbursementsPage from './components/ReimbursementsPage';
import MonthlyReportsPage from './components/MonthlyReportsPage';
import ReimbursementModal from './components/ReimbursementModal';
import ReimbursementHistoryPage from './components/ReimbursementHistoryPage';
import AlertModal from './components/AlertModal';
import HistoryPage from './components/HistoryPage';
import LoginPage from './components/LoginPage';


type Page = 'list' | 'reports' | 'detail' | 'reimbursements' | 'monthlyReports' | 'reimbursementHistory' | 'history';
type ModalType = 'raffle' | 'globalSale' | 'globalCost' | 'editRaffle' | null;
type EntryToEdit = { raffleId: string; type: 'sale' | 'cost'; entry: Sale | Cost } | null;
type EntryToDelete = { raffleId: string; type: 'sale' | 'cost'; entryId: string; description: string; } | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('list');
  const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [raffleToEdit, setRaffleToEdit] = useState<Raffle | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<EntryToEdit>(null);
  const [entryToDelete, setEntryToDelete] = useState<EntryToDelete>(null);
  const [raffleToDelete, setRaffleToDelete] = useState<Raffle | null>(null);
  const [costToReimburse, setCostToReimburse] = useState<{ raffleId: string; cost: Cost } | null>(null);
  const [raffleToToggleFinalize, setRaffleToToggleFinalize] = useState<Raffle | null>(null);
  const [alertModalContent, setAlertModalContent] = useState<{ title: string; message: React.ReactNode } | null>(null);
  const [reimbursementToDelete, setReimbursementToDelete] = useState<{ raffleId: string; cost: Cost } | null>(null);
  const [logToUndo, setLogToUndo] = useState<HistoryLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setAlertMessage] = useState<string | null>(null);
  const [detailSourcePage, setDetailSourcePage] = useState<Page>('list');

  // Check auth state on initial load
  useEffect(() => {
    try {
        const loggedIn = sessionStorage.getItem('isAuthenticated');
        if (loggedIn === 'true') {
            setIsAuthenticated(true);
        }
    } catch (e) {
        console.error("Could not access session storage:", e);
    } finally {
        setIsAuthLoading(false);
    }
  }, []);

  const loadData = async () => {
      try {
        setIsLoading(true);
        const [rafflesData, historyData] = await Promise.all([
            api.getRaffles(),
            api.getHistory()
        ]);
        setRaffles(rafflesData);
        setHistory(historyData);
        setAlertMessage(null);
      } catch (err) {
        setAlertMessage("Falha ao carregar os dados. Tente recarregar a página.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
  };

  // Load app data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
        loadData();
    }
  }, [isAuthenticated]);
  
  // Display alert and clear it after a timeout
  useEffect(() => {
    if (error) {
      alert(error);
      setAlertMessage(null);
    }
  }, [error]);

  const handleLoginSuccess = () => {
    try {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    } catch (e) {
        console.error("Could not access session storage:", e);
        // Fallback for environments where sessionStorage is blocked
        setIsAuthenticated(true); 
    }
  };

  const handleLogout = () => {
    try {
        sessionStorage.removeItem('isAuthenticated');
    } catch (e) {
        console.error("Could not access session storage:", e);
    }
    setIsAuthenticated(false);
  };

  const handleNavigate = (page: 'list' | 'reports' | 'history') => {
    setCurrentPage(page);
    setSelectedRaffleId(null); // Reset detail view when navigating
  };
  
  const handleNavigateToReimbursements = () => {
    setCurrentPage('reimbursements');
    setSelectedRaffleId(null);
  }

  const handleNavigateToReimbursementHistory = () => {
    setCurrentPage('reimbursementHistory');
  };

  const handleNavigateToMonthlyReports = () => {
    setCurrentPage('monthlyReports');
  };

  const handleSelectRaffle = (id: string, source: Page) => {
    setSelectedRaffleId(id);
    setDetailSourcePage(source);
    setCurrentPage('detail');
  };
  
  const handleBackToList = () => {
    setSelectedRaffleId(null);
    setCurrentPage('list');
  };

  // --- CRUD Operations ---
  const handleSaveRaffle = async (raffleData: Omit<Raffle, 'id' | 'sales' | 'costs'>) => {
    try {
      await api.saveRaffle(raffleData);
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao salvar a rifa.");
    }
  };

  const handleEditRaffle = (raffle: Raffle) => {
    setRaffleToEdit(raffle);
    setActiveModal('editRaffle');
  };
  
  const handleUpdateRaffle = async (raffleData: Omit<Raffle, 'sales' | 'costs'>) => {
    try {
      await api.updateRaffle(raffleData);
      await loadData();
    } catch(err) {
      setAlertMessage("Falha ao atualizar a rifa.");
    }
  }

  const handleFinalizeRaffleClick = (raffle: Raffle) => {
    if (raffle.isFinalized) {
      setRaffleToToggleFinalize(raffle);
      return;
    }

    const pendingCosts = raffle.costs.filter(cost => cost.isReimbursement && !cost.reimbursedDate);
    if (pendingCosts.length > 0) {
      setAlertModalContent({
        title: "Finalização Bloqueada",
        message: (
          <>
            <p>Esta rifa não pode ser finalizada pois existem reembolsos pendentes:</p>
            <ul className="list-disc list-inside mt-2 bg-slate-100 p-3 rounded-md text-sm">
              {pendingCosts.map(cost => (
                <li key={cost.id}>{cost.description} - {formatCurrency(cost.amount)}</li>
              ))}
            </ul>
          </>
        )
      });
    } else {
      setRaffleToToggleFinalize(raffle);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleConfirmToggleFinalize = async () => {
    if (!raffleToToggleFinalize) return;

    try {
      const { sales, costs, ...raffleCoreData } = raffleToToggleFinalize;
      const updatedCoreData = { ...raffleCoreData, isFinalized: !raffleToToggleFinalize.isFinalized };
      await api.updateRaffle(updatedCoreData);
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao atualizar o status da rifa.");
    } finally {
      setRaffleToToggleFinalize(null);
    }
  };


  const handleDeleteRaffle = async (raffleId: string) => {
    try {
      await api.deleteRaffle(raffleId);
      handleBackToList();
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao excluir a rifa.");
    }
  };
  
  const handleDeleteRaffleClick = (raffle: Raffle) => {
    if (raffle.isFinalized) {
      setAlertModalContent({
        title: "Exclusão Bloqueada",
        message: "Rifas finalizadas não podem ser excluídas. Por favor, reabra a rifa primeiro se desejar excluí-la."
      });
      return;
    }

    const pendingCosts = raffle.costs.filter(cost => cost.isReimbursement && !cost.reimbursedDate);
    if (pendingCosts.length > 0) {
      setAlertModalContent({
        title: "Exclusão Bloqueada",
        message: (
          <>
            <p>Esta rifa não pode ser excluída pois existem reembolsos pendentes:</p>
            <ul className="list-disc list-inside mt-2 bg-slate-100 p-3 rounded-md text-sm">
              {pendingCosts.map(cost => (
                <li key={cost.id}>{cost.description} - {formatCurrency(cost.amount)}</li>
              ))}
            </ul>
          </>
        )
      });
    } else {
      setRaffleToDelete(raffle);
    }
  };

  const handleAddEntry = async (raffleId: string, type: 'sale' | 'cost', entryData: Omit<Sale, 'id'> | Omit<Cost, 'id'>) => {
    try {
      await api.addEntry(raffleId, type, entryData);
      await loadData();
    } catch (err) {
       setAlertMessage("Falha ao adicionar lançamento.");
    }
  };
  
  const handleOpenEditModal = (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost) => {
    setEntryToEdit({ raffleId, type, entry });
  };

  const handleCloseEditModal = () => {
    setEntryToEdit(null);
  };

  const handleUpdateEntry = async (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost) => {
    try {
      await api.updateEntry(raffleId, type, entry);
      handleCloseEditModal();
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao atualizar lançamento.");
    }
  };

  const handleDeleteEntry = async (raffleId: string, type: 'sale' | 'cost', entryId: string) => {
    try {
      await api.deleteEntry(raffleId, type, entryId);
      await loadData();
    } catch (err) {
       setAlertMessage("Falha ao excluir lançamento.");
    }
  };

  const handleOpenDeleteConfirmation = (raffleId: string, type: 'sale' | 'cost', entry: Sale | Cost) => {
    setEntryToDelete({
      raffleId, type, entryId: entry.id,
      description: type === 'sale'
        ? `${(entry as Sale).quantity} número(s) - ${formatCurrency((entry as Sale).amount)}`
        : `${(entry as Cost).description} - ${formatCurrency((entry as Cost).amount)}`
    });
  };

  const handleCloseDeleteConfirmation = () => setEntryToDelete(null);

  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    handleDeleteEntry(entryToDelete.raffleId, entryToDelete.type, entryToDelete.entryId);
    handleCloseDeleteConfirmation();
  };
  
  const handleDeleteFromEditModal = () => {
    if (!entryToEdit) return;
    handleOpenDeleteConfirmation(entryToEdit.raffleId, entryToEdit.type, entryToEdit.entry);
    handleCloseEditModal();
  }

  const handleCloseRaffleDeleteConfirmation = () => setRaffleToDelete(null);

  const handleConfirmRaffleDelete = () => {
    if (!raffleToDelete) return;
    handleDeleteRaffle(raffleToDelete.id);
    handleCloseRaffleDeleteConfirmation();
  };
  
  const handleOpenReimburseModal = (raffleId: string, cost: Cost) => setCostToReimburse({ raffleId, cost });
  const handleCloseReimburseModal = () => setCostToReimburse(null);

  const handleSaveReimbursement = async (details: { reimbursedDate: string; reimbursementNotes?: string }) => {
    if (!costToReimburse) return;
    const { raffleId, cost } = costToReimburse;
    const updatedCost = { ...cost, reimbursedDate: details.reimbursedDate, reimbursementNotes: details.reimbursementNotes };
    try {
      await api.updateEntry(raffleId, 'cost', updatedCost);
      handleCloseReimburseModal();
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao registrar o reembolso.");
    }
  };
  
  const handleOpenDeleteReimbursementConfirmation = (raffleId: string, cost: Cost) => {
    setReimbursementToDelete({ raffleId, cost });
    handleCloseEditModal();
  };

  const handleConfirmDeleteReimbursement = async () => {
    if (!reimbursementToDelete) return;
    const { raffleId, cost } = reimbursementToDelete;
    const updatedCost: Cost = { ...cost, reimbursedDate: undefined, reimbursementNotes: undefined };
    try {
      await api.updateEntry(raffleId, 'cost', updatedCost);
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao remover o reembolso.");
    } finally {
      setReimbursementToDelete(null);
    }
  };

  const handleUndoActionClick = (logId: string) => {
    const log = history.find(h => h.id === logId);
    if (log) {
      setLogToUndo(log);
    }
  };

  const handleConfirmUndo = async () => {
    if (!logToUndo) return;
    try {
      await api.undoAction(logToUndo.id);
      await loadData();
    } catch (err) {
      setAlertMessage("Falha ao desfazer a ação.");
      console.error(err);
    } finally {
      setLogToUndo(null);
    }
  };

  const formatRaffleDateShort = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const month = monthNames[date.getUTCMonth()];
    const year = String(date.getUTCFullYear()).slice(-2);
    return `(${month}/${year})`;
  };
  
  const generateUndoMessage = (log: HistoryLog | null): React.ReactNode => {
    if (!log) return '';

    const raffle = raffles.find(r => r.id === log.raffleId);
    const raffleDateInfo = raffle ? ` ${formatRaffleDateShort(raffle.date)}` : '';
    const raffleTitleWithDate = `${log.raffleTitle}${raffleDateInfo}`;

    const formatValue = (value: any): string => {
        if (typeof value !== 'object' || value === null) return '';
        if ('quantity' in value) { // Sale
            return `${value.quantity} número(s) por ${formatCurrency(value.amount)}`;
        }
        if ('description' in value && 'amount' in value) { // Cost
            return `"${value.description}" de ${formatCurrency(value.amount)}`;
        }
        return '';
    };

    let actionDescription = '';
    let consequence: React.ReactNode = '';

    switch (log.actionType) {
        case 'CREATE_RAFFLE':
            actionDescription = `A criação da rifa "${raffleTitleWithDate}".`;
            consequence = `Isto irá excluir permanentemente a rifa e todos os seus lançamentos.`;
            break;
        case 'DELETE_RAFFLE':
            actionDescription = `A exclusão da rifa "${raffleTitleWithDate}".`;
            consequence = `Isto irá restaurar a rifa e todos os seus dados.`;
            break;
        case 'UPDATE_RAFFLE':
            actionDescription = `A edição dos dados da rifa "${raffleTitleWithDate}".`;
            consequence = `Os dados da rifa serão revertidos para o estado anterior.`;
            break;
        case 'TOGGLE_FINALIZE_RAFFLE':
            actionDescription = `A alteração de status da rifa "${raffleTitleWithDate}" para "${log.afterState?.isFinalized ? 'Finalizada' : 'Ativa'}".`;
            consequence = `O status da rifa voltará a ser "${log.beforeState?.isFinalized ? 'Finalizada' : 'Ativa'}".`;
            break;
        case 'ADD_SALE':
            actionDescription = `A adição da venda de ${formatValue(log.afterState)} na rifa "${raffleTitleWithDate}".`;
            consequence = `Esta venda será permanentemente excluída.`;
            break;
        case 'DELETE_SALE':
            actionDescription = `A exclusão da venda de ${formatValue(log.beforeState)} da rifa "${raffleTitleWithDate}".`;
            consequence = `Esta venda será restaurada.`;
            break;
        case 'UPDATE_SALE':
            actionDescription = `A edição de uma venda na rifa "${raffleTitleWithDate}".`;
            consequence = (
                <>
                    A venda será revertida:
                    <ul className="list-disc list-inside text-left text-xs my-2 bg-slate-100 p-2 rounded">
                        <li><strong>De:</strong> {formatValue(log.afterState)}</li>
                        <li><strong>Para:</strong> {formatValue(log.beforeState)}</li>
                    </ul>
                </>
            );
            break;
        case 'ADD_COST':
            actionDescription = `A adição do custo ${formatValue(log.afterState)} na rifa "${raffleTitleWithDate}".`;
            consequence = `Este custo será permanentemente excluído.`;
            break;
        case 'DELETE_COST':
            actionDescription = `A exclusão do custo ${formatValue(log.beforeState)} da rifa "${raffleTitleWithDate}".`;
            consequence = `Este custo será restaurado.`;
            break;
        case 'UPDATE_COST':
             actionDescription = `A edição de um custo na rifa "${raffleTitleWithDate}".`;
            consequence = (
                <>
                    O custo será revertido:
                    <ul className="list-disc list-inside text-left text-xs my-2 bg-slate-100 p-2 rounded">
                        <li><strong>De:</strong> {formatValue(log.afterState)}</li>
                        <li><strong>Para:</strong> {formatValue(log.beforeState)}</li>
                    </ul>
                </>
            );
            break;
        case 'ADD_REIMBURSEMENT':
            actionDescription = `O registro do reembolso para o custo "${log.afterState?.description}" na rifa "${raffleTitleWithDate}".`;
            consequence = `O custo voltará a ser marcado como um reembolso pendente.`;
            break;
        case 'DELETE_REIMBURSEMENT':
             actionDescription = `A remoção do reembolso para o custo "${log.afterState?.description}" na rifa "${raffleTitleWithDate}".`;
            consequence = `O reembolso será restaurado para o estado anterior.`;
            break;
        default:
            actionDescription = `Esta ação.`;
            consequence = `O estado anterior será restaurado.`;
    }

    return (
        <>
            <p>Você está prestes a desfazer a seguinte ação:</p>
            <p className="font-semibold text-text-primary mt-2 bg-slate-100 p-2 rounded">{actionDescription}</p>
            <p className="mt-2">{consequence}</p>
        </>
    );
  }


  const selectedRaffle = useMemo(() => raffles.find(r => r.id === selectedRaffleId), [raffles, selectedRaffleId]);
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10">Carregando...</div>;
    }
    
    switch (currentPage) {
      case 'detail':
        return selectedRaffle ? (
          <RaffleDetailPage 
            raffle={selectedRaffle} 
            onBack={() => {
              setSelectedRaffleId(null);
              setCurrentPage(detailSourcePage);
            }} 
            onAddEntry={handleAddEntry}
            onOpenDeleteConfirmation={handleOpenDeleteConfirmation}
            onDeleteRaffleClick={handleDeleteRaffleClick}
            onEditRaffle={handleEditRaffle}
            onOpenEditEntryModal={handleOpenEditModal}
            onUpdateEntry={(type, entry) => handleUpdateEntry(selectedRaffle.id, type, entry)}
            onOpenReimburseModal={handleOpenReimburseModal}
            onFinalizeRaffleClick={handleFinalizeRaffleClick}
          />
        ) : null;
      case 'reports':
        return <RelatoriosPage raffles={raffles} onNavigateToMonthlyReports={handleNavigateToMonthlyReports} onNavigateToReimbursements={handleNavigateToReimbursements} onLogout={handleLogout} />;
      case 'reimbursements':
        return <ReimbursementsPage 
          raffles={raffles} 
          onBack={() => handleNavigate('reports')}
          onOpenEditCostModal={handleOpenEditModal}
          onSelectRaffle={(id) => handleSelectRaffle(id, 'reimbursements')}
          onOpenReimburseModal={handleOpenReimburseModal}
          onNavigateToHistory={handleNavigateToReimbursementHistory}
          onLogout={handleLogout}
        />;
      case 'reimbursementHistory':
        return <ReimbursementHistoryPage 
          raffles={raffles}
          onBack={() => setCurrentPage('reimbursements')}
          onSelectRaffle={(id) => handleSelectRaffle(id, 'reimbursementHistory')}
        />;
      case 'monthlyReports':
        return <MonthlyReportsPage raffles={raffles} onBack={() => setCurrentPage('reports')} onSelectRaffle={(id) => handleSelectRaffle(id, 'monthlyReports')} />;
      case 'history':
        return <HistoryPage history={history} raffles={raffles} onUndo={handleUndoActionClick} onLogout={handleLogout} />;
      case 'list':
      default:
        return <RaffleListPage raffles={raffles} onSelectRaffle={(id) => handleSelectRaffle(id, 'list')} onLogout={handleLogout} />;
    }
  };

  if (isAuthLoading) {
      return <div className="flex items-center justify-center min-h-screen bg-background text-text-secondary">Verificando sessão...</div>;
  }
  
  if (!isAuthenticated) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="bg-background min-h-screen text-text-primary font-sans">
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {renderContent()}
      </main>

      <Navbar 
        onNavigate={handleNavigate} 
        onOpenRaffleModal={() => setActiveModal('raffle')}
        onOpenGlobalEntryModal={(type) => setActiveModal(type === 'sale' ? 'globalSale' : 'globalCost')}
        onNavigateToReimbursements={handleNavigateToReimbursements}
        currentPage={currentPage}
      />

      <RaffleFormModal 
        isOpen={activeModal === 'raffle'}
        onClose={() => setActiveModal(null)}
        onSave={handleSaveRaffle}
      />

      <GlobalEntryFormModal 
        isOpen={activeModal === 'globalSale' || activeModal === 'globalCost'}
        onClose={() => setActiveModal(null)}
        onSave={handleAddEntry}
        type={activeModal === 'globalSale' ? 'sale' : 'cost'}
        raffles={raffles}
      />

      <EditRaffleModal
        isOpen={activeModal === 'editRaffle'}
        onClose={() => setActiveModal(null)}
        onSave={handleUpdateRaffle}
        raffle={raffleToEdit}
      />

      <EditSaleModal
        isOpen={entryToEdit?.type === 'sale'}
        onClose={handleCloseEditModal}
        onSave={(updatedSale) => handleUpdateEntry(entryToEdit!.raffleId, 'sale', updatedSale)}
        sale={entryToEdit?.type === 'sale' ? entryToEdit.entry as Sale : null}
        raffle={raffles.find(r => r.id === entryToEdit?.raffleId) || null}
        onDelete={handleDeleteFromEditModal}
      />

      <EditCostModal
         isOpen={entryToEdit?.type === 'cost'}
         onClose={handleCloseEditModal}
         onSave={(updatedCost) => handleUpdateEntry(entryToEdit!.raffleId, 'cost', updatedCost)}
         cost={entryToEdit?.type === 'cost' ? entryToEdit.entry as Cost : null}
         onDelete={handleDeleteFromEditModal}
         onDeleteReimbursement={() => handleOpenDeleteReimbursementConfirmation(entryToEdit!.raffleId, entryToEdit!.entry as Cost)}
      />

      <ConfirmationModal
        isOpen={!!entryToDelete}
        onClose={handleCloseDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={
          <>
            <p>Você tem certeza que deseja excluir permanentemente o lançamento abaixo?</p>
            <p className="font-semibold text-text-primary mt-2 bg-slate-100 p-2 rounded">{entryToDelete?.description}</p>
            <p className="mt-2">Esta ação não pode ser desfeita.</p>
          </>
        }
      />

      <ConfirmationModal
        isOpen={!!raffleToDelete}
        onClose={handleCloseRaffleDeleteConfirmation}
        onConfirm={handleConfirmRaffleDelete}
        title="Confirmar Exclusão de Rifa"
        message={
          <>
            <p>Você tem certeza que deseja excluir permanentemente a rifa abaixo?</p>
            <p className="font-semibold text-text-primary mt-2 bg-slate-100 p-2 rounded">{raffleToDelete?.title}</p>
            <p className="mt-2 font-bold text-danger">Todos os dados de vendas e custos associados serão perdidos. Esta ação não pode ser desfeita.</p>
          </>
        }
      />
      
      <ConfirmationModal
        isOpen={!!raffleToToggleFinalize}
        onClose={() => setRaffleToToggleFinalize(null)}
        onConfirm={handleConfirmToggleFinalize}
        title={raffleToToggleFinalize?.isFinalized ? "Reabrir Rifa?" : "Finalizar Rifa?"}
        message={
          raffleToToggleFinalize?.isFinalized ? (
            <p>Ao reabrir uma rifa, ela voltará a ser listada como ativa. Você poderá novamente adicionar vendas, custos e ela aparecerá nas listas de seleção para novos lançamentos.</p>
          ) : (
            <p>Ao finalizar uma rifa, ela será arquivada. Não será mais possível adicionar novas vendas ou custos, e ela não aparecerá na lista de seleção para novos lançamentos. Você pode reabrir a rifa a qualquer momento.</p>
          )
        }
        confirmText={raffleToToggleFinalize?.isFinalized ? "Sim, Reabrir" : "Sim, Finalizar"}
        confirmButtonClass={raffleToToggleFinalize?.isFinalized ? "bg-primary hover:bg-primary-dark" : "bg-danger hover:bg-red-700"}
      />

       <ReimbursementModal
        isOpen={!!costToReimburse}
        onClose={handleCloseReimburseModal}
        onSave={handleSaveReimbursement}
        cost={costToReimburse?.cost || null}
      />
      
      <ConfirmationModal
        isOpen={!!reimbursementToDelete}
        onClose={() => setReimbursementToDelete(null)}
        onConfirm={handleConfirmDeleteReimbursement}
        title="Remover Reembolso?"
        message={
            <>
                <p>Você tem certeza que deseja remover o registro de reembolso para o custo abaixo?</p>
                <p className="font-semibold text-text-primary mt-2 bg-slate-100 p-2 rounded">{reimbursementToDelete?.cost.description}</p>
                <p className="mt-2">O custo continuará existindo como um reembolso pendente. Esta ação pode ser refeita.</p>
            </>
        }
        confirmText="Sim, Remover"
        confirmButtonClass="bg-danger hover:bg-red-700"
      />


      <AlertModal
        isOpen={!!alertModalContent}
        onClose={() => setAlertModalContent(null)}
        title={alertModalContent?.title || ''}
        message={alertModalContent?.message || ''}
      />
      
      <ConfirmationModal
        isOpen={!!logToUndo}
        onClose={() => setLogToUndo(null)}
        onConfirm={handleConfirmUndo}
        title="Confirmar Ação de Desfazer"
        message={generateUndoMessage(logToUndo)}
        confirmText="Sim, Desfazer"
        confirmButtonClass="bg-primary hover:bg-primary-dark"
      />

    </div>
  );
}

export default App;