import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  User, 
  Server, 
  Box, 
  AlertTriangle, 
  Phone, 
  Mail,
  ArrowRight
} from 'lucide-react';
import { AppDatabase, Vendor } from '../types';
import { performGlobalSearch, SearchMatch, sanitizePhoneNumber } from '../utils/alertEngine';

interface CommandPaletteProps {
  db: AppDatabase;
  isOpen: boolean;
  onClose: () => void;
  onSelectVendor: (vendor: Vendor) => void;
  onSelectTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  db,
  isOpen,
  onClose,
  onSelectVendor,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard listener for ⌘K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matches = performGlobalSearch(db, query);

  const handleSelectMatch = (match: SearchMatch) => {
    onClose();
    if (match.type === 'vendor') {
      onSelectVendor(match.item);
    } else if (match.type === 'contact') {
      onSelectVendor(match.item.vendor);
    } else if (match.type === 'server') {
      onSelectTab('servers');
    } else if (match.type === 'asset') {
      onSelectTab('assets');
    } else if (match.type === 'alert') {
      onSelectTab('alerts');
    }
  };

  const getMatchIcon = (type: SearchMatch['type']) => {
    switch (type) {
      case 'vendor':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'contact':
        return <User className="w-4 h-4 text-indigo-400" />;
      case 'server':
        return <Server className="w-4 h-4 text-sky-400" />;
      case 'asset':
        return <Box className="w-4 h-4 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-black/80">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0f131a] border border-[#232a39] shadow-2xl text-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f2636] bg-[#121721]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type anything (e.g. 'reivernet', 'marcus', '10.200', 'lic')..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1d2331] rounded text-slate-400 font-mono">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Search across all vendors, contact persons, phone numbers, servers, assets, and alerts.
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {matches.map(m => (
                <div
                  key={`${m.type}-${m.id}`}
                  onClick={() => handleSelectMatch(m)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#161c28] transition-colors cursor-pointer group text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-[#131722] border border-[#1f2738]">
                      {getMatchIcon(m.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {m.title}
                        </span>
                        {m.tag && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1c2230] text-slate-300">
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                        {m.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
