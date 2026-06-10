import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageName, AppUser, Transaction, Dispute, Notification } from './types';
import { SITE_DEFAULTS } from './site-defaults';

// ─── Site Settings Interface ─────────────────────────────
export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_logo: string;          // base64 or URL
  site_favicon: string;       // base64 or URL
  site_banner: string;        // base64 or URL
  site_login_bg: string;      // base64 or URL for login page background
  site_copyright: string;
  seo_meta_title: string;
  seo_meta_description: string;
  maintenance_mode: string;   // 'true' or 'false'
  contact_address: string;
  contact_phone: string;
  contact_email: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  ...SITE_DEFAULTS,
};

// ─── App State Interface ─────────────────────────────────
interface AppState {
  // Navigation
  currentPage: PageName;
  setPage: (page: PageName) => void;
  
  // Auth
  user: AppUser | null;
  setUser: (user: AppUser | null | ((prev: AppUser | null) => AppUser | null)) => void;
  isAuthenticated: boolean;
  clearUserData: () => void;
  
  // Selected items
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  selectedDisputeId: string | null;
  setSelectedDisputeId: (id: string | null) => void;
  selectedPaymentTransactionId: string | null;
  setSelectedPaymentTransactionId: (id: string | null) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  
  // Data cache
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  disputes: Dispute[];
  setDisputes: (disputes: Dispute[]) => void;
  
  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  scrollTarget: string | null;
  setScrollTarget: (target: string | null) => void;

  // Site Settings
  siteSettings: SiteSettings;
  setSiteSettings: (settings: Partial<SiteSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentPage: 'home' as PageName,
      setPage: (page) => set({ currentPage: page }),
      
      // Auth
      user: null,
      setUser: (userOrUpdater) => set((state) => {
        const user = typeof userOrUpdater === 'function' 
          ? userOrUpdater(state.user) 
          : userOrUpdater;
        return { user, isAuthenticated: !!user };
      }),
      isAuthenticated: false,
      clearUserData: () => set({
        user: null,
        isAuthenticated: false,
        selectedTransactionId: null,
        selectedDisputeId: null,
        selectedPaymentTransactionId: null,
        selectedUserId: null,
        transactions: [],
        notifications: [],
        disputes: [],
        sidebarOpen: false,
      }),
      
      // Selected items
      selectedTransactionId: null,
      setSelectedTransactionId: (id) => set({ selectedTransactionId: id }),
      selectedDisputeId: null,
      setSelectedDisputeId: (id) => set({ selectedDisputeId: id }),
      selectedPaymentTransactionId: null,
      setSelectedPaymentTransactionId: (id) => set({ selectedPaymentTransactionId: id }),
      selectedUserId: null,
      setSelectedUserId: (id) => set({ selectedUserId: id }),
      
      // Data cache
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      disputes: [],
      setDisputes: (disputes) => set({ disputes }),
      
      // UI
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      scrollTarget: null as string | null,
      setScrollTarget: (target) => set({ scrollTarget: target }),

      // Site Settings
      siteSettings: DEFAULT_SITE_SETTINGS,
      setSiteSettings: (settings) => set((state) => ({
        siteSettings: { ...state.siteSettings, ...settings },
      })),
    }),
    {
      name: 'amar-deal-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        selectedUserId: state.selectedUserId,
        scrollTarget: state.scrollTarget,
        siteSettings: state.siteSettings,
      }),
    }
  )
);
