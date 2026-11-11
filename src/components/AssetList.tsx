import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Edit2, 
  Trash2, 
  Building2,
  CheckSquare,
  Square
} from 'lucide-react';
import { Asset, AssetCategory, AppDatabase } from '../types';
import { getAlertUrgency, filterItemsByProperty } from '../utils/alertEngine';
import { dbService } from '../utils/storage';
import { AssetExportModal } from './AssetExportModal';
import { exportAssetsToCsv, triggerCsvDownload } from '../utils/csvExport';

interface AssetListProps {
  db: AppDatabase;
  activePropertyId: string | 'all';
  onEditAsset: (asset: Asset) => void;
  onNewAsset: () => void;
  onSelectVendorById?: (vendorId: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  db,
  activePropertyId,
  onEditAsset,
  onNewAsset,
  onSelectVendorById
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  const categories = ['All', 'Server Hardware', 'Network Router / Switch', 'LSP Circuit / Lease Line', 'Power / UPS', 'Storage / SAN', 'Peripheral'];

  // Scope assets strictly by hotel property
  const scopedAssets = filterItemsByProperty(db.assets, activePropertyId);

  const filteredAssets = scopedAssets.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.assetTag.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      (a.propertyName && a.propertyName.toLowerCase().includes(q))
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Remove asset "${name}"?`)) {
      dbService.deleteAsset(id);
    }
  };

  const toggleSelectAsset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedAssetIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAssetIds(next);
  };

  const handleQuickExportSelected = () => {
    const assetsToExport = selectedAssetIds.size > 0 
      ? db.assets.filter(a => selectedAssetIds.has(a.id))
      : filteredAssets;

    const propLabel = activePropertyId === 'all' ? 'All-Properties' : activePropertyId;
    const csv = exportAssetsToCsv(assetsToExport);
    triggerCsvDownload(csv, `marriott-assets-${propLabel}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Search & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-[#151922] text-slate-400 hover:text-slate-200 border border-[#232a39]'
              }`}
            >
              {cat}
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
              placeholder="Search tag, serial, location..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#151922] border border-[#232a39] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Export to Excel / CSV modal trigger */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1f2738] border border-[#232a39] text-slate-300 text-xs font-medium shrink-0 cursor-pointer shadow-sm"
            title="Export Assets to Excel / CSV with category filter and custom selection"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export Excel</span>
          </button>

          <button
            type="button"
            onClick={onNewAsset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </div>

      {/* Selected Items Quick Action Bar */}
      {selectedAssetIds.size > 0 && (
        <div className="p-2.5 px-3.5 rounded-xl bg-[#141b26] border border-indigo-700/40 flex items-center justify-between text-xs">
          <span className="text-indigo-300 font-mono">
            {selectedAssetIds.size} asset{selectedAssetIds.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedAssetIds(new Set())}
              className="text-slate-400 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleQuickExportSelected}
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>Export {selectedAssetIds.size} to CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Asset Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
          No hardware assets match the filter for this hotel property profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssets.map(asset => {
            const vendor = asset.vendorId ? db.vendors.find(v => v.id === asset.vendorId) : null;
            const warrantyUrgency = getAlertUrgency(asset.warrantyExpiry);
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <div
                key={asset.id}
                className={`rounded-xl border p-4 text-xs space-y-3 shadow-sm transition-colors flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#151c27] border-indigo-600/50'
                    : 'bg-[#121620] border-[#1f2636] hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectAsset(e, asset.id)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title={isSelected ? 'Deselect asset' : 'Select asset for export'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1a2130] text-emerald-400 border border-emerald-800/30">
                        {asset.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditAsset(asset)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
                        title="Edit asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, asset.id, asset.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2636] cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {asset.name}
                  </h3>

                  {asset.propertyName && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span className="font-medium text-slate-300">{asset.propertyName}</span>
                    </div>
                  )}

                  <div className="mt-2 p-2 rounded-lg bg-[#0c0f16] border border-[#1a212e] space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Asset Tag</span>
                      <span className="text-slate-200">{asset.assetTag}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Serial</span>
                      <span className="text-slate-300">{asset.serialNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location</span>
                      <span className="text-slate-400 truncate max-w-[150px]">{asset.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1a212e] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Warranty:</span>
                    <span className={`font-mono px-1.5 py-0.2 rounded text-[10px] ${
                      warrantyUrgency.tier === 'overdue'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-700/40'
                        : warrantyUrgency.tier === 'critical'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-700/40'
                        : 'text-slate-400'
                    }`}>
                      {asset.warrantyExpiry}
                    </span>
                  </div>

                  {vendor && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Vendor:</span>
                      <button
                        type="button"
                        onClick={() => onSelectVendorById && onSelectVendorById(vendor.id)}
                        className="text-indigo-400 hover:underline truncate max-w-[130px] font-medium"
                      >
                        {vendor.name}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export to Excel Modal */}
      {isExportModalOpen && (
        <AssetExportModal
          assets={db.assets}
          properties={db.properties}
          currentPropertyId={activePropertyId}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};
