import React, { useState, useEffect } from 'react';
import type { Sale, Raffle } from '../types';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sale: Sale) => void;
  onDelete: () => void;
  sale: Sale | null;
  raffle: Raffle | null;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, onSave, onDelete, sale, raffle }) => {
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isManualAmount, setIsManualAmount] = useState(false);

  useEffect(() => {
    if (isOpen && sale) {
      setQuantity(String(sale.quantity));
      setAmount(String(sale.amount));
      setDescription(sale.description);
      setError('');
      
      // Determine if amount was manually set or calculated
      if(raffle){
          const calculatedAmount = sale.quantity * raffle.ticketPrice;
          // Use a small tolerance for float comparison
          setIsManualAmount(Math.abs(calculatedAmount - sale.amount) > 0.001);
      }

    }
  }, [isOpen, sale, raffle]);
  
  // Auto-calculate total amount for sales unless manually overridden
  useEffect(() => {
      if (raffle && !isManualAmount) {
          const numQuantity = parseInt(quantity, 10);
          if (!isNaN(numQuantity) && numQuantity > 0) {
              const calculatedAmount = (numQuantity * raffle.ticketPrice).toFixed(2);
              setAmount(calculatedAmount);
          } else {
              setAmount('');
          }
      }
  }, [quantity, raffle, isManualAmount]);

  if (!isOpen || !sale) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsManualAmount(true);
      setAmount(e.target.value);
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsManualAmount(false);
      setQuantity(e.target.value);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity, 10);
    const numAmount = parseFloat(amount);
    
    if (isNaN(numQuantity) || numQuantity <= 0 || isNaN(numAmount) || numAmount < 0) {
      setError('Por favor, preencha a quantidade e um valor válido.');
      return;
    }

    onSave({ 
        ...sale, 
        quantity: numQuantity, 
        amount: numAmount, 
        description 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-4">Editar Venda</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="edit-quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantidade</label>
              <input
                id="edit-quantity"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              />
            </div>
            <div>
              <label htmlFor="edit-sale-amount" className="block text-sm font-medium text-text-secondary mb-1">Valor Total (R$)</label>
              <input
                id="edit-sale-amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                step="0.01"
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-sale-description" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
            <input
              id="edit-sale-description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="Ex: Pagamento parcial"
            />
          </div>
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <div className="flex items-center justify-center mt-6 space-x-3">
            <button
              type="button"
              onClick={onDelete}
              className="py-2 px-4 w-24 bg-danger text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Excluir
            </button>
            <button type="button" onClick={onClose} className="py-2 px-4 w-24 bg-pill-inactive-bg text-pill-inactive-text font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 w-24 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;
