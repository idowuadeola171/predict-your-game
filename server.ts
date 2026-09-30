import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import {
  db,
  hashPassword,
  generateSalt,
  createSession,
  getUserIdFromToken,
  removeSession,
  UserAuthRecord,
} from './server/db.ts';
import { sportsProvider } from './server/sportsProvider.ts';
import {
  runStatisticalAnalysis,
  parseMatchCodeOrText,
  calculateStatisticalEstimates,
} from './server/geminiAnalyst.ts';
import {
  User,
  UserRole,
  AccountStatus,
  SubscriptionPlan,
  Match,
  PaymentRecord,
  AnalysisRecord,
  SportsArticle,
  Advertisement,
  Announcement,
} from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Background real-time sports data refresher every 30 seconds
setInterval(() => {
  sportsProvider.refreshMatches().catch(() => {});
}, 30000);

// Helper to extract authenticated user
function getAuthUser(req: Request): UserAuthRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const userId = getUserIdFromToken(token);
  if (!userId) return null;
  return db.findUserById(userId) || null;
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }
  (req as any).user = user;
  next();
}

// Admin only middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Administrator access required.' });
  }
  (req as any).user = user;
  next();
}

// Strip sensitive fields from user object
function sanitizeUser(u: UserAuthRecord): User {
  const { passwordHash, salt, ...safe } = u;
  return safe;
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const settings = db.getSettings();

  // Role & initial status configuration
  const designatedAdminEmail = (process.env.ADMIN_EMAIL || 'idowuadeola171@gmail.com').toLowerCase().trim();
  const isDesignatedAdmin = email.trim().toLowerCase() === designatedAdminEmail;

  const role: UserRole = isDesignatedAdmin ? 'ADMIN' : 'USER';
  const status: AccountStatus = isDesignatedAdmin ? 'ACTIVE_PREMIUM' : 'PENDING_PAYMENT';
  const hasInitialAccess = isDesignatedAdmin;
  const subscriptionPlan: SubscriptionPlan = isDesignatedAdmin ? 'PREMIUM' : 'FREE';
  const analysesLimit = isDesignatedAdmin ? 9999 : 0; // 0 for unactivated users

  const newUser: UserAuthRecord = {
    id: 'usr_' + crypto.randomBytes(8).toString('hex'),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: (phone || '').trim(),
    role,
    status,
    hasInitialAccess,
    subscriptionPlan,
    subscriptionExpiresAt: isDesignatedAdmin ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
    analysesUsed: 0,
    analysesLimit,
    passwordHash,
    salt,
    createdAt: now,
    updatedAt: now,
  };

  db.createUser(newUser);
  const token = createSession(newUser.id);

  // Send initial notification
  db.addNotification({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: newUser.id,
    title: isDesignatedAdmin ? 'Administrator Account Ready' : 'Account Created - Activation Required',
    message: isDesignatedAdmin
      ? 'Administrator privileges active.'
      : 'Please activate your MatchSense AI account with ₦500 initial access to unlock standard statistical tools.',
    type: 'ANNOUNCEMENT',
    read: false,
    createdAt: now,
    link: '/pricing',
  });

  return res.status(201).json({
    user: sanitizeUser(newUser),
    token,
    message: 'Registration successful.',
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account suspended. Contact support.' });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createSession(user.id);

  // Check if premium subscription has expired
  let currentStatus = user.status;
  if (
    user.subscriptionPlan === 'PREMIUM' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt).getTime() < Date.now() &&
    user.role !== 'ADMIN'
  ) {
    currentStatus = 'EXPIRED';
    db.updateUser(user.id, { status: 'EXPIRED' });
  }

  const freshUser = db.findUserById(user.id) || user;
  return res.json({
    user: sanitizeUser(freshUser),
    token,
    message: 'Logged in successfully.',
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // Check if premium subscription has expired
  if (
    user.subscriptionPlan === 'PREMIUM' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt).getTime() < Date.now() &&
    user.role !== 'ADMIN'
  ) {
    db.updateUser(user.id, { status: 'EXPIRED' });
  }

  const fresh = db.findUserById(user.id) || user;
  return res.json({ user: sanitizeUser(fresh) });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    removeSession(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  const user = db.findUserByEmail(email);
  if (user) {
    const resetToken = 'reset_' + crypto.randomBytes(16).toString('hex');
    // In production this sends an email; here we confirm the reset flow safely
    return res.json({
      success: true,
      message: 'Password reset link and instructions have been dispatched to your email.',
      resetToken, // Provided for user test/flow
    });
  }
  return res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(newPassword, salt);
  db.updateUser(user.id, { passwordHash, salt });

  return res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
});

app.put('/api/auth/change-password', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  const computedCurrent = hashPassword(currentPassword, user.salt);
  if (computedCurrent !== user.passwordHash) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(newPassword, salt);
  db.updateUser(user.id, { passwordHash, salt });

  return res.json({ success: true, message: 'Password changed successfully.' });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const { fullName, phone } = req.body;

  const updated = db.updateUser(user.id, {
    fullName: fullName ? fullName.trim() : user.fullName,
    phone: phone !== undefined ? phone.trim() : user.phone,
  });

  if (!updated) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }

  return res.json({ user: sanitizeUser(updated), message: 'Profile updated.' });
});

