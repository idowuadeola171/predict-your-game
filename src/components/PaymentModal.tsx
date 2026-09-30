import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { PaymentType, PaymentRecord, UserPaymentState } from '../types/index.ts';
import {
  X,
  Copy,
  Check,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User as UserIcon,
  CreditCard,
  ShieldCheck,
  Loader2,
  Mail,
  RotateCcw,
  Headphones,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType?: PaymentType;
  amount?: number;
  planName?: string;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentType: initialPaymentType = 'INITIAL_ACCESS',
  amount: initialAmount,
  planName: initialPlanName,
  onSuccess,
}) => {
  const { user, token, refreshUser } = useAuth();
  const { toast } = useNotification();

  // Selected Plan state
  const [selectedPlan, setSelectedPlan] = useState<PaymentType>(initialPaymentType);
  const selectedAmount = selectedPlan === 'INITIAL_ACCESS' ? 500 : 1000;
  const selectedPlanName =
    selectedPlan === 'INITIAL_ACCESS' ? 'Standard Access' : 'Premium Subscription';

  // Form Fields as explicitly requested:
  // - User's full name
  // - Email address
  // - Amount paid
  // - Payment date
  // - Transaction/reference ID
  // - Upload payment receipt or screenshot as evidence
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

  // UI state
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<PaymentRecord | null>(null);

  // User payment state from backend
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [userPaymentState, setUserPaymentState] = useState<UserPaymentState>('PAYMENT_NOT_MADE');
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedPlan(initialPaymentType);
    setAmountPaid(initialPaymentType === 'INITIAL_ACCESS' ? 500 : 1000);
  }, [initialPaymentType, initialAmount]);

  useEffect(() => {
    if (user?.fullName && !fullName) {
      setFullName(user.fullName);
    }
    if (user?.email && !emailAddress) {
      setEmailAddress(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && token) {
      fetchPaymentStatus();
    }
  }, [isOpen, token]);

  const fetchPaymentStatus = async () => {
    if (!token) return;
    setPaymentStatusLoading(true);
    try {
      const res = await fetch('/api/payments/my-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserPaymentState(data.state);
        setLatestPayment(data.latestPayment);
        if (data.latestPayment && data.state === 'PAYMENT_AWAITING_VERIFICATION') {
          setSubmittedRecord(data.latestPayment);
          setSubmissionSuccess(true);
        }
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    } finally {
      setPaymentStatusLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText('9020714762');
    setCopied(true);
    toast('Account number 9020714762 copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePlanSelect = (type: PaymentType) => {
    setSelectedPlan(type);
    setAmountPaid(type === 'INITIAL_ACCESS' ? 500 : 1000);
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

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token || !user) {
      toast('Please log in to submit your payment evidence', 'error');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Please enter the user's full name.");
      return;
    }

    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!transactionReference.trim()) {
      setErrorMessage('Please enter your transaction/reference ID from your bank transfer.');
      return;
    }

    if (!dateOfPayment) {
      setErrorMessage('Please specify the date of payment.');
      return;
    }

    if (!receiptData) {
      setErrorMessage('Please upload your payment receipt or screenshot as evidence.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/payments/submit-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentType: selectedPlan,
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

      setSubmittedRecord(data.payment);
      setSubmissionSuccess(true);
      setUserPaymentState('PAYMENT_AWAITING_VERIFICATION');
      await refreshUser();
      toast('Payment evidence submitted successfully. Your payment is awaiting verification.', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNewEvidence = () => {
    setSubmissionSuccess(false);
    setUserPaymentState('PAYMENT_NOT_MADE');
    setTransactionReference('');
    setReceiptData('');
    setReceiptFileName('');
    setReceiptPreview('');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-3xl border border-slate-800 bg-[#0F172A] p-5 sm:p-7 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* State 1: Awaiting Verification Screen */}
        {submissionSuccess && (
          <div className="py-4 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-800/80 text-amber-300">
                Pending Administrator Verification
              </span>
              <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                Payment evidence submitted successfully. Your payment is awaiting verification.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your payment evidence has been recorded securely. Our administrator will review your transfer to the SmartCash account and activate your paid access upon approval.
              </p>
            </div>

            {/* Inactivity & Delay notice */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Headphones className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Verification Window & Support Information</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Administrator manual verification typically completes shortly. If the administrator is inactive or unavailable (e.g., outside standard hours), verification may be delayed. Your submission is securely stored and will remain in Pending status until reviewed.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex flex-col sm:flex-row gap-2 justify-between">
                <span>Support Email: <strong className="text-white">contact@matchsense.ai</strong></span>
                <span>Phone: <strong className="text-white">+234 800 MATCHSENSE</strong></span>
              </div>
            </div>

            {/* Submission Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2.5 font-mono">
              <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-sans font-medium text-slate-300">Status:</span>
                <span className="text-amber-400 font-bold font-sans flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Full Name:</span>
                <span className="text-white font-sans font-semibold">{submittedRecord?.userName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Email Address:</span>
                <span className="text-slate-200">{submittedRecord?.userEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Plan Selected:</span>
                <span className="text-white font-sans font-semibold">
                  {submittedRecord?.paymentType === 'PREMIUM_SUBSCRIPTION'
                    ? 'Premium Subscription'
                    : 'Standard Access'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Amount Paid:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ₦{submittedRecord?.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Transaction / Reference ID:</span>
                <span className="text-slate-200">{submittedRecord?.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Payment Date:</span>
                <span className="text-slate-200">{submittedRecord?.dateOfPayment}</span>
              </div>
              {submittedRecord?.receiptFileName && (
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="font-sans">Payment Evidence:</span>
                  <span className="text-blue-400 flex items-center gap-1 font-sans">
                    <FileText className="w-3.5 h-3.5" /> {submittedRecord.receiptFileName}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

        {/* State 2: Already Approved Screen */}
        {!submissionSuccess && userPaymentState === 'PAYMENT_APPROVED' && (
          <div className="py-4 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                Account Active & Verified
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Your payment has been approved by the administrator. Full platform intelligence features are active.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-bold">Active Verified</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Plan:</span>
                <span className="text-white font-semibold">{user?.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Analyses Quota:</span>
                <span className="text-slate-200 font-mono">
                  {user?.analysesUsed} / {user?.analysesLimit} analyses
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        )}

        {/* State 3: Payment Account & Submit Payment Evidence Form */}
        {!submissionSuccess && userPaymentState !== 'PAYMENT_APPROVED' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Direct Bank Transfer & Verification
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                Payment Account & Evidence Submission
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Transfer the exact subscription amount to our official SmartCash account below, then upload your payment evidence for administrator review.
              </p>
            </div>

            {/* Rejection Alert if previously rejected */}
            {userPaymentState === 'PAYMENT_REJECTED' && latestPayment && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Payment Verification Unsuccessful</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your previous submission (Transaction ID:{' '}
                  <strong className="text-white font-mono">{latestPayment.reference}</strong>) was rejected by the administrator:
                </p>
                <div className="p-2.5 rounded-lg bg-black/40 border border-rose-900/50 text-rose-200 font-sans text-xs italic">
                  "{latestPayment.rejectionReason || 'Transfer details could not be verified on our SmartCash bank statement. Please verify and submit new evidence.'}"
                </div>
                <p className="text-slate-400 text-[11px]">
                  Your account remains inactive. Please review the account details below, transfer the exact amount, and submit new evidence.
                </p>
              </div>
            )}

            {/* 1. PAYMENT ACCOUNT DETAILS - Prominently Displayed */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                    SC
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Official Payment Account</span>
                    <span className="text-[10px] text-emerald-400 font-medium">SmartCash Payment Service Bank</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Verified Account
                </span>
              </div>

              {/* Account Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Payment Provider:</span>
                  <span className="text-white font-bold text-sm">SmartCash</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Account Name:</span>
                  <span className="text-white font-bold text-sm tracking-wide">
                    Idowu Joseph Adeola
                  </span>
                </div>

                {/* Account Number with prominent Copy Button */}
                <div className="pt-2 pb-1 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      Account Number
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-wider">
                      9020714762
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 scale-95'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Account Number</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transfer Instruction & Administrator Inactivity Notice */}
              <div className="pt-3 border-t border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-amber-300 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Important:</strong> Transfer the exact amount to the account above, then submit your payment evidence below for verification.
                  </span>
                </div>

                <div className="flex items-start gap-2 text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px]">
                  <Headphones className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    If the administrator is inactive or unavailable, verification may be delayed. Your submission remains securely saved in Pending status. For assistance, contact support at <strong>contact@matchsense.ai</strong> or <strong>+234 800 MATCHSENSE</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Select Plan Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Subscription Plan:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePlanSelect('INITIAL_ACCESS')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'INITIAL_ACCESS'
                      ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-blue-400 block">
                    Standard Access
                  </span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">₦500</div>
                  <span className="text-[10px] text-slate-400 mt-1 block">One-time payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlanSelect('PREMIUM_SUBSCRIPTION')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'PREMIUM_SUBSCRIPTION'
                      ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-purple-400 block">
                    Premium Subscription
                  </span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">₦1,000</div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Monthly access</span>
                </button>
              </div>
            </div>

            {/* SECTION CALLED: Submit Payment Evidence */}
            <form onSubmit={handleSubmitVerification} className="space-y-4 pt-1">
              <div className="border-t border-slate-800 pt-4">
                <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Submit Payment Evidence
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete the fields below and attach your payment receipt or transfer screenshot for verification.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
                      placeholder="e.g. John Doe"
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
                    Must match plan price ({selectedPlanName}: ₦{selectedAmount.toLocaleString()})
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
                  Found on your bank debit alert, transfer receipt, or mobile app confirmation
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
                    className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200"
                  >
                    <Upload className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-xs text-white">Upload receipt screenshot or PDF document</span>
                    <span className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WebP screenshots or PDF receipt files (Max 15MB)
                    </span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      {receiptData.startsWith('data:image') ? (
                        <img
                          src={receiptPreview}
                          alt="Payment Evidence Preview"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {receiptFileName || 'payment_evidence.png'}
                        </span>
                        <span className="text-[10px] text-emerald-400">Evidence attached</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReceiptData('');
                        setReceiptPreview('');
                        setReceiptFileName('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs transition-colors cursor-pointer shrink-0"
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
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-bold text-xs sm:text-sm text-white transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Evidence...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-500 mt-2">
                  Administrator approval is required before activating paid access. Submissions are securely verified.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
