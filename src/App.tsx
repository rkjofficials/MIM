import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Server, 
  Box, 
  AlertTriangle, 
  ShieldCheck, 
  HardDrive, 
  Cloud, 
  Wifi, 
  Search,
  Plus,
  Receipt
} from 'lucide-react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { VendorList } from './components/VendorList';
import { VendorDetailModal } from './components/VendorDetailModal';
import { VendorFormModal } from './components/VendorFormModal';
import { ServerList } from './components/ServerList';
import { ServerFormModal } from './components/ServerFormModal';
import { AssetList } from './components/AssetList';
import { AssetFormModal } from './components/AssetFormModal';
import { AlertManager } from './components/AlertManager';
import { AlertFormModal } from './components/AlertFormModal';
import { BillManager } from './components/BillManager';
import { BillFormModal } from './components/BillFormModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { LoginScreen } from './components/LoginScreen';
import { CommandPalette } from './components/CommandPalette';
import { BackupModal } from './components/BackupModal';
import { dbService } from './utils/storage';
import { 
  Vendor, 
  Server as ServerType, 
  Asset, 
  AlertItem, 
  Bill, 
  AppDatabase 
} from './types';
import { getAlertUrgency, filterItemsByProperty } from './utils/alertEngine';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(dbService.getData());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(dbService.isAuthenticated());
  
  // Property scoping: 'all' or specific property id
  const [activePropertyId, setActivePropertyId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<string>('vendors');

  // Modals & Sheets
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null | undefined>(undefined);
  const [editingServer, setEditingServer] = useState<ServerType | null | undefined>(undefined);
  const [editingAsset, setEditingAsset] = useState<Asset | null | undefined>(undefined);
  const [editingBill, setEditingBill] = useState<Bill | null | undefined>(undefined);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null | undefined>(undefined);
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      const freshDb = dbService.getData();
      setDb(freshDb);
      setIsAuthenticated(dbService.isAuthenticated());

      // Keep selectedVendor state in sync if it was updated
      if (selectedVendor) {
        const updated = freshDb.vendors.find(v => v.id === selectedVendor.id);
        if (updated) setSelectedVendor(updated);
      }
    });
    return unsubscribe;
  }, [selectedVendor]);

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Operational metrics scoped to active property
  const scopedServers = filterItemsByProperty(db.servers, activePropertyId);
  const scopedAssets = filterItemsByProperty(db.assets, activePropertyId);
  const scopedBills = filterItemsByProperty(db.bills, activePropertyId);
  const scopedAlerts = filterItemsByProperty(db.alerts, activePropertyId);

  const lspVendors = db.vendors.filter(v => v.category === 'LSP' || v.category === 'ISP / Telecom');
  const onPremServers = scopedServers.filter(s => s.type === 'on-premises' || s.type === 'hybrid');
  const cloudServers = scopedServers.filter(s => s.type === 'cloud');
  
  const pendingBills = scopedBills.filter(b => b.status === 'pending_approval');
  const criticalAlertsCount = scopedAlerts.filter(a => {
    if (a.status !== 'active') return false;
    const u = getAlertUrgency(a.dueDate);
    return u.tier === 'overdue' || u.tier === 'critical';
  }).length;

  const currentPropertyName = activePropertyId === 'all'
    ? 'All Properties (Marriott Cluster)'
    : db.properties.find(p => p.id === activePropertyId)?.name || 'Property';

  const handleSelectVendorById = (vendorId: string) => {
    const found = db.vendors.find(v => v.id === vendorId);
    if (found) {
      setSelectedVendor(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-20 sm:pb-8">
      {/* Top Header */}
      <Header
        db={db}
        activePropertyId={activePropertyId}
        onSelectProperty={setActivePropertyId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenNewVendor={() => setEditingVendor(null)}
        onOpenNewServer={() => setEditingServer(null)}
        onOpenNewAsset={() => setEditingAsset(null)}
        onOpenNewBill={() => setEditingBill(null)}
        onOpenNewAlert={() => setEditingAlert(null)}
      />

      {/* Segmented Navigation Bar */}
      <TabNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activePropertyId={activePropertyId}
        db={db}
      />

      {/* Quick Status Bar */}
      <section className="border-b border-[#181f2a] bg-[#0f1219]/60 px-4 lg:px-6 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs overflow-x-auto gap-4 no-scrollbar">
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentPropertyName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-purple-400" />
              <span>LSP Lines:</span>
              <span className="text-white font-semibold">{lspVendors.length} active</span>
            </div>

            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>On-Prem:</span>
              <span className="text-white font-semibold">{onPremServers.length}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud:</span>
              <span className="text-white font-semibold">{cloudServers.length}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assets:</span>
              <span className="text-white font-semibold">{scopedAssets.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pendingBills.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('bills')}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/50 text-[11px] font-mono cursor-pointer hover:bg-amber-900/50 transition-colors"
              >
                <Receipt className="w-3 h-3 text-amber-400" />
                <span>{pendingBills.length} bills pending</span>
              </button>
            )}

            {criticalAlertsCount > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-700/50 text-[11px] font-mono cursor-pointer hover:bg-rose-900/50 transition-colors"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{criticalAlertsCount} critical</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span>Healthy</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex-1 w-full">
        {activeTab === 'vendors' && (
          <VendorList
            db={db}
            onSelectVendor={vendor => setSelectedVendor(vendor)}
            onEditVendor={vendor => setEditingVendor(vendor)}
            onNewVendor={() => setEditingVendor(null)}
          />
        )}

        {activeTab === 'servers' && (
          <ServerList
            db={db}
            activePropertyId={activePropertyId}
            onEditServer={server => setEditingServer(server)}
            onNewServer={() => setEditingServer(null)}
            onSelectVendorById={handleSelectVendorById}
          />
        )}

        {activeTab === 'assets' && (
          <AssetList
            db={db}
            activePropertyId={activePropertyId}
            onEditAsset={asset => setEditingAsset(asset)}
            onNewAsset={() => setEditingAsset(null)}
            onSelectVendorById={handleSelectVendorById}
          />
        )}

        {activeTab === 'bills' && (
          <BillManager
            db={db}
            activePropertyId={activePropertyId}
            onNewBill={() => setEditingBill(null)}
            onEditBill={bill => setEditingBill(bill)}
            onSelectVendorById={handleSelectVendorById}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertManager
            db={db}
            onNewAlert={() => setEditingAlert(null)}
            onEditAlert={alert => setEditingAlert(alert)}
            onSelectVendorById={handleSelectVendorById}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Nav Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e12] border-t border-[#1c222c] px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'vendors' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('servers')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'servers' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Servers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'assets' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Assets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bills')}
          className={`relative flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'bills' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Bills</span>
          {pendingBills.length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`relative flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'alerts' ? 'text-amber-400' : 'text-slate-500'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alerts</span>
          {criticalAlertsCount > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium text-slate-500 hover:text-white"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </nav>

      {/* Modals & Overlays */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          db={db}
          onClose={() => setSelectedVendor(null)}
          onEditVendor={vendor => {
            setSelectedVendor(null);
            setEditingVendor(vendor);
          }}
        />
      )}

      {editingVendor !== undefined && (
        <VendorFormModal
          initialVendor={editingVendor}
          onClose={() => setEditingVendor(undefined)}
          onSave={saved => {
            if (selectedVendor && selectedVendor.id === saved.id) {
              setSelectedVendor(saved);
            }
          }}
        />
      )}

      {editingServer !== undefined && (
        <ServerFormModal
          initialServer={editingServer}
          db={db}
          onClose={() => setEditingServer(undefined)}
        />
      )}

      {editingAsset !== undefined && (
        <AssetFormModal
          initialAsset={editingAsset}
          db={db}
          onClose={() => setEditingAsset(undefined)}
        />
      )}

      {editingBill !== undefined && (
        <BillFormModal
          initialBill={editingBill}
          db={db}
          defaultPropertyId={activePropertyId}
          onClose={() => setEditingBill(undefined)}
        />
      )}

      {editingAlert !== undefined && (
        <AlertFormModal
          initialAlert={editingAlert}
          db={db}
          onClose={() => setEditingAlert(undefined)}
        />
      )}

      {isAdminOpen && (
        <AdminPanelModal
          db={db}
          onClose={() => setIsAdminOpen(false)}
          onLogout={() => {
            setIsAdminOpen(false);
            dbService.logout();
            setIsAuthenticated(false);
          }}
        />
      )}

      <CommandPalette
        db={db}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVendor={vendor => setSelectedVendor(vendor)}
        onSelectTab={tab => setActiveTab(tab)}
      />

      {isBackupOpen && (
        <BackupModal
          db={db}
          onClose={() => setIsBackupOpen(false)}
        />
      )}
    </div>
  );
}
