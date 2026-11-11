import React, { useState } from 'react';
import { X, Server as ServerIcon } from 'lucide-react';
import { Server, ServerType, ServerRole, ServerStatus, AppDatabase } from '../types';
import { dbService } from '../utils/storage';

interface ServerFormModalProps {
  initialServer?: Server | null;
  db: AppDatabase;
  onClose: () => void;
  onSave?: (server: Server) => void;
}

const SERVER_ROLES: ServerRole[] = [
  'Gateway / LSP Router',
  'Database',
  'Application Server',
  'DNS / Edge',
  'Virtualization Host',
  'Backup / Storage',
  'Firewall'
];

export const ServerFormModal: React.FC<ServerFormModalProps> = ({
  initialServer,
  db,
  onClose,
  onSave,
}) => {
  const [propertyId, setPropertyId] = useState(initialServer?.propertyId || (db.properties[0]?.id || ''));
  const [name, setName] = useState(initialServer?.name || '');
  const [type, setType] = useState<ServerType>(initialServer?.type || 'on-premises');
  const [ipAddress, setIpAddress] = useState(initialServer?.ipAddress || '');
  const [publicIp, setPublicIp] = useState(initialServer?.publicIp || '');
  const [location, setLocation] = useState(initialServer?.location || '');
  const [role, setRole] = useState<ServerRole>(initialServer?.role || 'Gateway / LSP Router');
  const [os, setOs] = useState(initialServer?.os || '');
  const [cpu, setCpu] = useState(initialServer?.specs?.cpu || '');
  const [ram, setRam] = useState(initialServer?.specs?.ram || '');
  const [storage, setStorage] = useState(initialServer?.specs?.storage || '');
  const [vendorId, setVendorId] = useState(initialServer?.vendorId || '');
  const [status, setStatus] = useState<ServerStatus>(initialServer?.status || 'active');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(initialServer?.lastMaintenanceDate || '');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(initialServer?.nextMaintenanceDate || '');
  const [notes, setNotes] = useState(initialServer?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ipAddress.trim() || !propertyId) return;

    const property = db.properties.find(p => p.id === propertyId);

    const server: Server = {
      id: initialServer?.id || `srv-${Date.now()}`,
      propertyId,
      propertyName: property?.name || 'Hotel Property',
      name: name.trim(),
      type,
      ipAddress: ipAddress.trim(),
      publicIp: publicIp.trim() || undefined,
      location: location.trim() || (type === 'cloud' ? 'AWS / Cloud VPC' : 'On-Premises Server Room'),
      role,
      os: os.trim() || 'Linux / Enterprise OS',
      specs: {
        cpu: cpu.trim() || 'Multi-Core Server CPU',
        ram: ram.trim() || '16 GB',
        storage: storage.trim() || '500 GB SSD'
      },
      vendorId: vendorId || undefined,
      status,
      lastMaintenanceDate: lastMaintenanceDate || undefined,
      nextMaintenanceDate: nextMaintenanceDate || undefined,
      notes: notes.trim() || undefined
    };

    dbService.saveServer(server);
    if (onSave) onSave(server);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {initialServer ? 'Edit Server Configuration' : 'Deploy / Register Server'}
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

            <div>
              <label className="block text-slate-400 font-medium mb-1">Hostname / Server Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. reivernet-gw-edge01, db-prod-01"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Infrastructure Type</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#0b0e14] border border-[#232b3b]">
                {(['on-premises', 'cloud', 'hybrid'] as ServerType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-1 text-center font-medium rounded capitalize transition-colors ${
                      type === t
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'on-premises' ? 'On-Prem' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Internal IP Address *</label>
              <input
                type="text"
                required
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                placeholder="e.g. 10.200.0.1 or 192.168.1.10"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Public IP / DNS (Optional)</label>
              <input
                type="text"
                value={publicIp}
                onChange={e => setPublicIp(e.target.value)}
                placeholder="e.g. 194.72.108.45"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Server Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as ServerRole)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                {SERVER_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Operating System / Firmware</label>
              <input
                type="text"
                value={os}
                onChange={e => setOs(e.target.value)}
                placeholder="e.g. Ubuntu 24.04 LTS, Cisco IOS-XE, VMware ESXi 8"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Physical Location or Cloud Datacenter</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. HQ Server Room - Rack A1 (U22) or AWS us-east-1"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Associated Vendor / Provider</label>
              <select
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">None / Self-Managed</option>
                {db.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Operational Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ServerStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active (Production)</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="offline">Offline</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            {/* Hardware Specifications */}
            <div className="sm:col-span-2 pt-2 border-t border-[#1f2636]">
              <span className="block text-slate-400 font-medium mb-2 uppercase tracking-wider text-[11px]">
                Hardware / Compute Specs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={cpu}
                  onChange={e => setCpu(e.target.value)}
                  placeholder="CPU (e.g. 16 vCPU, Xeon Gold)"
                  className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                />
                <input
                  type="text"
                  value={ram}
                  onChange={e => setRam(e.target.value)}
                  placeholder="RAM (e.g. 64 GB ECC)"
                  className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                />
                <input
                  type="text"
                  value={storage}
                  onChange={e => setStorage(e.target.value)}
                  placeholder="Storage (e.g. 2TB NVMe)"
                  className="px-2.5 py-1.5 rounded bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
                />
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Last Maintenance Date</label>
              <input
                type="date"
                value={lastMaintenanceDate}
                onChange={e => setLastMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Next Maintenance Schedule</label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={e => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Technical Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ports configured, VLAN IDs, backup target policies..."
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
              Save Server Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
