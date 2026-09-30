import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import {
  User,
  Match,
  PaymentRecord,
  SportsArticle,
  Advertisement,
  Announcement,
  SiteSettings,
  AdPlacement,
} from '../types/index.ts';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  Activity,
  Brain,
  Newspaper,
  Megaphone,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Plus,
  Trash2,
  Edit,
  Shield,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  X,
  Building2,
} from 'lucide-react';

interface AdminPageProps {
  setCurrentTab: (tab: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ setCurrentTab }) => {
  const { user, token, logout, openAuthModal } = useAuth();
  const { toast } = useNotification();

  const [activeSection, setActiveSection] = useState<
    | 'dashboard'
    | 'users'
    | 'payments'
    | 'subscriptions'
    | 'matches'
    | 'news'
    | 'ads'
    | 'announcements'
    | 'reports'
    | 'settings'
  >('dashboard');

  // Overview metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'>('ALL');
  const [receiptModalPayment, setReceiptModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [matchesList, setMatchesList] = useState<Match[]>([]);
  const [newsList, setNewsList] = useState<SportsArticle[]>([]);
  const [adsList, setAdsList] = useState<Advertisement[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [reportsData, setReportsData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Forms / creation modal states
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchForm, setMatchForm] = useState({
    homeTeam: '',
    awayTeam: '',
    sport: 'Football',
    competition: 'Premier League',
    status: 'UPCOMING',
    code: '',
    venue: '',
  });

  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'Football',
    summary: '',
    content: '',
    author: 'MatchSense Editorial Staff',
  });

  const [showAdModal, setShowAdModal] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    linkUrl: '',
    placement: 'HOMEPAGE' as AdPlacement,
  });

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'ALERT',
  });

  // Guard: Admin role required
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-blue-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white">Administrator Portal</h2>
        <p className="text-xs text-slate-400">
          Please sign in with your administrator account (<strong className="text-slate-200">idowuadeola171@gmail.com</strong>) to access the MatchSense AI Admin Console.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white cursor-pointer transition-colors shadow-lg"
          >
            Sign In as Administrator
          </button>
          <button
            onClick={() => setCurrentTab('home')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">
          This portal requires administrator role authorization. Your currently signed in account ({user.email}) does not have admin permissions.
        </p>
        <button
          onClick={() => setCurrentTab('home')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white cursor-pointer"
        >
          Return to Platform
        </button>
      </div>
    );
  }

  // Load section data
  const loadSectionData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeSection === 'dashboard') {
        const res = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        }
      } else if (activeSection === 'users') {
        const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } else if (activeSection === 'payments') {
        const res = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setPaymentsList(data.payments || []);
        }
      } else if (activeSection === 'subscriptions' || activeSection === 'settings') {
        const res = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setSiteSettings(data.settings);
        }
      } else if (activeSection === 'matches') {
        const res = await fetch('/api/admin/matches', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setMatchesList(data.matches || []);
        }
      } else if (activeSection === 'news') {
        const res = await fetch('/api/admin/news', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setNewsList(data.news || []);
        }
      } else if (activeSection === 'ads') {
        const res = await fetch('/api/admin/ads', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAdsList(data.ads || []);
        }
      } else if (activeSection === 'announcements') {
        const res = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAnnouncementsList(data.announcements || []);
        }
      } else if (activeSection === 'reports') {
        const res = await fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setReportsData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load admin section data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectionData();
  }, [activeSection, token]);

  // Actions
  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast(`User status updated to ${newStatus}`, 'success');
        loadSectionData();
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to update user', 'error');
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to mark this payment as refunded?')) return;
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast('Payment marked as refunded', 'success');
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve payment.');
      }
      toast('Payment approved successfully! User account activated and notified.', 'success');
      loadSectionData();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPayment = async (paymentId: string, reason: string) => {
    setActionLoadingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject payment.');
      }
      toast('Payment marked as rejected. User account remains inactive and was notified.', 'info');
      setRejectModalPayment(null);
      setRejectReason('');
      loadSectionData();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(matchForm),
      });
      if (res.ok) {
        toast('New fixture added successfully', 'success');
        setShowMatchModal(false);
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Delete this match fixture?')) return;
    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast('Match removed', 'info');
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newsForm),
      });
      if (res.ok) {
        toast('Article published', 'success');
        setShowNewsModal(false);
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete this sports article?')) return;
    try {
      await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast('Article deleted', 'info');
      loadSectionData();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(adForm),
      });
      if (res.ok) {
        toast('Advertisement created', 'success');
        setShowAdModal(false);
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(annForm),
      });
      if (res.ok) {
        toast('Announcement broadcasted', 'success');
        setShowAnnModal(false);
        loadSectionData();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(siteSettings),
      });
      if (res.ok) {
        toast('Platform settings saved successfully', 'success');
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="font-display text-2xl font-bold text-white">
              MatchSense AI Administration Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete platform management: users, pricing, matches, ads, news, and financial telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('home')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            Go to User Site
          </button>
          <button
            onClick={() => {
              logout();
              setCurrentTab('home');
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Admin Layout: Navigation Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1 text-xs font-medium">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'dashboard' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'users' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button
            onClick={() => setActiveSection('payments')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'payments' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>Payment Verification</span>
            </div>
            {paymentsList.filter((p) => p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                {paymentsList.filter((p) => p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('subscriptions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'subscriptions' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" /> Subscriptions & Pricing
          </button>

          <button
            onClick={() => setActiveSection('matches')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'matches' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Match Management
          </button>

          <button
            onClick={() => setActiveSection('news')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'news' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" /> Sports News & Articles
          </button>

          <button
            onClick={() => setActiveSection('ads')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'ads' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Advertisements
          </button>

          <button
            onClick={() => setActiveSection('announcements')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'announcements' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" /> Announcements
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'reports' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Reports & Analytics
          </button>

          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === 'settings' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Platform Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* SECTION 1: OVERVIEW DASHBOARD */}
          {activeSection === 'dashboard' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Users</span>
                  <span className="text-xl font-bold font-mono text-white block">{metrics.totalUsers}</span>
                  <span className="text-[10px] text-emerald-400">{metrics.activeUsers} Active</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Premium Users</span>
                  <span className="text-xl font-bold font-mono text-blue-400 block">{metrics.premiumUsers}</span>
                  <span className="text-[10px] text-slate-500">Active Subscriptions</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Revenue</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 block">
                    ₦{metrics.totalRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">{metrics.successfulPayments} Successful</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Analyses Run</span>
                  <span className="text-xl font-bold font-mono text-purple-400 block">
                    {metrics.totalAnalyses}
                  </span>
                  <span className="text-[10px] text-slate-500">{metrics.liveMatches} Live Fixtures</span>
                </div>
              </div>

              {/* Revenue & Payment Health */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
                <h3 className="font-display text-sm font-bold text-white">Payment Health Breakdown</h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40">
                    <span className="text-emerald-400 font-bold font-mono text-lg block">
                      {metrics.successfulPayments}
                    </span>
                    <span className="text-[11px] text-slate-400">Successful</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40">
                    <span className="text-amber-400 font-bold font-mono text-lg block">
                      {metrics.pendingPayments}
                    </span>
                    <span className="text-[11px] text-slate-400">Pending</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40">
                    <span className="text-rose-400 font-bold font-mono text-lg block">
                      {metrics.failedPayments}
                    </span>
                    <span className="text-[11px] text-slate-400">Failed / Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: USER MANAGEMENT */}
          {activeSection === 'users' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">Registered Users ({usersList.length})</h3>
                <span className="text-[11px] text-slate-400">Password hashes never exposed</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Analyses</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">{u.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-400">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-bold ${u.role === 'ADMIN' ? 'bg-emerald-950 text-emerald-400' : 'text-slate-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-blue-400 font-sans">{u.subscriptionPlan}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-bold ${u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{u.analysesUsed}/{u.analysesLimit}</td>
                        <td className="py-2.5 px-3 text-right font-sans space-x-1">
                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUserStatusChange(u.id, 'SUSPENDED')}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserStatusChange(u.id, 'ACTIVE')}
                              className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-[10px] cursor-pointer"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: PAYMENT VERIFICATION */}
          {activeSection === 'payments' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-6">
              {/* Header & Status Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Payment Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review and verify direct bank transfers made to SmartCash account: <strong>9020714762</strong>.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setPaymentStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      paymentStatusFilter === 'ALL'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({paymentsList.length})
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('PENDING_VERIFICATION')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      paymentStatusFilter === 'PENDING_VERIFICATION'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                  >
                    <span>Pending</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 font-mono">
                      {paymentsList.filter((p) => p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('APPROVED')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      paymentStatusFilter === 'APPROVED'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-emerald-400/80 hover:text-emerald-300'
                    }`}
                  >
                    Approved ({paymentsList.filter((p) => p.status === 'APPROVED' || p.status === 'SUCCESSFUL').length})
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('REJECTED')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      paymentStatusFilter === 'REJECTED'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-rose-400/80 hover:text-rose-300'
                    }`}
                  >
                    Rejected ({paymentsList.filter((p) => p.status === 'REJECTED' || p.status === 'FAILED').length})
                  </button>
                </div>
              </div>

              {/* Payment Verification Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3">User Details</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Selected Plan</th>
                      <th className="py-3 px-3">Amount Paid</th>
                      <th className="py-3 px-3">Transaction ID</th>
                      <th className="py-3 px-3">Submission Date</th>
                      <th className="py-3 px-3">Payment Evidence</th>
                      <th className="py-3 px-3">Verification Status</th>
                      <th className="py-3 px-3 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                    {paymentsList
                      .filter((p) => {
                        if (paymentStatusFilter === 'ALL') return true;
                        if (paymentStatusFilter === 'PENDING_VERIFICATION') {
                          return p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING';
                        }
                        if (paymentStatusFilter === 'APPROVED') {
                          return p.status === 'APPROVED' || p.status === 'SUCCESSFUL';
                        }
                        if (paymentStatusFilter === 'REJECTED') {
                          return p.status === 'REJECTED' || p.status === 'FAILED';
                        }
                        return true;
                      })
                      .map((p) => {
                        const isPending = p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING';
                        const isApproved = p.status === 'APPROVED' || p.status === 'SUCCESSFUL';
                        const isRejected = p.status === 'REJECTED' || p.status === 'FAILED';

                        return (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                            {/* User Name */}
                            <td className="py-3 px-3">
                              <span className="font-semibold text-white block">{p.userName}</span>
                              {p.payerName && p.payerName !== p.userName && (
                                <span className="text-[10px] text-slate-400 block">
                                  Payer: {p.payerName}
                                </span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {p.userEmail}
                            </td>

                            {/* Selected Plan */}
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  p.paymentType === 'PREMIUM_SUBSCRIPTION'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                                }`}
                              >
                                {p.paymentType === 'PREMIUM_SUBSCRIPTION'
                                  ? 'Premium Subscription'
                                  : 'Standard Access'}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                              ₦{p.amount.toLocaleString()}
                            </td>

                            {/* Payment Reference */}
                            <td className="py-3 px-3 font-mono text-slate-200">
                              <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] select-all">
                                {p.reference}
                              </span>
                            </td>

                            {/* Date Submitted */}
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {p.dateOfPayment || new Date(p.createdAt).toLocaleDateString()}
                            </td>

                            {/* Receipt */}
                            <td className="py-3 px-3">
                              {p.receiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setReceiptModalPayment(p)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">No receipt attached</span>
                              )}
                            </td>

                            {/* Current Status */}
                            <td className="py-3 px-3">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                                  <Clock className="w-3 h-3" />
                                  Pending Verification
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Approved
                                </span>
                              )}
                              {isRejected && (
                                <span
                                  title={p.rejectionReason}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 cursor-help"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Rejected
                                </span>
                              )}
                              {p.status === 'REFUNDED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                                  Refunded
                                </span>
                              )}
                            </td>

                            {/* Verification Actions */}
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    disabled={actionLoadingId === p.id}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-[11px] transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve Payment</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectModalPayment(p);
                                      setRejectReason('');
                                    }}
                                    disabled={actionLoadingId === p.id}
                                    className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-semibold text-[11px] transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject Payment</span>
                                  </button>
                                </>
                              ) : isApproved ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-[11px] text-emerald-400 font-medium">✓ Verified Active</span>
                                  <button
                                    onClick={() => handleRefundPayment(p.id)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] cursor-pointer"
                                  >
                                    Refund
                                  </button>
                                </div>
                              ) : isRejected ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-[11px] text-rose-400 font-medium">Rejected</span>
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] cursor-pointer"
                                  >
                                    Re-Approve
                                  </button>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {paymentsList.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">No payment verification submissions yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: SUBSCRIPTION & PRICING CONFIGURATION */}
          {(activeSection === 'subscriptions' || activeSection === 'settings') && siteSettings && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">
                  {activeSection === 'subscriptions' ? 'Subscription & Pricing Engine' : 'Platform & Security Settings'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic database configuration. Adjust pricing without code modification.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Initial Access Price (₦)
                    </label>
                    <input
                      type="number"
                      value={siteSettings.initialAccessPrice}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, initialAccessPrice: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500">Default: ₦500 one-time activation.</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Premium Monthly Price (₦)
                    </label>
                    <input
                      type="number"
                      value={siteSettings.premiumMonthlyPrice}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, premiumMonthlyPrice: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500">Default: ₦1,000 per month.</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Initial Access AI Quota
                    </label>
                    <input
                      type="number"
                      value={siteSettings.initialAccessAnalysesQuota}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          initialAccessAnalysesQuota: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Premium Monthly AI Quota
                    </label>
                    <input
                      type="number"
                      value={siteSettings.premiumAnalysesQuota}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          premiumAnalysesQuota: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Website Name
                    </label>
                    <input
                      type="text"
                      value={siteSettings.websiteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, websiteName: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={siteSettings.contactEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      SmartCash Account Name
                    </label>
                    <input
                      type="text"
                      value={siteSettings.payoutAccountName || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, payoutAccountName: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      placeholder="Idowu Joseph Adeola"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Payment Provider / Bank
                    </label>
                    <input
                      type="text"
                      value={siteSettings.payoutBankName || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, payoutBankName: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      placeholder="SmartCash"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      SmartCash Account Number (Visible to Users)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.payoutAccountNumber || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, payoutAccountNumber: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold"
                      placeholder="9020714762"
                    />
                    <span className="text-[10px] text-slate-500">
                      Users see this account to transfer payments directly.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={siteSettings.maintenanceMode}
                      onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="maintenanceMode" className="text-slate-300 cursor-pointer">
                      Maintenance Mode (Emergency Toggle)
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white cursor-pointer"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 5: MATCH MANAGEMENT */}
          {activeSection === 'matches' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">Fixtures & Live Telemetry ({matchesList.length})</h3>
                <button
                  onClick={() => setShowMatchModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Match</span>
                </button>
              </div>

              <div className="space-y-3">
                {matchesList.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                        <span className="text-blue-400 font-semibold">{m.competition}</span>
                        <span>·</span>
                        <span className="font-mono">{m.code}</span>
                        <span>·</span>
                        <span className="font-bold text-emerald-400">{m.status}</span>
                      </div>
                      <div className="font-semibold text-white">
                        {m.homeTeam} {m.homeScore} - {m.awayScore} {m.awayTeam}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="p-1.5 rounded hover:bg-rose-950 text-rose-400 cursor-pointer"
                      title="Delete fixture"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Match Modal */}
              {showMatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                  <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 w-full max-w-md space-y-4">
                    <h4 className="font-display text-base font-bold text-white">Add New Fixture</h4>
                    <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300">Home Team</label>
                        <input
                          type="text"
                          required
                          value={matchForm.homeTeam}
                          onChange={(e) => setMatchForm({ ...matchForm, homeTeam: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Away Team</label>
                        <input
                          type="text"
                          required
                          value={matchForm.awayTeam}
                          onChange={(e) => setMatchForm({ ...matchForm, awayTeam: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-300">Competition</label>
                          <input
                            type="text"
                            value={matchForm.competition}
                            onChange={(e) => setMatchForm({ ...matchForm, competition: e.target.value })}
                            className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300">Code (e.g. EPL-ARS-MCI)</label>
                          <input
                            type="text"
                            value={matchForm.code}
                            onChange={(e) => setMatchForm({ ...matchForm, code: e.target.value })}
                            className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowMatchModal(false)}
                          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold"
                        >
                          Save Match
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: SPORTS NEWS ADMIN */}
          {activeSection === 'news' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">Articles & Quantitative Research</h3>
                <button
                  onClick={() => setShowNewsModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Article</span>
                </button>
              </div>

              <div className="space-y-3">
                {newsList.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-blue-400 font-semibold">{a.category}</span>
                      <h4 className="font-semibold text-white">{a.title}</h4>
                      <span className="text-[10px] text-slate-400">{a.author}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNews(a.id)}
                      className="p-1.5 rounded hover:bg-rose-950 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add News Modal */}
              {showNewsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                  <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                    <h4 className="font-display text-base font-bold text-white">Publish Research Article</h4>
                    <form onSubmit={handleCreateNews} className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300">Article Title</label>
                        <input
                          type="text"
                          required
                          value={newsForm.title}
                          onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Category</label>
                        <select
                          value={newsForm.category}
                          onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="Football">Football</option>
                          <option value="Basketball">Basketball</option>
                          <option value="Tennis">Tennis</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-300">Summary</label>
                        <textarea
                          rows={2}
                          required
                          value={newsForm.summary}
                          onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Full Content</label>
                        <textarea
                          rows={5}
                          required
                          value={newsForm.content}
                          onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowNewsModal(false)}
                          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold"
                        >
                          Publish
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: ADVERTISEMENTS */}
          {activeSection === 'ads' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">Sponsorship & Advertisements</h3>
                <button
                  onClick={() => setShowAdModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ad</span>
                </button>
              </div>

              <div className="space-y-3">
                {adsList.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-emerald-400 font-semibold">{ad.placement}</span>
                      <h4 className="font-semibold text-white">{ad.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Clicks: {ad.clicks} · Link: {ad.linkUrl}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-800">
                      {ad.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Ad Modal */}
              {showAdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                  <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 w-full max-w-md space-y-4">
                    <h4 className="font-display text-base font-bold text-white">Add Advertisement</h4>
                    <form onSubmit={handleCreateAd} className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300">Title</label>
                        <input
                          type="text"
                          required
                          value={adForm.title}
                          onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Target URL</label>
                        <input
                          type="text"
                          required
                          value={adForm.linkUrl}
                          onChange={(e) => setAdForm({ ...adForm, linkUrl: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Placement Slot</label>
                        <select
                          value={adForm.placement}
                          onChange={(e) => setAdForm({ ...adForm, placement: e.target.value as AdPlacement })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="HOMEPAGE">HOMEPAGE</option>
                          <option value="DASHBOARD">DASHBOARD</option>
                          <option value="NEWS">NEWS</option>
                          <option value="MATCH_PAGES">MATCH_PAGES</option>
                          <option value="ANALYSIS_PAGES">ANALYSIS_PAGES</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAdModal(false)}
                          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 8: ANNOUNCEMENTS */}
          {activeSection === 'announcements' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display text-base font-bold text-white">Platform Announcements</h3>
                <button
                  onClick={() => setShowAnnModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Announcement</span>
                </button>
              </div>

              <div className="space-y-3">
                {announcementsList.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold">{ann.type}</span>
                      <h4 className="font-semibold text-white">{ann.title}</h4>
                      <p className="text-[11px] text-slate-400">{ann.message}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950">
                      LIVE
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Announcement Modal */}
              {showAnnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                  <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 w-full max-w-md space-y-4">
                    <h4 className="font-display text-base font-bold text-white">Broadcast Announcement</h4>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300">Title</label>
                        <input
                          type="text"
                          required
                          value={annForm.title}
                          onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300">Message</label>
                        <textarea
                          rows={3}
                          required
                          value={annForm.message}
                          onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAnnModal(false)}
                          className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold"
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 9: REPORTS & CHARTS */}
          {activeSection === 'reports' && reportsData && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-6">
              <div>
                <h3 className="font-display text-base font-bold text-white">Quantitative Platform Analytics</h3>
                <p className="text-xs text-slate-400">7-day historical telemetry across revenue, registrations, and model queries.</p>
              </div>

              {/* Visual mini-bar chart representation */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <span className="text-xs font-semibold text-slate-300 block">Daily Revenue Telemetry (₦)</span>
                <div className="flex items-end gap-3 h-36 pt-4 px-2">
                  {reportsData.dailyMetrics?.map((m: any, i: number) => {
                    const heightPct = Math.min(100, Math.max(15, (m.revenue / 10000) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono text-emerald-400">₦{m.revenue}</span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full rounded-t bg-emerald-600 hover:bg-emerald-500 transition-all"
                        />
                        <span className="text-[10px] text-slate-400 truncate max-w-[45px]">{m.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-slate-800 text-slate-400 font-sans">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Daily Revenue</th>
                      <th className="py-2 px-3">Registrations</th>
                      <th className="py-2 px-3">AI Model Queries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {reportsData.dailyMetrics?.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-sans text-slate-200">{row.date}</td>
                        <td className="py-2 px-3 text-emerald-400">₦{row.revenue.toLocaleString()}</td>
                        <td className="py-2 px-3">{row.registrations}</td>
                        <td className="py-2 px-3 text-blue-400">{row.analyses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 10: PLATFORM & API SETTINGS */}
          {activeSection === 'settings' && siteSettings && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="font-display text-lg font-bold text-white">Platform & API Configuration</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure live football data providers, official payment account details, and membership pricing.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                {/* 1. API-Football Configuration Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold font-mono">
                        AF
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">API-Football Integration</h4>
                        <span className="text-[10px] text-slate-400">Official Provider: https://www.api-football.com/</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      Live Football Feed
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      API-Football Application Key (x-apisports-key or RapidAPI Key)
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your API-Football key here (e.g. 7f3b...)"
                      value={siteSettings.apiFootballKey || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, apiFootballKey: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                      <p>
                        • Keys are securely stored in the server environment and never sent to frontend JavaScript.
                      </p>
                      <p>
                        • Get an API key at{' '}
                        <a
                          href="https://www.api-football.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          https://www.api-football.com/
                        </a>.
                      </p>
                      <p>
                        • Automatic server caching prevents rate limits and duplicate requests.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Official Payment Account Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h4 className="font-semibold text-white text-sm pb-2 border-b border-slate-800">
                    Official Payment Transfer Destination
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-300 block mb-1">Payment Provider</label>
                      <input
                        type="text"
                        value={siteSettings.payoutBankName}
                        onChange={(e) => setSiteSettings({ ...siteSettings, payoutBankName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Account Name</label>
                      <input
                        type="text"
                        value={siteSettings.payoutAccountName}
                        onChange={(e) => setSiteSettings({ ...siteSettings, payoutAccountName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Account Number</label>
                      <input
                        type="text"
                        value={siteSettings.payoutAccountNumber}
                        onChange={(e) => setSiteSettings({ ...siteSettings, payoutAccountNumber: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Subscription Pricing */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h4 className="font-semibold text-white text-sm pb-2 border-b border-slate-800">
                    Subscription Pricing
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 block mb-1">Standard Access Price (₦)</label>
                      <input
                        type="number"
                        value={siteSettings.initialAccessPrice}
                        onChange={(e) => setSiteSettings({ ...siteSettings, initialAccessPrice: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Premium Subscription Monthly (₦)</label>
                      <input
                        type="number"
                        value={siteSettings.premiumMonthlyPrice}
                        onChange={(e) => setSiteSettings({ ...siteSettings, premiumMonthlyPrice: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors cursor-pointer shadow-lg"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-display text-base font-bold text-white">Payment Receipt</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Ref: {receiptModalPayment.reference} • ₦{receiptModalPayment.amount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReceiptModalPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-slate-950 p-2 flex items-center justify-center border border-slate-800">
              {receiptModalPayment.receiptUrl?.startsWith('data:image') ||
              receiptModalPayment.receiptUrl?.endsWith('.png') ||
              receiptModalPayment.receiptUrl?.endsWith('.jpg') ? (
                <img
                  src={receiptModalPayment.receiptUrl}
                  alt="Payment Receipt"
                  className="max-w-full max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    {receiptModalPayment.receiptFileName || 'Document Receipt'}
                  </p>
                  {receiptModalPayment.receiptUrl && (
                    <a
                      href={receiptModalPayment.receiptUrl}
                      download={receiptModalPayment.receiptFileName || 'receipt.pdf'}
                      className="inline-block px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer mt-2"
                    >
                      Download Document
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Payer: <strong className="text-slate-200">{receiptModalPayment.payerName || receiptModalPayment.userName}</strong></span>
              <span>Date: <strong className="text-slate-200">{receiptModalPayment.dateOfPayment}</strong></span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setReceiptModalPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT CONFIRMATION MODAL */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#0F172A] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-white">Reject Payment Verification</h4>
                <p className="text-xs text-slate-400">
                  User: {rejectModalPayment.userName} ({rejectModalPayment.userEmail})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting this payment will keep the user account <strong>inactive</strong> and notify them with your explanation so they can submit a corrected record.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">
                Rejection Reason (Visible to user)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction reference not found on SmartCash statement. Please verify exact amount transferred and provide receipt."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalPayment(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectPayment(rejectModalPayment.id, rejectReason)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white transition-colors cursor-pointer shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
