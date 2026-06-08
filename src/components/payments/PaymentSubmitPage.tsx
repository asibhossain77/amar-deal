'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  CreditCard, Loader2, Copy, CheckCircle2, Phone, Building2, 
  Wallet, Info, ImageIcon, ChevronRight, ArrowLeft, Shield,
  Upload, FileCheck, AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Transaction, PaymentGateway } from '@/lib/types';
import { formatBDT } from '@/lib/helpers';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  getGatewayLogoComponent, 
  getGatewayBrandColor, 
  StepIndicator 
} from './GatewayLogos';

// Default theme when gateway has theme disabled
const DEFAULT_THEME = {
  primaryColor: '#6BBF59',
  buttonColor: '#6BBF59',
  borderColor: '#6BBF59',
  backgroundColor: '#f0f7ee',
};

// Helper: get icon based on accountType
function getGatewayIcon(accountType: string) {
  const type = accountType.toLowerCase();
  if (type === 'personal' || type === 'merchant') return Phone;
  if (type === 'bank') return Building2;
  return Wallet;
}

// Helper: get account type label in Bengali
function getAccountTypeLabel(accountType: string): string {
  const type = accountType.toLowerCase();
  if (type === 'personal') return 'পার্সোনাল';
  if (type === 'merchant') return 'মার্চেন্ট';
  if (type === 'bank') return 'ব্যাংক';
  return accountType;
}

