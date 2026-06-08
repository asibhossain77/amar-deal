export type TransactionStatus = 
  | 'pending_payment' 
  | 'pending_verification' 
  | 'paid' 
  | 'work_in_progress' 
  | 'delivered' 
  | 'completed' 
  | 'disputed' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export type DisputeStatus = 
  | 'open' 
  | 'under_review' 
  | 'resolved_buyer' 
  | 'resolved_seller' 
  | 'resolved_cancelled';

export type UserRole = 'user' | 'admin';

export type PageName = 
  | 'home' 
  | 'about' 
  | 'how-it-works' 
  | 'login' 
  | 'register' 
  | 'forgot-password'
  | 'dashboard' 
  | 'profile'
  | 'account-settings'
  | 'subscription-plans'
  | 'transactions' 
  | 'transaction-detail'
  | 'create-transaction'
  | 'payment-submit'
  | 'disputes'
  | 'dispute-detail'
  | 'notifications'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-transactions'
  | 'admin-payments'
  | 'admin-disputes'
  | 'admin-logs'
  | 'admin-settings'
  | 'admin-gateways'
  | 'admin-gateway-payments'
  | 'admin-gateway-theme'
  | 'admin-subscriptions'
  | 'admin-badges'
  | 'public-profile';

export interface AppUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  country?: string;
  languagePreference?: string;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  // Reputation
  buyerRating?: number;
  sellerRating?: number;
  totalReviews?: number;
  completedDeals?: number;
  successfulTransactions?: number;
  trustScore?: number;
  disputeRate?: number;
  // Subscription
  currentSubscriptionId?: string;
  currentSubscription?: UserSubscription;
  currentPlan?: SubscriptionPlan;
}

export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  terms: string;
  status: TransactionStatus;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  buyer?: AppUser;
  seller?: AppUser;
  payments?: Payment[];
  disputes?: Dispute[];
}

export interface Payment {
  id: string;
  transactionId: string;
  userId: string;
  transactionRef: string;
  paymentMethod: string;
  screenshot?: string;
  status: PaymentStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  transaction?: Transaction;
  user?: AppUser;
}

export interface Dispute {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  transaction?: Transaction;
  buyer?: AppUser;
  seller?: AppUser;
  messages?: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: AppUser;
}

export interface Notification {
  id: string;
  userId: string;
  transactionId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user?: AppUser;
}

export interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  activeTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  disputedTransactions: number;
}

export interface PaymentGateway {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
  minDeposit: number;
  maxDeposit: number;
  isActive: boolean;
  sortOrder: number;
  themeEnabled: boolean;
  primaryColor: string;
  buttonColor: string;
  borderColor: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayTransaction {
  id: string;
  transactionId: string;
  gatewayId: string;
  userId: string;
  transactionRef: string;
  amount: number;
  screenshot?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  gateway?: PaymentGateway;
  user?: AppUser;
  transaction?: Transaction;
}

// ─── Public Profile Types ─────────────────────────

export interface EarnedBadge {
  key: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  color: string;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment?: string;
  reviewType: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    isVerified: boolean;
  };
}

export interface PublicProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  accountType: string;
  isVerified: boolean;
  country?: string;
  createdAt: string;
  lastActive: string;
  buyerRating: number;
  sellerRating: number;
  overallRating: number;
  totalReviews: number;
  positiveReviewPercentage: number;
  completedDeals: number;
  successfulTransactions: number;
  trustScore: number;
  disputeRate: number;
  successRate: number;
  currentPlan: SubscriptionPlan | null;
  currentSubscription: { id: string; status: string; startDate: string; endDate?: string } | null;
  earnedBadges: EarnedBadge[];
  stats: {
    totalTransactions: number;
    completedTransactions: number;
    inProgressTransactions: number;
    disputedTransactions: number;
    buyerTransactionCount: number;
    sellerTransactionCount: number;
  };
  memberSinceBadge: string;
  accountAgeDays: number;
  reviews: PublicReview[];
  canReview: boolean;
  hasReviewed: boolean;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  transactionId?: string;
  rating: number;
  comment?: string;
  reviewType: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  fromUser?: AppUser;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription & Badge Types ─────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  sortOrder: number;
  // Feature flags
  priorityListing: boolean;
  premiumProfile: boolean;
  featuredProfile: boolean;
  higherDealLimits: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customProfileBanner: boolean;
  featuredSellerStatus: boolean;
  featuredBuyerStatus: boolean;
  fasterDisputeResolution: boolean;
  profileVerification: boolean;
  vipSupport: boolean;
  maximumVisibility: boolean;
  exclusiveFeatures: boolean;
  createdAt: string;
  updatedAt: string;
  subscriberCount?: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  paymentMethod?: string;
  transactionRef?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  user?: AppUser;
}

export interface ReputationData {
  buyerRating: number;
  sellerRating: number;
  totalReviews: number;
  completedDeals: number;
  successfulTransactions: number;
  trustScore: number;
  disputeRate: number;
  isVerified: boolean;
  memberSinceBadge: string;
  memberSinceLabel: string;
  totalTransactions: number;
  disputedCount: number;
}
