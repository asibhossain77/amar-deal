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
  | 'admin-settings';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
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
