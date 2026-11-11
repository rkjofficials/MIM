import React, { useState } from 'react';
import { X, Plus, Trash2, Building2 } from 'lucide-react';
import { Vendor, VendorCategory, SlaTier, VendorContact } from '../types';
import { dbService } from '../utils/storage';

interface VendorFormModalProps {
  initialVendor?: Vendor | null;
  onClose: () => void;
  onSave?: (vendor: Vendor) => void;
}

const CATEGORIES: VendorCategory[] = [
  'LSP',
  'Cloud Provider',
  'Hardware',
  'SaaS & Licensing',
  'ISP / Telecom',
  'Maintenance',
  'Security',
  'Other'
];

const SLA_TIERS: SlaTier[] = [
  '24/7 Priority 1',
  'Mission Critical',
  'Business Hours (8x5)',
  'Next Business Day'
];

export const VendorFormModal: React.FC<VendorFormModalProps> = ({
  initialVendor,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialVendor?.name || '');
  const [category, setCategory] = useState<VendorCategory>(initialVendor?.category || 'LSP');
  const [accountId, setAccountId] = useState(initialVendor?.accountId || '');
  const [supportPortalUrl, setSupportPortalUrl] = useState(initialVendor?.supportPortalUrl || '');
  const [slaTier, setSlaTier] = useState<SlaTier>(initialVendor?.slaTier || '24/7 Priority 1');
  const [notes, setNotes] = useState(initialVendor?.notes || '');
  
  // Contacts
  const [contacts, setContacts] = useState<VendorContact[]>(
    initialVendor?.contacts && initialVendor.contacts.length > 0
      ? initialVendor.contacts
      : [
          {
            id: `c-${Date.now()}`,
            name: '',
            designation: 'Account Manager',
            emails: [''],
            phoneNumbers: [{ id: 'p1', label: 'Direct', number: '' }],
            isPrimary: true,
          }
        ]
  );

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        id: `c-${Date.now()}-${contacts.length}`,
        name: '',
        designation: '',
        emails: [''],
        phoneNumbers: [{ id: `p-${Date.now()}`, label: 'Mobile', number: '' }],
        isPrimary: contacts.length === 0,
      }
    ]);
  };

  const handleUpdateContact = (index: number, field: keyof VendorContact, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Filter valid contacts
    const validContacts = contacts
      .filter(c => c.name.trim())
      .map((c, i) => ({
        ...c,
        name: c.name.trim(),
        designation: c.designation.trim() || 'Representative',
        emails: c.emails.map(e => e.trim()).filter(Boolean),
        phoneNumbers: c.phoneNumbers
          .map((p, pIdx) => ({ id: p.id || `p-${pIdx}-${Date.now()}`, label: p.label?.trim() || 'Direct', number: p.number.trim() }))
          .filter(p => p.number),
        isPrimary: c.isPrimary ?? (i === 0),
      }));

    const vendor: Vendor = {
      id: initialVendor?.id || `v-${Date.now()}`,
      name: name.trim(),
      category,
      accountId: accountId.trim(),
      supportPortalUrl: supportPortalUrl.trim() || undefined,
      slaTier,
      notes: notes.trim() || undefined,
      contacts: validContacts,
      createdAt: initialVendor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbService.saveVendor(vendor);
    if (onSave) onSave(vendor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialVendor ? 'Edit Vendor Profile' : 'New Vendor Profile'}
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
          {/* Company Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Company / Provider Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Reivernet Telecom, Dell Technologies, AWS"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as VendorCategory)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">SLA Tier</label>
              <select
                value={slaTier}
                onChange={e => setSlaTier(e.target.value as SlaTier)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                {SLA_TIERS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Account / Customer ID</label>
              <input
                type="text"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="e.g. RV-UK-98441"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Support Portal URL</label>
              <input
                type="url"
                value={supportPortalUrl}
                onChange={e => setSupportPortalUrl(e.target.value)}
                placeholder="https://portal.reivernet.com"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Description / Contract Scope</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Details on bandwidth, leased fiber lines, server warranty, or SLAs..."
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white resize-none"
              />
            </div>
          </div>

          {/* Quick Contacts Section */}
          <div className="pt-3 border-t border-[#1f2636]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white uppercase tracking-wider text-xs">
                  Key Contact Persons
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((c, idx) => (
                <div key={c.id || idx} className="p-3 rounded-lg bg-[#141822] border border-[#202737] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-400">Person #{idx + 1}</span>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => handleUpdateContact(idx, 'name', e.target.value)}
                      placeholder="Contact Name (e.g. Marcus Holloway)"
                      className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white"
                    />
                    <input
                      type="text"
                      value={c.designation}
                      onChange={e => handleUpdateContact(idx, 'designation', e.target.value)}
                      placeholder="Designation (e.g. Lead NOC Tier 3)"
                      className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white"
                    />
                    <input
                      type="text"
                      value={c.phoneNumbers[0]?.number || ''}
                      onChange={e => {
                        const updatedPhones = [{ id: 'p1', label: 'Direct', number: e.target.value }];
                        handleUpdateContact(idx, 'phoneNumbers', updatedPhones);
                      }}
                      placeholder="Phone (e.g. +44 20 7946 0831)"
                      className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                    />
                    <input
                      type="email"
                      value={c.emails[0] || ''}
                      onChange={e => {
                        handleUpdateContact(idx, 'emails', [e.target.value]);
                      }}
                      placeholder="Email (e.g. noc@reivernet.com)"
                      className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                    />
                  </div>
                </div>
              ))}
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
              Save Vendor Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
