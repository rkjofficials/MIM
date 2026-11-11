import React, { useState } from 'react';
import { X, Box } from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, AppDatabase } from '../types';
import { dbService } from '../utils/storage';

interface AssetFormModalProps {
  initialAsset?: Asset | null;
  db: AppDatabase;
  onClose: () => void;
  onSave?: (asset: Asset) => void;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  'Server Hardware',
  'Network Router / Switch',
  'LSP Circuit / Lease Line',
  'Power / UPS',
  'Storage / SAN',
  'Peripheral'
];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  initialAsset,
  db,
  onClose,
  onSave,
}) => {
  const [propertyId, setPropertyId] = useState(initialAsset?.propertyId || (db.properties[0]?.id || ''));
  const [name, setName] = useState(initialAsset?.name || '');
  const [category, setCategory] = useState<AssetCategory>(initialAsset?.category || 'Network Router / Switch');
  const [assetTag, setAssetTag] = useState(initialAsset?.assetTag || '');
  const [serialNumber, setSerialNumber] = useState(initialAsset?.serialNumber || '');
  const [vendorId, setVendorId] = useState(initialAsset?.vendorId || '');
  const [location, setLocation] = useState(initialAsset?.location || '');
  const [purchaseDate, setPurchaseDate] = useState(initialAsset?.purchaseDate || '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(initialAsset?.warrantyExpiry || '');
  const [cost, setCost] = useState(initialAsset?.cost ? String(initialAsset.cost) : '');
  const [status, setStatus] = useState<AssetStatus>(initialAsset?.status || 'in-service');
  const [notes, setNotes] = useState(initialAsset?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !assetTag.trim() || !serialNumber.trim() || !propertyId) return;

    const property = db.properties.find(p => p.id === propertyId);

    const asset: Asset = {
      id: initialAsset?.id || `ast-${Date.now()}`,
      propertyId,
      propertyName: property?.name || 'Hotel Property',
      name: name.trim(),
      category,
      assetTag: assetTag.trim(),
      serialNumber: serialNumber.trim(),
      vendorId: vendorId || undefined,
      location: location.trim() || 'Main Datacenter',
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      warrantyExpiry: warrantyExpiry || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      cost: cost ? parseFloat(cost) : undefined,
      status,
      notes: notes.trim() || undefined
    };

    dbService.saveAsset(asset);
    if (onSave) onSave(asset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialAsset ? 'Edit Asset Record' : 'Register Hardware Asset'}
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
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Hotel Property Assignment *</label>
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

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Asset Name / Model *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Cisco Catalyst 9300 48P, Reivernet Optical Unit"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                {ASSET_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Asset Tag *</label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={e => setAssetTag(e.target.value)}
                placeholder="e.g. AST-NET-2024-001"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Serial Number (S/N) *</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="e.g. FOC2419L29X"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Supplier / Vendor</label>
              <select
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Direct / Unlinked</option>
                {db.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Assigned Rack / Room Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. MDF Rack A1 (U16) or Server Room 2"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Purchase / Commission Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Warranty / Contract Expiry</label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={e => setWarrantyExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Acquisition Cost (USD)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="in-service">In Service (Active)</option>
                <option value="spare">Cold Spare / Storage</option>
                <option value="in-repair">In Repair / RMA</option>
                <option value="retired">Retired / Decommissioned</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Notes / Circuit ID / MAC</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Circuit reference IDs, MAC addresses, port allocations..."
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
              Save Asset Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
