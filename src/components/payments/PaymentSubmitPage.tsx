'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Upload, Loader2, Copy, CheckCircle2, Phone, Building2, Wallet, Info, ImageIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Transaction, PaymentGateway } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Helper: get icon based on accountType
function getGatewayIcon(accountType: string) {
  const type = accountType.toLowerCase();
  if (type === 'personal' || type === 'merchant') return Phone;
  if (type === 'bank') return Building2;
  return Wallet;
}

// Helper: get color theme based on accountType
function getGatewayColors(accountType: string) {
  const type = accountType.toLowerCase();
  if (type === 'personal') return { text: 'text-pink-700', activeColor: 'border-pink-500 bg-pink-50', cardBorder: 'border-pink-200', cardBg: 'bg-pink-50/50', titleColor: 'text-pink-800' };
  if (type === 'merchant') return { text: 'text-orange-700', activeColor: 'border-orange-500 bg-orange-50', cardBorder: 'border-orange-200', cardBg: 'bg-orange-50/50', titleColor: 'text-orange-800' };
  if (type === 'bank') return { text: 'text-green-700', activeColor: 'border-green-500 bg-green-50', cardBorder: 'border-green-200', cardBg: 'bg-green-50/50', titleColor: 'text-green-800' };
  return { text: 'text-purple-700', activeColor: 'border-purple-500 bg-purple-50', cardBorder: 'border-purple-200', cardBg: 'bg-purple-50/50', titleColor: 'text-purple-800' };
}

// Helper: get account type label in Bengali
function getAccountTypeLabel(accountType: string): string {
  const type = accountType.toLowerCase();
  if (type === 'personal') return 'পার্সোনাল';
  if (type === 'merchant') return 'মার্চেন্ট';
  if (type === 'bank') return 'ব্যাংক';
  return accountType;
}