// Helper: get account type icon color
function getAccountTypeIconColor(accountType: string): string {
  const type = accountType.toLowerCase();
  if (type === 'personal') return 'text-blue-500';
  if (type === 'merchant') return 'text-emerald-500';
  if (type === 'bank') return 'text-amber-600';
  return 'text-gray-500';
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

  // UI state
  const [isDragging, setIsDragging] = useState(false);

  // Compute current step
  const currentStep = !selectedGateway ? 1 : !transactionRef.trim() || !amount ? 2 : 3;

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
        // Pre-fill amount from transaction
        if (tx?.amount) {
          setAmount(tx.amount.toString());
        }
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
        const sorted = [...gatewayList].sort((a: PaymentGateway, b: PaymentGateway) => a.sortOrder - b.sortOrder);
        setGateways(sorted);
      } catch {
        // Silently fail
      } finally {
        setGatewaysLoading(false);
      }
    }
    fetchGateways();
  }, []);

  // Compute CSS variables object for the selected gateway's theme
  const themeVars: React.CSSProperties = (() => {
    if (!selectedGateway) return {};
    if (selectedGateway.themeEnabled) {
      return {
        '--gateway-primary-color': selectedGateway.primaryColor,
        '--gateway-button-color': selectedGateway.buttonColor,
        '--gateway-border-color': selectedGateway.borderColor,
        '--gateway-bg-color': selectedGateway.backgroundColor,
      } as React.CSSProperties;
    }
    return {
      '--gateway-primary-color': DEFAULT_THEME.primaryColor,
      '--gateway-button-color': DEFAULT_THEME.buttonColor,
      '--gateway-border-color': DEFAULT_THEME.borderColor,
      '--gateway-bg-color': DEFAULT_THEME.backgroundColor,
    } as React.CSSProperties;
  })();

  const activeColor = selectedGateway?.themeEnabled ? selectedGateway.primaryColor : DEFAULT_THEME.primaryColor;

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: 'কপি হয়েছে!',
        description: `${text} ক্লিপবোর্ডে কপি হয়েছে`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  }, [toast]);

  const handleGatewaySelect = useCallback((gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setError('');
    setAmountError('');
    // Don't reset amount if it was pre-filled from transaction
  }, []);

  const handleAmountChange = useCallback((value: string) => {
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
  }, [selectedGateway]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Drag and drop handler
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  // ─── Success State ────────────────────────────
  if (success) {
    return (
      <div className="payment-gateway-module page-container" style={themeVars}>
        <div className="max-w-lg mx-auto text-center py-8 sm:py-12 success-container">
          <div className="success-checkmark">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">পেমেন্ট সফলভাবে জমা হয়েছে!</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            আপনার পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ রয়েছে। অ্যাডমিন যাচাই করার পর আপনাকে জানানো হবে।
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoToTransaction} className="gap-2 min-h-[44px]">
              লেনদেনের বিবরণ দেখুন
            </Button>
            <Button variant="outline" onClick={() => setPage('transactions')} className="gap-2 min-h-[44px]">
              সব লেনদেন
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Payment Form ────────────────────────
  return (
    <div className="payment-gateway-module page-container space-y-4 sm:space-y-6" style={themeVars}>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="shrink-0 h-10 w-10 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: activeColor }} />
            পেমেন্ট জমা দিন
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">আপনার পেমেন্টের বিবরণ পূরণ করুন</p>
        </div>
        <div className="shrink-0">
          <Shield className="h-5 w-5 text-green-500" />
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Transaction Info Summary - Compact Card */}
      <Card className="transaction-info-card">
        {loading ? (
          <CardContent className="p-4 space-y-3">
            <div className="gateway-skeleton h-4 w-3/4" />
            <div className="gateway-skeleton h-6 w-1/2" />
            <div className="gateway-skeleton h-4 w-2/3" />
          </CardContent>
        ) : transaction ? (
          <>
            <div className="info-header">
              <p className="text-xs opacity-80 mb-1">লেনদেনের তথ্য</p>
              <h3 className="text-sm font-semibold truncate">{transaction.title}</h3>
            </div>
            <div className="info-body space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">পরিমাণ</span>
                <span className="gateway-amount-text text-lg font-bold">{formatBDT(transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">বিক্রেতা</span>
                <span className="text-xs font-medium text-foreground">{transaction.seller?.name || 'বিক্রেতা'}</span>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">লেনদেনের তথ্য পাওয়া যায়নি</p>
            <Button variant="outline" size="sm" className="mt-2 min-h-[40px]" onClick={() => setPage('transactions')}>
              লেনদেন তালিকায় যান
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Payment Form */}
      {transaction && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          
          {/* ═══ STEP 1: Gateway Selection ═══ */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: activeColor }}>1</span>
              পেমেন্ট গেটওয়ে নির্বাচন করুন
              <span className="text-red-500">*</span>
            </Label>

            {gatewaysLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="gateway-card rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="gateway-skeleton w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="gateway-skeleton h-4 w-24" />
                        <div className="gateway-skeleton h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : gateways.length === 0 ? (
              <div className="gateway-card rounded-xl p-4 flex items-start gap-3">
                <Info className="instructions-icon h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">কোনো পেমেন্ট গেটওয়ে সক্রিয় নেই</p>
                  <p className="text-xs text-muted-foreground mt-1">অ্যাডমিন এখনো কোনো পেমেন্ট গেটওয়ে সক্রিয় করেননি।</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gateways.map((gateway) => {
                  const isSelected = selectedGateway?.id === gateway.id;
                  const gwColor = gateway.themeEnabled ? gateway.primaryColor : DEFAULT_THEME.primaryColor;
                  const LogoComponent = getGatewayLogoComponent(gateway.slug);
                  const GatewayIcon = getGatewayIcon(gateway.accountType);
                  const brandColor = getGatewayBrandColor(gateway.slug);

                  return (
                    <button
                      key={gateway.id}
                      type="button"
                      onClick={() => handleGatewaySelect(gateway)}
                      className={`gateway-card ${isSelected ? 'gateway-card-selected' : ''} rounded-xl p-3 sm:p-4 cursor-pointer text-left w-full`}
                    >
                      {/* Check indicator for selected state */}
                      <div className="gateway-check-indicator">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Gateway Logo */}
                        <div className="gateway-logo-container" style={gateway.logo && LogoComponent ? {} : { backgroundColor: `${brandColor}15`, color: brandColor }}>
                          {gateway.logo ? (
                            <img src={gateway.logo} alt={gateway.name} className="h-full w-full object-contain rounded-xl" />
                          ) : LogoComponent ? (
                            <LogoComponent size={48} />
                          ) : (
                            <GatewayIcon className="h-5 w-5" style={{ color: brandColor }} />
                          )}
                        </div>

                        {/* Gateway Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                            {gateway.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-1.5 py-0 ${getAccountTypeIconColor(gateway.accountType)}`}
                            >
                              {getAccountTypeLabel(gateway.accountType)}
                            </Badge>
                            {gateway.minDeposit > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                সর্বনিম্ন {formatBDT(gateway.minDeposit)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chevron for selected */}
                        <ChevronRight className={`h-4 w-4 transition-colors ${isSelected ? '' : 'text-muted-foreground/40'}`} style={isSelected ? { color: gwColor } : {}} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ STEP 2: Payment Details (shown after gateway selection) ═══ */}
          {selectedGateway && (
            <div className="animate-slide-up space-y-4 sm:space-y-5">
              
              {/* Gateway Detail Card */}
              <div className="gateway-detail-card rounded-xl">
                <div className="p-3 sm:p-4 pb-2 flex items-center gap-2">
                  {selectedGateway.logo ? (
                    <img src={selectedGateway.logo} alt={selectedGateway.name} className="h-5 w-5 object-contain rounded" />
                  ) : (
                    <div className="gateway-icon-wrapper h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${activeColor}15`, color: activeColor }}>
                      {React.createElement(getGatewayIcon(selectedGateway.accountType), { className: 'h-3.5 w-3.5' })}
                    </div>
                  )}
                  <h3 className="gateway-detail-header text-sm font-semibold">
                    {selectedGateway.name} পেমেন্টের তথ্য
                  </h3>
                </div>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
                  <div className="gateway-detail-inner space-y-3">
                    {/* Account Number - Prominent Display */}
                    <div className="account-number-box">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">অ্যাকাউন্ট নাম্বার</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tracking-wider">{selectedGateway.accountNumber}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gateway-copy-btn gap-1.5 mt-2 min-h-[36px]"
                        onClick={() => handleCopy(selectedGateway.accountNumber, `gateway-${selectedGateway.id}-number`)}
                      >
                        {copiedField === `gateway-${selectedGateway.id}-number` ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> কপি হয়েছে</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /> কপি করুন</>
                        )}
                      </Button>
                    </div>

                    {/* Account Name */}
                    {selectedGateway.accountName && (
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">অ্যাকাউন্টের নাম</span>
                        <span className="text-sm font-medium text-foreground">{selectedGateway.accountName}</span>
                      </div>
                    )}

                    {/* Min/Max Deposit */}
                    {(selectedGateway.minDeposit > 0 || selectedGateway.maxDeposit > 0) && (
                      <div className="flex items-center gap-4 text-xs">
                        {selectedGateway.minDeposit > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">সর্বনিম্ন:</span>
                            <span className="font-semibold text-foreground">{formatBDT(selectedGateway.minDeposit)}</span>
                          </div>
                        )}
                        {selectedGateway.maxDeposit > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">সর্বোচ্চ:</span>
                            <span className="font-semibold text-foreground">{formatBDT(selectedGateway.maxDeposit)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Instructions */}
                  <div className="gateway-instructions flex items-start gap-2">
                    <Info className="instructions-icon h-4 w-4 shrink-0 mt-0.5" />
                    <p className="instructions-text text-xs leading-relaxed">
                      {selectedGateway.instructions || (
                        <>উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ═══ Payment Amount ═══ */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: activeColor }}>2</span>
                  পেমেন্টের পরিমাণ
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">৳</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    min={selectedGateway?.minDeposit || undefined}
                    max={selectedGateway?.maxDeposit || undefined}
                    step="any"
                    className="gateway-input pl-8 text-lg font-bold"
                  />
                </div>
                {amountError && (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <p className="text-xs">{amountError}</p>
                  </div>
                )}
                {selectedGateway && (selectedGateway.minDeposit > 0 || selectedGateway.maxDeposit > 0) && !amountError && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGateway.minDeposit > 0 && `সর্বনিম্ন: ${formatBDT(selectedGateway.minDeposit)}`}
                    {selectedGateway.minDeposit > 0 && selectedGateway.maxDeposit > 0 && ' • '}
                    {selectedGateway.maxDeposit > 0 && `সর্বোচ্চ: ${formatBDT(selectedGateway.maxDeposit)}`}
                  </p>
                )}
              </div>

              {/* ═══ Transaction ID ═══ */}
              <div className="space-y-2">
                <Label htmlFor="transactionRef" className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: activeColor }}>3</span>
                  ট্রানজেকশন আইডি
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transactionRef"
                  placeholder="যেমন: TXN123456789"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    setError('');
                  }}
                  className="gateway-input font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">আপনার পেমেন্ট প্রদানের ট্রানজেকশন আইডি দিন</p>
              </div>

              {/* ═══ Screenshot Upload ═══ */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">পেমেন্টের স্ক্রিনশট</Label>
                <div 
                  className={`gateway-upload-area flex flex-col items-center justify-center gap-2 text-center ${isDragging ? 'drag-over' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {screenshotFileName ? (
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-foreground font-medium truncate max-w-[200px]">{screenshotFileName}</span>
                    </div>
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {screenshotFileName ? 'ফাইল পরিবর্তন করুন' : 'স্ক্রিনশট আপলোড করুন'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">ড্র্যাগ ও ড্রপ অথবা ক্লিক করুন</p>
                  </div>
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer border-0 bg-transparent p-0 file:bg-transparent file:border-0 file:text-sm file:font-medium"
                  />
                </div>
                <p className="text-xs text-muted-foreground">স্ক্রিনশট আপলোড করুন (ঐচ্ছিক)</p>
              </div>

              {/* ═══ Note ═══ */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium">নোট</Label>
                <Textarea
                  id="note"
                  placeholder="অতিরিক্ত তথ্য লিখুন (ঐচ্ছিক)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="gateway-input resize-none"
                />
              </div>

              {/* ═══ Error ═══ */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 animate-slide-in">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* ═══ Submit Button ═══ */}
              <button
                type="submit"
                className="gateway-submit-btn w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base"
                disabled={submitting || !selectedGateway || !transactionRef.trim() || !amount || !!amountError}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    পেমেন্ট জমা দিন
                  </>
                )}
              </button>

              {/* Help text when button is disabled */}
              {!selectedGateway && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" /> পেমেন্ট গেটওয়ে নির্বাচন করুন
                </p>
              )}
              {selectedGateway && (!amount || amountError) && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" /> পেমেন্টের পরিমাণ সঠিকভাবে দিন
                </p>
              )}
              {selectedGateway && amount && !amountError && !transactionRef.trim() && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" /> ট্রানজেকশন আইডি দিন
                </p>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1 pb-2">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[10px] text-muted-foreground">সুরক্ষিত পেমেন্ট • এসক্রো সুরক্ষিত</span>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
