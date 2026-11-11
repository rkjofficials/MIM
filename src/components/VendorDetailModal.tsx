import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Star, 
  Server as ServerIcon, 
  Box, 
  Clock, 
  ShieldCheck,
  Building,
  Plus
} from 'lucide-react';
import { Vendor, VendorContact, ContactPhoneNumber, AppDatabase } from '../types';
import { sanitizePhoneNumber } from '../utils/alertEngine';
import { dbService } from '../utils/storage';

interface VendorDetailModalProps {
  vendor: Vendor;
  db: AppDatabase;
  onClose: () => void;
  onEditVendor: (vendor: Vendor) => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  vendor,
  db,
  onClose,
  onEditVendor,
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Form state for new/edited contact
  const [cName, setCName] = useState('');
  const [cDesignation, setCDesignation] = useState('');
  const [cEmails, setCEmails] = useState<string[]>(['']);
  const [cPhones, setCPhones] = useState<{ label: string; number: string }[]>([
    { label: 'Direct', number: '' }
  ]);
  const [cIsPrimary, setCIsPrimary] = useState(false);
  const [cAvatarUrl, setCAvatarUrl] = useState('');
  const [cNotes, setCNotes] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenContactForm = (contact?: VendorContact) => {
    if (contact) {
      setEditingContact(contact);
      setCName(contact.name);
      setCDesignation(contact.designation);
      setCEmails(contact.emails.length > 0 ? [...contact.emails] : ['']);
      setCPhones(contact.phoneNumbers.length > 0 ? [...contact.phoneNumbers] : [{ label: 'Direct', number: '' }]);
      setCIsPrimary(contact.isPrimary);
      setCAvatarUrl(contact.avatarUrl || '');
      setCNotes(contact.notes || '');
    } else {
      setEditingContact(null);
      setCName('');
      setCDesignation('');
      setCEmails(['']);
      setCPhones([{ label: 'Direct', number: '' }]);
      setCIsPrimary(vendor.contacts.length === 0);
      setCAvatarUrl('');
      setCNotes('');
    }
    setIsAddingContact(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    const cleanEmails = cEmails.map(e => e.trim()).filter(Boolean);
    const cleanPhones = cPhones
      .map(p => ({ label: p.label.trim() || 'Direct', number: p.number.trim() }))
      .filter(p => Boolean(p.number));

    const updatedContact: VendorContact = {
      id: editingContact ? editingContact.id : `c-${Date.now()}`,
      name: cName.trim(),
      designation: cDesignation.trim() || 'Representative',
      emails: cleanEmails,
      phoneNumbers: cleanPhones.map((p, idx) => ({ id: `p-${idx}-${Date.now()}`, label: p.label, number: p.number })),
      isPrimary: cIsPrimary,
      avatarUrl: cAvatarUrl.trim() || undefined,
      notes: cNotes.trim() || undefined,
    };

    let updatedContacts = [...vendor.contacts];

    // If marked as primary, un-mark previous primary
    if (cIsPrimary) {
      updatedContacts = updatedContacts.map(c => ({ ...c, isPrimary: false }));
    }

    if (editingContact) {
      const idx = updatedContacts.findIndex(c => c.id === editingContact.id);
      if (idx >= 0) updatedContacts[idx] = updatedContact;
    } else {
      updatedContacts.push(updatedContact);
    }

    const updatedVendor = { ...vendor, contacts: updatedContacts };
    dbService.saveVendor(updatedVendor);
    setIsAddingContact(false);
  };

  const handleDeleteContact = (contactId: string) => {
    if (!confirm('Remove this contact from the vendor profile?')) return;
    const updatedContacts = vendor.contacts.filter(c => c.id !== contactId);
    const updatedVendor = { ...vendor, contacts: updatedContacts };
    dbService.saveVendor(updatedVendor);
  };

  // Find linked servers and assets
  const linkedServers = db.servers.filter(s => s.vendorId === vendor.id);
  const linkedAssets = db.assets.filter(a => a.vendorId === vendor.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#1f2636] bg-[#121721]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                {vendor.category}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 border border-[#2b3548]">
                {vendor.slaTier}
              </span>
              {vendor.accountId && (
                <span className="text-xs font-mono text-slate-400">
                  ID: {vendor.accountId}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {vendor.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEditVendor(vendor)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2636] transition-colors cursor-pointer"
              title="Edit Vendor"
              aria-label="Edit Vendor"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2636] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Notes & Links Bar */}
          {(vendor.notes || vendor.supportPortalUrl) && (
            <div className="p-3.5 rounded-lg bg-[#141822] border border-[#1f2737] text-xs text-slate-300 space-y-2">
              {vendor.notes && <p className="leading-relaxed">{vendor.notes}</p>}
              {vendor.supportPortalUrl && (
                <div className="flex items-center gap-1.5 text-indigo-400 pt-1">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <a
                    href={vendor.supportPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate text-indigo-300 font-mono text-[11px]"
                  >
                    {vendor.supportPortalUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* People & Multi-Contact Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Company Contacts
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-[#1c2230] px-1.5 py-0.2 rounded">
                  {vendor.contacts.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenContactForm()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Person</span>
              </button>
            </div>

            {vendor.contacts.length === 0 ? (
              <div className="p-6 rounded-lg bg-[#141822] border border-[#1f2737] text-center text-xs text-slate-400">
                No contact persons added yet. Click &ldquo;Add Person&rdquo; to add engineers, account managers, and emergency numbers.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vendor.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      contact.isPrimary
                        ? 'bg-[#151a24] border-indigo-700/40 shadow-sm'
                        : 'bg-[#131720] border-[#202735]'
                    }`}
                  >
                    {/* Person Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#2b3548]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-700 to-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase border border-indigo-500/30">
                            {contact.name.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-sm">
                              {contact.name}
                            </span>
                            {contact.isPrimary && (
                              <span className="flex items-center text-[10px] text-amber-400 bg-amber-950/40 border border-amber-600/30 px-1 py-0.2 rounded font-mono">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-indigo-300 font-medium">
                            {contact.designation}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenContactForm(contact)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
                          title="Edit Person"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2636] cursor-pointer"
                          title="Remove Person"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Phone Numbers List */}
                    {contact.phoneNumbers.length > 0 && (
                      <div className="space-y-1 my-2">
                        {contact.phoneNumbers.map((phone) => (
                          <div
                            key={phone.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0d1017] border border-[#1b2230]"
                          >
                            <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                              {phone.label}:
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-200">
                              <a
                                href={`tel:${sanitizePhoneNumber(phone.number)}`}
                                className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                title="Call directly"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{phone.number}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(phone.number)}
                                className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                                title="Copy number"
                              >
                                {copiedText === phone.number ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Email Addresses */}
                    {contact.emails.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {contact.emails.map((email, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0d1017] border border-[#1b2230]"
                          >
                            <a
                              href={`mailto:${email}`}
                              className="hover:text-indigo-300 flex items-center gap-1.5 truncate max-w-[200px] text-[11px] font-mono text-slate-300 transition-colors"
                              title="Send email"
                            >
                              <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{email}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(email)}
                              className="p-0.5 text-slate-400 hover:text-white cursor-pointer shrink-0"
                              title="Copy email"
                            >
                              {copiedText === email ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact Note */}
                    {contact.notes && (
                      <div className="text-[11px] text-slate-400 italic pt-1 border-t border-[#1b2230]">
                        {contact.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Servers & Assets */}
          <div className="pt-2 border-t border-[#1f2636]">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Linked Infrastructure & Assets
            </h3>
            {linkedServers.length === 0 && linkedAssets.length === 0 ? (
              <p className="text-xs text-slate-500">
                No servers or hardware assets currently tied to this vendor.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedServers.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#141822] border border-[#1f2737] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ServerIcon className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="text-slate-400 ml-2 font-mono">({s.ipAddress})</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c2230] text-slate-300">
                      {s.role} • {s.type}
                    </span>
                  </div>
                ))}

                {linkedAssets.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#141822] border border-[#1f2737] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-white">{a.name}</span>
                        <span className="text-slate-400 ml-2 font-mono">{a.assetTag}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      S/N: {a.serialNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Contact Modal Sub-layer */}
        {isAddingContact && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85">
            <div className="relative w-full max-w-lg rounded-xl bg-[#131720] border border-[#2b3548] p-5 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#212a3b]">
                <h3 className="font-semibold text-white text-base">
                  {editingContact ? 'Edit Contact Person' : 'Add Contact Person'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={e => setCName(e.target.value)}
                    placeholder="e.g. Marcus Holloway"
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={cDesignation}
                    onChange={e => setCDesignation(e.target.value)}
                    placeholder="e.g. Senior NOC Tier 3 Engineer, Key Account Director"
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Multiple Phone Numbers */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">Phone Numbers</label>
                    <button
                      type="button"
                      onClick={() => setCPhones([...cPhones, { label: 'Mobile', number: '' }])}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Number
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cPhones.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={phone.label}
                          onChange={e => {
                            const updated = [...cPhones];
                            updated[idx].label = e.target.value;
                            setCPhones(updated);
                          }}
                          placeholder="Label (e.g. 24x7 NOC)"
                          className="w-1/3 px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white"
                        />
                        <input
                          type="text"
                          value={phone.number}
                          onChange={e => {
                            const updated = [...cPhones];
                            updated[idx].number = e.target.value;
                            setCPhones(updated);
                          }}
                          placeholder="+44 20 7946 0999"
                          className="w-2/3 px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                        />
                        {cPhones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCPhones(cPhones.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multiple Email Addresses */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">Email Addresses</label>
                    <button
                      type="button"
                      onClick={() => setCEmails([...cEmails, ''])}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Email
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => {
                            const updated = [...cEmails];
                            updated[idx] = e.target.value;
                            setCEmails(updated);
                          }}
                          placeholder="noc@reivernet.com"
                          className="w-full px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                        />
                        {cEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCEmails(cEmails.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avatar URL & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Avatar / Photo URL</label>
                    <input
                      type="text"
                      value={cAvatarUrl}
                      onChange={e => setCAvatarUrl(e.target.value)}
                      placeholder="https://... or empty for initials"
                      className="w-full px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Responsibilities / Notes</label>
                    <input
                      type="text"
                      value={cNotes}
                      onChange={e => setCNotes(e.target.value)}
                      placeholder="e.g. BGP peering lead"
                      className="w-full px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white"
                    />
                  </div>
                </div>

                {/* Primary Contact Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPrimaryCheck"
                    checked={cIsPrimary}
                    onChange={e => setCIsPrimary(e.target.checked)}
                    className="rounded bg-[#0b0e14] border-[#232b3b] text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isPrimaryCheck" className="text-slate-300 font-medium cursor-pointer">
                    Set as Primary Contact for {vendor.name}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#212a3b]">
                  <button
                    type="button"
                    onClick={() => setIsAddingContact(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#1c2230] text-slate-300 hover:bg-[#252e3f] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