export default function PaymentSubmitPage() {
  const { selectedPaymentTransactionId, setPage, setSelectedTransactionId } = useAppStore();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Gateway state
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [note, setNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [amountError, setAmountError] = useState('');

  // Fetch transaction info
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

  // Fetch active gateways
  useEffect(() => {
    async function fetchGateways() {
      try {
        setGatewaysLoading(true);
        const data = await api.getActiveGateways();
        const gatewayList = data.gateways || data || [];
        // Sort by sortOrder
        const sorted = [...gatewayList].sort((a: PaymentGateway, b: PaymentGateway) => a.sortOrder - b.sortOrder);
        setGateways(sorted);
      } catch {
        // Silently fail - gateways will be empty
      } finally {
        setGatewaysLoading(false);
      }
    }
    fetchGateways();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: 'কপি হয়েছে!',
        description: `${text} ক্লিপবোর্ডে কপি হয়েছে`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleGatewaySelect = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setError('');
    setAmountError('');
    setAmount('');
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setAmountError('');
    setError('');

    if (!selectedGateway || !value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (selectedGateway.minDeposit > 0 && numValue < selectedGateway.minDeposit) {
      setAmountError(`সর্বনিম্ন জমার পরিমাণ ${formatBDT(selectedGateway.minDeposit)}`);
    }
    if (selectedGateway.maxDeposit > 0 && numValue > selectedGateway.maxDeposit) {
      setAmountError(`সর্বোচ্চ জমার পরিমাণ ${formatBDT(selectedGateway.maxDeposit)}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setScreenshot(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGateway) {
      setError('পেমেন্ট গেটওয়ে নির্বাচন করুন');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('পেমেন্টের পরিমাণ সঠিকভাবে দিন');
      return;
    }

    if (amountError) {
      setError(amountError);
      return;
    }

    if (!transactionRef.trim()) {
      setError('ট্রানজেকশন আইডি দিন');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submitGatewayTransaction({
        transactionId: selectedPaymentTransactionId!,
        gatewayId: selectedGateway.id,
        transactionRef: transactionRef.trim(),
        amount: parseFloat(amount),
        screenshot: screenshot || undefined,
        note: note.trim() || undefined,
      });
      setSuccess(true);
      toast({
        title: 'সফল!',
        description: 'পেমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করবেন।',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পেমেন্ট জমা দিতে সমস্যা হয়েছে';
      setError(message);
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
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

  // Render gateway details card after selection
  const renderGatewayDetails = () => {
    if (!selectedGateway) return null;

    const colors = getGatewayColors(selectedGateway.accountType);
    const GatewayIcon = getGatewayIcon(selectedGateway.accountType);

    return (
      <Card className={`${colors.cardBorder} ${colors.cardBg} shadow-sm`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-semibold ${colors.titleColor} flex items-center gap-2`}>
            {selectedGateway.logo ? (
              <img src={selectedGateway.logo} alt={selectedGateway.name} className="h-5 w-5 object-contain rounded" />
            ) : (
              <GatewayIcon className="h-4 w-4" />
            )}
            {selectedGateway.name} পেমেন্টের তথ্য
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white rounded-lg p-4 space-y-3">
            {/* Account Number with copy */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">অ্যাকাউন্ট নাম্বার</p>
                <p className="text-xl font-bold text-foreground font-mono tracking-wide">{selectedGateway.accountNumber}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                onClick={() => handleCopy(selectedGateway.accountNumber, `gateway-${selectedGateway.id}-number`)}
              >
                {copiedField === `gateway-${selectedGateway.id}-number` ? (
                  <><CheckCircle2 className="h-3 w-3 text-green-600" /> কপি হয়েছে</>
                ) : (
                  <><Copy className="h-3 w-3" /> কপি</>
                )}
              </Button>
            </div>

            {/* Account Name */}
            {selectedGateway.accountName && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">অ্যাকাউন্টের নাম</p>
                <p className="text-sm font-medium text-foreground">{selectedGateway.accountName}</p>
              </div>
            )}

            {/* Min/Max Deposit Info */}
            {(selectedGateway.minDeposit > 0 || selectedGateway.maxDeposit > 0) && (
              <div className="pt-2 border-t flex items-center gap-4">
                {selectedGateway.minDeposit > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">সর্বনিম্ন জমা</p>
                    <p className="text-sm font-medium text-foreground">{formatBDT(selectedGateway.minDeposit)}</p>
                  </div>
                )}
                {selectedGateway.maxDeposit > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">সর্বোচ্চ জমা</p>
                    <p className="text-sm font-medium text-foreground">{formatBDT(selectedGateway.maxDeposit)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Instructions */}
          {selectedGateway.instructions && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{selectedGateway.instructions}</p>
            </div>
          )}

          {/* Default instruction if no custom instructions */}
          {!selectedGateway.instructions && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Success state
  if (success) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট সফলভাবে জমা হয়েছে!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            আপনার পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ রয়েছে। অ্যাডমিন যাচাই করার পর আপনাকে জানানো হবে।
          </p>
          <Button onClick={handleGoToTransaction} className="bg-primary hover:bg-primary/90">
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
          <h1 className="text-xl md:text-2xl font-bold text-foreground">পেমেন্ট জমা দিন</h1>
          <p className="text-sm text-muted-foreground mt-0.5">আপনার পেমেন্টের বিবরণ পূরণ করুন</p>
        </div>
      </div>

      {/* Transaction Info Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">লেনদেনের তথ্য</CardTitle>
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
                <span className="text-sm text-muted-foreground">শিরোনাম</span>
                <span className="text-sm font-semibold text-foreground">{transaction.title}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">পরিমাণ</span>
                <span className="text-lg font-bold text-primary">{formatBDT(transaction.amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">বিক্রেতা</span>
                <span className="text-sm font-medium text-foreground">{transaction.seller?.name || 'বিক্রেতা'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">লেনদেনের তথ্য পাওয়া যায়নি</p>
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
              {/* Gateway Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">পেমেন্ট গেটওয়ে নির্বাচন করুন <span className="text-red-500">*</span></Label>

                {gatewaysLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-lg border-2 p-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : gateways.length === 0 ? (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4 flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">কোনো পেমেন্ট গেটওয়ে সক্রিয় নেই</p>
                        <p className="text-xs text-amber-700 mt-1">অ্যাডমিন এখনো কোনো পেমেন্ট গেটওয়ে সক্রিয় করেননি। অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <RadioGroup
                    value={selectedGateway?.id || ''}
                    onValueChange={(value) => {
                      const gateway = gateways.find(g => g.id === value);
                      if (gateway) handleGatewaySelect(gateway);
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {gateways.map((gateway) => {
                      const colors = getGatewayColors(gateway.accountType);
                      const GatewayIcon = getGatewayIcon(gateway.accountType);
                      const isSelected = selectedGateway?.id === gateway.id;

                      return (
                        <label
                          key={gateway.id}
                          className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-sm ${
                            isSelected
                              ? colors.activeColor
                              : 'border-border bg-card hover:border-primary/30'
                          }`}
                        >
                          <RadioGroupItem value={gateway.id} id={`gateway-${gateway.id}`} />
                          {gateway.logo ? (
                            <img src={gateway.logo} alt={gateway.name} className="h-4 w-4 object-contain rounded" />
                          ) : (
                            <GatewayIcon className={`h-4 w-4 ${colors.text}`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`gateway-${gateway.id}`} className="cursor-pointer font-medium text-sm block truncate">
                              {gateway.name}
                            </Label>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
                            {getAccountTypeLabel(gateway.accountType)}
                          </Badge>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>

              {/* Gateway Details Card */}
              {renderGatewayDetails()}

              <Separator />

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  পেমেন্টের পরিমাণ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="পরিমাণ লিখুন"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  min={selectedGateway?.minDeposit || undefined}
                  max={selectedGateway?.maxDeposit || undefined}
                  step="any"
                />
                {amountError && (
                  <p className="text-xs text-red-500">{amountError}</p>
                )}
                {selectedGateway && (selectedGateway.minDeposit > 0 || selectedGateway.maxDeposit > 0) && !amountError && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGateway.minDeposit > 0 && `সর্বনিম্ন: ${formatBDT(selectedGateway.minDeposit)}`}
                    {selectedGateway.minDeposit > 0 && selectedGateway.maxDeposit > 0 && ' | '}
                    {selectedGateway.maxDeposit > 0 && `সর্বোচ্চ: ${formatBDT(selectedGateway.maxDeposit)}`}
                  </p>
                )}
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="transactionRef" className="text-sm font-medium">
                  ট্রানজেকশন আইডি <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transactionRef"
                  placeholder="যেমন: TXN123456789"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    setError('');
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">আপনার পেমেন্ট প্রদানের ট্রানজেকশন আইডি দিন</p>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label htmlFor="screenshot" className="text-sm font-medium">
                  পেমেন্টের স্ক্রিনশট
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
                {screenshotFileName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {screenshotFileName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">স্ক্রিনশট আপলোড করুন (ঐচ্ছিক)</p>
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                disabled={submitting || !selectedGateway || !transactionRef.trim() || !amount || !!amountError}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    পেমেন্ট জমা দিন
                  </>
                )}
              </Button>

              {/* Help text when button is disabled */}
              {!selectedGateway && (
                <p className="text-xs text-center text-muted-foreground">পেমেন্ট গেটওয়ে নির্বাচন করুন</p>
              )}
              {selectedGateway && !amount && (
                <p className="text-xs text-center text-muted-foreground">পেমেন্টের পরিমাণ দিন</p>
              )}
              {selectedGateway && amount && !transactionRef.trim() && (
                <p className="text-xs text-center text-muted-foreground">ট্রানজেকশন আইডি দিন</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