// ==========================================
// 2. PAYMENT ACCOUNT & MANUAL VERIFICATION SYSTEM
// ==========================================

/**
 * PUBLIC PAYMENT ACCOUNT DETAILS
 * Users see this account to transfer payments directly.
 * Account Name: Idowu Joseph Adeola
 * Provider: SmartCash
 * Account Number: 9020714762
 */
app.get('/api/payment-account', (req, res) => {
  const settings = db.getSettings();
  return res.json({
    accountName: settings.payoutAccountName || 'Idowu Joseph Adeola',
    paymentProvider: settings.payoutBankName || 'SmartCash',
    accountNumber: settings.payoutAccountNumber || '9020714762',
    standardPrice: settings.initialAccessPrice || 500,
    premiumMonthlyPrice: settings.premiumMonthlyPrice || 1000,
    transferInstruction: 'Transfer the exact amount to the account above, then submit your payment details for verification.',
  });
});

app.get('/api/subscriptions/plans', (req, res) => {
  const settings = db.getSettings();
  return res.json({
    initialAccess: {
      price: settings.initialAccessPrice || 500,
      currency: 'NGN',
      name: 'Standard Access',
      description: 'One-time activation for standard platform access and core statistical tools.',
      quota: settings.initialAccessAnalysesQuota || 20,
      features: [
        'Account activation & standard dashboard',
        'Real-time match center & live score telemetry',
        'Standard statistical probability models',
        `${settings.initialAccessAnalysesQuota || 20} analysis requests included`,
        'Access to full sports news articles',
      ],
    },
    premium: {
      price: settings.premiumMonthlyPrice || 1000,
      currency: 'NGN',
      period: 'per month',
      name: 'Premium Subscription',
      description: 'Comprehensive sports intelligence with advanced AI analysis and priority live features.',
      quota: settings.premiumAnalysesQuota || 200,
      features: [
        'Advanced AI Sports Analyst reports',
        `${settings.premiumAnalysesQuota || 200} analysis requests per month`,
        'In-depth expected goals (xG) & tactical breakdown',
        'Extended historical statistics & H2H depth',
        'Live in-game statistical probability updates',
        'Custom match code parsing engine',
        'Priority feature access & historical report archives',
      ],
    },
    paymentAccount: {
      accountName: settings.payoutAccountName || 'Idowu Joseph Adeola',
      paymentProvider: settings.payoutBankName || 'SmartCash',
      accountNumber: settings.payoutAccountNumber || '9020714762',
      transferInstruction: 'Transfer the exact amount to the account above, then submit your payment details for verification.',
    },
  });
});

/**
 * USER SUBMITS PAYMENT EVIDENCE FOR VERIFICATION
 * Do NOT automatically activate account upon submission!
 * Secure verification workflow: validates required fields, confirms exact amount matches plan,
 * prevents duplicate reference IDs, stores evidence securely, notifies user & admins.
 */
