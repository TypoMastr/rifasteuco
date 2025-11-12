import React, { useState, useEffect } from 'react';
import type { Cost } from '../types';

interface ReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { reimbursedDate: string; reimbursementNotes?: string }) => void;
  cost: Cost | null;
}

const ReimbursementModal: React.FC<ReimbursementModalProps> = ({ isOpen, onClose, onSave, cost }) => {
  const [reimbursedDate, setReimbursedDate] = useState('');
  const [reimbursementNotes, setReimbursementNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && cost) {
      const formatDateForInput = (dateString: string) => new Date(dateString).toISOString().split('T')[0];
      // Set existing date or today's date as default
      const defaultDate = cost.reimbursedDate ? formatDateForInput(cost.reimbursedDate) : formatDateForInput(new Date().toISOString());
      setReimbursedDate(defaultDate);
      setReimbursementNotes(cost.reimbursementNotes || '');
      setError('');
    }
  }, [isOpen, cost]);

  if (!isOpen || !cost) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbursedDate) {
      setError('Por favor, selecione a data do reembolso.');
      return;
    }
    onSave({ reimbursedDate, reimbursementNotes });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md m-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-2">Registrar Reembolso</h2>
        <p className="text-text-secondary text-sm mb-4">Para o item: <span className="font-semibold">{cost.description}</span></p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reimbursement-date" className="block text-sm font-medium text-text-secondary mb-1">Data do Reembolso</label>
            <input
              id="reimbursement-date"
              type="date"
              value={reimbursedDate}
              onChange={e => setReimbursedDate(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reimbursement-notes" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
            <textarea
              id="reimbursement-notes"
              value={reimbursementNotes}
              onChange={e => setReimbursementNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="Ex: Reembolsado via Pix"
            />
          </div>
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-pill-inactive-bg text-pill-inactive-text font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              Confirmar Reembolso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReimbursementModal;