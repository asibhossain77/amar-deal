'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getSiteName } from '@/lib/site-defaults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { setPage, siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('ইমেইল লিখুন');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('সঠিক ইমেইল ঠিকানা লিখুন');
      return;
    }

    setIsLoading(true);

    try {
      // Demo: simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch {
      setError('পাসওয়ার্ড পুনরুদ্ধার লিংক পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              পাসওয়ার্ড পুনরুদ্ধার
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isSuccess
                ? 'ইমেইল পাঠানো হয়েছে'
                : 'আপনার ইমেইল ঠিকানা লিখুন, আমরা আপনাকে পাসওয়ার্ড পুনরায় সেট করার নির্দেশনা পাঠাবো।'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 text-primary text-sm rounded-md px-4 py-4 text-center">
                  <p className="font-medium mb-1">ইমেইল পাঠানো হয়েছে!</p>
                  <p className="text-primary/80">
                    {email} ঠিকানায় পাসওয়ার্ড পুনরুদ্ধারের নির্দেশনা পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setPage('login')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  লগইন পৃষ্ঠায় ফিরে যান
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email">ইমেইল</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
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

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      পাঠানো হচ্ছে...
                    </>
                  ) : (
                    'পাসওয়ার্ড পুনরুদ্ধার লিংক পাঠান'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setPage('login')}
                    className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    লগইন পৃষ্ঠায় ফিরে যান
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
