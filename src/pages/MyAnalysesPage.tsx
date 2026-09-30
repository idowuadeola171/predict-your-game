import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AnalysisRecord, SportType } from '../types/index.ts';
import { PaymentModal } from '../components/PaymentModal.tsx';
import { Bookmark, Clock, Search, ChevronRight, X, Info, Share2, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';

interface MyAnalysesPageProps {
  onOpenAnalyst: () => void;
}

export const MyAnalysesPage: React.FC<MyAnalysesPageProps> = ({ onOpenAnalyst }) => {
  const { user, token, refreshUser, openAuthModal } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<SportType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [activationPaymentOpen, setActivationPaymentOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/analyses/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalyses(data.analyses || []);
        }
      } catch (err) {
        console.error('Error fetching analysis history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const filtered = analyses.filter((a) => {
    if (selectedSport !== 'ALL' && a.sport !== selectedSport) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${a.matchTitle} ${a.competition} ${a.matchCode || ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
          <Bookmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">Analyses History</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Please log in to review your saved match telemetry and statistical probability reports.
          </p>
        </div>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-colors cursor-pointer shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!user.hasInitialAccess && user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Bookmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Account Status: Pending Payment (Access Not Activated)</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            Activation Required for Analysis History
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Your MatchSense AI account must be activated to run, store, and review persistent statistical analysis reports. Complete the ₦500 Initial Access payment to activate your account.
          </p>
        </div>

        <button
          onClick={() => setActivationPaymentOpen(true)}
          className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors cursor-pointer shadow-lg inline-flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pay ₦500 to Activate Now</span>
        </button>

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-400" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              My Analyses History
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Archived statistical probability reports. Historical records are immutable and verified for compliance.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved analyses..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-xs">
        {(['ALL', 'Football', 'Basketball', 'Tennis'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSport(s)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedSport === s ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading your analyses history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
          <p className="text-sm font-semibold text-slate-300">No past analyses recorded yet.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run your first statistical analysis using the AI Sports Analyst tool to populate your historical archive.
          </p>
          <button
            onClick={onOpenAnalyst}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Open AI Analyst
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item)}
              className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-[#0F172A] hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-blue-400">{item.competition}</span>
                  <span>·</span>
                  <span>{item.sport}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white">{item.matchTitle}</h3>
                <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed max-w-xl">
                  {item.explanation}
                </p>
              </div>

              {/* Probabilities Preview */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-xs font-mono">
                  <span className="text-blue-400 font-bold">{item.probabilities.homeWin}%</span>
                  {item.probabilities.draw > 0 && (
                    <span className="text-slate-400 mx-1.5">{item.probabilities.draw}%</span>
                  )}
                  <span className="text-emerald-400 font-bold">{item.probabilities.awayWin}%</span>
                  <span className="text-[10px] text-slate-500 block">Probability Split</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span className="text-blue-400 font-semibold">{selectedRecord.competition}</span>
                <span>·</span>
                <span>{new Date(selectedRecord.createdAt).toLocaleString()}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white">{selectedRecord.matchTitle}</h2>
            </div>

            {/* Probability Estimate */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Statistical Probability Estimate
              </span>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex mb-2">
                <div style={{ width: `${selectedRecord.probabilities.homeWin}%` }} className="bg-blue-600" />
                {selectedRecord.probabilities.draw > 0 && (
                  <div style={{ width: `${selectedRecord.probabilities.draw}%` }} className="bg-slate-500" />
                )}
                <div style={{ width: `${selectedRecord.probabilities.awayWin}%` }} className="bg-emerald-500" />
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-400">Home: {selectedRecord.probabilities.homeWin}%</span>
                {selectedRecord.probabilities.draw > 0 && (
                  <span className="text-slate-400">Draw: {selectedRecord.probabilities.draw}%</span>
                )}
                <span className="text-emerald-400">Away: {selectedRecord.probabilities.awayWin}%</span>
              </div>
            </div>

            {/* Narrative */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Analytical Narrative</span>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedRecord.explanation}
              </div>
            </div>

            {/* Factors */}
            {selectedRecord.factors && selectedRecord.factors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Contributing Factors</span>
                <div className="space-y-2">
                  {selectedRecord.factors.map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{f.factor}</span>
                        <span className="text-[10px] text-blue-400">{f.impact}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Immutable archive entry. Generated by MatchSense AI quantitative statistical engine. Not a gambling slip or guaranteed prediction.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
