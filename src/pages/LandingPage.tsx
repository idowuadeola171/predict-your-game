import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Match, SportsArticle } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';
import {
  Brain,
  Activity,
  BarChart3,
  TrendingUp,
  Newspaper,
  Crown,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
  onSelectMatchToAnalyze: (match: Match) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setCurrentTab,
  onSelectMatchToAnalyze,
}) => {
  const { user, openAuthModal } = useAuth();
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [recentNews, setRecentNews] = useState<SportsArticle[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingMatches(true);
      try {
        const [mRes, nRes] = await Promise.all([
          fetch('/api/matches?featured=true'),
          fetch('/api/news'),
        ]);
        if (mRes.ok) {
          const mData = await mRes.json();
          setFeaturedMatches(mData.matches || []);
        }
        if (nRes.ok) {
          const nData = await nRes.json();
          setRecentNews((nData.articles || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18">
        <div className="max-w-4xl mx-auto text-center space-y-5 px-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>MATCHSENSE AI · SPORTS INTELLIGENCE PLATFORM</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Understand the Game <span className="text-blue-500">Through Data</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Use sports statistics, live match information, and AI-powered analysis to understand games through data.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (user) setCurrentTab('analyst');
                else openAuthModal('register');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white transition-all shadow-lg hover:shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTab('live')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              Explore Live Center
            </button>
          </div>

          {/* Quick proof badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Non-Gambling Analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Real-Time Opta Compatible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Poisson & Dixon-Coles Models</span>
            </div>
          </div>
        </div>

        {/* Featured Live Match Telemetry Preview */}
        {featuredMatches.length > 0 && (
          <div className="max-w-4xl mx-auto mt-10 px-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/90 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-semibold text-blue-400">{featuredMatches[0].competition}</span>
                  <span>·</span>
                  <span>{featuredMatches[0].venue}</span>
                </div>
                {featuredMatches[0].status === 'LIVE' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-xs bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE {featuredMatches[0].matchTime}
                  </span>
                ) : featuredMatches[0].status === 'FINISHED' ? (
                  <span className="text-slate-400 font-mono text-xs">FULL TIME</span>
                ) : (
                  <span className="text-blue-400 font-medium text-xs">
                    {new Date(featuredMatches[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="text-center sm:text-left">
                  <h3 className="font-display text-lg font-bold text-white truncate">
                    {featuredMatches[0].homeTeam}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {featuredMatches[0].recentFormHome?.length ? `Form: ${featuredMatches[0].recentFormHome.join('-')}` : 'Home Squad'}
                  </span>
                </div>

                <div className="text-center py-2 sm:py-0">
                  <div className="text-3xl font-bold font-mono text-white">
                    {featuredMatches[0].status !== 'UPCOMING'
                      ? `${featuredMatches[0].homeScore} - ${featuredMatches[0].awayScore}`
                      : 'VS'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    {new Date(featuredMatches[0].startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  <h3 className="font-display text-lg font-bold text-white truncate">
                    {featuredMatches[0].awayTeam}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {featuredMatches[0].recentFormAway?.length ? `Form: ${featuredMatches[0].recentFormAway.join('-')}` : 'Away Squad'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 text-center sm:text-left">
                  Verified sports data feed fixture. Run mathematical probabilistic modeling.
                </span>
                <button
                  onClick={() => onSelectMatchToAnalyze(featuredMatches[0])}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  Analyze with AI
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Ad placement on Homepage */}
      <div className="max-w-5xl mx-auto px-4">
        <AdBanner placement="HOMEPAGE" />
      </div>

      {/* 2. CORE CAPABILITIES (Anti-Slop Grid) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Comprehensive Sports Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Every feature engineered strictly around verifiable data, performance telemetry, and machine learning models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">AI Sports Analyst</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes historical form, tactical pressing, goals scored, and defensive stability to produce calibrated statistical probability estimates.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Live Match Center</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time in-game possession, shots on target, xG telemetry, and dynamic statistical updates as match state develops.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Probability Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Understand the distribution: Home Win %, Draw %, and Away Win % grounded in Poisson distribution algorithms.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Match Statistics & Code Parsing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste standard match codes or fixture names (e.g. EPL-ARS-MCI) to instantly retrieve deep historical head-to-head metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Quantitative Sports News</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rigorous analytical journalism dissecting defensive structures, player variance, and advanced metrics across world sports.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Premium Membership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expanded analysis quotas, deep tactical reports, extended historical telemetry, and priority access to live match intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D]">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Methodology</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              How MatchSense AI Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              A transparent, structured workflow designed for sports enthusiasts, data analysts, and researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600/20 text-blue-400 font-bold font-mono text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold text-white">Create Account</h4>
              <p className="text-[11px] text-slate-400">Quick sign-up with email and secure password hashing.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600/20 text-blue-400 font-bold font-mono text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold text-white">Activate Access</h4>
              <p className="text-[11px] text-slate-400">Unlock standard access (₦500) or Premium (₦1,000/mo).</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600/20 text-blue-400 font-bold font-mono text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold text-white">Select a Match</h4>
              <p className="text-[11px] text-slate-400">Choose from live/upcoming fixtures or paste a match code.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600/20 text-blue-400 font-bold font-mono text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="text-xs font-bold text-white">Analyze Data</h4>
              <p className="text-[11px] text-slate-400">Form, goal differential, venue record, and head-to-head.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <span className="w-7 h-7 mx-auto rounded-full bg-emerald-600/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                5
              </span>
              <h4 className="text-xs font-bold text-white">Receive Insights</h4>
              <p className="text-[11px] text-slate-400">Get calibrated probability estimates and factors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING PREVIEW */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Transparent, Accessible Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Pricing is dynamically managed via the administrator portal. Powered by secure Nigerian payment architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Initial Access */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-[#0F172A] flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Standard Platform</span>
              <h3 className="font-display text-xl font-bold text-white mt-1">Initial Access</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white">₦500</span>
                <span className="text-xs text-slate-400">one-time activation</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Activate your MatchSense AI account and gain immediate access to the standard sports intelligence platform.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Account activation & dashboard access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time match center & live score telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard statistical probability models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>20 match analyses included</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentTab('pricing')}
              className="mt-8 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Activate Initial Access
            </button>
          </div>

          {/* Premium */}
          <div className="p-6 sm:p-8 rounded-2xl border border-blue-800/80 bg-gradient-to-b from-blue-950/30 to-[#0F172A] relative flex flex-col justify-between">
            <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-900/50 px-2.5 py-1 rounded-full border border-blue-700/60">
              Recommended
            </span>

            <div>
              <span className="text-xs font-semibold text-blue-400">Quantitative Edge</span>
              <h3 className="font-display text-xl font-bold text-white mt-1">MatchSense Premium</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-emerald-400">₦1,000</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Advanced AI analysis, higher quotas, in-depth xG modeling, and prioritized live match statistical telemetry.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Advanced AI Sports Analyst reports (Gemini 3.8)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>200 analyses per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Extended historical statistics & H2H depth</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live in-game statistical probability updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom match code parser & priority features</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentTab('pricing')}
              className="mt-8 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Subscribe to Premium (₦1,000/mo)
            </button>
          </div>
        </div>
      </section>

      {/* 5. LATEST SPORTS NEWS */}
      {recentNews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Quantitative Sports Analysis & News
              </h2>
              <p className="text-xs text-slate-400">Statistical breakdowns of modern sports tactics.</p>
            </div>
            <button
              onClick={() => setCurrentTab('news')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Articles</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentNews.map((article) => (
              <div
                key={article.id}
                onClick={() => setCurrentTab('news')}
                className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span className="text-blue-400 font-semibold">{article.category}</span>
                    <span>·</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-white line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[180px]">{article.author}</span>
                  <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                    Read <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. MANDATORY STATISTICAL DISCLAIMER BANNER */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Informational & Educational Sports Intelligence
          </span>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
            "MatchSense AI provides statistical analysis for informational and educational purposes. Probabilities are estimates and do not guarantee match outcomes."
          </p>
          <div className="text-[11px] text-slate-500 pt-1">
            Data helps you understand the game. No betting slips, stakes, or bookmaker affiliations.
          </div>
        </div>
      </section>
    </div>
  );
};
