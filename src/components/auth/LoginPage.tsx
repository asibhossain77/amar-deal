'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Shield } from 'lucide-react';

export default function LoginPage() {
  const { setUser, setPage, siteSettings } = useAppStore();

  const siteName = siteSettings.site_name || 'বাংলা এসক্রো';
  const siteLogo = siteSettings.site_logo;
  const loginBg = siteSettings.site_login_bg;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('ইমেইল লিখুন');
      return;
    }
    if (!password.trim()) {
      setError('পাসওয়ার্ড লিখুন');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে');
        return;
      }

      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPage('dashboard');
      } else {
        setError('ব্যবহারকারীর তথ্য লোড করতে সমস্যা হয়েছে');
      }
    } catch {
      setError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-background px-4 py-8"
      style={loginBg ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}}
    >
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage('home')}
          className={`mb-4 gap-2 rounded-lg ${loginBg ? 'text-white hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ArrowLeft className="h-4 w-4" />
          হোমে ফিরে যান
        </Button>
        <Card className={`card-modern shadow-lg ${loginBg ? 'border-white/20 bg-white/95 dark:bg-card/95 backdrop-blur-md' : 'border-border'}`}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex items-center justify-center">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-12 w-12 object-contain rounded-xl" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              লগইন করুন
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {siteName}-এ আপনার অ্যাকাউন্টে প্রবেশ করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="আপনার ইমেইল লিখুন"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPage('forgot-password')}
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  'লগইন'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                অ্যাকাউন্ট নেই?{' '}
                <button
                  type="button"
                  onClick={() => setPage('register')}
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                >
                  নিবন্ধন করুন
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
