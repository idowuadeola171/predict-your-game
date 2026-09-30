import React, { useState, useEffect } from 'react';
import { Match, ProbabilityEstimate } from '../types/index.ts';
import { X, Play, VideoOff, Activity, ShieldAlert, Clock, BarChart2 } from 'lucide-react';

interface MatchDetailModalProps {
  matchId: string | null;
  onClose: () => void;
  onAnalyzeMatch?: (match: Match) => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  matchId,
  onClose,
  onAnalyzeMatch,
}) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [liveProbability, setLiveProbability] = useState<ProbabilityEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'TIMELINE' | 'VIDEO'>('TELEMETRY');

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      return;
    }
    const fetchMatch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match);
          setLiveProbability(data.liveProbability);
        }
      } catch (err) {
        console.error('Error fetching match detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
    const interval = setInterval(fetchMatch, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, [matchId]);

  if (!matchId || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0F172A] p-5 sm:p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Scoreboard */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="font-semibold text-blue-400">{match.competition}</span>
            <span aria-hidden="true">·</span>
            <span>{match.venue}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{match.code}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                  {match.homeTeam}
                </h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">Home Venue</span>
              </div>

              {/* Score & Time */}
              <div className="px-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                    {match.homeScore}
                  </span>
                  <span className="text-slate-500 font-mono text-xl">-</span>
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                    {match.awayScore}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
                  {match.status === 'LIVE' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {match.matchTime}
                    </span>
                  ) : match.status === 'FINISHED' ? (
                    <span className="text-slate-400 font-mono">Full Time</span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center sm:text-right">
                <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                  {match.awayTeam}
                </h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">Visiting Squad</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Statistical Estimate Section */}
        {liveProbability && (
          <div className="mb-5 p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {match.status === 'LIVE' ? 'Live Statistical Probability Estimate' : 'Pre-Match Statistical Estimate'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Confidence: {liveProbability.confidenceRating}
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex mb-2">
              <div
                style={{ width: `${liveProbability.homeWin}%` }}
                className="bg-blue-600 transition-all duration-500"
                title={`${match.homeTeam}: ${liveProbability.homeWin}%`}
              />
              {liveProbability.draw > 0 && (
                <div
                  style={{ width: `${liveProbability.draw}%` }}
                  className="bg-slate-500 transition-all duration-500"
                  title={`Draw: ${liveProbability.draw}%`}
                />
              )}
              <div
                style={{ width: `${liveProbability.awayWin}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`${match.awayTeam}: ${liveProbability.awayWin}%`}
              />
            </div>

            <div className="flex justify-between text-xs font-mono">
              <span className="text-blue-400">
                {match.homeTeam}: <strong className="text-white">{liveProbability.homeWin}%</strong>
              </span>
              {liveProbability.draw > 0 && (
                <span className="text-slate-400">
                  Draw: <strong className="text-white">{liveProbability.draw}%</strong>
                </span>
              )}
              <span className="text-emerald-400">
                {match.awayTeam}: <strong className="text-white">{liveProbability.awayWin}%</strong>
              </span>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              * Statistical probability estimate based on in-game metrics, remaining duration, and spatial momentum. Live probabilities adjust continuously as the fixture develops.
            </p>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg mb-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'TELEMETRY' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry & Stats
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'TIMELINE' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Events Timeline ({match.events.length})
          </button>
          <button
            onClick={() => setActiveTab('VIDEO')}
            className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'VIDEO' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live Video Area
          </button>
        </div>

        {/* Tab 1: Telemetry & Statistics */}
        {activeTab === 'TELEMETRY' && (
          <div className="space-y-3 text-xs">
            {/* Possession */}
            {match.statistics.possessionHome > 0 && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-mono">
                  <span>{match.statistics.possessionHome}%</span>
                  <span className="text-slate-300 font-sans font-medium">Possession</span>
                  <span>{match.statistics.possessionAway}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${match.statistics.possessionHome}%` }}
                    className="bg-blue-600 transition-all"
                  />
                  <div
                    style={{ width: `${match.statistics.possessionAway}%` }}
                    className="bg-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Expected Goals (xG) */}
            {match.statistics.expectedGoalsHome !== undefined && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
                <span className="text-blue-400 font-semibold">{match.statistics.expectedGoalsHome}</span>
                <span className="text-slate-400 font-sans font-medium">Expected Goals (xG)</span>
                <span className="text-emerald-400 font-semibold">{match.statistics.expectedGoalsAway}</span>
              </div>
            )}

            {/* Shots */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
              <span className="text-slate-200">{match.statistics.shotsHome}</span>
              <span className="text-slate-400 font-sans font-medium">Total Shots</span>
              <span className="text-slate-200">{match.statistics.shotsAway}</span>
            </div>

            {/* Shots on Target */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
              <span className="text-blue-400">{match.statistics.shotsOnTargetHome}</span>
              <span className="text-slate-400 font-sans font-medium">Shots on Target</span>
              <span className="text-emerald-400">{match.statistics.shotsOnTargetAway}</span>
            </div>

            {/* Corners */}
            {match.sport === 'Football' && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
                <span className="text-slate-200">{match.statistics.cornersHome}</span>
                <span className="text-slate-400 font-sans font-medium">Corners</span>
                <span className="text-slate-200">{match.statistics.cornersAway}</span>
              </div>
            )}

            {/* Fouls */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
              <span className="text-slate-200">{match.statistics.foulsHome}</span>
              <span className="text-slate-400 font-sans font-medium">Fouls</span>
              <span className="text-slate-200">{match.statistics.foulsAway}</span>
            </div>

            {/* Yellow / Red Cards */}
            {match.sport === 'Football' && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80 font-mono">
                <span className="text-amber-400">{match.statistics.yellowCardsHome}</span>
                <span className="text-slate-400 font-sans font-medium">Yellow Cards</span>
                <span className="text-amber-400">{match.statistics.yellowCardsAway}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Events Timeline */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
            {match.events.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No major events recorded yet.</p>
            ) : (
              match.events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <span className="w-8 font-mono text-xs font-bold text-blue-400 shrink-0">
                    {ev.minute}'
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{ev.player}</span>
                      <span className="text-[10px] text-slate-400">
                        ({ev.team === 'HOME' ? match.homeTeam : match.awayTeam})
                      </span>
                    </div>
                    {ev.detail && <p className="text-[11px] text-slate-400 mt-0.5">{ev.detail}</p>}
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      ev.type === 'GOAL'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : ev.type === 'YELLOW_CARD'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {ev.type}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Live Video Area */}
        {activeTab === 'VIDEO' && (
          <div className="py-6 text-center">
            {match.authorizedVideoUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                <iframe
                  src={match.authorizedVideoUrl}
                  title="Authorized Broadcast Feed"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 max-w-md mx-auto space-y-3">
                <VideoOff className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-200">Authorized Video Unavailable</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Live video is unavailable for this match. Follow the live score and statistics instead.
                </p>
                <div className="pt-2 text-[10px] text-slate-500">
                  MatchSense AI operates under authorized sports-data licensing and does not scrape or rebroadcast unlicensed copyrighted streams.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {onAnalyzeMatch && (
          <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => {
                onAnalyzeMatch(match);
                onClose();
              }}
              className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BarChart2 className="w-4 h-4" />
              Open in AI Sports Analyst
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
