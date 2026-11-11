import React, { useState, useRef } from 'react';
import { X, Download, Upload, RotateCcw, Check, AlertCircle, HardDrive } from 'lucide-react';
import { AppDatabase } from '../types';
import { dbService } from '../utils/storage';

interface BackupModalProps {
  db: AppDatabase;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ db, onClose }) => {
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const json = dbService.exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linearit-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ text: 'Backup downloaded successfully.' });
    } catch (e: any) {
      setStatusMessage({ text: 'Export failed: ' + e.message, error: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = dbService.importBackupJson(content);
      if (res.success) {
        setStatusMessage({ text: 'Backup successfully restored.' });
      } else {
        setStatusMessage({ text: res.error || 'Restore failed', error: true });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset all inventory and vendor data to default template? Current custom entries will be replaced.')) {
      dbService.resetToDefaults();
      setStatusMessage({ text: 'Database restored to initial state.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80">
      <div className="relative w-full max-w-md rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Data & Offline Storage
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

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 ${
              statusMessage.error
                ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
            }`}>
              {statusMessage.error ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Counts Info */}
          <div className="p-3 rounded-lg bg-[#0c0f16] border border-[#1b2230] space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Vendors & Providers:</span>
              <span className="text-white">{db.vendors.length}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Servers & Hosts:</span>
              <span className="text-white">{db.servers.length}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tracked Assets:</span>
              <span className="text-white">{db.assets.length}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Active Alerts:</span>
              <span className="text-white">{db.alerts.length}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer shadow transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#161c28] hover:bg-[#1f2738] text-slate-200 border border-[#232c3f] font-medium cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Restore from JSON File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#141822] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#1e2536] hover:border-rose-800/40 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
