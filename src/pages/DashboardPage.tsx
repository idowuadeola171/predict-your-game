import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Match, AnalysisRecord, SportsArticle, Announcement } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import {
  User,
  Crown,
  Activity,
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
  onSelectMatchToAnalyze: (match: Match) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setCurrentTab,
  onSelectMatchToAnalyze,
}) => {
  const { user, token, openAuthModal, refreshUser } = useAuth();
  const [activationPaymentOpen, setActivationPaymentOpen] = useState(false);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const [recentNews, setRecentNews] = useState<SportsArticle[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [mRes, nRes, annRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/news'),
          fetch('/api/announcements'),
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          const all: Match[] = mData.matches || [];
          setFeaturedMatches(all.filter((m) => m.isFeatured));
          setLiveMatches(all.filter((m) => m.status === 'LIVE'));
        }

        if (nRes.ok) {
          const nData = await nRes.json();
          setRecentNews((nData.articles || []).slice(0, 3));
        }

        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData.announcements || []);
        }

        if (token) {
          const aRes = await fetch('/api/analyses/history', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (aRes.ok) {
            const aData = await aRes.json();
            setRecentAnalyses((aData.analyses || []).slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Dashboard Access</h2>
        <p className="text-xs text-slate-400">Please log in to view your sports intelligence dashboard.</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Handle Suspended Account State
  if (user.status === 'SUSPENDED') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Account Suspended</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your MatchSense AI account has been suspended by the platform administrator. For inquiries, please reach out to support.
        </p>
      </div>
    );
  }

  // Handle Unpaid / Pending Payment State
  if (!user.hasInitialAccess && user.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Account Status: Payment Required
          </span>
          <h2 className="font-display text-3xl font-bold text-white">
            Activate Your MatchSense AI Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Your account has been registered, but access is not yet activated. Complete the one-time <strong>₦500 Initial Access</strong> payment to unlock standard analytics and telemetry.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] text-left text-xs space-y-3 max-w-md mx-auto">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Activation Fee:</span>
            <span className="text-lg font-bold font-mono text-emerald-400">₦500</span>
          </div>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Standard Dashboard & live match telemetry</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>20 statistical analysis requests</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Historical sports database access</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActivationPaymentOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay ₦500 to Activate Now</span>
          </button>
          <button
            onClick={() => setCurrentTab('pricing')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            View All Plans
          </button>
        </div>

        <PaymentModal
          isOpen={activationPaymentOpen}
          onClose={() => setActivationPaymentOpen(false)}
          paymentType="INITIAL_ACCESS"
          amount={500}
          planName="Initial Platform Access"
          onSuccess={async () => {
            await refreshUser();
            setActivationPaymentOpen(false);
          }}
        />
      </div>
    );
  }

  // Handle Expired Subscription State
  if (user.status === 'EXPIRED' && user.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Subscription Expired</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Your Premium subscription has expired. Please renew your subscription to resume high-volume analyses and priority live features.
        </p>
        <button
          onClick={() => setCurrentTab('pricing')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white cursor-pointer"
        >
          Renew Subscription (₦1,000/mo)
        </button>
      </div>
    );
  }

  const remainingQuota = Math.max(0, user.analysesLimit - user.analysesUsed);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Active Announcement Alerts */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-xl border border-blue-900/60 bg-blue-950/30 flex items-start gap-3 text-xs text-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white mr-1.5">{announcements[0].title}:</span>
            {announcements[0].message}
          </div>
        </div>
      )}

      {/* Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics overview and sports intelligence workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('analyst')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Brain className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
          <button
            onClick={() => setCurrentTab('pricing')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            Manage Plan
          </button>
        </div>
      </div>

      {/* 7 Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Account Status */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Status</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block truncate">
            {user.status}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {user.hasInitialAccess ? 'Access Active' : 'Unactivated'}
          </span>
        </div>

        {/* 2. Subscription */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Subscription</span>
          <span className="text-sm font-bold font-mono text-blue-400 block truncate">
            {user.subscriptionPlan}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">Plan Level</span>
        </div>

        {/* 3. Subscription Expiry */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Expiry</span>
          <span className="text-sm font-bold font-mono text-slate-200 block truncate">
            {user.subscriptionExpiresAt
              ? new Date(user.subscriptionExpiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : 'Permanent'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {user.subscriptionExpiresAt ? 'Renewal date' : 'One-time tier'}
          </span>
        </div>

        {/* 4. Analyses Used */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">AI Used</span>
          <span className="text-sm font-bold font-mono text-white block">
            {user.analysesUsed}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">Total runs</span>
        </div>

        {/* 5. Remaining Analysis Requests */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Remaining</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block">
            {remainingQuota}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">Of {user.analysesLimit} total</span>
        </div>

        {/* 6. Live Matches */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Live Matches</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {liveMatches.length}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">In play right now</span>
        </div>

        {/* 7. Recent Analyses */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">History</span>
          <span className="text-sm font-bold font-mono text-purple-400 block">
            {recentAnalyses.length}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">Saved reports</span>
        </div>
      </div>

      {/* Ad slot for Dashboard */}
      <AdBanner placement="DASHBOARD" />

      {/* Main Grid: Live & Featured Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Matches & Featured */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Matches Widget */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-white">Live Matches Now</h3>
              </div>
              <button
                onClick={() => setCurrentTab('live')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                View Match Center
              </button>
            </div>

            {liveMatches.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No live matches in progress right now.</p>
            ) : (
              <div className="space-y-2.5">
                {liveMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setCurrentTab('live')}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                        <span className="text-blue-400 font-semibold">{m.competition}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-mono font-semibold">{m.matchTime}</span>
                      </div>
                      <div className="font-semibold text-slate-200">
                        {m.homeTeam} vs {m.awayTeam}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-white block">
                        {m.homeScore} - {m.awayScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.statistics?.possessionHome ? `Poss: ${m.statistics.possessionHome}%` : (m.matchTime || 'Live')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured Matches */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-display text-sm font-bold text-white">Featured Statistical Fixtures</h3>
              </div>
              <button
                onClick={() => setCurrentTab('live')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                All Fixtures
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{m.competition}</span>
                      <span className="font-mono">{m.code}</span>
                    </div>
                    <div className="font-semibold text-white text-sm">
                      {m.homeTeam} vs {m.awayTeam}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {m.h2hSummary || 'Historical competitive records available.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {m.status === 'LIVE' ? m.matchTime : new Date(m.startTime).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onSelectMatchToAnalyze(m)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Run Model
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Analyses & News */}
        <div className="space-y-6">
          {/* Recent Analyses Widget */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <h3 className="font-display text-sm font-bold text-white">Recent Analyses</h3>
              </div>
              <button
                onClick={() => setCurrentTab('my-analyses')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                View History
              </button>
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 space-y-2">
                <p>No analyses run yet.</p>
                <button
                  onClick={() => setCurrentTab('analyst')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Start First Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAnalyses.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setCurrentTab('my-analyses')}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{a.competition}</span>
                      <span className="font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate">{a.matchTitle}</div>
                    <div className="flex justify-between text-[11px] font-mono pt-1 text-slate-400">
                      <span>H: {a.probabilities.homeWin}%</span>
                      {a.probabilities.draw > 0 && <span>D: {a.probabilities.draw}%</span>}
                      <span>A: {a.probabilities.awayWin}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Sports News */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-display text-sm font-bold text-white">Latest Sports Research</h3>
              <button
                onClick={() => setCurrentTab('news')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                All News
              </button>
            </div>

            <div className="space-y-3">
              {recentNews.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setCurrentTab('news')}
                  className="group cursor-pointer space-y-1 text-xs"
                >
                  <span className="text-[10px] text-blue-400 font-semibold block">{n.category}</span>
                  <h4 className="font-semibold text-slate-200 group-hover:text-white line-clamp-2 leading-snug">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 block">
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
