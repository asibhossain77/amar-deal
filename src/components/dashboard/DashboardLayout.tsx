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
  Palette,
  Sun,
  Moon,
  UserCog,
  Crown,
  Award,
  MessageSquare,
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
} from '@/components/ui/sheet';
import { getSiteName, getSiteTagline } from '@/lib/site-defaults';
import { getInitials } from '@/lib/helpers';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { BadgeDisplayMini } from '@/components/shared/BadgeDisplay';
import { VerificationBadge } from '@/components/shared/BadgeIcon';
import UserLink from '@/components/shared/UserLink';

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

const accountItems: NavItem[] = [
  { label: 'অ্যাকাউন্ট সেটিংস', icon: UserCog, page: 'account-settings' },
  { label: 'সাবস্ক্রিপশন প্ল্যান', icon: Crown, page: 'subscription-plans' },
];

const adminNavItems: NavItem[] = [
  { label: 'প্রশাসন ড্যাশবোর্ড', icon: Settings, page: 'admin-dashboard', adminOnly: true },
  { label: 'ব্যবহারকারী ব্যবস্থাপনা', icon: Users, page: 'admin-users', adminOnly: true },
  { label: 'সাবস্ক্রিপশন পরিচালনা', icon: Crown, page: 'admin-subscriptions', adminOnly: true },
  { label: 'ব্যাজ ব্যবস্থাপনা', icon: Award, page: 'admin-badges', adminOnly: true },
  { label: 'পেমেন্ট গেটওয়ে', icon: CreditCard, page: 'admin-gateways', adminOnly: true },
  { label: 'গেটওয়ে পেমেন্ট যাচাই', icon: CreditCard, page: 'admin-gateway-payments', adminOnly: true },
  { label: 'গেটওয়ে থিম সেটিংস', icon: Palette, page: 'admin-gateway-theme', adminOnly: true },
  { label: 'বিরোধ ব্যবস্থাপনা', icon: Scale, page: 'admin-disputes', adminOnly: true },
  { label: 'রিভিউ মডারেশন', icon: MessageSquare, page: 'admin-reviews', adminOnly: true },
  { label: 'কার্যক্রম লগ', icon: FileText, page: 'admin-logs', adminOnly: true },
  { label: 'ওয়েবসাইট সেটিংস', icon: Settings, page: 'admin-settings', adminOnly: true },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}
      className="shrink-0 h-9 w-9 rounded-lg hover:bg-accent transition-colors"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setPage, user, setSidebarOpen, siteSettings, setSelectedUserId } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const siteName = getSiteName(siteSettings.site_name);
  const siteTagline = getSiteTagline(siteSettings.site_tagline);

  const handleNav = (page: PageName) => {
    setPage(page);
    setSidebarOpen(false);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-card transition-theme">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        {siteSettings.site_logo ? (
          <img src={siteSettings.site_logo} alt={siteName} className="h-9 w-9 object-contain rounded-xl" />
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-base font-bold text-foreground">{siteName}</h1>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{siteTagline}</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            মেনু
          </p>
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </button>
            );
          })}

          <Separator className="my-3" />

          <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            অ্যাকাউন্ট
          </p>
          {accountItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <Separator className="my-4" />
              <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                প্রশাসন
              </p>
              {adminNavItems.map((item) => {
                const isActive = currentPage === item.page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User info & logout */}
      <div className="border-t border-border px-4 py-4">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { setSelectedUserId(user.id); setPage('public-profile'); }}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setSelectedUserId(user.id); setPage('public-profile'); }}
                  className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors text-left"
                >
                  {user.name}
                </button>
                {user.isVerified && (
                  <VerificationBadge size="sm" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <BadgeDisplayMini plan={user.currentPlan} />
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-primary/10 text-primary border-0 shrink-0"
            >
              {user.role === 'admin' ? 'প্রশাসক' : 'ব্যবহারকারী'}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);

  return (
    <div className="flex h-screen bg-background transition-theme">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] shrink-0 border-r border-border flex-col shadow-sm">
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
          <div className="flex items-center gap-2">
            {siteSettings.site_logo ? (
              <img src={siteSettings.site_logo} alt={siteName} className="h-8 w-8 object-contain rounded-lg" />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <Shield className="w-4 h-4" />
              </div>
            )}
            <span className="font-bold text-foreground text-sm">{siteName}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="মেনু খুলুন"
              className="h-9 w-9 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
