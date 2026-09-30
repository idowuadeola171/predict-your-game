import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  SiteSettings,
  PaymentRecord,
  Match,
  AnalysisRecord,
  SportsArticle,
  Advertisement,
  Announcement,
  NotificationItem,
} from '../src/types/index.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'matchsense_db.json');

export interface UserAuthRecord extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  users: UserAuthRecord[];
  settings: SiteSettings;
  payments: PaymentRecord[];
  matches: Match[];
  analyses: AnalysisRecord[];
  news: SportsArticle[];
  ads: Advertisement[];
  announcements: Announcement[];
  notifications: NotificationItem[];
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// In-memory token storage: token -> { userId, expiresAt }
export const sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

export function createSession(userId: string): string {
  const token = 'ms_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  sessions.set(token, { userId, expiresAt });
  return token;
}

export function getUserIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

export function removeSession(token: string): void {
  sessions.delete(token);
}

// Default production settings with admin payout configuration
const defaultSettings: SiteSettings = {
  websiteName: 'MatchSense AI',
  tagline: 'Smarter Sports Analysis. Better Understanding.',
  contactEmail: 'contact@matchsense.ai',
  contactPhone: '+234 800 MATCHSENSE',
  initialAccessPrice: 500, // ₦500
  premiumMonthlyPrice: 1000, // ₦1,000 / month
  freeAnalysesQuota: 0, // Unactivated accounts have 0 quota until ₦500 payment
  initialAccessAnalysesQuota: 20,
  premiumAnalysesQuota: 200,
  maintenanceMode: false,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_matchsense_gateway',
  payoutAccountName: 'Idowu Joseph Adeola',
  payoutBankName: 'SmartCash',
  payoutAccountNumber: '9020714762', // SmartCash Account: 9020714762
  sportsApiProvider: 'MatchSense Simulated Live Engine',
  liveSimSpeedSeconds: 15,
};

// Initial matches for sports intelligence telemetry
function createInitialMatches(): Match[] {
  return [];
}

function createInitialNews(): SportsArticle[] {
  return [
    {
      id: 'news_001',
      title: 'Statistical Breakdown: How High-Press Defensive Lines Impact Transition Goals in Modern Football',
      slug: 'statistical-breakdown-high-press-defensive-lines',
      summary: 'Data models examine how teams adopting an aggressive counter-press concede 38% fewer high-probability chances from structured possession phases.',
      content: `In the contemporary era of football tactical analytics, the relationship between high pressing volume and opponent xG suppression has reached unprecedented statistical clarity.

By cross-referencing match records across top European competitions, data demonstrates that squads maintaining an average defensive line height above 44.5 meters allow fewer sustained penalty-box entries than deep-block configurations, despite intuitive concerns regarding counter-attacking vulnerability.

Key metrics tracked include PPDA (Passes Allowed Per Defensive Action), field tilt percentage, and recovery distance. When assessing matches objectively through verified spatial metrics rather than emotional impressions, analysts observe structural balance that heavily influences probability distributions over 90 minutes.`,
      category: 'Football',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      author: 'Quantitative Sports Research Desk',
      published: true,
      featured: true,
      publishedAt: '2026-09-28T08:00:00.000Z',
    },
    {
      id: 'news_002',
      title: 'Three-Point Variance & Shot Selection: Why Expected Points Per Possession Tells the Real Story',
      slug: 'three-point-variance-shot-selection-nba-analytics',
      summary: 'A deep examination of effective field goal percentages and shot quality indicators across conference championship contenders.',
      content: `Basketball analytics have evolved beyond raw field-goal percentages to encompass true shooting efficiency, contested shot difficulty, and secondary assist creation rates.

Recent data shows that teams generating above 1.18 points per half-court possession demonstrate significantly lower game-to-game volatility than squads heavily reliant on unassisted mid-range jumpers.

Understanding expected possession value provides spectators with an analytical lens to observe strategic timeouts and rotation alterations without bias.`,
      category: 'Basketball',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      author: 'Sports Telemetry Team',
      published: true,
      featured: false,
      publishedAt: '2026-09-27T12:30:00.000Z',
    },
    {
      id: 'news_003',
      title: 'First-Serve Efficiency on Fast Hard Courts: The Correlation with Break Point Conversion Deficits',
      slug: 'first-serve-efficiency-fast-hard-courts-tennis',
      summary: 'Evaluating ATP tour servebot statistics versus dynamic returners through return-point win frequencies.',
      content: `At the highest tiers of professional tennis, winning percentages on first serve create asymmetric match dynamics that statistical models must rigorously weigh.

Returners who neutralize second serves with depth within 1 meter of the baseline raise their overall set probability by nearly 24%.

MatchSense AI evaluates serve speeds, bounce apex distributions, and unforced error patterns to provide balanced probability ranges.`,
      category: 'Tennis',
      imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
      author: 'Tennis Analytics Desk',
      published: true,
      featured: false,
      publishedAt: '2026-09-26T15:45:00.000Z',
    },
  ];
}

