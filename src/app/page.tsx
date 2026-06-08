'use client';

import React, { Component, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import HomePage from '@/components/home/HomePage';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import ProfilePage from '@/components/dashboard/ProfilePage';
import NotificationsPage from '@/components/dashboard/NotificationsPage';
import TransactionsPage from '@/components/transactions/TransactionsPage';
import CreateTransactionPage from '@/components/transactions/CreateTransactionPage';
import TransactionDetailPage from '@/components/transactions/TransactionDetailPage';
import PaymentSubmitPage from '@/components/payments/PaymentSubmitPage';
import DisputesPage from '@/components/disputes/DisputesPage';
import DisputeDetailPage from '@/components/disputes/DisputeDetailPage';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import AdminUsersPage from '@/components/admin/AdminUsersPage';
import AdminPaymentsPage from '@/components/admin/AdminPaymentsPage';
import AdminDisputesPage from '@/components/admin/AdminDisputesPage';
import AdminLogsPage from '@/components/admin/AdminLogsPage';
import AdminSettingsPage from '@/components/admin/AdminSettingsPage';
import AdminGatewaysPage from '@/components/admin/AdminGatewaysPage';
import AdminGatewayPaymentsPage from '@/components/admin/AdminGatewayPaymentsPage';
import AdminGatewayThemePage from '@/components/admin/AdminGatewayThemePage';
import AdminSubscriptionsPage from '@/components/admin/AdminSubscriptionsPage';
import AdminBadgesPage from '@/components/admin/AdminBadgesPage';
import AccountSettingsPage from '@/components/account/AccountSettingsPage';
import SubscriptionPlansPage from '@/components/subscriptions/SubscriptionPlansPage';
import PublicProfilePage from '@/components/profile/PublicProfilePage';
import AboutPage from '@/components/pages/AboutPage';
import HowItWorksPage from '@/components/pages/HowItWorksPage';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteSettingsLoader from '@/components/shared/SiteSettingsLoader';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-lg font-semibold">কিছু একটা সমস্যা হয়েছে</h2>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || 'অজানা ত্রুটি'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              useAppStore.getState().setPage('dashboard');
            }}
          >
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageRouter() {
  const { currentPage, isAuthenticated, user } = useAppStore();
  const [checking, setChecking] = useState(!isAuthenticated || !user);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            useAppStore.getState().setUser(data.user);
          } else {
            useAppStore.getState().setUser(null);
          }
        } else if (res.status === 401) {
          useAppStore.getState().setUser(null);
        }
      } catch {
        // Network error - keep persisted state
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  if (checking && (!isAuthenticated || !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show public pages
  if (!isAuthenticated || !user) {
    switch (currentPage) {
      case 'login':
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <LoginPage />
          </div>
        );
      case 'register':
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <RegisterPage />
          </div>
        );
      case 'forgot-password':
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <ForgotPasswordPage />
          </div>
        );
      case 'about':
        return (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1"><AboutPage /></main>
            <Footer />
          </div>
        );
      case 'how-it-works':
        return (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1"><HowItWorksPage /></main>
            <Footer />
          </div>
        );
      case 'home':
      default:
        return (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1"><HomePage /></main>
            <Footer />
          </div>
        );
    }
  }

  // Authenticated - show dashboard layout
  return (
    <DashboardLayout>
      <DashboardRouter />
    </DashboardLayout>
  );
}

function DashboardRouter() {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case 'dashboard':
      return <ErrorBoundary><DashboardPage /></ErrorBoundary>;
    case 'profile':
      return <ErrorBoundary><ProfilePage /></ErrorBoundary>;
    case 'account-settings':
      return <ErrorBoundary><AccountSettingsPage /></ErrorBoundary>;
    case 'public-profile':
      return <ErrorBoundary><PublicProfilePage /></ErrorBoundary>;
    case 'subscription-plans':
      return <ErrorBoundary><SubscriptionPlansPage /></ErrorBoundary>;
    case 'notifications':
      return <ErrorBoundary><NotificationsPage /></ErrorBoundary>;
    case 'transactions':
      return <ErrorBoundary><TransactionsPage /></ErrorBoundary>;
    case 'create-transaction':
      return <ErrorBoundary><CreateTransactionPage /></ErrorBoundary>;
    case 'transaction-detail':
      return <ErrorBoundary><TransactionDetailPage /></ErrorBoundary>;
    case 'payment-submit':
      return <ErrorBoundary><PaymentSubmitPage /></ErrorBoundary>;
    case 'disputes':
      return <ErrorBoundary><DisputesPage /></ErrorBoundary>;
    case 'dispute-detail':
      return <ErrorBoundary><DisputeDetailPage /></ErrorBoundary>;
    case 'admin-dashboard':
      return <ErrorBoundary><AdminDashboardPage /></ErrorBoundary>;
    case 'admin-users':
      return <ErrorBoundary><AdminUsersPage /></ErrorBoundary>;
    case 'admin-transactions':
      return <ErrorBoundary><TransactionsPage /></ErrorBoundary>;
    case 'admin-payments':
      return <ErrorBoundary><AdminPaymentsPage /></ErrorBoundary>;
    case 'admin-disputes':
      return <ErrorBoundary><AdminDisputesPage /></ErrorBoundary>;
    case 'admin-logs':
      return <ErrorBoundary><AdminLogsPage /></ErrorBoundary>;
    case 'admin-settings':
      return <ErrorBoundary><AdminSettingsPage /></ErrorBoundary>;
    case 'admin-gateways':
      return <ErrorBoundary><AdminGatewaysPage /></ErrorBoundary>;
    case 'admin-gateway-payments':
      return <ErrorBoundary><AdminGatewayPaymentsPage /></ErrorBoundary>;
    case 'admin-gateway-theme':
      return <ErrorBoundary><AdminGatewayThemePage /></ErrorBoundary>;
    case 'admin-subscriptions':
      return <ErrorBoundary><AdminSubscriptionsPage /></ErrorBoundary>;
    case 'admin-badges':
      return <ErrorBoundary><AdminBadgesPage /></ErrorBoundary>;
    default:
      return <ErrorBoundary><DashboardPage /></ErrorBoundary>;
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <SiteSettingsLoader />
      <PageRouter />
    </AuthProvider>
  );
}
