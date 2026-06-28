'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, FileText, ShoppingBag, Store, User, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';

export default function CreateTransactionPage() {
  const { setPage } = useAppStore();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [counterpartyEmail, setCounterpartyEmail] = useState('');
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'চুক্তির শিরোনাম আবশ্যক';
    }

    if (!description.trim()) {
      newErrors.description = 'বিবরণ আবশ্যক';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'পরিমাণ অবশ্যই ধনাত্মক হতে হবে';
    }

    if (!counterpartyEmail.trim()) {
      newErrors.counterpartyEmail = 'প্রতিপক্ষের ইমেইল আবশ্যক';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(counterpartyEmail.trim())) {
      newErrors.counterpartyEmail = 'সঠিক ইমেইল ঠিকানা দিন';
    }

    if (!terms.trim()) {
      newErrors.terms = 'শর্তাবলী আবশ্যক';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      const data = await api.createTransaction({
        title: title.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        terms: terms.trim(),
        counterpartyEmail: counterpartyEmail.trim(),
        userRole,
      });

      toast({
        title: 'সফল!',
        description: data.message || 'লেনদেন সফলভাবে তৈরি হয়েছে',
      });

      setPage('transactions');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'লেনদেন তৈরি করতে ত্রুটি হয়েছে';
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="নতুন এসক্রো ডিল তৈরি করুন"
        subtitle="এসক্রো লেনদেনের তথ্য পূরণ করুন"
        icon={<FileText className="h-5 w-5 text-primary" />}
        backTo="transactions"
      />

      {/* Form */}
      <Card className="card-modern max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">ডিলের তথ্য</CardTitle>
          <CardDescription>
            নতুন এসক্রো লেনদেন তৈরি করতে নিচের তথ্য পূরণ করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

            {/* Role Selection - Enhanced Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                আপনি কি ভূমিকায় এই ডিল তৈরি করছেন?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Buyer Option */}
                <button
                  type="button"
                  onClick={() => setUserRole('buyer')}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 ${
                    userRole === 'buyer'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
                  }`}
                >
                  {userRole === 'buyer' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
                      userRole === 'buyer'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-sm font-semibold ${
                        userRole === 'buyer' ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      আমি ক্রেতা
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      পণ্য/সেবা কিনব
                    </div>
                  </div>
                </button>

                {/* Seller Option */}
                <button
                  type="button"
                  onClick={() => setUserRole('seller')}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 ${
                    userRole === 'seller'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
                  }`}
                >
                  {userRole === 'seller' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
                      userRole === 'seller'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                    }`}
                  >
                    <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-sm font-semibold ${
                        userRole === 'seller' ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      আমি বিক্রেতা
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      পণ্য/সেবা বিক্রি করব
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Counterparty Email */}
            <div className="space-y-2">
              <Label htmlFor="counterpartyEmail" className="text-sm font-medium">
                {userRole === 'buyer' ? 'বিক্রেতার ইমেইল' : 'ক্রেতার ইমেইল'}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="counterpartyEmail"
                  type="email"
                  placeholder={
                    userRole === 'buyer'
                      ? 'seller@example.com'
                      : 'buyer@example.com'
                  }
                  value={counterpartyEmail}
                  onChange={(e) => {
                    setCounterpartyEmail(e.target.value);
                    if (errors.counterpartyEmail) {
                      setErrors((prev) => ({ ...prev, counterpartyEmail: '' }));
                    }
                  }}
                  className={`pl-10 h-12 text-base ${errors.counterpartyEmail ? 'border-destructive' : ''}`}
                  autoComplete="off"
                />
              </div>
              {errors.counterpartyEmail && (
                <p className="text-sm text-destructive">{errors.counterpartyEmail}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                প্রতিপক্ষকে স্বয়ংক্রিয়ভাবে এই ডিলে যুক্ত করা হবে
              </p>
            </div>

            {/* Transaction Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">চুক্তির শিরোনাম</Label>
              <Input
                id="title"
                placeholder="যেমন: ওয়েবসাইট ডিজাইন প্রজেক্ট"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors((prev) => ({ ...prev, title: '' }));
                  }
                }}
                className={`h-12 text-base ${errors.title ? 'border-destructive' : ''}`}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">বিবরণ</Label>
              <Textarea
                id="description"
                placeholder="লেনদেনের বিস্তারিত বিবরণ লিখুন"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: '' }));
                  }
                }}
                className={`text-base ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">পরিমাণ (বিডিটি)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base">
                  ৳
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors((prev) => ({ ...prev, amount: '' }));
                    }
                  }}
                  className={`pl-8 h-12 text-base font-semibold ${errors.amount ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms" className="text-sm font-medium">শর্তাবলী</Label>
              <Textarea
                id="terms"
                placeholder="লেনদেনের শর্তাবলী ও প্রয়োজনীয়তা লিখুন"
                rows={5}
                value={terms}
                onChange={(e) => {
                  setTerms(e.target.value);
                  if (errors.terms) {
                    setErrors((prev) => ({ ...prev, terms: '' }));
                  }
                }}
                className={`text-base ${errors.terms ? 'border-destructive' : ''}`}
              />
              {errors.terms && (
                <p className="text-sm text-destructive">{errors.terms}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage('transactions')}
                disabled={submitting}
                className="w-full sm:w-auto h-12 sm:h-10"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto h-12 sm:h-10 gap-2 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    ডিল তৈরি করুন
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