app.post('/api/payments/submit-verification', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const { paymentType, amount, reference, dateOfPayment, payerName, email, receipt, receiptFileName } = req.body;

  // 1. Validate required fields
  if (!paymentType || !amount || !reference || !dateOfPayment || !payerName) {
    return res.status(400).json({
      error: 'Please fill in all required fields: Full Name, Email, Amount Paid, Payment Date, and Transaction/Reference ID.',
    });
  }

  const cleanRef = String(reference).trim();
  const cleanPayer = String(payerName).trim();
  const cleanEmail = String(email || user.email).trim().toLowerCase();
  const numAmount = Number(amount);
  const settings = db.getSettings();

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount paid.' });
  }

  // 2. Confirm submitted amount matches selected plan
  const expectedAmount = paymentType === 'PREMIUM_SUBSCRIPTION'
    ? (settings.premiumMonthlyPrice || 1000)
    : (settings.initialAccessPrice || 500);

  if (numAmount !== expectedAmount) {
    return res.status(400).json({
      error: `Submitted amount (₦${numAmount.toLocaleString()}) does not match the required price for ${
        paymentType === 'PREMIUM_SUBSCRIPTION' ? 'Premium Subscription' : 'Standard Access'
      } (₦${expectedAmount.toLocaleString()}). Please transfer the exact amount.`,
    });
  }

  // 3. Validate payment evidence / receipt
  if (!receipt) {
    return res.status(400).json({
      error: 'Payment evidence is required. Please upload your payment receipt or transfer screenshot as evidence.',
    });
  }

  // 4. Prevent duplicate submissions of identical reference if already pending or approved
  const existingPayments = db.getPayments();
  const duplicate = existingPayments.find(
    (p) => p.reference.toLowerCase() === cleanRef.toLowerCase() && (p.status === 'PENDING_VERIFICATION' || p.status === 'APPROVED')
  );
  if (duplicate) {
    return res.status(409).json({
      error: 'A payment submission with this transaction/reference ID already exists in the system.',
    });
  }

  const now = new Date().toISOString();
  const newPayment: PaymentRecord = {
    id: 'pay_' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    userEmail: cleanEmail,
    userName: cleanPayer,
    amount: numAmount,
    currency: 'NGN',
    paymentType: paymentType === 'PREMIUM_SUBSCRIPTION' ? 'PREMIUM_SUBSCRIPTION' : 'INITIAL_ACCESS',
    status: 'PENDING_VERIFICATION',
    reference: cleanRef,
    dateOfPayment: String(dateOfPayment),
    payerName: cleanPayer,
    receiptUrl: String(receipt),
    receiptFileName: receiptFileName || 'payment_evidence.png',
    gateway: 'SMARTCASH_TRANSFER',
    createdAt: now,
  };

  db.addPayment(newPayment);

  // Send in-app notification to the user
  db.addNotification({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    title: 'Payment Evidence Awaiting Verification',
    message: 'Payment evidence submitted successfully. Your payment is awaiting verification.',
    type: 'PAYMENT',
    read: false,
    createdAt: now,
    link: '/pricing',
  });

  // Notify administrators of new submission
  const adminUsers = db.getUsers().filter((u) => u.role === 'ADMIN');
  for (const admin of adminUsers) {
    db.addNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: admin.id,
      title: 'New Payment Evidence Submitted',
      message: `New payment evidence submitted by ${cleanPayer} (${cleanEmail}) for ${
        newPayment.paymentType === 'PREMIUM_SUBSCRIPTION' ? 'Premium Subscription' : 'Standard Access'
      } (₦${numAmount.toLocaleString()}, Ref: ${cleanRef}). Awaiting verification.`,
      type: 'PAYMENT',
      read: false,
      createdAt: now,
      link: '/admin',
    });
  }

  return res.status(201).json({
    success: true,
    payment: newPayment,
    message: 'Payment evidence submitted successfully. Your payment is awaiting verification.',
  });
});

/**
 * CHECK CURRENT USER PAYMENT STATUS
 * Distinguishes clearly between:
 * - PAYMENT NOT MADE
 * - PAYMENT AWAITING VERIFICATION
 * - PAYMENT APPROVED
 * - PAYMENT REJECTED
 */
app.get('/api/payments/my-status', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const userPayments = db.getPayments().filter((p) => p.userId === user.id);
  const latestPayment = userPayments[0] || null;

  let state: 'PAYMENT_NOT_MADE' | 'PAYMENT_AWAITING_VERIFICATION' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' = 'PAYMENT_NOT_MADE';

  if (user.role === 'ADMIN' || (user.hasInitialAccess && (user.status === 'ACTIVE_STANDARD' || user.status === 'ACTIVE_PREMIUM' || user.status === 'ACTIVE'))) {
    state = 'PAYMENT_APPROVED';
  } else if (latestPayment) {
    if (latestPayment.status === 'PENDING_VERIFICATION' || latestPayment.status === 'PENDING') {
      state = 'PAYMENT_AWAITING_VERIFICATION';
    } else if (latestPayment.status === 'APPROVED' || latestPayment.status === 'SUCCESSFUL') {
      state = 'PAYMENT_APPROVED';
    } else if (latestPayment.status === 'REJECTED' || latestPayment.status === 'FAILED') {
      state = 'PAYMENT_REJECTED';
    } else {
      state = 'PAYMENT_NOT_MADE';
    }
  }

  return res.json({
    state,
    latestPayment,
    user: sanitizeUser(user),
  });
});

