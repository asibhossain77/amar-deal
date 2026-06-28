'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
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
  Sun,
  Moon,
  UserCog,
  ShieldCheck,
  MessageSquare,
  Handshake,
  BarChart3,
  Palette,
  ChevronDown,
  Star,
  Wallet,
  LifeBuoy,
  PlusCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageName } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getSiteName } from '@/lib/site-defaults';
import { getInitials } from '@/lib/helpers';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { VerificationBadge } from '@/components/shared/BadgeIcon';

/* ───────────────────── Nav Item Types ───────────────────── */
interface NavItem {
  label: string;
  icon: React.ElementType;
  page: PageName;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/* ───────────────────── User Navigation ───────────────────── */
const userNavGroups: NavGroup[] = [
  {
    title: 'মূল',
    items: [
      { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, page: 'dashboard' },
      { label: 'সক্রিয় ডিল', icon: Handshake, page: 'transactions' },
      { label: 'নতুন ডিল', icon: PlusCircle, page: 'create-transaction' },
    ],
  },
  {
    title: 'আর্থিক',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'পেমেন্ট', icon: Wallet, page: 'payment-submit' },
      { label: 'বিরোধ', icon: AlertTriangle, page: 'disputes' },
    ],
  },
  {
    title: 'ব্যক্তিগত',
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: 'KYC যাচাইকরণ', icon: ShieldCheck, page: 'account-settings' },
      { label: 'রেটিং ও রিভিউ', icon: Star, page: 'public-profile' },
      { label: 'বিজ্ঞপ্তি', icon: Bell, page: 'notifications' },
      { label: 'সহায়তা', icon: LifeBuoy, page: 'dashboard' },
      { label: 'অ্যাকাউন্ট সেটিংস', icon: UserCog, page: 'account-settings' },
    ],
  },
];

/* ───────────────────── Admin Navigation ───────────────────── */
const adminNavGroups: NavGroup[] = [
  {
    title: 'প্রশাসন',
    items: [
      { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, page: 'admin-dashboard' },
      { label: 'সকল এসক্রো ডিল', icon: ArrowLeftRight, page: 'admin-escrow-deals' },
      { label: 'লেনদেন', icon: CreditCard, page: 'admin-gateway-payments' },
      { label: 'ব্যবহারকারী', icon: Users, page: 'admin-users' },
    ],
  },
  {
    title: 'নিয়ন্ত্রণ',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'KYC অনুরোধ', icon: ShieldCheck, page: 'admin-kyc' },
      { label: 'বিরোধ', icon: Scale, page: 'admin-disputes' },
      { label: 'পেমেন্ট গেটওয়ে', icon: CreditCard, page: 'admin-gateways' },
      { label: 'রিভিউ', icon: MessageSquare, page: 'admin-reviews' },
    ],
  },
  {
    title: 'সিস্টেম',
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: 'রিপোর্ট', icon: BarChart3, page: 'admin-reviews' },
      { label: 'গেটওয়ে থিম', icon: Palette, page: 'admin-gateway-theme' },
      { label: 'কার্যক্রম লগ', icon: FileText, page: 'admin-logs' },
      { label: 'ওয়েবসাইট সেটিংস', icon: Settings, page: 'admin-settings' },
    ],
  },
];

/* ───────────────────── Theme Toggle ───────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}
      className="shrink-0 h-7 w-7 rounded-md hover:bg-accent transition-colors"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/* ───────────────────── Collapsible Group ───────────────────── */
function NavGroupSection({
  group,
  currentPage,
  onNav,
}: {
  group: NavGroup;
  currentPage: PageName;
  onNav: (page: PageName) => void;
}) {
  const hasActive = group.items.some((item) => item.page === currentPage);
  const [open, setOpen] = useState(
    group.defaultOpen !== undefined ? group.defaultOpen : hasActive
  );

  return (
    <div>
      <button
        onClick={group.collapsible ? () => setOpen(!open) : undefined}
        className={`w-full flex items-center justify-between px-2.5 mb-0.5 ${
          group.collapsible
            ? 'cursor-pointer hover:bg-accent/50 rounded-md py-1'
            : 'py-0.5'
        }`}
      >
        <span className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] select-none">
          {group.title}
        </span>
        {group.collapsible && (
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground/50 transition-transform duration-200 ${
              !open ? '-rotate-90' : ''
            }`}
          />
        )}
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          open || !group.collapsible
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-px">
            {group.items.map((item) => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNav(item.page)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-100 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground/70'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[9px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-0 leading-none"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Sidebar Content ───────────────────── */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setPage, user, setSidebarOpen, siteSettings, setSelectedUserId } =
    useAppStore();
  const isAdmin = user?.role === 'admin';
  const siteName = getSiteName(siteSettings.site_name);

  const handleNav = (page: PageName) => {
    setPage(page);
    setSidebarOpen(false);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        {siteSettings.site_logo ? (
          <img
            src={siteSettings.site_logo}
            alt={siteName}
            className="h-7 w-7 object-contain rounded-md"
          />
        ) : (
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
            <Shield className="w-3.5 h-3.5" />
          </div>
        )}
        <h1 className="text-[13px] font-bold text-foreground truncate">{siteName}</h1>
      </div>

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {userNavGroups.map((group) => (
            <NavGroupSection
              key={group.title}
              group={group}
              currentPage={currentPage}
              onNav={handleNav}
            />
          ))}

          {isAdmin && (
            <>
              <div className="my-1.5 mx-2 border-t border-border/60" />
              {adminNavGroups.map((group) => (
                <NavGroupSection
                  key={group.title}
                  group={group}
                  currentPage={currentPage}
                  onNav={handleNav}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* ── User Card ── */}
      <div className="border-t border-border px-2.5 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUserId(user!.id);
              setPage('public-profile');
            }}
            className="shrink-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-7 w-7">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {getInitials(user?.name || '')}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => {
                setSelectedUserId(user!.id);
                setPage('public-profile');
              }}
              className="flex items-center gap-1 text-[12px] font-medium text-foreground truncate hover:text-primary transition-colors leading-tight"
            >
              <span className="truncate">{user?.name}</span>
              {user?.isVerified && <VerificationBadge size="sm" />}
            </button>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {user?.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য'}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={async () => {
                useAppStore.getState().setUser(null);
                useAppStore.getState().setPage('home');
                await signOut({ redirect: false });
              }}
              aria-label="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Main Layout ───────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[210px] shrink-0 border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>নেভিগেশন</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-1.5">
            {siteSettings.site_logo ? (
              <img
                src={siteSettings.site_logo}
                alt={siteName}
                className="h-6 w-6 object-contain rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
                <Shield className="w-3 h-3" />
              </div>
            )}
            <span className="font-bold text-foreground text-[13px]">{siteName}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="মেনু খুলুন"
              className="h-7 w-7 rounded-md"
            >
              <Menu className="w-4 h-4" />
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
