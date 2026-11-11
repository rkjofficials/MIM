import React from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Plus, 
  Bell, 
  Shield, 
  ChevronDown, 
  Receipt,
  Server as ServerIcon,
  Box,
  AlertTriangle
} from 'lucide-react';
import { AppDatabase } from '../types';
import { getAlertUrgency } from '../utils/alertEngine';

interface HeaderProps {
  db: AppDatabase;
  activePropertyId: string | 'all';
  onSelectProperty: (propertyId: string | 'all') => void;
  onOpenSearch: () => void;
  onOpenBackup: () => void;
  onOpenAdmin: () => void;
  onOpenNewVendor: () => void;
  onOpenNewServer: () => void;
  onOpenNewAsset: () => void;
  onOpenNewBill: () => void;
  onOpenNewAlert: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  activePropertyId,
  onSelectProperty,
  onOpenSearch,
  onOpenBackup,
  onOpenAdmin,
  onOpenNewVendor,
  onOpenNewServer,
  onOpenNewAsset,
  onOpenNewBill,
  onOpenNewAlert,
  activeTab,
  onSelectTab
}) => {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = React.useState(false);

  // Active property name
  const currentProperty = activePropertyId === 'all' 
    ? null 
    : db.properties.find(p => p.id === activePropertyId);

  // Calculate active urgent alerts count
  const activeAlertsCount = db.alerts.filter(a => {
    if (a.status !== 'active') return false;
    const urgency = getAlertUrgency(a.dueDate);
    return urgency.tier === 'overdue' || urgency.tier === 'critical' || urgency.tier === 'upcoming';
  }).length;

  return (
    <header className="sticky top-0 z-30 bg-[#0c0e12] border-b border-[#1c222c] px-4 lg:px-6 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Property Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-inner text-white font-mono font-bold text-sm tracking-tight shrink-0">
            IT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                LinearIT
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#14231b] text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Offline
              </span>
            </div>
          </div>

          {/* Hotel Property Switcher */}
          <div className="relative ml-1 sm:ml-2">
            <button
              type="button"
              onClick={() => setShowPropertyMenu(!showPropertyMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#232b3c] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              aria-label="Switch hotel property profile"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {currentProperty ? currentProperty.name : 'All Properties'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>

            {showPropertyMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPropertyMenu(false)}
                />
                <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[#121620] border border-[#232c3f] shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1c2333]">
                    Marriott Hotel Properties
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectProperty('all');
                      setShowPropertyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                      activePropertyId === 'all'
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'text-slate-300 hover:bg-[#19202e]'
                    }`}
                  >
                    <div>
                      <span>All Properties (Cluster Overview)</span>
                      <span className="block text-[10px] text-slate-500">View combined assets and bills</span>
                    </div>
                  </button>

                  <div className="h-px bg-[#1c2333] my-1" />

                  {db.properties.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProperty(p.id);
                        setShowPropertyMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                        activePropertyId === p.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'text-slate-300 hover:bg-[#19202e]'
                      }`}
                    >
                      <div>
                        <span>{p.name}</span>
                        <span className="block text-[10px] text-slate-500">{p.city} • Code: {p.code}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1c2230] text-slate-400">
                        {p.brand}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#232b3c] text-xs text-slate-300 transition-colors cursor-pointer group"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            <span className="hidden md:inline text-slate-400">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#1e2533] rounded text-slate-400 font-mono">⌘K</kbd>
          </button>

          {/* Backup / Export */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#232b3c] text-xs text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-label="Backup"
            title="Backup & Restore"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Backup</span>
          </button>

          {/* Admin Panel Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#141822] hover:bg-[#1a202d] border border-[#232b3c] text-xs text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-label="Open Admin Panel"
            title="Admin Panel & Change Password"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Admin</span>
          </button>

          {/* Alerts Counter Button */}
          <button
            type="button"
            onClick={() => onSelectTab('alerts')}
            className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                : 'bg-[#141822] hover:bg-[#1a202d] border-[#232b3c] text-slate-300'
            }`}
            aria-label={`View alerts, ${activeAlertsCount} active alerts`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono">{activeAlertsCount}</span>
            {activeAlertsCount > 0 && (
              <span className="sm:hidden absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Create New Entity Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              aria-label="Add new record"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[#141822] border border-[#262e3d] shadow-2xl py-1 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenNewBill();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#1f2633] flex items-center justify-between cursor-pointer"
                  >
                    <span>Submit Vendor Bill</span>
                    <span className="text-[10px] text-emerald-400 font-mono">+Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenNewVendor();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#1f2633] flex items-center justify-between cursor-pointer"
                  >
                    <span>Vendor Profile</span>
                    <span className="text-[10px] text-slate-500 font-mono">+V</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenNewServer();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#1f2633] flex items-center justify-between cursor-pointer"
                  >
                    <span>Server / Host</span>
                    <span className="text-[10px] text-slate-500 font-mono">+S</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenNewAsset();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#1f2633] flex items-center justify-between cursor-pointer"
                  >
                    <span>Hardware Asset</span>
                    <span className="text-[10px] text-slate-500 font-mono">+A</span>
                  </button>
                  <div className="h-px bg-[#262e3d] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false);
                      onOpenNewAlert();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#1f2633] flex items-center justify-between cursor-pointer"
                  >
                    <span>Renewal / Maintenance Alert</span>
                    <span className="text-[10px] text-amber-500 font-mono">!</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