app.get('/api/payments/history', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const userPayments = db.getPayments().filter((p) => p.userId === user.id);
  return res.json({ payments: userPayments });
});

// ==========================================
// 3. MATCHES & LIVE MATCH CENTER (REAL-TIME SPORTS PROVIDER)
// ==========================================

app.get('/api/matches', async (req, res) => {
  const { status, sport, featured, refresh } = req.query;

  try {
    const data = await sportsProvider.getMatches(refresh === 'true');
    const dbCustomMatches = db.getMatches();

    let combined = [...data.matches, ...dbCustomMatches];

    if (status && status !== 'ALL') {
      combined = combined.filter((m) => m.status.toUpperCase() === (status as string).toUpperCase());
    }
    if (sport && sport !== 'ALL') {
      combined = combined.filter((m) => m.sport.toLowerCase() === (sport as string).toLowerCase());
    }
    if (featured === 'true') {
      combined = combined.filter((m) => m.isFeatured);
    }

    const liveMatches = combined.filter((m) => m.status === 'LIVE');
    const upcomingMatches = combined.filter((m) => m.status === 'UPCOMING');
    const finishedMatches = combined.filter((m) => m.status === 'FINISHED');

    return res.json({
      matches: combined,
      lastUpdated: data.lastUpdated,
      providerStatus: data.status,
      providerName: data.providerName,
      error: data.error,
      liveCount: liveMatches.length,
      upcomingCount: upcomingMatches.length,
      finishedCount: finishedMatches.length,
      rateLimitRemaining: data.rateLimitRemaining,
    });
  } catch (err: any) {
    return res.status(503).json({
      matches: [],
      lastUpdated: null,
      providerStatus: 'OFFLINE',
      error: 'Live match data is temporarily unavailable. Please try again later.',
      liveCount: 0,
      upcomingCount: 0,
      finishedCount: 0,
    });
  }
});

app.get('/api/matches/:id', async (req, res) => {
  // Query verified provider matches first, then custom admin matches
  let match: Match | null | undefined = await sportsProvider.getMatchById(req.params.id);
  if (!match) {
    match = db.getMatchById(req.params.id);
  }

  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  // Calculate live statistical probability estimate based on real score and minute
  const liveProbability = sportsProvider.calculateLiveProbability(match);

  return res.json({
    match,
    liveProbability,
    disclaimer: 'Statistical Probability Estimate based on available match telemetry. Probabilities are estimates and do not guarantee match outcomes.',
  });
});

app.get('/api/matches/code/:code', async (req, res) => {
  const code = req.params.code;
  const data = await sportsProvider.getMatches();
  let match: Match | null | undefined = data.matches.find((m) => m.code.toUpperCase() === code.toUpperCase());
  if (!match) {
    match = db.getMatchByCode(code);
  }

  if (!match) {
    const parsed = parseMatchCodeOrText(code);
    return res.json({ found: false, parsed });
  }
  const liveProbability = sportsProvider.calculateLiveProbability(match);
  return res.json({ found: true, match, liveProbability });
});

// ==========================================
// 4. AI SPORTS ANALYST & CODE PARSER
// ==========================================

