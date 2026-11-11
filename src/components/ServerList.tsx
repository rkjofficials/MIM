import React, { useState } from 'react';
import { 
  Server as ServerIcon, 
  Cloud, 
  HardDrive, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  Wrench, 
  Edit2, 
  Trash2, 
  Cpu, 
  Layers
} from 'lucide-react';
import { Server, ServerType, AppDatabase } from '../types';
import { getAlertUrgency, filterItemsByProperty } from '../utils/alertEngine';
import { dbService } from '../utils/storage';

interface ServerListProps {
  db: AppDatabase;
  activePropertyId: string | 'all';
  onEditServer: (server: Server) => void;
  onNewServer: () => void;
  onSelectVendorById?: (vendorId: string) => void;
}

export const ServerList: React.FC<ServerListProps> = ({
  db,
  activePropertyId,
  onEditServer,
  onNewServer,
  onSelectVendorById
}) => {
  const [selectedType, setSelectedType] = useState<'all' | ServerType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const copyIp = (e: React.MouseEvent, ip: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  const scopedServers = filterItemsByProperty(db.servers, activePropertyId);

  const filteredServers = scopedServers.filter(s => {
    if (selectedType !== 'all' && s.type !== selectedType) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.ipAddress.includes(q) ||
      (s.publicIp && s.publicIp.includes(q)) ||
      s.location.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      (s.propertyName && s.propertyName.toLowerCase().includes(q))
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Remove server "${name}" from inventory?`)) {
      dbService.deleteServer(id);
    }
  };

  const handleQuickMaintenanceLog = (e: React.MouseEvent, server: Server) => {
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    // Push next maintenance to 90 days out
    const d = new Date();
    d.setDate(d.getDate() + 90);
    const nextDate = d.toISOString().split('T')[0];

    dbService.saveServer({
      ...server,
      lastMaintenanceDate: today,
      nextMaintenanceDate: nextDate,
      status: 'active'
    });
  };

  return (
    <div className="space-y-4">
      {/* Type Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121620] border border-[#1f2636]">
          {[
            { id: 'all', label: 'All Hosts' },
            { id: 'on-premises', label: 'On-Premises' },
            { id: 'cloud', label: 'Cloud' },
            { id: 'hybrid', label: 'Hybrid' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & New Server */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by hostname, IP, role..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#151922] border border-[#232a39] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onNewServer}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Host</span>
          </button>
        </div>
      </div>

      {/* Servers Table / Card List */}
      {filteredServers.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
          No servers found matching the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredServers.map(server => {
            const vendor = server.vendorId ? db.vendors.find(v => v.id === server.vendorId) : null;
            const maintenanceUrgency = server.nextMaintenanceDate ? getAlertUrgency(server.nextMaintenanceDate) : null;

            return (
              <div
                key={server.id}
                className="rounded-xl bg-[#121620] border border-[#1f2636] p-4 text-xs space-y-3 shadow-sm hover:border-slate-700 transition-colors"
              >
                {/* Header: Name, Type, Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#1a2130] text-indigo-400 border border-[#263147]">
                      {server.type === 'cloud' ? (
                        <Cloud className="w-4 h-4 text-sky-400" />
                      ) : (
                        <HardDrive className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white text-sm">
                          {server.name}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono uppercase font-medium ${
                          server.type === 'cloud'
                            ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                            : server.type === 'hybrid'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                        }`}>
                          {server.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {server.role} • {server.os}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditServer(server)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
                      title="Edit server"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, server.id, server.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2636] cursor-pointer"
                      title="Delete server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Network & Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#0c0f16] border border-[#1a212e]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                      Internal IP
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-200 mt-0.5">
                      <span>{server.ipAddress}</span>
                      <button
                        type="button"
                        onClick={(e) => copyIp(e, server.ipAddress)}
                        className="p-0.5 text-slate-500 hover:text-white cursor-pointer"
                        title="Copy IP"
                      >
                        {copiedIp === server.ipAddress ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {server.publicIp ? (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Public IP / Gateway
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-indigo-300 mt-0.5">
                        <span>{server.publicIp}</span>
                        <button
                          type="button"
                          onClick={(e) => copyIp(e, server.publicIp!)}
                          className="p-0.5 text-slate-500 hover:text-white cursor-pointer"
                          title="Copy Public IP"
                        >
                          {copiedIp === server.publicIp ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Location / Datacenter
                      </span>
                      <span className="text-slate-300 truncate block mt-0.5 font-mono text-[11px]">
                        {server.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specs Pill */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {server.specs.cpu} • {server.specs.ram} • {server.specs.storage}
                  </span>
                </div>

                {/* Maintenance & Vendor Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#1a212e] text-[11px]">
                  {vendor ? (
                    <button
                      type="button"
                      onClick={() => onSelectVendorById && onSelectVendorById(vendor.id)}
                      className="text-slate-400 hover:text-indigo-400 font-medium truncate max-w-[140px] text-left cursor-pointer"
                    >
                      {vendor.name}
                    </button>
                  ) : (
                    <span className="text-slate-500">Internal</span>
                  )}

                  <div className="flex items-center gap-2">
                    {server.nextMaintenanceDate && maintenanceUrgency && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        maintenanceUrgency.tier === 'overdue'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-700/40'
                          : maintenanceUrgency.tier === 'critical'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-700/40'
                          : 'bg-[#18202c] text-slate-300'
                      }`}>
                        Maint: {server.nextMaintenanceDate}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleQuickMaintenanceLog(e, server)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
                      title="Log maintenance completed (reschedules +90d)"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
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
