import React, { useState } from 'react';
import { DigitizedInvoice, InvoiceCategory, InvoiceItem } from '../types';
import { Plus, Trash2, Check, X, Calculator, ShieldCheck } from 'lucide-react';

interface EditInvoiceModalProps {
  invoice: DigitizedInvoice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DigitizedInvoice) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<DigitizedInvoice>({ ...invoice });
  const [items, setItems] = useState<InvoiceItem[]>([...invoice.items]);

  const categories: InvoiceCategory[] = [
    'Electronics',
    'Food & Beverage',
    'Travel & Hospitality',
    'Office Supplies',
    'Medical & Healthcare',
    'Utilities',
    'Logistics & Freight',
    'Professional Services',
    'Retail & Others',
  ];

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Auto calculate line total if qty or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : current.quantity;
      const p = field === 'unitPrice' ? Number(value) : current.unitPrice;
      current.totalPrice = Math.round(q * p * 100) / 100;
    }

    updated[index] = current;
    setItems(updated);

    // Auto update subtotal
    const newSubtotal = updated.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    const newTotal = newSubtotal + (Number(formData.taxGst) || 0) - (Number(formData.discount) || 0);

    setFormData((prev) => ({
      ...prev,
      subtotal: newSubtotal,
      totalAmount: Math.max(0, newTotal),
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-new-${Date.now()}`,
      description: 'New Item',
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
    };
    const updated = [...items, newItem];
    setItems(updated);

    const newSubtotal = updated.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTotal = newSubtotal + (Number(formData.taxGst) || 0) - (Number(formData.discount) || 0);

    setFormData((prev) => ({
      ...prev,
      subtotal: newSubtotal,
      totalAmount: newTotal,
    }));
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);

    const newSubtotal = updated.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTotal = newSubtotal + (Number(formData.taxGst) || 0) - (Number(formData.discount) || 0);

    setFormData((prev) => ({
      ...prev,
      subtotal: newSubtotal,
      totalAmount: newTotal,
    }));
  };

  const handleRecalculate = () => {
    const sub = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    const taxRate = Number(formData.taxRatePercent) || 18;
    const tax = Math.round(((sub * taxRate) / 100) * 100) / 100;
    const disc = Number(formData.discount) || 0;
    const tot = sub + tax - disc;

    setFormData((prev) => ({
      ...prev,
      subtotal: sub,
      taxGst: tax,
      totalAmount: tot,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Re-verify anomalies
    const itemsSum = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const anomalies = [];
    if (Math.abs(itemsSum - formData.subtotal) > 1) {
      anomalies.push({
        id: `anom-math-${Date.now()}`,
        type: 'math_mismatch' as const,
        severity: 'warning' as const,
        title: 'Line Items Mismatch',
        message: 'Line items sum does not equal subtotal.',
      });
    }

    if (!formData.vendorGstin) {
      anomalies.push({
        id: `anom-tax-${Date.now()}`,
        type: 'missing_tax' as const,
        severity: 'info' as const,
        title: 'Missing GSTIN',
        message: 'No GSTIN provided for this vendor.',
      });
    }

    onSave({
      ...formData,
      items,
      anomalies,
      status: anomalies.length > 0 ? 'needs_review' : 'verified',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 transition-colors">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Verify & Edit Extracted Fields
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Correct any OCR or NLP field extractions with automatic recalculation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Primary Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vendor Name</label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vendor GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.vendorGstin || ''}
                onChange={(e) => setFormData({ ...formData, vendorGstin: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-600 dark:text-blue-400"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Invoice Date</label>
              <input
                type="text"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category (NLP)</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as InvoiceCategory })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Customer / Bill To</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">Itemized Products & Services</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-14 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded text-center"
                    title="Quantity"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                    className="w-20 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded text-right"
                    title="Unit Price"
                  />
                  <span className="w-20 font-bold text-right text-slate-800 dark:text-slate-200">
                    ₹ {item.totalPrice.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Financials Row & Recalculate Button */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Subtotal (₹)</label>
              <input
                type="number"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">GST Tax (₹)</label>
              <input
                type="number"
                value={formData.taxGst}
                onChange={(e) => setFormData({ ...formData, taxGst: Number(e.target.value) })}
                className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Discount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 block mb-0.5">Total Amount (₹)</label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                className="w-full p-1.5 bg-blue-600 text-white border border-blue-700 rounded font-black text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRecalculate}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Auto-Recalculate (18% GST slab)</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
