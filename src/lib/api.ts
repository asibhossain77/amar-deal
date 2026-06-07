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
    const error = await res.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  
  return res.json();
}

// Auth
export const api = {
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
  resolveDispute: (id: string, data: { status: string; resolution: string }) => 
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
};
