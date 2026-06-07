'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Upload, Loader2, Copy, CheckCircle2, Phone, Building2, Wallet } from 'lucide-react';
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

interface PaymentAccountInfo {
  bkash: { number: string; name: string };
  nagad: { number: string; name: string };
  rocket: { number: string; name: string };
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
    routing: string;
  };
}

const paymentMethods = [
  { value: 'bkash', label: 'bKash', icon: Phone, color: 'bg-pink-50 text-pink-700 border-pink-200', activeColor: 'border-pink-500 bg-pink-50' },
  { value: 'nagad', label: 'Nagad', icon: Phone, color: 'bg-orange-50 text-orange-700 border-orange-200', activeColor: 'border-orange-500 bg-orange-50' },
  { value: 'rocket', label: 'Rocket', icon: Wallet, color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'border-purple-500 bg-purple-50' },
  { value: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার', icon: Building2, color: 'bg-green-50 text-green-700 border-green-200', activeColor: 'border-green-500 bg-green-50' },
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

  const [accountInfo, setAccountInfo] = useState<PaymentAccountInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Fetch payment account info
  useEffect(() => {
    async function fetchAccountInfo() {
      try {
        const res = await fetch('/api/settings?category=payment_accounts');
        if (res.ok) {
          const data = await res.json();
          setAccountInfo(data);
        }
      } catch {
        // Silently fail - account info is optional
      }
    }
    fetchAccountInfo();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

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

  // Render account info based on selected payment method
  const renderAccountInfo = () => {
    if (!paymentMethod || !accountInfo) return null;

    if (paymentMethod === 'bkash' && accountInfo.bkash.number) {
      return (
        <Card className="border-pink-200 bg-pink-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-pink-800 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              bKash পেমেন্টের তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্ট নাম্বার</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{accountInfo.bkash.number}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleCopy(accountInfo.bkash.number, 'bkash-number')}
                >
                  {copiedField === 'bkash-number' ? (
                    <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                  ) : (
                    <><Copy className="h-3 w-3" /> কপি</>
                  )}
                </Button>
              </div>
              {accountInfo.bkash.name && (
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্টের নাম</p>
                  <p className="text-sm font-medium text-gray-700">{accountInfo.bkash.name}</p>
                </div>
              )}
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚠️ উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (paymentMethod === 'nagad' && accountInfo.nagad.number) {
      return (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-orange-800 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Nagad পেমেন্টের তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্ট নাম্বার</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{accountInfo.nagad.number}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleCopy(accountInfo.nagad.number, 'nagad-number')}
                >
                  {copiedField === 'nagad-number' ? (
                    <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                  ) : (
                    <><Copy className="h-3 w-3" /> কপি</>
                  )}
                </Button>
              </div>
              {accountInfo.nagad.name && (
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্টের নাম</p>
                  <p className="text-sm font-medium text-gray-700">{accountInfo.nagad.name}</p>
                </div>
              )}
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚠️ উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (paymentMethod === 'rocket' && accountInfo.rocket.number) {
      return (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Rocket পেমেন্টের তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্ট নাম্বার</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{accountInfo.rocket.number}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleCopy(accountInfo.rocket.number, 'rocket-number')}
                >
                  {copiedField === 'rocket-number' ? (
                    <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                  ) : (
                    <><Copy className="h-3 w-3" /> কপি</>
                  )}
                </Button>
              </div>
              {accountInfo.rocket.name && (
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্টের নাম</p>
                  <p className="text-sm font-medium text-gray-700">{accountInfo.rocket.name}</p>
                </div>
              )}
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚠️ উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (paymentMethod === 'bank_transfer' && accountInfo.bank.accountNumber) {
      return (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              ব্যাংক ট্রান্সফারের তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-3 space-y-3">
              {accountInfo.bank.bankName && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">ব্যাংকের নাম</p>
                    <p className="text-sm font-medium text-gray-900">{accountInfo.bank.bankName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্ট নাম্বার</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{accountInfo.bank.accountNumber}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleCopy(accountInfo.bank.accountNumber, 'bank-account')}
                >
                  {copiedField === 'bank-account' ? (
                    <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                  ) : (
                    <><Copy className="h-3 w-3" /> কপি</>
                  )}
                </Button>
              </div>
              {accountInfo.bank.accountName && (
                <div>
                  <p className="text-xs text-gray-500">অ্যাকাউন্টের নাম</p>
                  <p className="text-sm font-medium text-gray-700">{accountInfo.bank.accountName}</p>
                </div>
              )}
              {accountInfo.bank.branch && (
                <div>
                  <p className="text-xs text-gray-500">শাখা</p>
                  <p className="text-sm font-medium text-gray-700">{accountInfo.bank.branch}</p>
                </div>
              )}
              {accountInfo.bank.routing && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">রাউটিং নাম্বার</p>
                    <p className="text-sm font-medium text-gray-700 font-mono">{accountInfo.bank.routing}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleCopy(accountInfo.bank.routing, 'bank-routing')}
                  >
                    {copiedField === 'bank-routing' ? (
                      <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                    ) : (
                      <><Copy className="h-3 w-3" /> কপি</>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚠️ উপরের অ্যাকাউন্টে টাকা পাঠান এবং ট্রানজেকশন আইডি নিচে দিন।
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
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
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.value}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-sm ${
                          paymentMethod === method.value
                            ? method.activeColor
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={method.value} id={method.value} />
                        <Icon className="h-4 w-4" />
                        <Label htmlFor={method.value} className="cursor-pointer font-medium text-sm">
                          {method.label}
                        </Label>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Account Info Display */}
              {renderAccountInfo()}

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
