import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { Footer } from './components/Footer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LiveCenterPage } from './pages/LiveCenterPage.tsx';
import { AIAnalystPage } from './pages/AIAnalystPage.tsx';
import { MyAnalysesPage } from './pages/MyAnalysesPage.tsx';
import { NewsPage } from './pages/NewsPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { Match, UserPaymentState, PaymentRecord } from './types/index.ts';
import { AlertTriangle, CreditCard, Clock, RotateCcw } from 'lucide-react';

export function MatchSenseApp() {
  const { user, token, refreshUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedMatchForAnalysis, setSelectedMatchForAnalysis] = useState<Match | null>(null);
  const [globalPaymentOpen, setGlobalPaymentOpen] = useState<boolean>(false);
  const [userPaymentState, setUserPaymentState] = useState<UserPaymentState>('PAYMENT_NOT_MADE');
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchUserPaymentStatus();
    }
  }, [user, token]);

  const fetchUserPaymentStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/payments/my-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserPaymentState(data.state);
        setLatestPayment(data.latestPayment);
      }
    } catch (err) {
      console.error('Error fetching user payment status:', err);
    }
  };

  const handleSelectMatchToAnalyze = (match: Match) => {
    setSelectedMatchForAnalysis(match);
    setCurrentTab('analyst');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (status: string, role: string) => {
    if (role === 'ADMIN') {
      handleTabChange('admin');
    } else if (status === 'PENDING_PAYMENT' || (!user?.hasInitialAccess)) {
      handleTabChange('dashboard');
      setGlobalPaymentOpen(true);
    } else {
      handleTabChange('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Global Persistent Activation Banner for Unactivated Accounts */}
      {user && !user.hasInitialAccess && user.role !== 'ADMIN' && (
        <div className={`w-full border-b px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md z-30 ${
          userPaymentState === 'PAYMENT_AWAITING_VERIFICATION'
            ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-amber-600/50 text-amber-200'
            : userPaymentState === 'PAYMENT_REJECTED'
            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-600/50 text-rose-200'
            : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-blue-600/40 text-blue-200'
        }`}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            {userPaymentState === 'PAYMENT_AWAITING_VERIFICATION' ? (
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            ) : userPaymentState === 'PAYMENT_REJECTED' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}

            <span>
              {userPaymentState === 'PAYMENT_AWAITING_VERIFICATION' ? (
                <>
                  <strong className="text-white uppercase font-bold tracking-wide">
                    PAYMENT AWAITING VERIFICATION
                  </strong>{' '}
                  — Your payment record (Ref: {latestPayment?.reference}) was submitted and is awaiting administrator verification.
                </>
              ) : userPaymentState === 'PAYMENT_REJECTED' ? (
                <>
                  <strong className="text-white uppercase font-bold tracking-wide">
                    PAYMENT VERIFICATION UNSUCCESSFUL
                  </strong>{' '}
                  — Your previous transfer could not be verified. Please transfer to SmartCash and submit a corrected payment record.
                </>
              ) : (
                <>
                  <strong className="text-white uppercase font-bold tracking-wide">
                    PAYMENT NOT MADE (ACCESS NOT ACTIVATED)
                  </strong>{' '}
                  — Transfer ₦500 to SmartCash account 9020714762 to unlock live match telemetry and AI Sports Analyst.
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setGlobalPaymentOpen(true)}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-white text-xs transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5 ${
              userPaymentState === 'PAYMENT_REJECTED'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {userPaymentState === 'PAYMENT_AWAITING_VERIFICATION' ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>View Submission</span>
              </>
            ) : userPaymentState === 'PAYMENT_REJECTED' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit Corrected Record</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transfer & Verify (₦500)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <LandingPage
            setCurrentTab={handleTabChange}
            onSelectMatchToAnalyze={handleSelectMatchToAnalyze}
          />
        )}

        {currentTab === 'live' && (
          <LiveCenterPage onAnalyzeMatch={handleSelectMatchToAnalyze} />
        )}

        {currentTab === 'analyst' && (
          <AIAnalystPage
            initialMatch={selectedMatchForAnalysis}
            onOpenMyAnalyses={() => handleTabChange('my-analyses')}
            onOpenPricing={() => handleTabChange('pricing')}
          />
        )}

        {currentTab === 'my-analyses' && (
          <MyAnalysesPage onOpenAnalyst={() => handleTabChange('analyst')} />
        )}

        {currentTab === 'news' && <NewsPage />}

        {currentTab === 'pricing' && <PricingPage />}

        {currentTab === 'dashboard' && (
          <DashboardPage
            setCurrentTab={handleTabChange}
            onSelectMatchToAnalyze={handleSelectMatchToAnalyze}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage onOpenPricing={() => handleTabChange('pricing')} />
        )}

        {currentTab === 'admin' && <AdminPage setCurrentTab={handleTabChange} />}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal onAuthSuccess={handleAuthSuccess} />

      {/* Global Platform Activation Payment Modal */}
      <PaymentModal
        isOpen={globalPaymentOpen}
        onClose={() => setGlobalPaymentOpen(false)}
        paymentType="INITIAL_ACCESS"
        amount={500}
        planName="Initial Platform Access"
        onSuccess={async () => {
          await refreshUser();
          setGlobalPaymentOpen(false);
          handleTabChange('dashboard');
        }}
      />

      {/* Mobile Android Bottom Navigation */}
      <MobileBottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Footer */}
      <Footer setCurrentTab={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MatchSenseApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