function createInitialAds(): Advertisement[] {
  return [
    {
      id: 'ad_001',
      title: 'MatchSense Pro Analytics Suite',
      imageUrl: '',
      linkUrl: '/pricing',
      placement: 'HOMEPAGE',
      active: true,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      clicks: 0,
      impressions: 0,
    },
    {
      id: 'ad_002',
      title: 'Real-Time Sports Telemetry & Data Feeds',
      imageUrl: '',
      linkUrl: '/live',
      placement: 'DASHBOARD',
      active: true,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      clicks: 0,
      impressions: 0,
    },
  ];
}

function createInitialAnnouncements(): Announcement[] {
  return [
    {
      id: 'ann_001',
      title: 'Welcome to MatchSense AI - Professional Sports Intelligence',
      message: 'Explore our algorithmic match statistical probability estimates, live match center, and in-depth tactical telemetry.',
      type: 'INFO',
      active: true,
      publishedAt: '2026-09-25T00:00:00.000Z',
    },
    {
      id: 'ann_002',
      title: 'System Notice: Responsible Data Policy',
      message: 'All figures provided across MatchSense AI are statistical probability estimates calculated for informational and educational purposes. We do not offer or promote gambling activities.',
      type: 'ALERT',
      active: true,
      publishedAt: '2026-09-26T10:00:00.000Z',
    },
  ];
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure settings has payout fields
        if (parsed.settings) {
          parsed.settings.payoutAccountName = parsed.settings.payoutAccountName || 'Idowu Joseph Adeola';
          parsed.settings.payoutBankName = parsed.settings.payoutBankName || 'SmartCash';
          parsed.settings.payoutAccountNumber = parsed.settings.payoutAccountNumber || '9020714762';
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error loading database file, initializing clean database:', err);
    }

    const initial: DatabaseSchema = {
      users: [], // Zero hardcoded demo users!
      settings: defaultSettings,
      payments: [], // Zero fake payments!
      matches: createInitialMatches(),
      analyses: [],
      news: createInitialNews(),
      ads: createInitialAds(),
      announcements: createInitialAnnouncements(),
      notifications: [],
    };
    this.save(initial);
    return initial;
  }

  public save(dataToSave?: DatabaseSchema): void {
    const toWrite = dataToSave || this.data;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  // Users
  public getUsers(): UserAuthRecord[] {
    return this.data.users;
  }

  public findUserById(id: string): UserAuthRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): UserAuthRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: UserAuthRecord): UserAuthRecord {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserAuthRecord>): UserAuthRecord | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // Settings
  public getSettings(): SiteSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // Payments
  public getPayments(): PaymentRecord[] {
    return this.data.payments;
  }

  public addPayment(payment: PaymentRecord): PaymentRecord {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<PaymentRecord>): PaymentRecord | null {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.payments[idx] = { ...this.data.payments[idx], ...updates };
    this.save();
    return this.data.payments[idx];
  }

  // Matches
  public getMatches(): Match[] {
    return this.data.matches;
  }

  public getMatchById(id: string): Match | undefined {
    return this.data.matches.find((m) => m.id === id);
  }

  public getMatchByCode(code: string): Match | undefined {
    return this.data.matches.find((m) => m.code.toUpperCase() === code.toUpperCase().trim());
  }

  public addMatch(match: Match): Match {
    this.data.matches.unshift(match);
    this.save();
    return match;
  }

  public updateMatch(id: string, updates: Partial<Match>): Match | null {
    const idx = this.data.matches.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.matches[idx] = { ...this.data.matches[idx], ...updates };
    this.save();
    return this.data.matches[idx];
  }

  public deleteMatch(id: string): boolean {
    const initialLen = this.data.matches.length;
    this.data.matches = this.data.matches.filter((m) => m.id !== id);
    if (this.data.matches.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Analyses
  public getAnalyses(): AnalysisRecord[] {
    return this.data.analyses;
  }

  public getUserAnalyses(userId: string): AnalysisRecord[] {
    return this.data.analyses.filter((a) => a.userId === userId);
  }

  public addAnalysis(analysis: AnalysisRecord): AnalysisRecord {
    this.data.analyses.unshift(analysis);
    this.save();
    return analysis;
  }

  public getAnalysisById(id: string): AnalysisRecord | undefined {
    return this.data.analyses.find((a) => a.id === id);
  }

  // News
  public getNews(onlyPublished = true): SportsArticle[] {
    if (onlyPublished) {
      return this.data.news.filter((n) => n.published);
    }
    return this.data.news;
  }

  public getNewsById(id: string): SportsArticle | undefined {
    return this.data.news.find((n) => n.id === id);
  }

  public addNews(article: SportsArticle): SportsArticle {
    this.data.news.unshift(article);
    this.save();
    return article;
  }

  public updateNews(id: string, updates: Partial<SportsArticle>): SportsArticle | null {
    const idx = this.data.news.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    this.data.news[idx] = { ...this.data.news[idx], ...updates };
    this.save();
    return this.data.news[idx];
  }

  public deleteNews(id: string): boolean {
    const len = this.data.news.length;
    this.data.news = this.data.news.filter((n) => n.id !== id);
    if (this.data.news.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // Advertisements
  public getAds(placement?: string): Advertisement[] {
    if (placement) {
      return this.data.ads.filter((a) => a.active && a.placement === placement);
    }
    return this.data.ads;
  }

  public addAd(ad: Advertisement): Advertisement {
    this.data.ads.unshift(ad);
    this.save();
    return ad;
  }

  public updateAd(id: string, updates: Partial<Advertisement>): Advertisement | null {
    const idx = this.data.ads.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.ads[idx] = { ...this.data.ads[idx], ...updates };
    this.save();
    return this.data.ads[idx];
  }

  public deleteAd(id: string): boolean {
    const len = this.data.ads.length;
    this.data.ads = this.data.ads.filter((a) => a.id !== id);
    if (this.data.ads.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // Announcements
  public getAnnouncements(activeOnly = true): Announcement[] {
    if (activeOnly) {
      return this.data.announcements.filter((a) => a.active);
    }
    return this.data.announcements;
  }

  public addAnnouncement(announcement: Announcement): Announcement {
    this.data.announcements.unshift(announcement);
    this.save();
    return announcement;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const idx = this.data.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.announcements[idx] = { ...this.data.announcements[idx], ...updates };
    this.save();
    return this.data.announcements[idx];
  }

  public deleteAnnouncement(id: string): boolean {
    const len = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    if (this.data.announcements.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter((n) => n.userId === userId || n.userId === 'ALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notification);
    this.save();
    return notification;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string): void {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'ALL') {
        n.read = true;
      }
    });
    this.save();
  }
}

export const db = new Database();
