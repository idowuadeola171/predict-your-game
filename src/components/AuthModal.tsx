import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { X, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onAuthSuccess?: (status: string, role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, user } = useAuth();
  const { toast } = useNotification();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    if (authModalMode === 'login') {
      const res = await login(email, password);
      setSubmitting(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to log in');
      } else {
        toast('Logged in successfully', 'success');
        // Check fresh user status for routing
        try {
          const token = localStorage.getItem('matchsense_token');
          if (token) {
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (onAuthSuccess) {
                onAuthSuccess(meData.user.status, meData.user.role);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    } else if (authModalMode === 'register') {
      if (password !== confirmPassword) {
        setSubmitting(false);
        setErrorMessage('Passwords do not match');
        return;
      }
      const res = await register({ fullName, email, phone, password, confirmPassword });
      setSubmitting(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed');
      } else {
        toast('Account created successfully. Please activate your access.', 'success');
        try {
          const token = localStorage.getItem('matchsense_token');
          if (token) {
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (onAuthSuccess) {
                onAuthSuccess(meData.user.status, meData.user.role);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    } else if (authModalMode === 'forgot') {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setSubmitting(false);
        setForgotSubmitted(true);
        toast('Password reset dispatched', 'info');
      } catch (err: any) {
        setSubmitting(false);
        setErrorMessage(err.message || 'Error requesting reset');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] p-6 sm:p-7 shadow-2xl text-slate-100">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold font-mono">
            MS
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight text-white">
            {authModalMode === 'login' && 'Sign in to MatchSense AI'}
            {authModalMode === 'register' && 'Create your Account'}
            {authModalMode === 'forgot' && 'Reset your Password'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {authModalMode === 'login' && 'Enter your credentials to access your sports intelligence dashboard.'}
            {authModalMode === 'register' && 'Register to activate MatchSense AI statistical analysis.'}
            {authModalMode === 'forgot' && 'Enter your registered email address to receive password reset instructions.'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        {forgotSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Reset Request Dispatched</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an account with <span className="text-slate-200">{email}</span> exists, secure password reset instructions have been sent.
            </p>
            <button
              onClick={() => {
                setForgotSubmitted(false);
                openAuthModal('login');
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. David Alaba"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                />
              </div>
            </div>

            {authModalMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  {authModalMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => openAuthModal('forgot')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {authModalMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {authModalMode === 'login' && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer shadow-md"
            >
              {submitting
                ? 'Processing...'
                : authModalMode === 'login'
                ? 'Sign In'
                : authModalMode === 'register'
                ? 'Create Account'
                : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        {/* Mode Toggle Footer */}
        <div className="mt-4 pt-3 text-center text-xs text-slate-400 border-t border-slate-800/80">
          {authModalMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
