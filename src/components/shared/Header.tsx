'use client';

import { useState } from 'react';
import { Shield, Menu, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

const navLinks = [
  { label: 'হোম', page: 'home' as const },
  { label: 'কিভাবে কাজ করে', page: 'how-it-works' as const },
  { label: 'সম্পর্কে', page: 'about' as const },
  { label: 'যোগাযোগ', page: 'home' as const },
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

export default function Header() {
  const { currentPage, setPage, user, isAuthenticated, setUser } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (page: typeof navLinks[number]['page']) => {
    setPage(page);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setUser(null);
    setPage('home');
    await signOut({ redirect: false });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-theme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              বাংলা এসক্রো
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  currentPage === link.page
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-accent'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavClick('dashboard')}
                  className="gap-2 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  ড্যাশবোর্ড
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-muted-foreground hover:text-destructive rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  লগআউট
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick('login')}
                  className="text-muted-foreground rounded-lg"
                >
                  লগইন
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavClick('register')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg btn-lift"
                >
                  নিবন্ধন
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">মেনু খুলুন</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-base font-bold text-foreground">
                      বাংলা এসক্রো
                    </span>
                  </div>
                </SheetTitle>
                <nav className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => handleNavClick(link.page)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium text-right transition-all duration-150 ${
                        currentPage === link.page
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-primary hover:bg-accent'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-muted-foreground font-medium">
                        {user.name}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleNavClick('dashboard');
                        }}
                        className="gap-2 justify-start rounded-lg"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        ড্যাশবোর্ড
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="gap-2 justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        লগআউট
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleNavClick('login');
                        }}
                        className="w-full rounded-lg"
                      >
                        লগইন
                      </Button>
                      <Button
                        onClick={() => {
                          handleNavClick('register');
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                      >
                        নিবন্ধন
                      </Button>
                    </>
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
