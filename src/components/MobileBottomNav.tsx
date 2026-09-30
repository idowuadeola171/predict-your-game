import React from 'react';
import { Home, Activity, Brain, Newspaper, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around h-16">
      <button
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 cursor-pointer transition-colors ${
          currentTab === 'home' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </button>

      <button
        onClick={() => setCurrentTab('live')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 cursor-pointer transition-colors ${
          currentTab === 'live' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Activity className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Live</span>
      </button>

      <button
        onClick={() => setCurrentTab('analyst')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 cursor-pointer transition-colors ${
          currentTab === 'analyst' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Brain className="w-5 h-5 text-emerald-400" />
        <span className="text-[10px] tracking-tight">AI Analyst</span>
      </button>

      <button
        onClick={() => setCurrentTab('news')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 cursor-pointer transition-colors ${
          currentTab === 'news' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Newspaper className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">News</span>
      </button>

      <button
        onClick={() => setCurrentTab(user ? 'dashboard' : 'pricing')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 cursor-pointer transition-colors ${
          currentTab === 'dashboard' || currentTab === 'profile' || currentTab === 'pricing'
            ? 'text-blue-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <UserCheck className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">{user ? 'Account' : 'Plans'}</span>
      </button>
    </nav>
  );
};
