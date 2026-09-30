import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import { PaymentType, PaymentRecord, UserPaymentState } from '../types/index.ts';
import {
  Check,
  ShieldCheck,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Copy,
  Clock,
  RotateCcw,
  FileCheck,
  Upload,
  User as UserIcon,
  Mail,
  Loader2,
  FileText,
  Headphones,
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { user, token, openAuthModal, refreshUser } = useAuth();
  const { toast } = useNotification();
  const [plansData, setPlansData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // SmartCash Payment Account copy feedback
  const [copied, setCopied] = useState(false);

  // User payment state
  const [userPaymentState, setUserPaymentState] = useState<UserPaymentState>('PAYMENT_NOT_MADE');
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);

  // Inline "Submit Payment Evidence" Form States
  const [selectedPlanType, setSelectedPlanType] = useState<PaymentType>('INITIAL_ACCESS');
  const selectedAmount = selectedPlanType === 'INITIAL_ACCESS' ? 500 : 1000;
  const selectedPlanName =
    selectedPlanType === 'INITIAL_ACCESS' ? 'Standard Access' : 'Premium Subscription';

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [amountPaid, setAmountPaid] = useState<number>(selectedAmount);
  const [dateOfPayment, setDateOfPayment] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [transactionReference, setTransactionReference] = useState('');
  const [receiptData, setReceiptData] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Modal checkout state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPlans();
    if (user && token) {
      fetchUserPaymentStatus();
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!emailAddress && user.email) setEmailAddress(user.email);
    }
  }, [user, token]);

  // Sync plan change to amount
  useEffect(() => {
    setAmountPaid(selectedPlanType === 'INITIAL_ACCESS' ? 500 : 1000);
  }, [selectedPlanType]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans');
      if (res.ok) {
        const data = await res.json();
        setPlansData(data);
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPaymentStatus = async () => {
    const authToken = token || localStorage.getItem('matchsense_token');
    if (!authToken) return;
    try {
      const res = await fetch('/api/payments/my-status', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserPaymentState(data.state);
        setLatestPayment(data.latestPayment);
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    }
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText('9020714762');
    setCopied(true);
    toast('Account number 9020714762 copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast('Receipt file size must be under 15MB', 'error');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setReceiptData(result);
      setReceiptPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccessMessage('');

    if (!user || !token) {
      openAuthModal('login');
      return;
    }

    if (!fullName.trim()) {
      setFormError("Please enter the user's full name.");
      return;
    }

    if (!emailAddress.trim()) {
      setFormError('Please enter your email address.');
      return;
    }

    if (!transactionReference.trim()) {
      setFormError('Please enter your transaction/reference ID.');
      return;
    }

    if (!dateOfPayment) {
      setFormError('Please specify the payment date.');
      return;
    }

    if (!receiptData) {
      setFormError('Please upload your payment receipt or screenshot as evidence.');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/payments/submit-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentType: selectedPlanType,
          amount: amountPaid,
          reference: transactionReference.trim(),
          dateOfPayment,
          payerName: fullName.trim(),
          email: emailAddress.trim(),
          receipt: receiptData,
          receiptFileName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment evidence.');
      }

      setFormSuccessMessage('Payment evidence submitted successfully. Your payment is awaiting verification.');
      setUserPaymentState('PAYMENT_AWAITING_VERIFICATION');
      setLatestPayment(data.payment);
      await refreshUser();
      toast('Payment evidence submitted successfully. Your payment is awaiting verification.', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err.message || 'Submission error. Please check your details and try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const initialPrice = plansData?.initialAccess?.price || 500;
  const premiumPrice = plansData?.premium?.price || 1000;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 pb-24">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
          Membership & Payment Verification
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          MatchSense AI Plans & Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Transfer directly to our official SmartCash account, then submit your payment evidence for administrator review.
        </p>
      </div>

      {/* 1. PAYMENT ACCOUNT DETAILS - Prominently Displayed */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0F1D] border-2 border-emerald-500/50 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Official Transfer Destination
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Payment Account Details
            </h2>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Direct Transfer Account
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] font-semibold block">
              Account Name
            </span>
            <span className="text-base font-bold text-white mt-1 block tracking-wide">
              Idowu Joseph Adeola
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 uppercase text-[10px] font-semibold block">
              Payment Provider
            </span>
            <span className="text-base font-bold text-white mt-1 block">
              SmartCash
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 uppercase text-[10px] font-semibold block">
              Account Number
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-wider">
                9020714762
              </span>
            </div>
          </div>
        </div>

        {/* Copy Account Number Button & Instructions */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-xs text-amber-200 bg-amber-950/30 p-3.5 rounded-2xl border border-amber-600/30 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              "Transfer the exact amount to the account above, then submit your payment details for verification."
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyAccountNumber}
            className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-500 text-slate-950 scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Account Number Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Account Number</span>
              </>
            )}
          </button>
        </div>

        {/* Administrator Availability & Support Information */}
        <div className="pt-2 border-t border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
          <Headphones className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white block">Verification Window & Support Information</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payment verification is performed by our administrator. If the administrator is inactive or unavailable (e.g. outside standard hours), verification may be delayed. Your submission remains securely saved in Pending status. For assistance, reach our support desk at{' '}
              <strong className="text-white">contact@matchsense.ai</strong> or call <strong className="text-white">+234 800 MATCHSENSE</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. USER PAYMENT STATUS BANNER */}
      {user && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] shadow-md">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Your Payment & Verification Status
          </span>

          {/* STATE A: PAYMENT APPROVED */}
          {userPaymentState === 'PAYMENT_APPROVED' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>PAYMENT APPROVED — Paid Access Active</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Your payment has been approved by the administrator. Active plan:{' '}
                  <strong className="text-white">
                    {user.subscriptionPlan === 'PREMIUM' ? 'Premium Subscription' : 'Standard Access'}
                  </strong>{' '}
                  ({user.analysesUsed} / {user.analysesLimit} analysis requests available).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                Verified Active
              </span>
            </div>
          )}

          {/* STATE B: PAYMENT AWAITING VERIFICATION */}
          {userPaymentState === 'PAYMENT_AWAITING_VERIFICATION' && latestPayment && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>PAYMENT AWAITING VERIFICATION</span>
                </div>
                <p className="text-xs text-amber-200 font-semibold">
                  "Payment evidence submitted successfully. Your payment is awaiting verification."
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Transaction ID:{' '}
                  <strong className="text-white font-mono">{latestPayment.reference}</strong> • Amount:{' '}
                  <strong className="text-emerald-400 font-mono">
                    ₦{latestPayment.amount.toLocaleString()}
                  </strong>{' '}
                  • Date: <strong className="text-slate-200">{latestPayment.dateOfPayment}</strong>.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  If the administrator is currently inactive, your submission will remain securely marked as Pending and will be reviewed once online.
                </p>
              </div>

              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/80 text-amber-200 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                View Evidence Details
              </button>
            </div>
          )}

          {/* STATE C: PAYMENT REJECTED */}
          {userPaymentState === 'PAYMENT_REJECTED' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>PAYMENT REJECTED — Verification Unsuccessful</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  The administrator rejected this payment verification.
                  {latestPayment?.rejectionReason && (
                    <span className="text-rose-300 italic block mt-0.5">
                      Reason: "{latestPayment.rejectionReason}"
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your account remains inactive. Please review the payment account details, transfer the exact amount, and submit new evidence below.
                </p>
              </div>

              <button
                onClick={() => {
                  setTransactionReference('');
                  setReceiptData('');
                  setReceiptPreview('');
                  setReceiptFileName('');
                  document.getElementById('evidence-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-xs text-white cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit New Evidence</span>
              </button>
            </div>
          )}

          {/* STATE D: PAYMENT NOT MADE */}
          {userPaymentState === 'PAYMENT_NOT_MADE' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>PAYMENT NOT MADE — Access Not Activated</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Transfer to the SmartCash account above (₦500 for Standard Access or ₦1,000 for Premium), then submit your payment evidence below.
                </p>
              </div>

              <button
                onClick={() => {
                  document.getElementById('evidence-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition-colors cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Submit Payment Evidence</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. SUBSCRIPTION PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Tier 1: Standard Access */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-[#0F172A] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Standard Platform
              </span>
              {user?.hasInitialAccess && user.subscriptionPlan !== 'PREMIUM' && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Active
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl font-bold text-white mt-1">
              Standard Access
            </h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold font-mono text-white">
                ₦{initialPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">one-time payment</span>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Activate your MatchSense AI account to unlock the standard platform, explore live match telemetry, and access core statistical tools.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Account activation & standard dashboard</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Real-time match center & live score telemetry</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Standard statistical probability models</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{plansData?.initialAccess?.quota || 20} analysis requests included</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Full access to sports journalism articles</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPlanType('INITIAL_ACCESS');
              document.getElementById('evidence-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            {user?.hasInitialAccess ? 'Select Standard Access' : `Select Standard Access (₦${initialPrice.toLocaleString()})`}
          </button>
        </div>

        {/* Tier 2: Premium Subscription */}
        <div className="p-6 sm:p-8 rounded-3xl border border-blue-700/80 bg-gradient-to-b from-blue-950/40 via-[#0F172A] to-[#0F172A] shadow-2xl relative flex flex-col justify-between">
          <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Recommended
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Full Machine Learning Engine
              </span>
              {user?.subscriptionPlan === 'PREMIUM' && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Active Subscription
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl font-bold text-white mt-1">
              Premium Subscription
            </h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold font-mono text-emerald-400">
                ₦{premiumPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month</span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Full access to advanced machine learning models, higher query quotas, extended historical statistics, and live in-game probability estimates.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Advanced AI Sports Analyst reports (Gemini 3.8 Flash)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{plansData?.premium?.quota || 200} analysis requests per month</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Extended historical statistics & H2H depth</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Live in-game statistical probability updates</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Custom match code parser & priority features</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPlanType('PREMIUM_SUBSCRIPTION');
              document.getElementById('evidence-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-lg hover:shadow-blue-600/30 cursor-pointer"
          >
            Select Premium Subscription (₦{premiumPrice.toLocaleString()}/mo)
          </button>
        </div>
      </div>

      {/* 4. CLEAR SECTION CALLED: Submit Payment Evidence */}
      <div
        id="evidence-form-section"
        className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl space-y-6 scroll-mt-24"
      >
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">
              Submit Payment Evidence
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            After transferring to the SmartCash account (<strong>9020714762</strong>), upload your receipt screenshot and enter your transaction details below.
          </p>
        </div>

        {formSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{formSuccessMessage}</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Submissions remain in Pending status until reviewed by the administrator. Paid access is activated upon approval.
            </p>
          </div>
        )}

        {formError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Plan Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Subscription Plan:
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setSelectedPlanType('INITIAL_ACCESS')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedPlanType === 'INITIAL_ACCESS'
                    ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-white block">Standard Access</span>
                <span className="font-mono text-emerald-400 font-bold">₦500</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlanType('PREMIUM_SUBSCRIPTION')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedPlanType === 'PREMIUM_SUBSCRIPTION'
                    ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-white block">Premium Subscription</span>
                <span className="font-mono text-emerald-400 font-bold">₦1,000/mo</span>
              </button>
            </div>
          </div>

          {/* User's Full Name & Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                User's Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Alaba"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Amount Paid & Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Amount Paid (₦) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold">₦</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  required
                  min={100}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Must match exact plan amount ({selectedPlanName}: ₦{selectedAmount.toLocaleString()})
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Payment Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dateOfPayment}
                onChange={(e) => setDateOfPayment(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Transaction / Reference ID */}
          <div className="text-xs">
            <label className="text-slate-300 font-semibold block mb-1">
              Transaction / Reference ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. Bank Session ID, Transfer Reference, or Transaction Code"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Found on your bank transfer receipt, debit alert, or mobile app
            </span>
          </div>

          {/* Upload Payment Receipt or Screenshot as Evidence */}
          <div className="text-xs space-y-1.5">
            <label className="text-slate-300 font-semibold block">
              Upload Payment Receipt or Screenshot <span className="text-rose-400">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
            />

            {!receiptPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200"
              >
                <Upload className="w-6 h-6 text-blue-400" />
                <span className="font-semibold text-xs text-white">Click to upload payment receipt or screenshot</span>
                <span className="text-[10px] text-slate-500">
                  Accepts JPG, PNG, WebP screenshots or PDF documents (Max 15MB)
                </span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  {receiptData.startsWith('data:image') ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">
                      {receiptFileName || 'payment_evidence.png'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">Receipt evidence attached</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptData('');
                    setReceiptPreview('');
                    setReceiptFileName('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs transition-colors cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit for Verification Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-bold text-sm text-white transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Evidence...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              Submissions are securely stored. Paid access activates once approved by the administrator.
            </p>
          </div>
        </form>
      </div>

      {/* Trust & Architecture Statement */}
      <div className="max-w-2xl mx-auto p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure Administrator Verification Protocol</span>
        </div>
        <p className="leading-relaxed">
          Payments are verified by the administrator before accounts are activated. Transfers are verified directly against our official SmartCash account.
        </p>
      </div>

      {/* Payment Confirmation Modal (if opened via button) */}
      <PaymentModal
        isOpen={checkoutModalOpen}
        onClose={() => {
          setCheckoutModalOpen(false);
          fetchUserPaymentStatus();
        }}
        paymentType={selectedPlanType}
        amount={selectedPlanType === 'INITIAL_ACCESS' ? initialPrice : premiumPrice}
        planName={selectedPlanName}
        onSuccess={() => {
          refreshUser();
          fetchUserPaymentStatus();
        }}
      />
    </div>
  );
};
