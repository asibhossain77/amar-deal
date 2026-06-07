'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setPage('transactions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            নতুন লেনদেন তৈরি করুন
          </h1>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>লেনদেনের তথ্য</CardTitle>
          <CardDescription>
            নতুন এসক্রো লেনদেন তৈরি করতে নিচের তথ্য পূরণ করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">আপনার ভূমিকা</Label>
              <RadioGroup
                value={userRole}
                onValueChange={(v) => setUserRole(v as 'buyer' | 'seller')}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors flex-1">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="cursor-pointer flex-1">
                    <div className="font-medium">আমি ক্রেতা</div>
                    <div className="text-xs text-muted-foreground">
                      আমি পণ্য/সেবা কিনব এবং পেমেন্ট করব
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors flex-1">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="cursor-pointer flex-1">
                    <div className="font-medium">আমি বিক্রেতা</div>
                    <div className="text-xs text-muted-foreground">
                      আমি পণ্য/সেবা বিক্রি করব এবং পেমেন্ট পাব
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Counterparty Email */}
            <div className="space-y-2">
              <Label htmlFor="counterpartyEmail">
                প্রতিপক্ষের ইমেইল
              </Label>
              <Input
                id="counterpartyEmail"
                type="email"
                placeholder={
                  userRole === 'buyer'
                    ? 'বিক্রেতার ইমেইল লিখুন'
                    : 'ক্রেতার ইমেইল লিখুন'
                }
                value={counterpartyEmail}
                onChange={(e) => {
                  setCounterpartyEmail(e.target.value);
                  if (errors.counterpartyEmail) {
                    setErrors((prev) => ({ ...prev, counterpartyEmail: '' }));
                  }
                }}
                className={errors.counterpartyEmail ? 'border-destructive' : ''}
              />
              {errors.counterpartyEmail && (
                <p className="text-sm text-destructive">{errors.counterpartyEmail}</p>
              )}
            </div>

            {/* Transaction Title */}
            <div className="space-y-2">
              <Label htmlFor="title">চুক্তির শিরোনাম</Label>
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
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">বিবরণ</Label>
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
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">পরিমাণ (বিডিটি)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
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
                  className={`pl-8 ${errors.amount ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms">শর্তাবলী</Label>
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
                className={errors.terms ? 'border-destructive' : ''}
              />
              {errors.terms && (
                <p className="text-sm text-destructive">{errors.terms}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage('transactions')}
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  'লেনদেন তৈরি করুন'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
