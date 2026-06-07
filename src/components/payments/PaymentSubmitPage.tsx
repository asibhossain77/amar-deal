'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Upload, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Transaction } from '@/lib/types';
import { formatBDT } from '@/lib/helpers';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const paymentMethods = [
  { value: 'bkash', label: 'bKash', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'nagad', label: 'Nagad', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'rocket', label: 'Rocket', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার', color: 'bg-green-50 text-green-700 border-green-200' },
];

export default function PaymentSubmitPage() {
  const { selectedPaymentTransactionId, setPage, setSelectedTransactionId } = useAppStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotDesc, setScreenshotDesc] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    async function fetchTransaction() {
      if (!selectedPaymentTransactionId) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getTransaction(selectedPaymentTransactionId);
        const tx = data.transaction || data;
        setTransaction(tx);
      } catch {
        setError('লেনদেনের তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();
  }, [selectedPaymentTransactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      setError('পেমেন্ট পদ্ধতি নির্বাচন করুন');
      return;
    }
    if (!transactionRef.trim()) {
      setError('ট্রানজেকশন আইডি দিন');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submitPayment({
        transactionId: selectedPaymentTransactionId!,
        transactionRef: transactionRef.trim(),
        paymentMethod,
        screenshot: screenshotDesc.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পেমেন্ট জমা দিতে সমস্যা হয়েছে';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (transaction) {
      setSelectedTransactionId(transaction.id);
      setPage('transaction-detail');
    } else {
      setPage('transactions');
    }
  };

  const handleGoToTransaction = () => {
    if (transaction) {
      setSelectedTransactionId(transaction.id);
      setPage('transaction-detail');
    }
  };

  if (success) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">পেমেন্ট সফলভাবে জমা হয়েছে!</h2>
          <p className="text-sm text-gray-500 mb-6">
            আপনার পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ রয়েছে। অ্যাডমিন যাচাই করার পর আপনাকে জানানো হবে।
          </p>
          <Button onClick={handleGoToTransaction} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            লেনদেনের বিবরণ দেখুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">পেমেন্ট জমা দিন</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার পেমেন্টের বিবরণ পূরণ করুন</p>
        </div>
      </div>

      {/* Transaction Info Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">লেনদেনের তথ্য</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : transaction ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">শিরোনাম</span>
                <span className="text-sm font-semibold text-gray-900">{transaction.title}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">পরিমাণ</span>
                <span className="text-lg font-bold text-[#2563eb]">{formatBDT(transaction.amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">বিক্রেতা</span>
                <span className="text-sm font-medium text-gray-900">{transaction.seller?.name || 'বিক্রেতা'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">লেনদেনের তথ্য পাওয়া যায়নি</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setPage('transactions')}>
                লেনদেন তালিকায় যান
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      {transaction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">পেমেন্টের বিবরণ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">পেমেন্ট পদ্ধতি <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-2 gap-3"
                >
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-sm ${
                        paymentMethod === method.value
                          ? `${method.color} border-current`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Label htmlFor={method.value} className="cursor-pointer font-medium text-sm">
                        {method.label}
                      </Label>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="transactionRef" className="text-sm font-medium">
                  ট্রানজেকশন আইডি <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transactionRef"
                  placeholder="যেমন: TXN123456789"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-400">আপনার পেমেন্ট প্রদানের ট্রানজেকশন আইডি দিন</p>
              </div>

              {/* Screenshot */}
              <div className="space-y-2">
                <Label htmlFor="screenshot" className="text-sm font-medium">
                  পেমেন্টের স্ক্রিনশট
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="screenshot"
                      placeholder="স্ক্রিনশটের বিবরণ লিখুন (ঐচ্ছিক)"
                      value={screenshotDesc}
                      onChange={(e) => setScreenshotDesc(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">স্ক্রিনশট আপলোড করুন অথবা বিবরণ লিখুন</p>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium">
                  নোট
                </Label>
                <Textarea
                  id="note"
                  placeholder="অতিরিক্ত তথ্য লিখুন (ঐচ্ছিক)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-3"
                disabled={submitting || !paymentMethod || !transactionRef.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  'পেমেন্ট জমা দিন'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
