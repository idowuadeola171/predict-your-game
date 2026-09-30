import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#070B14] text-slate-400 text-xs pb-20 md:pb-12 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Compliance & Statistical Disclaimer Box */}
        <div className="mb-10 p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-slate-300">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-white">Statistical Probability Notice: </span>
            MatchSense AI provides statistical analysis and match modeling for informational, tactical, and educational purposes only. All figures presented are mathematical estimates based on historical form, spatial telemetry, and performance data, and do not constitute guaranteed outcomes. MatchSense AI does not facilitate gambling or provide betting advice.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs font-mono">
                MS
              </span>
              <span className="font-display text-base font-bold text-white">MatchSense AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Smarter Sports Analysis. Better Understanding. Professional sports intelligence and quantitative live telemetry.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Independent Sports Analytics Infrastructure</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentTab('live')} className="hover:text-white cursor-pointer">
                  Live Match Center
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('analyst')} className="hover:text-white cursor-pointer">
                  AI Sports Analyst
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('news')} className="hover:text-white cursor-pointer">
                  Quantitative Sports News
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('pricing')} className="hover:text-white cursor-pointer">
                  Access & Membership
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentTab('home')} className="hover:text-white cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('analyst')} className="hover:text-white cursor-pointer">
                  Match Code Syntax Guide
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('pricing')} className="hover:text-white cursor-pointer">
                  Verified Payment Gateway
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('admin')} className="hover:text-emerald-400 text-slate-400 cursor-pointer flex items-center gap-1">
                  <span>Admin Console</span>
                </button>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">Data Feed: API-Football (api-sports.io)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Security & Standards</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Server-side payment verification</li>
              <li>Encrypted salted credential vaults</li>
              <li>Zero gambling affiliations</li>
              <li>© {new Date().getFullYear()} MatchSense AI. All rights reserved.</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            MatchSense AI · Quantitative Sports Analysis Platform
          </div>
          <div className="flex items-center gap-4">
            <span>Educational Use Only</span>
            <span>·</span>
            <span>No Guarantees Implied</span>
            <span>·</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
