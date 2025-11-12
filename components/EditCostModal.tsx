import React, { useState, useEffect } from 'react';
import type { Cost } from '../types';
import { TrashIcon } from './icons';

interface EditCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cost: Cost) => void;
  onDelete: () => void;
  onDeleteReimbursement: () => void;
  cost: Cost | null;
}

const EditCostModal: React.FC<EditCostModalProps> = ({ isOpen, onClose, onSave, onDelete, onDeleteReimbursement, cost }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isDonation, setIsDonation] = useState(false);
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [notes, setNotes] = useState('');
  const [reimbursedDate, setReimbursedDate] = useState('');
  const [reimbursementNotes, setReimbursementNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && cost) {
      const formatDateForInput = (dateString?: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';
      
      setDescription(cost.description);
      setAmount(String(cost.amount));
      setDate(formatDateForInput(cost.date));
      setIsDonation(cost.isDonation || false);
      setIsReimbursement(cost.isReimbursement || false);
      setNotes(cost.notes || '');
      setReimbursedDate(formatDateForInput(cost.reimbursedDate));
      setReimbursementNotes(cost.reimbursementNotes || '');
      setError('');
    }
  }, [isOpen, cost]);
  
  useEffect(() => {
    if (isDonation) setIsReimbursement(false);
  }, [isDonation]);

  useEffect(() => {
    if (isReimbursement) setIsDonation(false);
  }, [isReimbursement]);

  if (!isOpen || !cost) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount < 0 || (numAmount === 0 && !isDonation)) {
      setError('Por favor, preencha a descrição e um valor válido. Doações podem ter valor 0.');
      return;
    }

    onSave({ 
        ...cost, 
        description,
        amount: numAmount,
        date,
        isDonation,
        isReimbursement,
        notes,
        reimbursedDate,
        reimbursementNotes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto flex justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in self-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-3">Editar Custo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="edit-cost-description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <input
              id="edit-cost-description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label htmlFor="edit-cost-amount" className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
              <input
                id="edit-cost-amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="edit-cost-date" className="block text-sm font-medium text-text-secondary mb-1">Data (Opcional)</label>
              <input
                id="edit-cost-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center">
                  <input id="edit-isDonation" type="checkbox" checked={isDonation} onChange={e => setIsDonation(e.target.checked)} disabled={isReimbursement} className="custom-checkbox" />
                  <label htmlFor="edit-isDonation" className="ml-2 block text-sm text-text-secondary">É doação?</label>
              </div>
              <div className="flex items-center">
                  <input id="edit-isReimbursement" type="checkbox" checked={isReimbursement} onChange={e => setIsReimbursement(e.target.checked)} disabled={isDonation} className="custom-checkbox" />
                  <label htmlFor="edit-isReimbursement" className="ml-2 block text-sm text-text-secondary">Reembolso futuro?</label>
              </div>
          </div>
          <div className="mb-3">
            <label htmlFor="edit-cost-notes" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
            <textarea
              id="edit-cost-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
              placeholder="Ex: Comprado na loja X"
            />
          </div>

          {isReimbursement && (
            <div className="mt-3 pt-3 border-t border-stroke">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold text-text-primary">Detalhes do Reembolso</h3>
                </div>
                <div className="mb-3">
                    <label htmlFor="edit-reimbursed-date" className="block text-sm font-medium text-text-secondary mb-1">Data do Reembolso</label>
                    <input
                        id="edit-reimbursed-date"
                        type="date"
                        value={reimbursedDate}
                        onChange={e => setReimbursedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                    />
                     <p className="text-xs text-text-secondary mt-1">Deixe em branco se o reembolso ainda não foi efetuado.</p>
                </div>
                <div>
                    <label htmlFor="edit-reimbursement-notes" className="block text-sm font-medium text-text-secondary mb-1">Observações do Reembolso</label>
                    <textarea
                        id="edit-reimbursement-notes"
                        value={reimbursementNotes}
                        onChange={e => setReimbursementNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                        placeholder="Ex: Reembolsado via Pix"
                    />
                </div>
            </div>
          )}

          {error && <p className="text-danger text-sm mb-3 mt-3">{error}</p>}

          <div className="mt-4 space-y-2">
              {/* Deletion Buttons */}
              <div className="space-y-2">
                  <button
                      type="button"
                      onClick={onDelete}
                      className="w-full py-2 px-4 bg-danger text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                      Excluir Custo
                  </button>
                  {cost?.reimbursedDate && (
                      <button
                          type="button"
                          onClick={onDeleteReimbursement}
                          className="w-full py-2 px-4 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors text-sm"
                      >
                          Excluir Reembolso
                      </button>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 py-2 px-4 bg-pill-inactive-bg text-pill-inactive-text font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
                    Salvar
                  </button>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCostModal;