import React, { useState, useEffect } from 'react';
import type { Sale, Cost } from '../types';

interface InlineEntryFormProps {
    onSave: (entry: Omit<Sale, 'id'> | Omit<Cost, 'id'>) => void;
    onCancel: () => void;
    type: 'sale' | 'cost';
    ticketPrice?: number;
}

const InlineEntryForm: React.FC<InlineEntryFormProps> = ({ onSave, onCancel, type, ticketPrice }) => {
    // Sale state
    const [quantity, setQuantity] = useState('');
    const [saleAmount, setSaleAmount] = useState('');
    const [saleDescription, setSaleDescription] = useState('');

    // Cost state
    const [costDescription, setCostDescription] = useState('');
    const [costAmount, setCostAmount] = useState('');
    const [costDate, setCostDate] = useState('');
    const [isDonation, setIsDonation] = useState(false);
    const [isReimbursement, setIsReimbursement] = useState(false);
    const [costNotes, setCostNotes] = useState('');

    const [error, setError] = useState('');
    
    // Auto-calculate total amount for sales
    useEffect(() => {
        if (type === 'sale' && ticketPrice) {
            const numQuantity = parseInt(quantity, 10);
            if (!isNaN(numQuantity) && numQuantity > 0) {
                const calculatedAmount = (numQuantity * ticketPrice).toFixed(2);
                setSaleAmount(calculatedAmount);
            } else {
                setSaleAmount('');
            }
        }
    }, [quantity, ticketPrice, type]);

    useEffect(() => {
        if (isDonation) setIsReimbursement(false);
    }, [isDonation]);

    useEffect(() => {
        if (isReimbursement) setIsDonation(false);
    }, [isReimbursement]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (type === 'sale') {
            const numQuantity = parseInt(quantity, 10);
            const numAmount = parseFloat(saleAmount);
            if (isNaN(numQuantity) || numQuantity <= 0 || isNaN(numAmount) || numAmount < 0) {
                setError('Quantidade e valor são obrigatórios.');
                return;
            }
            onSave({ description: saleDescription, quantity: numQuantity, amount: numAmount });
        } else { // cost
            const numAmount = parseFloat(costAmount);
            if (!costDescription.trim() || isNaN(numAmount) || numAmount < 0 || (numAmount === 0 && !isDonation)) {
                setError('Descrição e valor são obrigatórios. Doações podem ter valor 0.');
                return;
            }
            onSave({ description: costDescription, amount: numAmount, date: costDate, isDonation, isReimbursement, notes: costNotes });
        }
    };

    const renderSaleForm = () => (
        <div className="space-y-3">
             <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="quantity" className="text-xs font-medium text-text-secondary">Quantidade</label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="0"
                        className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                    />
                </div>
                <div>
                    <label htmlFor="sale-amount" className="text-xs font-medium text-text-secondary">Valor Total (R$)</label>
                    <input
                        id="sale-amount"
                        type="number"
                        value={saleAmount}
                        onChange={e => setSaleAmount(e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="sale-description" className="text-xs font-medium text-text-secondary">Observações (Opcional)</label>
                <input
                    id="sale-description"
                    type="text"
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value)}
                    placeholder="Ex: Pagamento parcial"
                    className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white"
                />
            </div>
        </div>
    );

     const renderCostForm = () => (
        <div className="space-y-3">
            <div>
                <label htmlFor="cost-description" className="text-xs font-medium text-text-secondary">Descrição</label>
                <input
                    type="text"
                    id="cost-description"
                    value={costDescription}
                    onChange={(e) => setCostDescription(e.target.value)}
                    placeholder="Ex: Compra dos prêmios"
                    className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-danger focus:border-danger bg-white"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="cost-amount" className="text-xs font-medium text-text-secondary">Valor (R$)</label>
                    <input
                        type="number"
                        id="cost-amount"
                        value={costAmount}
                        onChange={(e) => setCostAmount(e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-danger focus:border-danger bg-white"
                    />
                </div>
                <div>
                    <label htmlFor="cost-date" className="text-xs font-medium text-text-secondary">Data (Opcional)</label>
                    <input
                        type="date"
                        id="cost-date"
                        value={costDate}
                        onChange={(e) => setCostDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-danger focus:border-danger bg-white"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <input id="inline-isDonation" type="checkbox" checked={isDonation} onChange={e => setIsDonation(e.target.checked)} disabled={isReimbursement} className="custom-checkbox" />
                    <label htmlFor="inline-isDonation" className="ml-2 block text-xs text-text-secondary">É doação?</label>
                </div>
                <div className="flex items-center">
                    <input id="inline-isReimbursement" type="checkbox" checked={isReimbursement} onChange={e => setIsReimbursement(e.target.checked)} disabled={isDonation} className="custom-checkbox" />
                    <label htmlFor="inline-isReimbursement" className="ml-2 block text-xs text-text-secondary">Reembolso futuro?</label>
                </div>
            </div>
             <div>
                <label htmlFor="inline-cost-notes" className="text-xs font-medium text-text-secondary">Observações (Opcional)</label>
                <textarea
                    id="inline-cost-notes"
                    value={costNotes}
                    onChange={e => setCostNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Comprado na loja X"
                    className="w-full mt-1 px-3 py-2 text-sm border border-stroke rounded-md focus:ring-danger focus:border-danger bg-white"
                />
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-lg mt-2 border border-stroke animate-fade-in">
            {type === 'sale' ? renderSaleForm() : renderCostForm()}
            {error && <p className="text-danger text-xs mt-2">{error}</p>}
            <div className="flex justify-end space-x-2 mt-4">
                 <button type="button" onClick={onCancel} className="py-2 px-4 bg-pill-inactive-bg text-pill-inactive-text text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                    Cancelar
                </button>
                <button type="submit" className={`py-2 px-4 ${type === 'sale' ? 'bg-primary' : 'bg-danger'} text-white text-sm font-semibold rounded-lg transition-colors`}>
                    Salvar
                </button>
            </div>
        </form>
    );
};

export default InlineEntryForm;