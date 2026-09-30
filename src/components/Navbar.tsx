import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { Bell, User as UserIcon, Shield, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, openAuthModal } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0A0F1D]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider shadow-sm group-hover:bg-blue-500 transition-colors font-mono">
              MS
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                MatchSense AI
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentTab('live')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentTab === 'live' ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : ''
            }`}
          >
            Live Match Center
          </button>
          <button
            onClick={() => setCurrentTab('analyst')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentTab === 'analyst' ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : ''
            }`}
          >
            AI Sports Analyst
          </button>
          {user && (
            <button
              onClick={() => setCurrentTab('my-analyses')}
              className={`transition-colors hover:text-white cursor-pointer ${
                currentTab === 'my-analyses' ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : ''
              }`}
            >
              My Analyses
            </button>
          )}
          <button
            onClick={() => setCurrentTab('news')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentTab === 'news' ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : ''
            }`}
          >
            Sports News
          </button>
          <button
            onClick={() => setCurrentTab('pricing')}
            className={`transition-colors hover:text-white cursor-pointer ${
              currentTab === 'pricing' ? 'text-blue-400 font-semibold border-b-2 border-blue-500 pb-1' : ''
            }`}
          >
            Access & Plans
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 hover:bg-emerald-900/80'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary actions & User controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0A0F1D]" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#0F172A] shadow-2xl p-4 z-50 text-slate-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              n.read ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-800/80 text-slate-200 border-l-2 border-blue-500'
                            }`}
                          >
                            <p className="font-semibold text-slate-100">{n.title}</p>
                            <p className="mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-200 cursor-pointer transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0)}
                  </span>
                  <span className="hidden sm:inline-block max-w-[120px] truncate">{user.fullName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#0F172A] shadow-2xl py-2 z-50 text-slate-200 text-sm">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1.5 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Account:</span>
                          <span className={`font-semibold ${user.hasInitialAccess ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {user.hasInitialAccess ? 'Activated' : 'Pending Payment'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Quota:</span>
                          <span className="font-mono text-slate-200">{user.analysesUsed} / {user.analysesLimit}</span>
                        </div>
                      </div>

                      {!user.hasInitialAccess && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => {
                            setCurrentTab('pricing');
                            setShowUserMenu(false);
                          }}
                          className="mt-2 w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white text-center cursor-pointer transition-colors"
                        >
                          Activate Account (₦500)
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentTab('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white"
                    >
                      <UserIcon className="w-4 h-4 text-blue-400" /> Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" /> Profile & Billing
                    </button>

                    {user.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" /> Admin Console
                      </button>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          setCurrentTab('home');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
