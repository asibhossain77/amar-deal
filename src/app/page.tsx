'use client';

import React, { useEffect, useState } from 'react';
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
import AboutPage from '@/components/pages/AboutPage';
import HowItWorksPage from '@/components/pages/HowItWorksPage';
import { Loader2 } from 'lucide-react';

function PageRouter() {
  const { currentPage, isAuthenticated, user } = useAppStore();
  const [checking, setChecking] = useState(true);

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
        } else {
          useAppStore.getState().setUser(null);
        }
      } catch {
        useAppStore.getState().setUser(null);
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show public pages
  if (!isAuthenticated || !user) {
    switch (currentPage) {
      case 'login':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <LoginPage />
          </div>
        );
      case 'register':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <RegisterPage />
          </div>
        );
      case 'forgot-password':
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
      return <DashboardPage />;
    case 'profile':
      return <ProfilePage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'transactions':
      return <TransactionsPage />;
    case 'create-transaction':
      return <CreateTransactionPage />;
    case 'transaction-detail':
      return <TransactionDetailPage />;
    case 'payment-submit':
      return <PaymentSubmitPage />;
    case 'disputes':
      return <DisputesPage />;
    case 'dispute-detail':
      return <DisputeDetailPage />;
    case 'admin-dashboard':
      return <AdminDashboardPage />;
    case 'admin-users':
      return <AdminUsersPage />;
    case 'admin-transactions':
      return <TransactionsPage />;
    case 'admin-payments':
      return <AdminPaymentsPage />;
    case 'admin-disputes':
      return <AdminDisputesPage />;
    case 'admin-logs':
      return <AdminLogsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <PageRouter />
    </AuthProvider>
  );
}