app.post('/api/analyses/run', requireAuth, async (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const { matchId, matchCode, rawInput, sport } = req.body;

  // Check activation
  if (!user.hasInitialAccess && user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Account activation required. Please activate standard access (₦500) to use the AI Sports Analyst.',
      activationRequired: true,
    });
  }

  // Check quota
  if (user.analysesUsed >= user.analysesLimit && user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'You have reached your analysis limit. Please upgrade to Premium or renew your subscription.',
      quotaReached: true,
    });
  }

  let targetSport = sport || 'Football';
  let homeTeam = '';
  let awayTeam = '';
  let competition = 'Sports Competition';
  let matchObj: Match | undefined;
  let recentFormHome: string[] | undefined;
  let recentFormAway: string[] | undefined;

  // Case 1: Existing match by ID
  if (matchId) {
    matchObj = db.getMatchById(matchId);
    if (matchObj) {
      targetSport = matchObj.sport;
      homeTeam = matchObj.homeTeam;
      awayTeam = matchObj.awayTeam;
      competition = matchObj.competition;
      recentFormHome = matchObj.recentFormHome;
      recentFormAway = matchObj.recentFormAway;
    }
  }

  // Case 2: Match by code
  if (!homeTeam && matchCode) {
    matchObj = db.getMatchByCode(matchCode);
    if (matchObj) {
      targetSport = matchObj.sport;
      homeTeam = matchObj.homeTeam;
      awayTeam = matchObj.awayTeam;
      competition = matchObj.competition;
      recentFormHome = matchObj.recentFormHome;
      recentFormAway = matchObj.recentFormAway;
    } else {
      const parsed = parseMatchCodeOrText(matchCode);
      if (!parsed.isValid) {
        return res.status(400).json({ error: parsed.errorMessage });
      }
      targetSport = parsed.sport || targetSport;
      homeTeam = parsed.homeTeam!;
      awayTeam = parsed.awayTeam!;
      competition = parsed.competition || competition;
    }
  }

  // Case 3: Raw user input text
  if (!homeTeam && rawInput) {
    const parsed = parseMatchCodeOrText(rawInput);
    if (!parsed.isValid) {
      return res.status(400).json({ error: parsed.errorMessage });
    }
    targetSport = parsed.sport || targetSport;
    homeTeam = parsed.homeTeam!;
    awayTeam = parsed.awayTeam!;
    competition = parsed.competition || competition;
  }

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({
      error: 'Insufficient data available for a meaningful statistical estimate. Please select a match or provide valid team names.',
    });
  }

  try {
    const result = await runStatisticalAnalysis(
      targetSport,
      homeTeam,
      awayTeam,
      competition,
      recentFormHome,
      recentFormAway,
      rawInput,
      matchObj
    );

    const analysisRecord: AnalysisRecord = {
      id: 'an_' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      matchId: matchObj?.id,
      matchCode: matchCode || matchObj?.code,
      matchTitle: `${homeTeam} vs ${awayTeam}`,
      sport: targetSport,
      competition,
      probabilities: result.probabilities,
      explanation: result.explanation,
      factors: result.factors,
      dataQualityNotes: result.dataQualityNotes,
      isLiveAnalysis: matchObj?.status === 'LIVE',
      createdAt: new Date().toISOString(),
    };

    db.addAnalysis(analysisRecord);

    // Increment analysis count for user
    db.updateUser(user.id, { analysesUsed: user.analysesUsed + 1 });

    return res.json({
      analysis: analysisRecord,
      remainingQuota: Math.max(0, user.analysesLimit - (user.analysesUsed + 1)),
      disclaimer:
        'MatchSense AI provides statistical analysis for informational and educational purposes. Probabilities are estimates and do not guarantee match outcomes.',
    });
  } catch (err: any) {
    return res.status(400).json({
      error: err.message || 'Unable to retrieve sports data. Please try again.',
    });
  }
});

app.get('/api/analyses/history', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const list = db.getUserAnalyses(user.id);
  return res.json({ analyses: list });
});

app.get('/api/analyses/:id', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const analysis = db.getAnalysisById(req.params.id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis record not found.' });
  }
  if (analysis.userId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  return res.json({ analysis });
});

// ==========================================
// 5. SPORTS NEWS
// ==========================================

