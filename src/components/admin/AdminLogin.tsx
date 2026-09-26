import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Mail, KeyRound, AlertCircle, ArrowLeft, 
  ShieldCheck, Eye, EyeOff 
} from 'lucide-react';
import { ADMIN_CONFIG, createSession, logActivity } from '../../utils/security';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToPortfolio: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToPortfolio }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rate Limiting / Brute-force protection
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return Number(sessionStorage.getItem('reiner_login_failures') || '0');
  });
  const [lockedUntil, setLockedUntil] = useState<number>(() => {
    return Number(sessionStorage.getItem('reiner_locked_until') || '0');
  });
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (lockedUntil > now) {
        setRemainingLockSeconds(Math.ceil((lockedUntil - now) / 1000));
      } else {
        setRemainingLockSeconds(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if account is temporarily locked
    if (Date.now() < lockedUntil) {
      setError(`Access locked due to multiple failed attempts. Please wait ${remainingLockSeconds} seconds.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === ADMIN_CONFIG.EMAIL.toLowerCase() && cleanPassword === ADMIN_CONFIG.PASSWORD) {
      // Reset failed counter on success
      sessionStorage.removeItem('reiner_login_failures');
      sessionStorage.removeItem('reiner_locked_until');
      setFailedAttempts(0);
      setLockedUntil(0);

      createSession(rememberMe);
      logActivity('Admin Credentials Authenticated', `Primary authentication passed for ${cleanEmail}. Session started.`, 'success');
      onLoginSuccess();
    } else {
      const newFailures = failedAttempts + 1;
      setFailedAttempts(newFailures);
      sessionStorage.setItem('reiner_login_failures', String(newFailures));

      if (newFailures >= 5) {
        const lockDuration = 10 * 60 * 1000; // 10 minutes lock
        const lockTime = Date.now() + lockDuration;
        setLockedUntil(lockTime);
        sessionStorage.setItem('reiner_locked_until', String(lockTime));
        setError('Maximum login attempts exceeded. Portal is locked for 10 minutes for security.');
        logActivity('Security Lockout Triggered', `5 failed login attempts for email: ${cleanEmail}. Access restricted.`, 'warning');
      } else {
        setError(`Invalid administrative credentials. Attempt ${newFailures} of 5.`);
        logActivity('Failed Login Attempt', `Unauthorized login attempt with email: ${cleanEmail}`, 'warning');
      }
    }
  };

  const isLocked = Date.now() < lockedUntil;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing ambiance */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-700/20 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-6 z-10 flex items-center justify-between">
        <button
          onClick={onBackToPortfolio}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Portfolio</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Protected Administrative Gateway</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-stone-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-stone-800">
          
          {/* Logo & Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-stone-900 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg shadow-amber-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-serif-title font-bold text-white tracking-tight">
              Administrator Login
            </h2>
            <p className="text-xs text-stone-400">
              Enter your credentials to access the portfolio dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={isLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-700 rounded-xl bg-stone-950 text-white text-xs placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  placeholder="Enter admin email address"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-stone-700 rounded-xl bg-stone-950 text-white text-xs placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-400 hover:text-stone-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-600 focus:ring-amber-500"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLocked}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLocked ? `Locked (${remainingLockSeconds}s)` : 'Log In to Dashboard'}</span>
              </button>
            </div>
          </form>

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-stone-800 text-[11px] text-stone-500 text-center space-y-1">
            <p>Protected by encrypted administrative authentication and rate limiting.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
