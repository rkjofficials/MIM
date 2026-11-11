import React, { useState } from 'react';
import { Lock, KeyRound, Shield, ArrowRight, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';
import { dbService } from '../utils/storage';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const ok = await dbService.login(password);
      if (ok) {
        onSuccess();
      } else {
        setError('Incorrect password. Default access is "admin123".');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsSubmitting(true);
    setError(null);

    const ok = dbService.loginWithPin(pin);
    if (ok) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Default PIN is "1234".');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#080a0d] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-sm rounded-2xl bg-[#0e1218] border border-[#1e2533] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* App Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 items-center justify-center shadow-lg text-white font-mono font-bold text-lg">
            IT
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            LinearIT Portal
          </h1>
          <p className="text-xs text-slate-400">
            Multi-Property IT Operations & Vendor Portal
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#090c10] border border-[#1a212e] text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError(null);
            }}
            className={`py-1.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'password'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('pin');
              setError(null);
            }}
            className={`py-1.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'pin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Quick PIN</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Password Form */}
        {authMode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090d] border border-[#202735] text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <span>Authenticate Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* PIN Form */
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 text-center">
                4-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-[#07090d] border border-[#202735] text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <span>Unlock LinearIT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Quick Credentials Info Box */}
        <div className="p-3 rounded-xl bg-[#090c10] border border-[#1b2230] text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Default Password:</span>
            <span className="font-mono text-indigo-300">admin123</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Default Quick PIN:</span>
            <span className="font-mono text-indigo-300">1234</span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-[#1b2230]">
            Change credentials anytime via the Admin Panel.
          </p>
        </div>
      </div>
    </div>
  );
};
