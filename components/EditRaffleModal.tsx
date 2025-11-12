import React, { useState, useEffect } from 'react';
import type { Raffle } from '../types';

const CATEGORIES = ["Caboclo", "Preto Velho", "Exú", "Crianças", "Mata", "Praia", "Outro"];

interface EditRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (raffle: Omit<Raffle, 'sales' | 'costs'>) => void;
  raffle: Raffle | null;
}

const EditRaffleModal: React.FC<EditRaffleModalProps> = ({ isOpen, onClose, onSave, raffle }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && raffle) {
        const formattedDate = new Date(raffle.date).toISOString().split('T')[0];
        setTitle(raffle.title);
        setCategory(raffle.category);
        setDate(formattedDate);
        setTicketPrice(String(raffle.ticketPrice));
    }
  }, [isOpen, raffle]);

  if (!isOpen || !raffle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(ticketPrice);
    if (!title.trim() || !category || !date || isNaN(price) || price < 0) {
      setError('Por favor, preencha todos os campos com valores válidos.');
      return;
    }
    onSave({ id: raffle.id, title, category, date, ticketPrice: price });
    onClose();
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
        <h2 className="text-xl font-bold text-text-primary mb-4">Editar Rifa</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-raffle-title" className="block text-sm font-medium text-text-secondary mb-1">Título da Rifa</label>
            <input
              id="edit-raffle-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
            />
          </div>
           <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="edit-raffle-category" className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
              <select
                  id="edit-raffle-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="edit-raffle-date" className="block text-sm font-medium text-text-secondary mb-1">Data</label>
              <input
                id="edit-raffle-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-raffle-price" className="block text-sm font-medium text-text-secondary mb-1">Preço por Número (R$)</label>
            <input
              id="edit-raffle-price"
              type="number"
              value={ticketPrice}
              onChange={e => setTicketPrice(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="Ex: 10.00"
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
              className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRaffleModal;