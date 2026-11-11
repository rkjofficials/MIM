import React from 'react';
import { Building2, Server, Box, Bell, AlertTriangle, Receipt } from 'lucide-react';
import { AppDatabase } from '../types';
import { getAlertUrgency, filterItemsByProperty } from '../utils/alertEngine';

interface TabNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activePropertyId: string | 'all';
  db: AppDatabase;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onSelectTab,
  activePropertyId,
  db
}) => {
  // Scoped counts for current property
  const vendorCount = db.vendors.length;
  const serverCount = filterItemsByProperty(db.servers, activePropertyId).length;
  const assetCount = filterItemsByProperty(db.assets, activePropertyId).length;
  
  const scopedBills = filterItemsByProperty(db.bills, activePropertyId);
  const pendingBillsCount = scopedBills.filter(b => b.status === 'pending_approval' || b.status === 'approved').length;

  const scopedAlerts = filterItemsByProperty(db.alerts, activePropertyId);
  const urgentAlertsCount = scopedAlerts.filter(a => {
    if (a.status !== 'active') return false;
    const urgency = getAlertUrgency(a.dueDate);
    return urgency.tier === 'overdue' || urgency.tier === 'critical';
  }).length;

  const totalActiveAlerts = scopedAlerts.filter(a => a.status === 'active').length;

  const tabs = [
    {
      id: 'vendors',
      label: 'Vendors & Contacts',
      icon: Building2,
      count: vendorCount,
    },
    {
      id: 'servers',
      label: 'Servers & Cloud',
      icon: Server,
      count: serverCount,
    },
    {
      id: 'assets',
      label: 'Asset Tracking',
      icon: Box,
      count: assetCount,
    },
    {
      id: 'bills',
      label: 'Bills & Invoices',
      icon: Receipt,
      count: scopedBills.length,
      alertUrgentCount: pendingBillsCount > 0 ? pendingBillsCount : undefined,
    },
    {
      id: 'alerts',
      label: 'Alerts & Renewals',
      icon: AlertTriangle,
      count: totalActiveAlerts,
      alertUrgentCount: urgentAlertsCount,
    },
  ];

  return (
    <div className="border-b border-[#1c222c] bg-[#0c0e12]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1a202c] text-white shadow-sm border border-[#2a3447]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141820]'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono leading-none ${
                    tab.alertUrgentCount && tab.alertUrgentCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                      : isActive
                      ? 'bg-[#252e3e] text-slate-200'
                      : 'bg-[#151921] text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