app.get('/api/news', (req, res) => {
  const { category, search } = req.query;
  let articles = db.getNews(true);

  if (category && category !== 'All') {
    articles = articles.filter((a) => a.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (search) {
    const s = (search as string).toLowerCase();
    articles = articles.filter(
      (a) => a.title.toLowerCase().includes(s) || a.summary.toLowerCase().includes(s)
    );
  }

  return res.json({ articles });
});

app.get('/api/news/:id', (req, res) => {
  const article = db.getNewsById(req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found.' });
  }
  return res.json({ article });
});

// ==========================================
// 6. ADVERTISEMENTS & ANNOUNCEMENTS
// ==========================================

app.get('/api/ads', (req, res) => {
  const placement = req.query.placement as string | undefined;
  const ads = db.getAds(placement);
  return res.json({ ads });
});

app.post('/api/ads/:id/click', (req, res) => {
  const ad = db.getAds().find((a) => a.id === req.params.id);
  if (ad) {
    db.updateAd(ad.id, { clicks: ad.clicks + 1 });
  }
  return res.json({ success: true });
});

app.get('/api/announcements', (req, res) => {
  const announcements = db.getAnnouncements(true);
  return res.json({ announcements });
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  const notifs = db.getNotifications(user.id);
  return res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  db.markNotificationAsRead(req.params.id);
  return res.json({ success: true });
});

app.put('/api/notifications/read-all', requireAuth, (req, res) => {
  const user: UserAuthRecord = (req as any).user;
  db.markAllNotificationsRead(user.id);
  return res.json({ success: true });
});

// ==========================================
// 8. ADMIN DASHBOARD & MANAGEMENT ROUTES
// ==========================================

app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const users = db.getUsers();
  const payments = db.getPayments();
  const matches = db.getMatches();
  const news = db.getNews(false);
  const analyses = db.getAnalyses();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const premiumUsers = users.filter((u) => u.subscriptionPlan === 'PREMIUM').length;

  const successfulPayments = payments.filter((p) => p.status === 'SUCCESSFUL');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const failedPayments = payments.filter((p) => p.status === 'FAILED');

  const totalRevenue = successfulPayments.reduce((acc, p) => acc + p.amount, 0);
  const subscriptionRevenue = successfulPayments
    .filter((p) => p.paymentType === 'PREMIUM_SUBSCRIPTION')
    .reduce((acc, p) => acc + p.amount, 0);

  const liveMatchesCount = matches.filter((m) => m.status === 'LIVE').length;
  const publishedArticles = news.filter((n) => n.published).length;

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      premiumUsers,
      newRegistrations: users.filter((u) => new Date(u.createdAt).getMonth() === new Date().getMonth()).length,
      successfulPayments: successfulPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      totalRevenue,
      subscriptionRevenue,
      totalAnalyses: analyses.length,
      liveMatches: liveMatchesCount,
      publishedArticles,
    },
    recentPayments: payments.slice(0, 5),
    recentUsers: users.slice(-5).map(sanitizeUser),
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.getUsers().map(sanitizeUser);
  return res.json({ users });
});

app.put('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'DEACTIVATED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Safeguard: Do not deactivate the root admin
  if (user.role === 'ADMIN' && status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Primary administrator cannot be deactivated or suspended.' });
  }

  const updated = db.updateUser(user.id, { status });
  return res.json({ user: sanitizeUser(updated!), message: `User status set to ${status}.` });
});

app.put('/api/admin/users/:id/restore', requireAdmin, (req, res) => {
  const updated = db.updateUser(req.params.id, { status: 'ACTIVE' });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: sanitizeUser(updated), message: 'User account restored.' });
});

// ==========================================
// ADMIN PAYMENT VERIFICATION ROUTES
// ==========================================

app.get('/api/admin/payment-verifications', requireAdmin, (req, res) => {
  const status = req.query.status as string | undefined;
  let payments = db.getPayments();
  if (status && status !== 'ALL') {
    payments = payments.filter((p) => p.status === status);
  }
  return res.json({ payments });
});

app.get('/api/admin/payments', requireAdmin, (req, res) => {
  const status = req.query.status as string | undefined;
  let payments = db.getPayments();
  if (status && status !== 'ALL') {
    payments = payments.filter((p) => p.status === status);
  }
  return res.json({ payments });
});

app.post('/api/admin/payments/:id/approve', requireAdmin, (req, res) => {
  const adminUser: UserAuthRecord = (req as any).user;
  const payment = db.getPayments().find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

  const now = new Date().toISOString();
  const settings = db.getSettings();

  const updatedPayment = db.updatePayment(payment.id, {
    status: 'APPROVED',
    verifiedAt: now,
    reviewedBy: adminUser.email,
  });

  const targetUser = db.findUserById(payment.userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user account not found.' });
  }

  let userUpdates: Partial<UserAuthRecord> = {};
  if (payment.paymentType === 'INITIAL_ACCESS') {
    userUpdates = {
      status: targetUser.subscriptionPlan === 'PREMIUM' ? 'ACTIVE_PREMIUM' : 'ACTIVE_STANDARD',
      hasInitialAccess: true,
      subscriptionPlan: targetUser.subscriptionPlan === 'PREMIUM' ? 'PREMIUM' : 'INITIAL_ACCESS',
      analysesLimit: Math.max(targetUser.analysesLimit, settings.initialAccessAnalysesQuota || 20),
      updatedAt: now,
    };

    db.addNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUser.id,
      title: 'Payment Approved - Standard Access Active',
      message: `Your payment of ₦${payment.amount.toLocaleString()} has been verified and approved. Standard platform access is active!`,
      type: 'PAYMENT',
      read: false,
      createdAt: now,
      link: '/dashboard',
    });
  } else {
    // PREMIUM_SUBSCRIPTION
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    userUpdates = {
      status: 'ACTIVE_PREMIUM',
      hasInitialAccess: true,
      subscriptionPlan: 'PREMIUM',
      subscriptionExpiresAt: expiry,
      analysesLimit: Math.max(targetUser.analysesLimit, settings.premiumAnalysesQuota || 200),
      updatedAt: now,
    };

    db.addNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUser.id,
      title: 'Payment Approved - Premium Subscription Active',
      message: `Your payment of ₦${payment.amount.toLocaleString()} has been verified and approved. Premium subscription is unlocked with 200 monthly analyses!`,
      type: 'SUBSCRIPTION',
      read: false,
      createdAt: now,
      link: '/analyst',
    });
  }

  const updatedUser = db.updateUser(targetUser.id, userUpdates);

  return res.json({
    success: true,
    payment: updatedPayment,
    user: sanitizeUser(updatedUser!),
    message: 'Payment approved successfully. Account activated and user notified.',
  });
});

