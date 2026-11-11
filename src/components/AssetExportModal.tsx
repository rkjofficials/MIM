import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckSquare, Square, Filter } from 'lucide-react';
import { Asset, AssetCategory, Property } from '../types';
import { exportAssetsToCsv, triggerCsvDownload } from '../utils/csvExport';

interface AssetExportModalProps {
  assets: Asset[];
  properties: Property[];
  currentPropertyId: string | 'all';
  onClose: () => void;
}

const CATEGORIES: ('All' | AssetCategory)[] = [
  'All',
  'Server Hardware',
  'Network Router / Switch',
  'LSP Circuit / Lease Line',
  'Power / UPS',
  'Storage / SAN',
  'Peripheral'
];

export const AssetExportModal: React.FC<AssetExportModalProps> = ({
  assets,
  properties,
  currentPropertyId,
  onClose,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>(currentPropertyId);
  const [selectedCategory, setSelectedCategory] = useState<'All' | AssetCategory>('All');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(assets.map(a => a.id))
  );

  // Filtered pool of assets based on category and property
  const filteredAssets = assets.filter(a => {
    if (selectedPropertyId !== 'all' && a.propertyId !== selectedPropertyId) return false;
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    return true;
  });

  const isAllFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.has(a.id));

  const toggleSelectAllFiltered = () => {
    const next = new Set(selectedAssetIds);
    if (isAllFilteredSelected) {
      filteredAssets.forEach(a => next.delete(a.id));
    } else {
      filteredAssets.forEach(a => next.add(a.id));
    }
    setSelectedAssetIds(next);
  };

  const toggleAsset = (id: string) => {
    const next = new Set(selectedAssetIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAssetIds(next);
  };

  const handleExport = () => {
    const assetsToExport = assets.filter(a => selectedAssetIds.has(a.id));
    if (assetsToExport.length === 0) return;

    const propName = selectedPropertyId === 'all' 
      ? 'All-Properties' 
      : properties.find(p => p.id === selectedPropertyId)?.code || 'Property';

    const catName = selectedCategory === 'All' ? 'All-Kinds' : selectedCategory.replace(/\s+/g, '-');
    const filename = `marriott-assets-${propName}-${catName}-${new Date().toISOString().split('T')[0]}.csv`;

    const csv = exportAssetsToCsv(assetsToExport);
    triggerCsvDownload(csv, filename);
    onClose();
  };

  const selectedCount = assets.filter(a => selectedAssetIds.has(a.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Export Assets to Excel / CSV
              </h2>
              <p className="text-xs text-slate-400">
                Choose property, asset category, and select specific assets to include.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#1f2636] bg-[#0c0f16] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Scope by Hotel Property</label>
            <select
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141822] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Properties (Cluster Overview)</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Asset Kind / Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[#141822] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Asset Kinds' : c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assets Selection Checklist */}
        <div className="p-4 sm:p-5 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2536]">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>{isAllFilteredSelected ? 'Deselect All in View' : 'Select All in View'}</span>
            </button>

            <span className="font-mono text-slate-400">
              {selectedCount} of {assets.length} selected
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {filteredAssets.length === 0 ? (
              <p className="text-center py-6 text-slate-500">No assets match the selected filters.</p>
            ) : (
              filteredAssets.map(asset => {
                const isChecked = selectedAssetIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[#151a24] border-indigo-700/40 text-white'
                        : 'bg-[#11141c] border-[#1f2636] text-slate-400 hover:bg-[#161b26]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{asset.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#1c2230] text-slate-300">
                            {asset.assetTag}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {asset.category} • S/N: {asset.serialNumber} • {asset.propertyName || 'Property'}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[11px] text-slate-400">
                      {asset.warrantyExpiry}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[#1f2636] bg-[#121721] text-xs">
          <span className="text-slate-400">
            Export ready: CSV format compatible with Microsoft Excel & Sheets.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#1a202c] text-slate-300 hover:bg-[#252e3f] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium cursor-pointer shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel/CSV ({selectedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
