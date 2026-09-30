import React, { useState, useEffect, useRef } from 'react';
import { Match, MatchStatus, SportType } from '../types/index.ts';
import { MatchDetailModal } from '../components/MatchDetailModal.tsx';
import { AdBanner } from '../components/AdBanner.tsx';
import {
  Activity,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  BarChart2,
  RefreshCw,
  AlertTriangle,
  Radio,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface LiveCenterPageProps {
  onAnalyzeMatch: (match: Match) => void;
}

export const LiveCenterPage: React.FC<LiveCenterPageProps> = ({ onAnalyzeMatch }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus | 'ALL'>('LIVE');
  const [selectedSport, setSelectedSport] = useState<SportType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Real-time API Provider metadata
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('Authoritative Sports API Provider');

  const fetchMatches = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/matches${isManual ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        if (data.lastUpdated) {
          setLastUpdated(data.lastUpdated);
        }
        setProviderStatus(data.providerStatus || 'ONLINE');
        setProviderName(data.providerName || 'Authoritative Sports API Provider');
        setErrorMessage(data.error || null);
      } else {
        setProviderStatus('OFFLINE');
        setErrorMessage('Live match data is temporarily unavailable. Please try again later.');
      }
    } catch (err: any) {
      console.error('Error fetching real-time match data:', err);
      setProviderStatus('OFFLINE');
      setErrorMessage('Live match data is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Real-time polling every 20 seconds so scores and minute ticks update automatically
    const interval = setInterval(() => {
      fetchMatches(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filter matches based on user selection
  const filteredMatches = matches.filter((m) => {
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'LIVE' && m.status !== 'LIVE') return false;
      if (selectedStatus === 'UPCOMING' && m.status !== 'UPCOMING') return false;
      if (selectedStatus === 'FINISHED' && m.status !== 'FINISHED') return false;
    }
    if (selectedSport !== 'ALL' && m.sport !== selectedSport) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.homeTeam} ${m.awayTeam} ${m.competition} ${m.code}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED');

  // Format last updated time for display
  const formatUpdateTime = (isoStr: string | null) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-24">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Match Center
            </h1>

            {/* Live Indicator Pill */}
            {liveMatches.length > 0 ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {liveMatches.length} Live Now
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
                0 Active Live
              </span>
            )}

            {/* Provider Tag */}
            <span className="text-[10px] text-blue-400 font-mono bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-800/80">
              API-Football Live Feed
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Real-time football data feed powered by API-Football, verified live scores, official minute clocks, and in-game statistics.
          </p>
        </div>

        {/* Search & Manual Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams, league, code..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchMatches(true)}
            disabled={refreshing}
            title="Refresh real-time scores now"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Status & Last Update Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              providerStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {providerStatus === 'ONLINE' ? 'Connected to Sports Data Provider' : 'Data Feed Unavailable'}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Auto-refreshing every 20 seconds
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last data update:</span>
          <strong className="text-slate-200">
            {lastUpdated ? formatUpdateTime(lastUpdated) : 'Connecting...'}
          </strong>
        </div>
      </div>

      {/* Category Tabs: LIVE, UPCOMING, FINISHED, ALL */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl text-xs font-medium">
          <button
            onClick={() => setSelectedStatus('LIVE')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'LIVE'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${liveMatches.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>LIVE ({liveMatches.length})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'UPCOMING'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>UPCOMING ({upcomingMatches.length})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('FINISHED')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'FINISHED'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>FINISHED ({finishedMatches.length})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({matches.length})
          </button>
        </div>

        {/* Sport Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center gap-1 text-slate-400">
            {(['ALL', 'Football', 'Basketball'] as const).map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedSport === sport
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'hover:text-slate-200'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR STATE: When sports API is unavailable */}
      {errorMessage && providerStatus === 'OFFLINE' && (
        <div className="p-8 text-center rounded-3xl border border-rose-900/60 bg-rose-950/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-display text-base font-bold text-white">
              Live match data is temporarily unavailable. Please try again later.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We could not establish a connection with the real-time sports data feed. No placeholder or mock matches are displayed to guarantee data authenticity.
            </p>
          </div>
          <button
            onClick={() => fetchMatches(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm font-medium text-slate-400">
            Querying sports data API for live fixtures...
          </p>
        </div>
      ) : null}

      {/* EMPTY STATE: "No live matches at the moment." */}
      {!loading && !errorMessage && selectedStatus === 'LIVE' && filteredMatches.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-slate-800 bg-[#0F172A] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Radio className="w-7 h-7 text-slate-500" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-display text-lg font-bold text-white">
              No live matches at the moment.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              There are currently no games actively in progress returned by the sports API provider. Real matches only appear here when live on the pitch.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setSelectedStatus('UPCOMING')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>View Upcoming Scheduled Matches ({upcomingMatches.length})</span>
            </button>
            <button
              onClick={() => setSelectedStatus('FINISHED')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              View Recent Results ({finishedMatches.length})
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE for other filters */}
      {!loading && !errorMessage && selectedStatus !== 'LIVE' && filteredMatches.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-slate-800 bg-[#0F172A] space-y-3">
          <p className="text-sm font-semibold text-slate-300">No matches found in this category.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No matches matched "${searchQuery}". Try clearing your search filter.`
              : 'No fixtures found for the selected category from the provider feed.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* MATCHES GRID: Only Real Verified Matches */}
      {!loading && filteredMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border bg-[#0F172A] transition-all flex flex-col justify-between group ${
                m.status === 'LIVE'
                  ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Competition & Live Status */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-blue-400 truncate max-w-[200px]">
                      {m.competition}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-slate-500">{m.code}</span>
                  </div>

                  {/* Status Indicator */}
                  {m.status === 'LIVE' ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-xs bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {m.matchTime === 'HT' ? 'Half Time (HT)' : `LIVE ${m.matchTime || ''}`}
                    </span>
                  ) : m.status === 'FINISHED' ? (
                    <span className="text-slate-300 text-xs font-mono font-semibold bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Full Time (FT)
                    </span>
                  ) : m.status === 'POSTPONED' ? (
                    <span className="text-amber-400 text-xs font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      Postponed
                    </span>
                  ) : m.status === 'CANCELLED' ? (
                    <span className="text-rose-400 text-xs font-semibold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      Cancelled
                    </span>
                  ) : (
                    <span className="text-blue-400 text-xs font-semibold bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-900 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Scheduled ({new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </span>
                  )}
                </div>

                {/* Teams & Real Scores */}
                <div className="space-y-2 mb-4">
                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors truncate max-w-[240px]">
                      {m.homeTeam}
                    </span>
                    <span
                      className={`font-mono text-lg font-bold ${
                        m.status === 'LIVE'
                          ? 'text-emerald-400'
                          : m.status === 'FINISHED'
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {m.status !== 'UPCOMING' ? m.homeScore : '-'}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors truncate max-w-[240px]">
                      {m.awayTeam}
                    </span>
                    <span
                      className={`font-mono text-lg font-bold ${
                        m.status === 'LIVE'
                          ? 'text-emerald-400'
                          : m.status === 'FINISHED'
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {m.status !== 'UPCOMING' ? m.awayScore : '-'}
                    </span>
                  </div>
                </div>

                {/* Match Details & Venue */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px] text-slate-500">
                    📍 {m.venue}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {new Date(m.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Live Statistics if available */}
                {m.status === 'LIVE' && m.statistics && m.statistics.possessionHome > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Poss: {m.statistics.possessionHome}% - {m.statistics.possessionAway}%</span>
                    <span>Shots: {m.statistics.shotsHome} - {m.statistics.shotsAway}</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedMatchId(m.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => onAnalyzeMatch(m)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>AI Analysis</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ad slot for Match Pages */}
      <AdBanner placement="MATCH_PAGES" className="mt-8" />

      {/* Match Detail Modal */}
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          onAnalyzeMatch={onAnalyzeMatch}
        />
      )}
    </div>
  );
};
