import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { PaymentRecord } from '../types/index.ts';
import { User, Phone, Mail, ShieldCheck, Calendar, CreditCard, Lock, Check, X } from 'lucide-react';

interface ProfilePageProps {
  onOpenPricing: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenPricing }) => {
  const { user, token, updateProfile, openAuthModal } = useAuth();
  const { toast } = useNotification();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Change password modal state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error('Error fetching payment history:', err);
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [token]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const res = await updateProfile({ fullName, phone });
    setUpdating(false);
    if (res.success) {
      toast('Profile updated successfully', 'success');
    } else {
      toast(res.error || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');

    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast('Password changed successfully', 'success');
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setChangePasswordError(err.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Account Profile & Billing
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, access status, subscription duration, and verified payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile Edit Form */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-5">
          <h3 className="font-display text-base font-bold text-white">Profile Information</h3>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Email address is permanently bound to your verified transactions.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setChangePasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setChangePasswordOpen(true);
                }}
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>

              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors cursor-pointer"
              >
                {updating ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Membership Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              Membership State
            </span>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-white font-mono">{user.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{user.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Initial Access:</span>
                <span className={user.hasInitialAccess ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {user.hasInitialAccess ? 'Activated' : 'Required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry:</span>
                <span className="font-mono text-slate-200">
                  {user.subscriptionExpiresAt
                    ? new Date(user.subscriptionExpiresAt).toLocaleDateString()
                    : 'Permanent Access'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quota:</span>
                <span className="font-mono text-slate-200">{user.analysesUsed} / {user.analysesLimit}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenPricing}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Upgrade or Renew Plan
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" />
          <h3 className="font-display text-base font-bold text-white">Payment & Billing History</h3>
        </div>

        {loadingPayments ? (
          <p className="text-xs text-slate-400 py-4">Loading transaction records...</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{p.id}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">{p.paymentType}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₦{p.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded font-sans ${
                          p.status === 'SUCCESSFUL'
                            ? 'bg-emerald-950 text-emerald-400'
                            : p.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{p.reference}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Change Account Password</h3>
                <p className="text-xs text-slate-400">Update your security credentials</p>
              </div>
            </div>

            {changePasswordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
