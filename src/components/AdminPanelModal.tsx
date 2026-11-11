import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Shield, 
  Building2, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  LogOut,
  Sliders,
  Lock
} from 'lucide-react';
import { AppDatabase, Property, PropertyBrand } from '../types';
import { dbService } from '../utils/storage';

interface AdminPanelModalProps {
  db: AppDatabase;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  db,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'properties' | 'security'>('password');
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // PIN state
  const [pinCode, setPinCode] = useState(db.adminSettings.pinCode || '1234');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Property addition state
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [propName, setPropName] = useState('');
  const [propCode, setPropCode] = useState('');
  const [propBrand, setPropBrand] = useState<PropertyBrand>('JW Marriott');
  const [propCity, setPropCity] = useState('');
  const [propItContact, setPropItContact] = useState('');
  const [propNotes, setPropNotes] = useState('');

  // Security toggle
  const [requireAuth, setRequireAuth] = useState(db.adminSettings.requireAuth ?? true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await dbService.updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password');
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode || pinCode.length < 4) {
      return;
    }
    dbService.updateAdminSettings({ pinCode });
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim() || !propCode.trim()) return;

    const newProp: Property = {
      id: `prop-${Date.now()}`,
      name: propName.trim(),
      code: propCode.trim().toUpperCase(),
      brand: propBrand,
      city: propCity.trim() || 'Headquarters',
      itContactName: propItContact.trim() || undefined,
      notes: propNotes.trim() || undefined,
    };

    dbService.saveProperty(newProp);
    setIsAddingProperty(false);
    setPropName('');
    setPropCode('');
    setPropCity('');
    setPropItContact('');
    setPropNotes('');
  };

  const handleDeleteProperty = (id: string, name: string) => {
    if (confirm(`Remove hotel property "${name}"? Existing servers & assets will need to be re-assigned.`)) {
      dbService.deleteProperty(id);
    }
  };

  const handleToggleAuth = (val: boolean) => {
    setRequireAuth(val);
    dbService.updateAdminSettings({ requireAuth: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0f131a] border border-[#222938] shadow-2xl text-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2636] bg-[#121721]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-700/40">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Admin Panel & Security Settings
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {db.adminSettings.adminDisplayName}
              </span>
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-[#1b2230] bg-[#0c0f16] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'password'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Password & PIN
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'properties'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Hotel Properties</span>
            <span className="px-1.5 py-0.2 rounded bg-[#1c2230] text-[10px] font-mono">
              {db.properties.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security Policy
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 text-xs max-h-[70vh] overflow-y-auto space-y-6">
          {/* TAB 1: PASSWORD & PIN */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="p-4 rounded-xl bg-[#121620] border border-[#1f2636] space-y-3">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Update Admin Password</span>
                </h3>

                {passwordSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Password updated successfully!</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer shadow transition-colors"
                    >
                      Save Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Set Quick 4-Digit Unlock PIN */}
              <div className="p-4 rounded-xl bg-[#121620] border border-[#1f2636] space-y-3">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Quick Unlock PIN (Mobile & Android)</span>
                </h3>

                {pinSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>PIN updated successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSavePin} className="flex items-center gap-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value)}
                    placeholder="1234"
                    className="w-32 px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1a202d] hover:bg-[#232d40] text-slate-200 border border-[#283447] font-medium cursor-pointer"
                  >
                    Save PIN
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: HOTEL PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    Managed Marriott Properties
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Assets, servers, and bills are scoped strictly to their respective property profile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingProperty(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Property</span>
                </button>
              </div>

              {/* Add Property Form Sub-layer */}
              {isAddingProperty && (
                <form onSubmit={handleSaveProperty} className="p-4 rounded-xl bg-[#0c0f16] border border-indigo-700/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f2738]">
                    <span className="font-semibold text-white">Add New Hotel Property</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingProperty(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Property Name *</label>
                      <input
                        type="text"
                        required
                        value={propName}
                        onChange={e => setPropName(e.target.value)}
                        placeholder="e.g. Courtyard by Marriott Airport"
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Property Code *</label>
                      <input
                        type="text"
                        required
                        value={propCode}
                        onChange={e => setPropCode(e.target.value)}
                        placeholder="e.g. CY-04"
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Brand</label>
                      <select
                        value={propBrand}
                        onChange={e => setPropBrand(e.target.value as PropertyBrand)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
                      >
                        <option value="JW Marriott">JW Marriott</option>
                        <option value="The Ritz-Carlton">The Ritz-Carlton</option>
                        <option value="Marriott Marquis">Marriott Marquis</option>
                        <option value="Courtyard by Marriott">Courtyard by Marriott</option>
                        <option value="Sheraton">Sheraton</option>
                        <option value="W Hotels">W Hotels</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium mb-1">City / Location</label>
                      <input
                        type="text"
                        value={propCity}
                        onChange={e => setPropCity(e.target.value)}
                        placeholder="e.g. London Heathrow"
                        className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-[#232b3b] text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProperty(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#19202c] text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      Create Property Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Property Cards List */}
              <div className="space-y-2">
                {db.properties.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-[#121620] border border-[#1f2636] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#18202d] text-indigo-400 border border-[#243044]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{p.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1c2230] text-slate-300">
                            {p.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.brand} • {p.city}
                        </div>
                      </div>
                    </div>

                    {db.properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProperty(p.id, p.name)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-[#1a212e] transition-colors cursor-pointer"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY POLICY & LOGOUT */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#121620] border border-[#1f2636] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Require Password on Open</span>
                    <span className="text-slate-400 text-[11px]">
                      When enabled, users must authenticate with password or PIN upon opening the app.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireAuth}
                    onChange={e => handleToggleAuth(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0b0e14] border-[#232b3b] text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock & Log Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
