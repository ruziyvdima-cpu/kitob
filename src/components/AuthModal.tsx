import React, { useState } from 'react';
import { X, Mail, Lock, User, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { translations } from '../utils/translations';

interface AuthModalProps {
  currentLang: 'uz' | 'ru' | 'en';
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  initialView?: 'login' | 'register' | 'admin';
}

export default function AuthModal({
  currentLang,
  onClose,
  onSuccess,
  initialView = 'login',
}: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'admin'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');

  const t = translations[currentLang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token temporarily so user can verify code
      localStorage.setItem('kitobx_token', data.token);
      setDevCode(data.devVerificationCode);
      setMessage(data.message);
      setView('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const token = localStorage.getItem('kitobx_token');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      onSuccess(token || '', data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      setDevCode(data.devResetCode);
      setMessage(data.message);
      setView('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage(data.message);
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Admin login relies on email and password in backend. Admin user has 'admin@kitobx.uz' as email.
    // So if user puts adminId = 'admin@kitobx.uz' and adminPassword = 'admin123KitobX!', it authenticates with standard login.
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminId, password: adminPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs" id="auth-modal-root">
      <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer"
          id="auth-modal-close-btn"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-md font-black tracking-tight text-slate-900">
            {view === 'login' && t.login}
            {view === 'register' && t.register}
            {view === 'verify' && t.verifyEmail}
            {view === 'forgot' && t.forgotPassword}
            {view === 'reset' && t.resetPassword}
            {view === 'admin' && t.adminLogin}
          </h2>
          <p className="mt-1 text-[10px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            {view === 'login' && t.tagline}
            {view === 'register' && 'Join KitobX for infinite digital reads'}
            {view === 'verify' && 'We sent a verification code to check your email'}
            {view === 'forgot' && 'Enter your email to request a reset code'}
            {view === 'reset' && 'Provide the code sent to your email to save a new password'}
            {view === 'admin' && 'Access administrative controls and statistics'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-3 rounded border border-rose-150 bg-rose-50 p-2 text-xs font-semibold text-rose-700" id="auth-error">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-3 rounded border border-emerald-150 bg-emerald-50 p-2 text-xs font-semibold text-emerald-700" id="auth-message">
            {message}
          </div>
        )}

        {/* Verification Code Hint in development */}
        {devCode && (
          <div className="mb-3 rounded border border-amber-250 bg-amber-50 p-2 text-[10px] font-bold text-amber-800">
            💡 Dev Simulation Email Sandbox: Code received is: <span className="font-mono text-xs underline">{devCode}</span>
          </div>
        )}

        {/* Forms */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.email}</label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">{t.password}</label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-8 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:bg-indigo-400 cursor-pointer shadow-xs"
            >
              {loading ? '...' : t.login}
            </button>

            <div className="text-center text-[10px] text-slate-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => setView('register')} className="font-bold text-indigo-600 hover:underline cursor-pointer">
                {t.register}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 text-center">
              <button
                type="button"
                onClick={() => setView('admin')}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                System Admin Access
              </button>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.fullName}</label>
              <div className="relative">
                <User className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ismoil Samani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.email}</label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.password}</label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-8 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:bg-indigo-400 cursor-pointer shadow-xs"
            >
              {loading ? '...' : t.register}
            </button>

            <div className="text-center text-[10px] text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={() => setView('login')} className="font-bold text-indigo-600 hover:underline cursor-pointer">
                {t.login}
              </button>
            </div>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.enterCode}</label>
              <div className="relative">
                <Key className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-center text-sm font-mono tracking-widest outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              {t.verifyButton}
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotRequest} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.email}</label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              {t.sendResetCode}
            </button>

            <div className="text-center text-[10px] text-slate-500">
              Remembered?{' '}
              <button type="button" onClick={() => setView('login')} className="font-bold text-indigo-600 hover:underline cursor-pointer">
                Back to {t.login}
              </button>
            </div>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.enterCode}</label>
              <div className="relative">
                <Key className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-center text-sm font-mono tracking-widest outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.newPassword}</label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              {t.savePassword}
            </button>
          </form>
        )}

        {view === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.adminId} (Email)</label>
              <div className="relative">
                <User className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@kitobx.uz"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.adminPassword}</label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="admin123KitobX!"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded border border-slate-200 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-indigo-500 bg-slate-50/35"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              {loading ? '...' : t.login}
            </button>

            <div className="text-center text-[10px] text-slate-500">
              <button type="button" onClick={() => setView('login')} className="font-bold text-indigo-600 hover:underline cursor-pointer">
                Back to Standard Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
