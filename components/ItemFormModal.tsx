import React, { useState } from 'react';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: { description: string; amount: number }) => void;
  type: 'sale' | 'cost';
}

const EntryFormModal: React.FC<EntryFormModalProps> = ({ isOpen, onClose, onSave, type }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const title = type === 'sale' ? 'Adicionar Venda' : 'Adicionar Custo';
  const buttonColor = type === 'sale' ? 'bg-primary hover:bg-primary-dark' : 'bg-danger hover:bg-red-700';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor, preencha todos os campos com valores válidos.');
      return;
    }
    onSave({ description, amount: numericAmount });
    setDescription('');
    setAmount('');
    setError('');
  };

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
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary"
              placeholder={type === 'sale' ? 'Ex: Bloco de 10 números' : 'Ex: Compra dos prêmios'}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary"
              placeholder="0,00"
              step="0.01"
            />
          </div>
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
              className={`py-2 px-4 ${buttonColor} text-white font-semibold rounded-lg transition-colors`}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryFormModal;