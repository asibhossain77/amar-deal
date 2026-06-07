'use client';

import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PlusCircle,
  AlertTriangle,
  Bell,
  Settings,
  Users,
  CreditCard,
  Scale,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageName } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getInitials } from '@/lib/helpers';
import { signOut } from 'next-auth/react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  page: PageName;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, page: 'dashboard' },
  { label: 'লেনদেনসমূহ', icon: ArrowLeftRight, page: 'transactions' },
  { label: 'নতুন লেনদেন', icon: PlusCircle, page: 'create-transaction' },
  { label: 'বিরোধসমূহ', icon: AlertTriangle, page: 'disputes' },
  { label: 'বিজ্ঞপ্তি', icon: Bell, page: 'notifications' },
];

const adminNavItems: NavItem[] = [
  { label: 'প্রশাসন ড্যাশবোর্ড', icon: Settings, page: 'admin-dashboard', adminOnly: true },
  { label: 'ব্যবহারকারী ব্যবস্থাপনা', icon: Users, page: 'admin-users', adminOnly: true },
  { label: 'পেমেন্ট যাচাই', icon: CreditCard, page: 'admin-payments', adminOnly: true },
  { label: 'বিরোধ ব্যবস্থাপনা', icon: Scale, page: 'admin-disputes', adminOnly: true },
  { label: 'পেমেন্ট সেটিংস', icon: CreditCard, page: 'admin-settings', adminOnly: true },
  { label: 'কার্যক্রম লগ', icon: FileText, page: 'admin-logs', adminOnly: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setPage, user, setSidebarOpen } = useAppStore();
  const isAdmin = user?.role === 'admin';

  const handleNav = (page: PageName) => {
    setPage(page);
    setSidebarOpen(false);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">বাংলা এসক্রো</h1>
          <p className="text-xs text-gray-500">নিরাপদ লেনদেনের প্ল্যাটফর্ম</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            মেনু
          </p>
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <Separator className="my-4" />
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                প্রশাসন
              </p>
              {adminNavItems.map((item) => {
                const isActive = currentPage === item.page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User info & logout */}
      <div className="border-t border-gray-100 px-4 py-4">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Badge
              variant="secondary"
              className="text-xs bg-blue-50 text-blue-700 border-0 shrink-0"
            >
              {user.role === 'admin' ? 'প্রশাসক' : 'ব্যবহারকারী'}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={async () => {
            useAppStore.getState().setUser(null);
            useAppStore.getState().setPage('home');
            await signOut({ redirect: false });
          }}
        >
          <LogOut className="w-4 h-4" />
          লগআউট
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[250px] shrink-0 border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>নেভিগেশন</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">বাংলা এসক্রো</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
