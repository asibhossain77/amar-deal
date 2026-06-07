'use client';

import { useState } from 'react';
import { Shield, Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { signOut } from 'next-auth/react';

const navLinks = [
  { label: 'হোম', page: 'home' as const },
  { label: 'কিভাবে কাজ করে', page: 'how-it-works' as const },
  { label: 'সম্পর্কে', page: 'about' as const },
  { label: 'যোগাযোগ', page: 'home' as const },
];

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">
              বাংলা এসক্রো
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.page)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === link.page
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavClick('dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  ড্যাশবোর্ড
                </Button>
                <span className="text-sm text-slate-600 font-medium">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-slate-500 hover:text-red-600"
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
                  className="text-slate-600"
                >
                  লগইন
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavClick('register')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  নিবন্ধন
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">মেনু খুলুন</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base font-bold text-slate-800">
                    বাংলা এসক্রো
                  </span>
                </div>
              </SheetTitle>
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.page)}
                    className={`px-4 py-3 rounded-md text-sm font-medium text-right transition-colors ${
                      currentPage === link.page
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col gap-3">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-slate-600 font-medium">
                      {user.name}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleNavClick('dashboard');
                      }}
                      className="gap-2 justify-start"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      ড্যাশবোর্ড
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="gap-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      className="w-full"
                    >
                      লগইন
                    </Button>
                    <Button
                      onClick={() => {
                        handleNavClick('register');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
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
    </header>
  );
}
