const API_BASE = '/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    // Handle session expiration - auto logout on 401 only for non-admin endpoints
    // Admin endpoints properly return 401 when not authenticated
    if (res.status === 401) {
      // Only auto-logout for user endpoints, not admin or settings
      if (!endpoint.startsWith('/settings') && !endpoint.startsWith('/admin')) {
        if (typeof window !== 'undefined') {
          const { useAppStore } = await import('./store');
          useAppStore.getState().setUser(null);
        }
      }
      throw new Error('সেশন মেয়াদোত্তীর্ণ হয়েছে। দয়া করে আবার লগইন করুন।');
    }
    
    // Handle forbidden - DO NOT auto-logout on 403, just show error
    // 403 means user is authenticated but doesn't have permission
    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({ error: 'অনুমতি নেই' }));
      throw new Error(errorData.error || 'এই কাজ করার অনুমতি আপনার নেই');
    }
    
    const error = await res.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  
  return res.json();
}

// Auth
export const api = {
  // Authentication
  logout: async () => {
    try {
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
    } catch {
      // NextAuth signOut may fail, continue anyway
    }
    if (typeof window !== 'undefined') {
      const { useAppStore } = await import('./store');
      useAppStore.getState().setUser(null);
      useAppStore.getState().setPage('login');
    }
  },

  // Transactions
  getTransactions: () => fetchAPI('/transactions'),
  getTransaction: (id: string) => fetchAPI(`/transactions/${id}`),
  createTransaction: (data: { title: string; description: string; amount: number; buyerId?: string; sellerId?: string; terms: string; counterpartyEmail?: string; userRole?: string }) => 
    fetchAPI('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransactionStatus: (id: string, status: string) => 
    fetchAPI(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  // Payments
  getPayments: () => fetchAPI('/payments'),
  submitPayment: (data: { transactionId: string; transactionRef: string; paymentMethod: string; screenshot?: string }) => 
    fetchAPI('/payments', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (id: string, data: { status: string; adminNote?: string }) => 
    fetchAPI(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Disputes
  getDisputes: () => fetchAPI('/disputes'),
  getDispute: (id: string) => fetchAPI(`/disputes/${id}`),
  openDispute: (data: { transactionId: string; reason: string }) => 
    fetchAPI('/disputes', { method: 'POST', body: JSON.stringify(data) }),
  addDisputeMessage: (id: string, message: string) => 
    fetchAPI(`/disputes/${id}`, { method: 'POST', body: JSON.stringify({ message }) }),
  resolveDispute: (id: string, data: { outcome: string; resolution: string }) => 
    fetchAPI(`/disputes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Notifications
  getNotifications: () => fetchAPI('/notifications'),
  markNotificationsRead: (ids?: string[]) => 
    fetchAPI('/notifications', { method: 'PUT', body: JSON.stringify({ ids }) }),
  
  // Users
  getUser: () => fetchAPI('/users'),
  updateUser: (id: string, data: { name?: string; phone?: string }) => 
    fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Admin
  getAdminStats: () => fetchAPI('/admin'),
  getAdminUsers: () => fetchAPI('/admin/users'),
  toggleUserStatus: (id: string, isActive: boolean) => 
    fetchAPI('/admin/users', { method: 'PUT', body: JSON.stringify({ userId: id, isActive }) }),
  getAdminLogs: () => fetchAPI('/admin/logs'),
  
  // Payment Gateways (Public)
  getActiveGateways: () => fetchAPI('/gateways'),
  
  // Payment Gateways (Admin)
  getAdminGateways: () => fetchAPI('/gateways?admin=true'),
  createGateway: (data: { name: string; slug: string; logo?: string; accountType: string; accountNumber: string; accountName: string; instructions?: string; minDeposit?: number; maxDeposit?: number; isActive?: boolean; sortOrder?: number }) =>
    fetchAPI('/gateways', { method: 'POST', body: JSON.stringify(data) }),
  updateGateway: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/gateways/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGateway: (id: string) =>
    fetchAPI(`/gateways/${id}`, { method: 'DELETE' }),
  reorderGateways: (orders: { id: string; sortOrder: number }[]) =>
    fetchAPI('/gateways/reorder', { method: 'PUT', body: JSON.stringify({ orders }) }),
  
  // Gateway Transactions
  getGatewayTransactions: (status?: string) => 
    fetchAPI(`/gateway-transactions${status ? `?status=${status}` : ''}`),
  submitGatewayTransaction: (data: { transactionId: string; gatewayId: string; transactionRef: string; amount: number; screenshot?: string; note?: string }) =>
    fetchAPI('/gateway-transactions', { method: 'POST', body: JSON.stringify(data) }),
  verifyGatewayTransaction: (id: string, data: { status: string; adminNote?: string }) =>
    fetchAPI(`/gateway-transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Gateway Theme
  getGatewayTheme: () => fetchAPI('/gateway-theme'),
  updateGatewayTheme: (data: { primaryColor?: string; buttonColor?: string; borderColor?: string; backgroundColor?: string }) =>
    fetchAPI('/gateway-theme', { method: 'PUT', body: JSON.stringify(data) }),
};
