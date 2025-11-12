import React, { useState, useEffect, useMemo } from 'react';
import type { Raffle, Sale, Cost } from '../types';

interface GlobalEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (raffleId: string, type: 'sale' | 'cost', entry: Omit<Sale, 'id'> | Omit<Cost, 'id'>) => void;
  type: 'sale' | 'cost';
  raffles: Raffle[];
}

const formatRaffleDateForFilter = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const month = monthNames[date.getUTCMonth()];
    const year = String(date.getUTCFullYear()).slice(-2);
    return `(${month}/${year})`;
};

const GlobalEntryFormModal: React.FC<GlobalEntryFormModalProps> = ({ isOpen, onClose, onSave, type, raffles }) => {
  const [selectedRaffleId, setSelectedRffleId] = useState('');
  
  // Sale fields
  const [quantity, setQuantity] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  
  // Cost fields
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costDate, setCostDate] = useState('');
  const [isDonation, setIsDonation] = useState(false);
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [costNotes, setCostNotes] = useState('');
  
  const [error, setError] = useState('');

  const sortedRaffles = useMemo(() => {
    return [...raffles]
      .filter(r => !r.isFinalized)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [raffles]);

  const selectedRaffle = raffles.find(r => r.id === selectedRaffleId);

  useEffect(() => {
    if (isOpen && sortedRaffles.length > 0 && !selectedRaffleId) {
      setSelectedRffleId(sortedRaffles[0].id);
    }
    if(!isOpen) {
        setSelectedRffleId('');
        setQuantity('');
        setSaleDescription('');
        setSaleAmount('');
        setCostDescription('');
        setCostAmount('');
        setCostDate('');
        setIsDonation(false);
        setIsReimbursement(false);
        setCostNotes('');
        setError('');
    }
  }, [isOpen, sortedRaffles, selectedRaffleId]);

   useEffect(() => {
    if (type === 'sale' && selectedRaffle) {
        const numQuantity = parseInt(quantity, 10);
        if (!isNaN(numQuantity) && numQuantity > 0) {
            const calculatedAmount = (numQuantity * selectedRaffle.ticketPrice).toFixed(2);
            setSaleAmount(calculatedAmount);
        } else {
            setSaleAmount('');
        }
    }
  }, [quantity, selectedRaffle, type]);

  useEffect(() => {
    if (isDonation) setIsReimbursement(false);
  }, [isDonation]);

  useEffect(() => {
    if (isReimbursement) setIsDonation(false);
  }, [isReimbursement]);


  if (!isOpen) return null;

  const title = type === 'sale' ? 'Adicionar Venda' : 'Adicionar Custo';
  const buttonColor = type === 'sale' ? 'bg-primary hover:bg-primary-dark' : 'bg-danger hover:bg-red-700';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaffleId) {
        setError('Por favor, selecione uma rifa.');
        return;
    }

    if (type === 'sale') {
        const numQuantity = parseInt(quantity, 10);
        const numAmount = parseFloat(saleAmount);
        if (isNaN(numQuantity) || numQuantity <= 0 || isNaN(numAmount) || numAmount < 0) {
            setError('Por favor, preencha a quantidade e um valor válido.');
            return;
        }
        onSave(selectedRaffleId, 'sale', { description: saleDescription, quantity: numQuantity, amount: numAmount });
    } else { // cost
        const numAmount = parseFloat(costAmount);
        if (!costDescription.trim() || isNaN(numAmount) || numAmount < 0 || (numAmount === 0 && !isDonation)) {
            setError('Por favor, preencha a descrição e um valor válido. Doações podem ter valor 0.');
            return;
        }
        onSave(selectedRaffleId, 'cost', { description: costDescription, amount: numAmount, date: costDate, isDonation, isReimbursement, notes: costNotes });
    }
    
    onClose();
  };

  const renderSaleForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
         <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantidade</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="0"
              disabled={!selectedRaffleId}
            />
          </div>
          <div>
            <label htmlFor="sale-amount" className="block text-sm font-medium text-text-secondary mb-1">Valor Total (R$)</label>
            <input
              id="sale-amount"
              type="number"
              value={saleAmount}
              onChange={e => setSaleAmount(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="0,00"
              step="0.01"
              disabled={!selectedRaffleId}
            />
          </div>
      </div>
      <div className="mb-4">
        <label htmlFor="sale-description" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
        <input
          id="sale-description"
          type="text"
          value={saleDescription}
          onChange={e => setSaleDescription(e.target.value)}
          className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
          placeholder="Ex: Pagamento parcial"
          disabled={!selectedRaffleId}
        />
      </div>
    </>
  );

  const renderCostForm = () => (
    <>
       <div className="mb-4">
        <label htmlFor="cost-description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
        <input
          id="cost-description"
          type="text"
          value={costDescription}
          onChange={e => setCostDescription(e.target.value)}
          className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
          placeholder="Ex: Compra dos prêmios"
          disabled={!selectedRaffleId}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="cost-amount" className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
          <input
            id="cost-amount"
            type="number"
            value={costAmount}
            onChange={e => setCostAmount(e.target.value)}
            className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
            placeholder="0,00"
            step="0.01"
            disabled={!selectedRaffleId}
          />
        </div>
        <div>
            <label htmlFor="cost-date" className="block text-sm font-medium text-text-secondary mb-1">Data (Opcional)</label>
            <input
              id="cost-date"
              type="date"
              value={costDate}
              onChange={e => setCostDate(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              disabled={!selectedRaffleId}
            />
          </div>
      </div>
      <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center">
              <input id="isDonation" type="checkbox" checked={isDonation} onChange={e => setIsDonation(e.target.checked)} disabled={!selectedRaffleId || isReimbursement} className="custom-checkbox" />
              <label htmlFor="isDonation" className="ml-2 block text-sm text-text-secondary">É doação?</label>
          </div>
          <div className="flex items-center">
              <input id="isReimbursement" type="checkbox" checked={isReimbursement} onChange={e => setIsReimbursement(e.target.checked)} disabled={!selectedRaffleId || isDonation} className="custom-checkbox" />
              <label htmlFor="isReimbursement" className="ml-2 block text-sm text-text-secondary">Reembolso futuro?</label>
          </div>
      </div>
       <div className="mb-4">
        <label htmlFor="cost-notes" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
        <textarea
          id="cost-notes"
          value={costNotes}
          onChange={e => setCostNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
          placeholder="Ex: Comprado na loja X"
          disabled={!selectedRaffleId}
        />
      </div>
    </>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="raffle-select" className="block text-sm font-medium text-text-secondary mb-1">Selecione a Rifa</label>
            <select
              id="raffle-select"
              value={selectedRaffleId}
              onChange={e => setSelectedRffleId(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
            >
              {sortedRaffles.length > 0 ? (
                sortedRaffles.map(raffle => (
                  <option key={raffle.id} value={raffle.id}>{`${raffle.title} ${formatRaffleDateForFilter(raffle.date)}`}</option>
                ))
              ) : (
                <option disabled>Nenhuma rifa ativa disponível</option>
              )}
            </select>
          </div>

          {type === 'sale' ? renderSaleForm() : renderCostForm()}
          
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-pill-inactive-bg text-pill-inactive-text font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedRaffleId}
              className={`py-2 px-4 ${buttonColor} text-white font-semibold rounded-lg transition-colors disabled:bg-slate-300`}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GlobalEntryFormModal;