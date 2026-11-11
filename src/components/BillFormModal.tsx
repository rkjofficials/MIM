import React, { useState } from 'react';
import { X, Receipt, Building2 } from 'lucide-react';
import { Bill, BillCategory, BillStatus, AppDatabase } from '../types';
import { dbService } from '../utils/storage';

interface BillFormModalProps {
  initialBill?: Bill | null;
  db: AppDatabase;
  defaultPropertyId?: string | 'all';
  onClose: () => void;
  onSave?: (bill: Bill) => void;
}

const BILL_CATEGORIES: BillCategory[] = [
  'LSP & Leased Line',
  'Hardware Maintenance',
  'Cloud Infrastructure',
  'Software Licensing',
  'Internet & Telecom',
  'Security & Firewall',
  'Other'
];

export const BillFormModal: React.FC<BillFormModalProps> = ({
  initialBill,
  db,
  defaultPropertyId,
  onClose,
  onSave,
}) => {
  const [billNumber, setBillNumber] = useState(initialBill?.billNumber || '');
  const [vendorId, setVendorId] = useState(initialBill?.vendorId || (db.vendors[0]?.id || ''));
  const [propertyId, setPropertyId] = useState(
    initialBill?.propertyId || 
    (defaultPropertyId && defaultPropertyId !== 'all' ? defaultPropertyId : (db.properties[0]?.id || ''))
  );
  const [amount, setAmount] = useState(initialBill?.amount ? String(initialBill.amount) : '');
  const [currency, setCurrency] = useState(initialBill?.currency || 'USD');
  const [billingCategory, setBillingCategory] = useState<BillCategory>(initialBill?.billingCategory || 'LSP & Leased Line');
  const [issueDate, setIssueDate] = useState(initialBill?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    initialBill?.dueDate || new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<BillStatus>(initialBill?.status || 'pending_approval');
  const [poNumber, setPoNumber] = useState(initialBill?.poNumber || '');
  const [paymentReference, setPaymentReference] = useState(initialBill?.paymentReference || '');
  const [paidDate, setPaidDate] = useState(initialBill?.paidDate || '');
  const [notes, setNotes] = useState(initialBill?.notes || '');
  const [submittedBy, setSubmittedBy] = useState(initialBill?.submittedBy || 'Cluster IT Engineer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber.trim() || !amount || !vendorId || !propertyId) return;

    const vendor = db.vendors.find(v => v.id === vendorId);
    const property = db.properties.find(p => p.id === propertyId);

    const bill: Bill = {
      id: initialBill?.id || `b-${Date.now()}`,
      billNumber: billNumber.trim(),
      vendorId,
      vendorName: vendor ? vendor.name : 'Vendor',
      propertyId,
      propertyName: property ? property.name : 'Hotel Property',
      amount: parseFloat(amount) || 0,
      currency,
      billingCategory,
      issueDate,
      dueDate,
      status,
      poNumber: poNumber.trim() || undefined,
      paymentReference: paymentReference.trim() || undefined,
      paidDate: status === 'paid' ? (paidDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: notes.trim() || undefined,
      submittedBy: submittedBy.trim() || 'IT Staff',
      submittedAt: initialBill?.submittedAt || new Date().toISOString()
    };

    dbService.saveBill(bill);
    if (onSave) onSave(bill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialBill ? 'Edit Vendor Bill' : 'Submit Vendor Invoice / Bill'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Bill / Invoice Number *</label>
              <input
                type="text"
                required
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                placeholder="e.g. INV-RV-2026-9041"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Paying Hotel Property *</label>
              <select
                required
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                {db.properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Payee Vendor / Supplier *</label>
              <select
                required
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                {db.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Billing Category</label>
              <select
                value={billingCategory}
                onChange={e => setBillingCategory(e.target.value as BillCategory)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                {BILL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Invoice Amount (USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 3450.00"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Approval / Payment Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BillStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="pending_approval">Pending IT Approval</option>
                <option value="approved">Approved for Finance Payment</option>
                <option value="paid">Paid & Settled</option>
                <option value="overdue">Overdue Notice</option>
                <option value="disputed">Under Dispute / Review</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Invoice Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">PO / Capex / Opex Reference</label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="e.g. PO-JWM-9941"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Submitting IT Engineer</label>
              <input
                type="text"
                value={submittedBy}
                onChange={e => setSubmittedBy(e.target.value)}
                placeholder="e.g. Marcus Holloway (Lead)"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
              />
            </div>

            {status === 'paid' && (
              <>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payment Settlement Date</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={e => setPaidDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payment Wire / TX Reference</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. WIRE-RC-99812"
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Service Month / Description</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Circuit bandwidth commitment, service month, rack audit charges..."
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1f2636]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#1a202c] text-slate-300 hover:bg-[#252e3f] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer shadow"
            >
              Save Bill Submission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
