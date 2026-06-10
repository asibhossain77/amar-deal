'use client';

import { useState } from 'react';
import {
  Shield,
  Menu,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Home,
  BookOpen,
  Sparkles,
  Phone,
  LogIn,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { getSiteName } from '@/lib/site-defaults';
import type { PageName } from '@/lib/types';

/* ───────────────────── Nav Link Config ───────────────────── */
interface NavLink {
  label: string;
  page: PageName;
  section?: string;   // if set, scrolls to this section ID on the home page
  icon: React.ElementType;
}

const publicNavLinks: NavLink[] = [
  { label: 'হোম', page: 'home', icon: Home },
  { label: 'কিভাবে কাজ করে', page: 'how-it-works', icon: BookOpen },
  { label: 'বৈশিষ্ট্য', page: 'home', section: 'features', icon: Sparkles },
  { label: 'যোগাযোগ', page: 'home', section: 'contact', icon: Phone },
];

/* ───────────────────── Theme Toggle ───────────────────── */
function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}
      className={`shrink-0 h-8 w-8 rounded-md hover:bg-accent transition-colors ${className}`}
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/* ───────────────────── Header Component ───────────────────── */
export default function Header() {
  const { currentPage, setPage, user, isAuthenticated, setUser, siteSettings, setScrollTarget } =
    useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const siteName = getSiteName(siteSettings.site_name);
  const siteLogo = siteSettings.site_logo;

  const handleNavClick = (link: NavLink) => {
    setPage(link.page);
    if (link.section) {
      setScrollTarget(link.section);
    }
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setUser(null);
    setPage('home');
    await signOut({ redirect: false });
  };

  const isActive = (link: NavLink) => {
    if (link.section) {
      return currentPage === 'home' && !window.location.hash;
    }
    return currentPage === link.page;
  };

  const renderLogo = (size: 'lg' | 'sm') => {
    const iconSize = size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';
    const shieldSize = size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    const imgSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

    return siteLogo ? (
      <img src={siteLogo} alt={siteName} className={`${imgSize} object-contain rounded`} />
    ) : (
      <div className={`${iconSize} bg-primary rounded-lg flex items-center justify-center`}>
        <Shield className={`${shieldSize} text-primary-foreground`} />
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* ── Logo ── */}
          <button
            onClick={() => {
              setPage('home');
              setScrollTarget(null);
            }}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0"
          >
            {renderLogo('lg')}
            <span className="text-[13px] font-bold text-foreground">{siteName}</span>
          </button>

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              const active = currentPage === link.page && !link.section;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* ── Desktop Auth Section ── */}
          <div className="hidden md:flex items-center gap-1.5">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage('dashboard')}
                  className="gap-1.5 rounded-md h-7 text-[11px] px-2.5"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  ড্যাশবোর্ড
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1 text-muted-foreground hover:text-red-600 rounded-md h-7 text-[11px] px-2"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden lg:inline">লগআউট</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage('login')}
                  className="text-muted-foreground rounded-md h-7 text-[11px] gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  লগইন
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPage('register')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-7 text-[11px] gap-1 px-3"
                >
                  <UserPlus className="w-3 h-3" />
                  নিবন্ধন
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile Controls ── */}
          <div className="flex items-center gap-0.5 md:hidden">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                  <Menu className="w-4 h-4" />
                  <span className="sr-only">মেনু খুলুন</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SheetTitle className="sr-only">নেভিগেশন মেনু</SheetTitle>

                {/* Mobile Logo */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    {renderLogo('sm')}
                    <span className="text-[12px] font-bold text-foreground">{siteName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Mobile Nav Links */}
                <nav className="flex flex-col px-2 py-2">
                  {publicNavLinks.map((link) => {
                    const Icon = link.icon;
                    const active = currentPage === link.page && !link.section;
                    return (
                      <button
                        key={link.label}
                        onClick={() => handleNavClick(link)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {link.label}
                      </button>
                    );
                  })}
                </nav>

                <Separator className="mx-3" />

                {/* Mobile Auth */}
                <div className="px-3 py-3">
                  {isAuthenticated && user ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPage('dashboard');
                          setMobileOpen(false);
                        }}
                        className="w-full gap-2 justify-start rounded-md h-8 text-[11px]"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        ড্যাশবোর্ড
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full gap-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md h-8 text-[11px]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        লগআউট
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPage('login');
                          setMobileOpen(false);
                        }}
                        className="w-full rounded-md h-8 text-[11px] gap-1.5"
                      >
                        <LogIn className="w-3 h-3" />
                        লগইন
                      </Button>
                      <Button
                        onClick={() => {
                          setPage('register');
                          setMobileOpen(false);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-8 text-[11px] gap-1.5"
                      >
                        <UserPlus className="w-3 h-3" />
                        নিবন্ধন
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
