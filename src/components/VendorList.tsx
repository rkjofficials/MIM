import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Phone, 
  Mail, 
  ChevronRight, 
  Plus, 
  Users, 
  Shield, 
  ExternalLink,
  Edit2,
  Trash2
} from 'lucide-react';
import { Vendor, VendorCategory, AppDatabase } from '../types';
import { sanitizePhoneNumber } from '../utils/alertEngine';
import { dbService } from '../utils/storage';

interface VendorListProps {
  db: AppDatabase;
  onSelectVendor: (vendor: Vendor) => void;
  onEditVendor: (vendor: Vendor) => void;
  onNewVendor: () => void;
}

const CATEGORIES: ('All' | VendorCategory)[] = [
  'All',
  'LSP',
  'Cloud Provider',
  'Hardware',
  'Maintenance',
  'ISP / Telecom',
  'SaaS & Licensing',
  'Security'
];

export const VendorList: React.FC<VendorListProps> = ({
  db,
  onSelectVendor,
  onEditVendor,
  onNewVendor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | VendorCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = db.vendors.filter(v => {
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesVendor = v.name.toLowerCase().includes(q) || v.accountId.toLowerCase().includes(q);
    const matchesContact = v.contacts.some(c => 
      c.name.toLowerCase().includes(q) || 
      c.designation.toLowerCase().includes(q) ||
      c.phoneNumbers.some(p => p.number.includes(q))
    );
    return matchesVendor || matchesContact;
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Delete vendor "${name}"? This cannot be undone.`)) {
      dbService.deleteVendor(id);
    }
  };

  const getCategoryColor = (cat: VendorCategory) => {
    switch (cat) {
      case 'LSP':
        return 'bg-purple-950/50 text-purple-300 border-purple-700/40';
      case 'Cloud Provider':
        return 'bg-sky-950/50 text-sky-300 border-sky-700/40';
      case 'Hardware':
        return 'bg-blue-950/50 text-blue-300 border-blue-700/40';
      case 'Maintenance':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-700/40';
      case 'Security':
        return 'bg-rose-950/50 text-rose-300 border-rose-700/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-[#151922] text-slate-400 hover:text-slate-200 hover:bg-[#1f2635] border border-[#232a39]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search within Vendors */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter vendors or contacts..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#151922] border border-[#232a39] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onNewVendor}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
          No vendors match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVendors.map(vendor => {
            const primaryContact = vendor.contacts.find(c => c.isPrimary) || vendor.contacts[0];
            const primaryPhone = primaryContact?.phoneNumbers[0]?.number;
            const primaryEmail = primaryContact?.emails[0];

            return (
              <div
                key={vendor.id}
                onClick={() => onSelectVendor(vendor)}
                className="group relative rounded-xl bg-[#121620] hover:bg-[#151a26] border border-[#1f2636] hover:border-indigo-500/40 p-4 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Top Bar: Category & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getCategoryColor(vendor.category)}`}>
                        {vendor.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {vendor.accountId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditVendor(vendor);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#202737] cursor-pointer"
                        title="Edit Vendor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, vendor.id, vendor.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#202737] cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Company Name & SLA */}
                  <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                    {vendor.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 mb-3 text-xs text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>{vendor.slaTier}</span>
                  </div>

                  {/* Primary Contact Preview */}
                  {primaryContact && (
                    <div className="p-2.5 rounded-lg bg-[#0c0f16] border border-[#1a212e] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-200">
                          {primaryContact.name}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-mono">
                          {primaryContact.designation}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                        {primaryPhone && (
                          <a
                            href={`tel:${sanitizePhoneNumber(primaryPhone)}`}
                            onClick={e => e.stopPropagation()}
                            className="hover:text-emerald-400 flex items-center gap-1"
                            title="Call primary contact"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{primaryPhone}</span>
                          </a>
                        )}
                        {primaryEmail && (
                          <a
                            href={`mailto:${primaryEmail}`}
                            onClick={e => e.stopPropagation()}
                            className="hover:text-indigo-300 flex items-center gap-1 truncate"
                            title="Email primary contact"
                          >
                            <Mail className="w-3 h-3 text-indigo-400" />
                            <span className="truncate">{primaryEmail}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Count & View arrow */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1a212e] text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{vendor.contacts.length} {vendor.contacts.length === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform font-medium">
                    <span>View profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
