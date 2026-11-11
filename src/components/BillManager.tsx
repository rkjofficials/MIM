import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Building2, 
  CreditCard, 
  Edit2, 
  Trash2, 
  DollarSign
} from 'lucide-react';
import { Bill, BillStatus, AppDatabase } from '../types';
import { getAlertUrgency, calculateBillMetrics, filterItemsByProperty } from '../utils/alertEngine';
import { dbService } from '../utils/storage';
import { exportBillsToCsv, triggerCsvDownload } from '../utils/csvExport';

interface BillManagerProps {
  db: AppDatabase;
  activePropertyId: string | 'all';
  onNewBill: () => void;
  onEditBill: (bill: Bill) => void;
  onSelectVendorById?: (vendorId: string) => void;
}

export const BillManager: React.FC<BillManagerProps> = ({
  db,
  activePropertyId,
  onNewBill,
  onEditBill,
  onSelectVendorById,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | BillStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scoped bills by property
  const scopedBills = filterItemsByProperty(db.bills, activePropertyId);

  // Financial metrics
  const metrics = calculateBillMetrics(db.bills, activePropertyId);

  const filteredBills = scopedBills.filter(b => {
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      b.vendorName.toLowerCase().includes(q) ||
      b.propertyName.toLowerCase().includes(q) ||
      (b.poNumber && b.poNumber.toLowerCase().includes(q))
    );
  });

  const handleApprove = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    dbService.saveBill({ ...bill, status: 'approved' });
  };

  const handleMarkPaid = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    const ref = prompt('Enter payment transaction reference (Wire / Check / PO):', `WIRE-${bill.propertyName.split(' ')[0]}-${Date.now().toString().slice(-5)}`);
    if (ref !== null) {
      dbService.saveBill({
        ...bill,
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0],
        paymentReference: ref || undefined
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string, num: string) => {
    e.stopPropagation();
    if (confirm(`Delete bill "${num}"?`)) {
      dbService.deleteBill(id);
    }
  };

  const handleExportBillsCsv = () => {
    const csv = exportBillsToCsv(filteredBills);
    const propLabel = activePropertyId === 'all' ? 'All-Properties' : activePropertyId;
    triggerCsvDownload(csv, `marriott-bills-${propLabel}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusBadge = (status: BillStatus, dueDate: string) => {
    const urgency = getAlertUrgency(dueDate);

    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>PAID</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-medium">
            APPROVED FOR PAYMENT
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>PENDING APPROVAL</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/40 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>OVERDUE</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1c2230] text-slate-300">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#121620] border border-[#1f2636] space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Pending IT Approval
          </span>
          <div className="text-lg font-bold font-mono text-amber-300">
            ${metrics.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {metrics.pendingCount} unpaid invoice{metrics.pendingCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121620] border border-[#1f2636] space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Paid & Settled
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400">
            ${metrics.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Settled via finance
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121620] border border-[#1f2636] space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Critical Overdue Bills
          </span>
          <div className={`text-lg font-bold font-mono ${metrics.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {metrics.overdueCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Requires immediate payment
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121620] border border-[#1f2636] space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">
            Property Allocation
          </span>
          <div className="text-xs font-semibold text-white truncate pt-1">
            {activePropertyId === 'all' 
              ? 'Cluster (All Properties)' 
              : db.properties.find(p => p.id === activePropertyId)?.name || 'Property'}
          </div>
          <span className="text-[10px] text-indigo-400 font-mono">
            {metrics.totalCount} total bills
          </span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121620] border border-[#1f2636] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Bills' },
            { id: 'pending_approval', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'paid', label: 'Paid' },
            { id: 'overdue', label: 'Overdue' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter bills or PO#..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#151922] border border-[#232a39] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleExportBillsCsv}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1f2738] border border-[#232a39] text-slate-300 text-xs font-medium shrink-0 cursor-pointer shadow-sm"
            title="Export Bills to CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">CSV</span>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Cards List */}
      {filteredBills.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
          No bills found for the selected property and status filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBills.map(bill => {
            const urgency = getAlertUrgency(bill.dueDate);

            return (
              <div
                key={bill.id}
                className="rounded-xl bg-[#121620] border border-[#1f2636] p-4 text-xs space-y-3 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Bill Number, Status, Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-white text-sm">
                          {bill.billNumber}
                        </span>
                        {getStatusBadge(bill.status, bill.dueDate)}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-300">{bill.propertyName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditBill(bill)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, bill.id, bill.billNumber)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2636] cursor-pointer"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vendor & Amount Box */}
                  <div className="p-3 rounded-lg bg-[#0c0f16] border border-[#1a212e] flex items-center justify-between gap-2 my-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Payee Vendor
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectVendorById && onSelectVendorById(bill.vendorId)}
                        className="font-semibold text-white hover:text-indigo-300 transition-colors text-left truncate block text-xs"
                      >
                        {bill.vendorName}
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {bill.billingCategory}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Invoice Total
                      </span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        ${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Reference */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">Issued:</span> {bill.issueDate}
                    </div>
                    <div>
                      <span className="text-slate-500">Due:</span>{' '}
                      <span className={urgency.tier === 'overdue' ? 'text-rose-400 font-bold' : ''}>
                        {bill.dueDate}
                      </span>
                    </div>
                    {bill.poNumber && (
                      <div>
                        <span className="text-slate-500">PO Ref:</span> {bill.poNumber}
                      </div>
                    )}
                    {bill.paymentReference && (
                      <div className="truncate">
                        <span className="text-slate-500">TX Ref:</span> {bill.paymentReference}
                      </div>
                    )}
                  </div>

                  {bill.notes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#1a212e] mt-2">
                      {bill.notes}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#1a212e] text-[11px]">
                  <span className="text-slate-500">
                    Submitted by: {bill.submittedBy}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {bill.status === 'pending_approval' && (
                      <button
                        type="button"
                        onClick={(e) => handleApprove(e, bill)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                      >
                        Approve Bill
                      </button>
                    )}

                    {bill.status === 'approved' && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkPaid(e, bill)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
