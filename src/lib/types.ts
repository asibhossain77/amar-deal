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

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type KYCDocumentType = 'national_id' | 'passport' | 'driving_license';

export type PageName = 
  | 'home' 
  | 'about' 
  | 'how-it-works' 
  | 'login' 
  | 'register' 
  | 'forgot-password'
  | 'dashboard' 
  | 'account-settings'
  | 'transactions' 
  | 'transaction-detail'
  | 'create-transaction'
  | 'payment-submit'
  | 'disputes'
  | 'dispute-detail'
  | 'notifications'
  | 'public-profile'
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
  | 'admin-kyc'
  | 'admin-reviews';

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
  verificationStatus?: VerificationStatus;
  createdAt: string;
  // Reputation
  buyerRating?: number;
  sellerRating?: number;
  buyerReviewCount?: number;
  sellerReviewCount?: number;
  totalReviews?: number;
  completedDeals?: number;
  successfulTransactions?: number;
  trustScore?: number;
  disputeRate?: number;
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
  verificationStatus: VerificationStatus;
  createdAt: string;
  buyerRating: number;
  sellerRating: number;
  buyerReviewCount: number;
  sellerReviewCount: number;
  totalReviews: number;
  completedDeals: number;
  trustScore: number;
  reviews?: PublicReview[];
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

export interface AdminReview {
  id: string;
  fromUserId: string;
  toUserId: string;
  transactionId?: string;
  rating: number;
  comment?: string;
  reviewType: string;
  isPublic: boolean;
  isHidden: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  fromUser: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    isVerified: boolean;
    email?: string;
  };
  toUser: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    isVerified: boolean;
    email?: string;
  };
}

// ─── KYC Verification Types ─────────────────────────

export interface KYCVerification {
  id: string;
  userId: string;
  documentType: KYCDocumentType;
  documentNumber: string;
  documentFront: string;
  documentBack?: string;
  selfie?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
}

export interface KYCSubmission {
  documentType: KYCDocumentType;
  documentNumber: string;
  documentFront: string;
  documentBack?: string;
  selfie?: string;
}

export interface ReputationData {
  buyerRating: number;
  sellerRating: number;
  buyerReviewCount: number;
  sellerReviewCount: number;
  totalReviews: number;
  completedDeals: number;
  successfulTransactions: number;
  trustScore: number;
  disputeRate: number;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  totalTransactions: number;
  disputedCount: number;
}
