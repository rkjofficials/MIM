import React, { useState } from 'react';
import { X, Bell, AlertTriangle } from 'lucide-react';
import { AlertItem, AlertType, AlertPriority, AlertRecurrence, AppDatabase } from '../types';
import { dbService } from '../utils/storage';

interface AlertFormModalProps {
  initialAlert?: AlertItem | null;
  db: AppDatabase;
  onClose: () => void;
  onSave?: (alert: AlertItem) => void;
}

export const AlertFormModal: React.FC<AlertFormModalProps> = ({
  initialAlert,
  db,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialAlert?.title || '');
  const [type, setType] = useState<AlertType>(initialAlert?.type || 'license_renewal');
  const [entityType, setEntityType] = useState<'vendor' | 'server' | 'asset' | 'bill'>(initialAlert?.relatedEntityType || 'vendor');
  const [entityId, setEntityId] = useState(initialAlert?.relatedEntityId || (db.vendors[0]?.id || ''));
  const [dueDate, setDueDate] = useState(initialAlert?.dueDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<AlertRecurrence>(initialAlert?.recurrence || 'annual');
  const [priority, setPriority] = useState<AlertPriority>(initialAlert?.priority || 'urgent');
  const [notes, setNotes] = useState(initialAlert?.notes || '');

  // Get current entity name
  const getEntityName = (t: 'vendor' | 'server' | 'asset' | 'bill', id: string): string => {
    if (t === 'vendor') {
      return db.vendors.find(v => v.id === id)?.name || 'Vendor';
    }
    if (t === 'server') {
      return db.servers.find(s => s.id === id)?.name || 'Server';
    }
    if (t === 'bill') {
      const b = db.bills.find(b => b.id === id);
      return b ? `${b.billNumber} (${b.vendorName})` : 'Bill';
    }
    return db.assets.find(a => a.id === id)?.name || 'Asset';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const alert: AlertItem = {
      id: initialAlert?.id || `al-${Date.now()}`,
      title: title.trim(),
      type,
      relatedEntityType: entityType,
      relatedEntityId: entityId,
      relatedEntityName: getEntityName(entityType, entityId),
      dueDate,
      recurrence,
      status: 'active',
      priority,
      notes: notes.trim() || undefined
    };

    dbService.saveAlert(alert);
    if (onSave) onSave(alert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialAlert ? 'Edit Alert & Schedule' : 'Schedule Renewal / Maintenance'}
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
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Alert Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Reivernet 10G Circuit SLA Contract Renewal"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Alert Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as AlertType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="license_renewal">Software / SSL License Renewal</option>
                  <option value="contract_renewal">LSP / Vendor Contract Renewal</option>
                  <option value="maintenance_due">Scheduled Hardware Maintenance</option>
                  <option value="warranty_expiry">Hardware Warranty Expiry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as AlertPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="urgent">Urgent (Immediate NOC Action)</option>
                  <option value="warning">Warning (Standard Planning)</option>
                  <option value="normal">Normal (Routine Notice)</option>
                </select>
              </div>
            </div>

            {/* Entity Linking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#0c0f16] border border-[#1b2230]">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Entity Type</label>
                <select
                  value={entityType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setEntityType(t);
                    if (t === 'vendor') setEntityId(db.vendors[0]?.id || '');
                    else if (t === 'server') setEntityId(db.servers[0]?.id || '');
                    else setEntityId(db.assets[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#141822] border border-[#232b3b] text-white"
                >
                  <option value="vendor">Vendor / Provider</option>
                  <option value="server">Server / Host</option>
                  <option value="asset">Hardware Asset</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Specific Entity</label>
                <select
                  value={entityId}
                  onChange={e => setEntityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141822] border border-[#232b3b] text-white"
                >
                  {entityType === 'vendor' && db.vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                  {entityType === 'server' && db.servers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.ipAddress})</option>
                  ))}
                  {entityType === 'asset' && db.assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Recurrence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Due / Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Recurrence Cycle</label>
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value as AlertRecurrence)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
                >
                  <option value="none">One-Time Only</option>
                  <option value="monthly">Monthly (+1 Month)</option>
                  <option value="quarterly">Quarterly (+3 Months)</option>
                  <option value="biannual">Biannual (+6 Months)</option>
                  <option value="annual">Annual (+1 Year)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Action Checklist / Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Include contract numbers, contact person to notify, SLA review requirements..."
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
              Save Schedule Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
