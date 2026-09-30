import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { Match, SportType, AnalysisRecord } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import {
  Brain,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Bookmark,
  Share2,
  CreditCard,
  Lock,
} from 'lucide-react';

interface AIAnalystPageProps {
  initialMatch?: Match | null;
  onOpenMyAnalyses: () => void;
  onOpenPricing: () => void;
}

export const AIAnalystPage: React.FC<AIAnalystPageProps> = ({
  initialMatch,
  onOpenMyAnalyses,
  onOpenPricing,
}) => {
  const { user, token, refreshUser, openAuthModal } = useAuth();
  const { toast } = useNotification();

  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType>('Football');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatch ? initialMatch.id : '');
  const [inputMode, setInputMode] = useState<'SELECT' | 'CODE_OR_TEXT'>('SELECT');
  const [codeOrTextInput, setCodeOrTextInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activationPaymentOpen, setActivationPaymentOpen] = useState(false);

  // Fetch available matches for selector
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          setAvailableMatches(data.matches || []);
        }
      } catch (err) {
        console.error('Error loading matches for selector:', err);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (initialMatch) {
      setSelectedMatchId(initialMatch.id);
      setSelectedSport(initialMatch.sport);
      setInputMode('SELECT');
    }
  }, [initialMatch]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      openAuthModal('login');
      return;
    }

    setErrorMessage('');
    setAnalysisResult(null);

    // Check account activation
    if (!user.hasInitialAccess && user.role !== 'ADMIN') {
      setErrorMessage('Account activation required. Please activate your account with ₦500 initial access to use the AI Sports Analyst.');
      return;
    }

    // Check quota
    if (user.analysesUsed >= user.analysesLimit && user.role !== 'ADMIN') {
      setErrorMessage('You have reached your analysis limit for your plan. Please upgrade to Premium to continue.');
      return;
    }

    setAnalyzing(true);

    try {
      const payload: any = { sport: selectedSport };
      if (inputMode === 'SELECT') {
        if (!selectedMatchId) {
          setAnalyzing(false);
          setErrorMessage('Please select a match from the schedule.');
          return;
        }
        payload.matchId = selectedMatchId;
      } else {
        if (!codeOrTextInput.trim()) {
          setAnalyzing(false);
          setErrorMessage('Please enter a match code or fixture details.');
          return;
        }
        payload.matchCode = codeOrTextInput.trim();
        payload.rawInput = codeOrTextInput.trim();
      }

      const res = await fetch('/api/analyses/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete analysis.');
      }

      setAnalysisResult(data.analysis);
      await refreshUser();
      toast('Statistical analysis completed and saved to history', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve sports data. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (!analysisResult) return;
    const text = `MatchSense AI Statistical Probability Estimate for ${analysisResult.matchTitle}:\nHome Win: ${analysisResult.probabilities.homeWin}%\nDraw: ${analysisResult.probabilities.draw}%\nAway Win: ${analysisResult.probabilities.awayWin}%\n\nNotice: Probabilities are estimates and do not guarantee match outcomes.`;
    navigator.clipboard.writeText(text);
    toast('Summary copied to clipboard', 'info');
  };

  // 1. Unauthenticated Gate
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-bold text-white">AI Sports Analyst</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Please log in or create an account to access the AI Sports Analyst and generate mathematical match probability estimates.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-colors cursor-pointer shadow-md"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // 2. Unactivated User Gate (Pending Payment)
  if (!user.hasInitialAccess && user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Account Status: Pending Payment (Access Not Activated)</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            AI Sports Analyst Requires Activation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Access to our algorithmic sports analysis engine, expected goals (xG) metrics, and calibrated mathematical probabilities is reserved for activated accounts.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] text-left text-xs space-y-3 max-w-md mx-auto shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-slate-400 font-medium">One-Time Activation:</span>
            <span className="text-xl font-bold font-mono text-emerald-400">₦500</span>
          </div>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlock AI Sports Analyst engine</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>20 analysis requests credited instantly</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Poisson & mathematical probability estimates</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full match code parsing & custom fixtures</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActivationPaymentOpen(true)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay ₦500 to Activate Now</span>
          </button>
          <button
            onClick={onOpenPricing}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            View Membership Plans
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              AI Sports Analyst
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Objective mathematical modeling evaluating recent form, goals scored/conceded, venue efficiency, and spatial telemetry into calibrated probability estimates.
          </p>
        </div>

        {/* User Quota Indicator */}
        {user && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block">Analysis Quota</span>
              <span className="font-mono font-bold text-white">
                {user.analysesUsed} / {user.analysesLimit} Used
              </span>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold transition-colors cursor-pointer text-xs"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Input Formulation Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          {/* Sport Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg text-xs">
            {(['Football', 'Basketball', 'Tennis'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSport(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedSport === s ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setInputMode('SELECT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                inputMode === 'SELECT' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Select Active Match
            </button>
            <button
              type="button"
              onClick={() => setInputMode('CODE_OR_TEXT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                inputMode === 'CODE_OR_TEXT' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paste Code / Match Text
            </button>
          </div>
        </div>

        {user && !user.hasInitialAccess && user.role !== 'ADMIN' && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Account activation required. Complete ₦500 initial access payment to run statistical analyses.</span>
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white cursor-pointer shrink-0"
            >
              Activate Now (₦500)
            </button>
          </div>
        )}

        <form onSubmit={handleRunAnalysis} className="space-y-4">
          {inputMode === 'SELECT' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Fixture to Analyze
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose from available schedule --</option>
                {availableMatches
                  .filter((m) => m.sport === selectedSport)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.competition}] {m.homeTeam} vs {m.awayTeam} ({m.code}) - {m.status}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter Supported Match Code or Fixture Name
              </label>
              <input
                type="text"
                value={codeOrTextInput}
                onChange={(e) => setCodeOrTextInput(e.target.value)}
                placeholder="e.g. EPL-ARS-MCI or Arsenal vs Chelsea or NBA-BOS-LAL"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: Standard codes (EPL-MCI-ARS, UCL-RMA-BAY, NBA-BOS-LAL, ATP-ALC-SIN) or "Team A vs Team B".
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block">Analysis Notice:</span>
                {errorMessage}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Statistical model evaluates 5-match rolling form index and venue resistance.</span>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Statistical Probabilities...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Request Statistical Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Output Section */}
      {analysisResult && (
        <div className="p-6 sm:p-8 rounded-2xl border border-blue-900/60 bg-[#0F172A] shadow-2xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span className="font-semibold text-blue-400">{analysisResult.competition}</span>
                <span>·</span>
                <span>{analysisResult.sport}</span>
                {analysisResult.matchCode && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{analysisResult.matchCode}</span>
                  </>
                )}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                {analysisResult.matchTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Summary</span>
              </button>
              <button
                onClick={onOpenMyAnalyses}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved in History</span>
              </button>
            </div>
          </div>

          {/* Probability Estimates Display */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Statistical Probability Estimate
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Confidence: <strong className="text-emerald-400">{analysisResult.probabilities.confidenceRating}</strong>
              </span>
            </div>

            {/* Distribution Bar */}
            <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex mb-3 shadow-inner">
              <div
                style={{ width: `${analysisResult.probabilities.homeWin}%` }}
                className="bg-blue-600 transition-all duration-700"
                title={`Home: ${analysisResult.probabilities.homeWin}%`}
              />
              {analysisResult.probabilities.draw > 0 && (
                <div
                  style={{ width: `${analysisResult.probabilities.draw}%` }}
                  className="bg-slate-500 transition-all duration-700"
                  title={`Draw: ${analysisResult.probabilities.draw}%`}
                />
              )}
              <div
                style={{ width: `${analysisResult.probabilities.awayWin}%` }}
                className="bg-emerald-500 transition-all duration-700"
                title={`Away: ${analysisResult.probabilities.awayWin}%`}
              />
            </div>

            {/* Numerical breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block truncate">Home Team</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
                  {analysisResult.probabilities.homeWin}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block truncate">Draw</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-300">
                  {analysisResult.probabilities.draw}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block truncate">Away Team</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {analysisResult.probabilities.awayWin}%
                </span>
              </div>
            </div>
          </div>

          {/* Analytical Explanation */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              AI Quantitative Narrative
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {analysisResult.explanation}
            </div>
          </div>

          {/* Key Analytical Factors */}
          {analysisResult.factors && analysisResult.factors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Contributing Factor Matrix
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisResult.factors.map((f, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{f.factor}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f.impact === 'FAVORS_HOME'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : f.impact === 'FAVORS_AWAY'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {f.impact.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strict Mandatory Disclaimer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statistical Probability Estimate Notice:</strong> MatchSense AI outputs are calculated for educational and sports analysis purposes only. Percentages reflect mathematical distributions based on historical telemetry and do not represent guaranteed outcomes.
            </p>
          </div>
        </div>
      )}

      {/* Ad slot for Analysis pages */}
      <AdBanner placement="ANALYSIS_PAGES" />
    </div>
  );
};