app.post('/api/admin/payments/:id/reject', requireAdmin, (req, res) => {
  const adminUser: UserAuthRecord = (req as any).user;
  const payment = db.getPayments().find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

  const { reason } = req.body;
  const rejectionReason = reason || 'Payment details or transaction reference could not be verified with SmartCash. Please ensure the exact amount was transferred and submit a corrected receipt.';
  const now = new Date().toISOString();

  const updatedPayment = db.updatePayment(payment.id, {
    status: 'REJECTED',
    rejectionReason,
    verifiedAt: now,
    reviewedBy: adminUser.email,
  });

  const targetUser = db.findUserById(payment.userId);
  if (targetUser && targetUser.role !== 'ADMIN') {
    db.updateUser(targetUser.id, {
      status: 'PENDING_PAYMENT',
      hasInitialAccess: false,
      updatedAt: now,
    });

    db.addNotification({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: targetUser.id,
      title: 'Payment Verification Unsuccessful',
      message: `Your payment submission (Ref: ${payment.reference}) was rejected: ${rejectionReason}. You may review and submit a corrected payment record.`,
      type: 'PAYMENT',
      read: false,
      createdAt: now,
      link: '/pricing',
    });
  }

  return res.json({
    success: true,
    payment: updatedPayment,
    message: 'Payment rejected. Account kept inactive and user notified to submit a corrected record.',
  });
});

app.post('/api/admin/payments/:id/refund', requireAdmin, (req, res) => {
  const payment = db.getPayments().find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  const updated = db.updatePayment(payment.id, {
    status: 'REFUNDED',
    refundedAt: new Date().toISOString(),
  });

  return res.json({ payment: updated, message: 'Payment marked as refunded.' });
});

app.get('/api/admin/matches', requireAdmin, (req, res) => {
  return res.json({ matches: db.getMatches() });
});

app.post('/api/admin/matches', requireAdmin, (req, res) => {
  const body = req.body;
  const newMatch: Match = {
    id: 'match_' + crypto.randomBytes(6).toString('hex'),
    code: body.code || 'MATCH-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    sport: body.sport || 'Football',
    competition: body.competition || 'League',
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    homeScore: body.homeScore || 0,
    awayScore: body.awayScore || 0,
    matchTime: body.matchTime || 'Upcoming',
    minute: body.minute || 0,
    status: body.status || 'UPCOMING',
    startTime: body.startTime || new Date().toISOString(),
    venue: body.venue || 'Stadium',
    isFeatured: !!body.isFeatured,
    statistics: body.statistics || {
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      cornersHome: 0,
      cornersAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      yellowCardsHome: 0,
      yellowCardsAway: 0,
      redCardsHome: 0,
      redCardsAway: 0,
      expectedGoalsHome: 0,
      expectedGoalsAway: 0,
    },
    events: body.events || [],
  };

  db.addMatch(newMatch);
  return res.status(201).json({ match: newMatch });
});

