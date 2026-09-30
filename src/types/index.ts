export type UserRole = 'USER' | 'ADMIN';

export type AccountStatus =
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'ACTIVE_STANDARD'
  | 'ACTIVE_PREMIUM'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type SubscriptionPlan = 'FREE' | 'INITIAL_ACCESS' | 'PREMIUM';

export type PaymentType = 'INITIAL_ACCESS' | 'PREMIUM_SUBSCRIPTION';

export type PaymentStatus =
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REFUNDED';

export type UserPaymentState =
  | 'PAYMENT_NOT_MADE'
  | 'PAYMENT_AWAITING_VERIFICATION'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED';

export type SportType = 'Football' | 'Basketball' | 'Tennis' | 'Other';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  hasInitialAccess: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null; // ISO string
  analysesUsed: number;
  analysesLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  websiteName: string;
  tagline: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  initialAccessPrice: number; // ₦500 default
  premiumMonthlyPrice: number; // ₦1000 default
  freeAnalysesQuota: number; // e.g. 1 sample
  initialAccessAnalysesQuota: number; // e.g. 15
  premiumAnalysesQuota: number; // e.g. 150
  maintenanceMode: boolean;
  paystackPublicKey: string;
  payoutAccountName: string; // Idowu Joseph Adeola
  payoutBankName: string; // SmartCash
  payoutAccountNumber: string; // 9020714762
  sportsApiProvider: 'MatchSense Simulated Live Engine' | 'API-Football' | 'Opta Data Layer' | 'API-Football (api-sports.io)';
  apiFootballKey?: string;
  liveSimSpeedSeconds: number;
}

export interface PublicPaymentAccountInfo {
  accountName: string;
  paymentProvider: string;
  accountNumber: string;
  standardPrice: number;
  premiumMonthlyPrice: number;
  transferInstruction: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  reference: string;
  dateOfPayment?: string;
  payerName?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  rejectionReason?: string;
  gateway: 'SMARTCASH_TRANSFER' | 'DIRECT' | 'PAYSTACK';
  createdAt: string;
  verifiedAt?: string;
  reviewedBy?: string;
  refundedAt?: string;
  channel?: string;
}

export interface MatchStatistics {
  possessionHome: number; // percentage
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR_DECISION' | 'DANGEROUS_ATTACK';
  team: 'HOME' | 'AWAY';
  player: string;
  detail?: string;
}

export interface Match {
  id: string;
  code: string; // e.g. EPL-MCI-ARS
  sport: SportType;
  competition: string;
  competitionLogo?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchTime: string; // "64'", "HT", "FT", "19:45"
  minute?: number;
  status: MatchStatus;
  startTime: string; // ISO string
  venue: string;
  isFeatured: boolean;
  statistics: MatchStatistics;
  events: MatchEvent[];
  authorizedVideoUrl?: string; // If null, fallback messaging
  videoSourceTitle?: string;
  h2hSummary?: string;
  recentFormHome?: string[]; // ['W','W','D','L','W']
  recentFormAway?: string[]; // ['W','D','W','W','L']
}

export interface ProbabilityEstimate {
  homeWin: number; // percentage e.g. 52
  draw: number; // percentage e.g. 26 (0 for tennis/basketball)
  awayWin: number; // percentage e.g. 22
  confidenceRating: 'High' | 'Moderate' | 'Exploratory';
  projectedScore?: string; // "2 - 1"
  bothTeamsToScoreProb?: number;
  over25GoalsProb?: number;
}

export interface AnalysisFactor {
  factor: string;
  impact: 'FAVORS_HOME' | 'FAVORS_AWAY' | 'NEUTRAL';
  description: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  matchId?: string;
  matchCode?: string;
  matchTitle: string;
  sport: SportType;
  competition: string;
  probabilities: ProbabilityEstimate;
  explanation: string;
  factors: AnalysisFactor[];
  dataQualityNotes: string;
  isLiveAnalysis?: boolean;
  createdAt: string;
}

export interface SportsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: SportType;
  imageUrl: string;
  author: string;
  published: boolean;
  featured: boolean;
  publishedAt: string;
  scheduledAt?: string;
}

export type AdPlacement = 'HOMEPAGE' | 'DASHBOARD' | 'NEWS' | 'MATCH_PAGES' | 'ANALYSIS_PAGES';

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: AdPlacement;
  active: boolean;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'FEATURE' | 'ALERT' | 'MAINTENANCE';
  active: boolean;
  publishedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // or 'ALL'
  title: string;
  message: string;
  type: 'PAYMENT' | 'SUBSCRIPTION' | 'FEATURED_MATCH' | 'NEWS' | 'ANNOUNCEMENT';
  read: boolean;
  createdAt: string;
  link?: string;
}