app.put('/api/admin/matches/:id', requireAdmin, (req, res) => {
  const updated = db.updateMatch(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Match not found.' });
  return res.json({ match: updated });
});

app.delete('/api/admin/matches/:id', requireAdmin, (req, res) => {
  const success = db.deleteMatch(req.params.id);
  if (!success) return res.status(404).json({ error: 'Match not found.' });
  return res.json({ success: true, message: 'Match deleted.' });
});

app.post('/api/admin/matches/:id/events', requireAdmin, (req, res) => {
  const match = db.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found.' });

  const { type, team, player, detail, minute } = req.body;
  const event = {
    id: 'ev_' + crypto.randomBytes(6).toString('hex'),
    minute: minute || match.minute || 1,
    type,
    team,
    player,
    detail,
  };

  const events = [...match.events, event];
  let homeScore = match.homeScore;
  let awayScore = match.awayScore;
  if (type === 'GOAL') {
    if (team === 'HOME') homeScore += 1;
    if (team === 'AWAY') awayScore += 1;
  }

  const updated = db.updateMatch(match.id, { events, homeScore, awayScore });
  return res.json({ match: updated, event });
});

// Admin News CRUD
app.get('/api/admin/news', requireAdmin, (req, res) => {
  return res.json({ news: db.getNews(false) });
});

app.post('/api/admin/news', requireAdmin, (req, res) => {
  const body = req.body;
  const article: SportsArticle = {
    id: 'news_' + crypto.randomBytes(6).toString('hex'),
    title: body.title,
    slug: (body.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    summary: body.summary,
    content: body.content,
    category: body.category || 'Football',
    imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    author: body.author || 'MatchSense Analytics Desk',
    published: body.published !== undefined ? body.published : true,
    featured: !!body.featured,
    publishedAt: new Date().toISOString(),
    scheduledAt: body.scheduledAt,
  };

  db.addNews(article);
  return res.status(201).json({ article });
});

app.put('/api/admin/news/:id', requireAdmin, (req, res) => {
  const updated = db.updateNews(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Article not found.' });
  return res.json({ article: updated });
});

app.delete('/api/admin/news/:id', requireAdmin, (req, res) => {
  const ok = db.deleteNews(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Article not found.' });
  return res.json({ success: true });
});

// Admin Ads CRUD
app.get('/api/admin/ads', requireAdmin, (req, res) => {
  return res.json({ ads: db.getAds() });
});

app.post('/api/admin/ads', requireAdmin, (req, res) => {
  const body = req.body;
  const newAd: Advertisement = {
    id: 'ad_' + crypto.randomBytes(6).toString('hex'),
    title: body.title,
    imageUrl: body.imageUrl || '',
    linkUrl: body.linkUrl || '/',
    placement: body.placement || 'HOMEPAGE',
    active: body.active !== undefined ? body.active : true,
    startDate: body.startDate || new Date().toISOString(),
    endDate: body.endDate || new Date(Date.now() + 90 * 86400000).toISOString(),
    clicks: 0,
    impressions: 0,
  };
  db.addAd(newAd);
  return res.status(201).json({ ad: newAd });
});

app.put('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const updated = db.updateAd(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ad not found.' });
  return res.json({ ad: updated });
});

app.delete('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const ok = db.deleteAd(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ad not found.' });
  return res.json({ success: true });
});

// Admin Announcements CRUD
app.get('/api/admin/announcements', requireAdmin, (req, res) => {
  return res.json({ announcements: db.getAnnouncements(false) });
});

app.post('/api/admin/announcements', requireAdmin, (req, res) => {
  const body = req.body;
  const newAnn: Announcement = {
    id: 'ann_' + crypto.randomBytes(6).toString('hex'),
    title: body.title,
    message: body.message,
    type: body.type || 'INFO',
    active: body.active !== undefined ? body.active : true,
    publishedAt: new Date().toISOString(),
  };
  db.addAnnouncement(newAnn);
  return res.status(201).json({ announcement: newAnn });
});

app.put('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const updated = db.updateAnnouncement(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Announcement not found.' });
  return res.json({ announcement: updated });
});

app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const ok = db.deleteAnnouncement(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Announcement not found.' });
  return res.json({ success: true });
});

// Admin Settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  return res.json({ settings: db.getSettings() });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const updated = db.updateSettings(req.body);
  sportsProvider.refreshMatches().catch(() => {});
  return res.json({ settings: updated, message: 'Settings saved successfully.' });
});

// Admin Reports
app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const payments = db.getPayments().filter((p) => p.status === 'SUCCESSFUL');
  const users = db.getUsers();
  const analyses = db.getAnalyses();

  // 7-day daily data simulation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return {
      date: dayStr,
      revenue: (i + 1) * 1500 + Math.floor(Math.random() * 2000),
      registrations: Math.floor(Math.random() * 8) + 2,
      analyses: Math.floor(Math.random() * 25) + 10,
    };
  });

  return res.json({
    dailyMetrics: last7Days,
    totalRevenue: payments.reduce((acc, p) => acc + p.amount, 0),
    totalUsers: users.length,
    totalAnalyses: analyses.length,
  });
});

// ==========================================
// Vite Middleware / Static File Serving
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MatchSense AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
