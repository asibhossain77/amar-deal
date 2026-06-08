'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  formatBDT,
  formatDate,
  transactionStatusLabels,
  transactionStatusColors,
  paymentStatusLabels,
  disputeStatusLabels,
} from '@/lib/helpers';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  User,
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserLink from '@/components/shared/UserLink';

const statusTimeline: TransactionStatus[] = [
  'pending_payment',
  'pending_verification',
  'paid',
  'work_in_progress',
  'delivered',
  'completed',
  'disputed',
  'cancelled',
];

function getTimelineIndex(status: TransactionStatus): number {
  return statusTimeline.indexOf(status);
}

function isStatusReached(current: TransactionStatus, target: TransactionStatus): boolean {
  // Special cases: disputed and cancelled are not in the normal flow
  if (target === 'disputed') return current === 'disputed';
  if (target === 'cancelled') return current === 'cancelled';

  const currentIndex = getTimelineIndex(current);
  const targetIndex = getTimelineIndex(target);

  // If current is disputed or cancelled, no normal statuses are "reached" beyond what was
  if (current === 'disputed' || current === 'cancelled') {
    return false;
  }

  return currentIndex >= targetIndex;
}

function isTerminalStatus(status: TransactionStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export default function TransactionDetailPage() {
  const {
    user,
    setPage,
    selectedTransactionId,
    setSelectedPaymentTransactionId,
    setSelectedUserId,
  } = useAppStore();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTransaction = useCallback(async () => {
    if (!selectedTransactionId) return;
    try {
      setLoading(true);
      const data = await api.getTransaction(selectedTransactionId);
      setTransaction(data.transaction || data);
    } catch (error) {
      console.error('লেনদেন লোড করতে ত্রুটি:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTransactionId]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!transaction) return;
    try {
      setUpdating(true);
      const data = await api.updateTransactionStatus(transaction.id, newStatus);
      setTransaction(data.transaction || data);
      toast({
        title: 'সফল!',
        description: data.message || 'লেনদেনের অবস্থা আপডেট হয়েছে',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'আপডেট করতে ত্রুটি হয়েছে';
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!transaction) return;
    try {
      setUpdating(true);
      await api.openDispute({
        transactionId: transaction.id,
        reason: 'ক্রেতা বিরোধ খুলেছেন',
      });
      await fetchTransaction();
      toast({
        title: 'সফল!',
        description: 'বিরোধ সফলভাবে খোলা হয়েছে',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'বিরোধ খুলতে ত্রুটি হয়েছে';
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (!transaction) return;
    setSelectedPaymentTransactionId(transaction.id);
    setPage('payment-submit');
  };

  const isBuyer = transaction && user ? transaction.buyerId === user.id : false;
  const isSeller = transaction && user ? transaction.sellerId === user.id : false;
  const isAdmin = user?.role === 'admin';
  const isDisputed = transaction?.status === 'disputed';
  const isCancelled = transaction?.status === 'cancelled';

  // Loading state
  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="card-modern">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setPage('transactions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">লেনদেন পাওয়া যায়নি</h1>
        </div>
        <Card className="card-modern">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">এই লেনদেনের তথ্য লোড করা যায়নি</p>
            <Button variant="outline" onClick={() => setPage('transactions')} className="mt-4">
              লেনদেনসমূহে ফিরে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setPage('transactions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">লেনদেনের বিবরণ</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{transaction.title}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${transactionStatusColors[transaction.status]} text-sm px-3 py-1`}
        >
          {transactionStatusLabels[transaction.status]}
        </Badge>
      </div>

      {/* Transaction Info Card */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            চুক্তির তথ্য
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title & Amount */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{transaction.title}</h3>
            <span className="text-2xl font-bold text-primary">
              {formatBDT(transaction.amount)}
            </span>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">বিবরণ</p>
            <p className="text-sm whitespace-pre-wrap">{transaction.description}</p>
          </div>

          {/* Terms */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">শর্তাবলী</p>
            <p className="text-sm whitespace-pre-wrap">{transaction.terms}</p>
          </div>

          <Separator />

          {/* Buyer & Seller Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">ক্রেতা</p>
              <div className="flex items-center gap-2">
                {transaction.buyer ? (
                  <>
                    <UserLink user={transaction.buyer} showAvatar size="sm" showBadge={false} />
                    {!isBuyer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(transaction.buyer!.id);
                          setPage('public-profile');
                        }}
                        title="প্রোফাইল দেখুন"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">ক্রেতা</span>
                  </div>
                )}
                {isBuyer && (
                  <Badge variant="secondary" className="text-[10px] ml-1">আপনি</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">বিক্রেতা</p>
              <div className="flex items-center gap-2">
                {transaction.seller ? (
                  <>
                    <UserLink user={transaction.seller} showAvatar size="sm" showBadge={false} />
                    {!isSeller && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(transaction.seller!.id);
                          setPage('public-profile');
                        }}
                        title="প্রোফাইল দেখুন"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-3 w-3 text-green-700" />
                    </div>
                    <span className="text-sm font-medium">বিক্রেতা</span>
                  </div>
                )}
                {isSeller && (
                  <Badge variant="secondary" className="text-[10px] ml-1">আপনি</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>তৈরির তারিখ: {formatDate(transaction.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            অবস্থার ধাপ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop timeline */}
          <div className="hidden sm:block">
            <div className="relative">
              <div className="flex items-center justify-between">
                {statusTimeline.slice(0, 6).map((status, index) => {
                  const reached = isStatusReached(transaction.status, status);
                  const isCurrent = transaction.status === status;
                  const isSpecial = status === 'disputed' || status === 'cancelled';

                  // Skip disputed/cancelled in the main flow for desktop
                  if (isSpecial) return null;

                  return (
                    <div key={status} className="flex flex-col items-center flex-1 relative">
                      {/* Connecting line */}
                      {index > 0 && (
                        <div
                          className={`absolute top-4 right-1/2 w-full h-0.5 ${
                            reached ? 'bg-green-500' : 'bg-muted'
                          }`}
                        />
                      )}
                      {/* Dot */}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? 'bg-primary text-white ring-4 ring-primary/20'
                            : reached
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {reached && !isCurrent ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      {/* Label */}
                      <span
                        className={`mt-2 text-xs text-center leading-tight ${
                          isCurrent
                            ? 'font-semibold text-primary'
                            : reached
                            ? 'text-green-700 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {transactionStatusLabels[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Show disputed/cancelled separately if applicable */}
              {(isDisputed || isCancelled) && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    {transactionStatusLabels[transaction.status]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="sm:hidden space-y-0">
            {statusTimeline.map((status) => {
              const reached = isStatusReached(transaction.status, status);
              const isCurrent = transaction.status === status;

              // Don't show unrelated terminal statuses
              if (
                (status === 'completed' && transaction.status !== 'completed') ||
                (status === 'cancelled' && transaction.status !== 'cancelled') ||
                (status === 'disputed' && transaction.status !== 'disputed')
              ) {
                // Show disputed/cancelled only if that's the current status
                if (isCurrent) {
                  // Show it
                } else {
                  return null;
                }
              }

              return (
                <div key={status} className="flex items-start gap-3">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-primary text-white ring-2 ring-primary/20'
                          : reached
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {reached && !isCurrent ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    <div
                      className={`w-0.5 h-8 ${
                        reached && !isTerminalStatus(transaction.status) ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  </div>
                  {/* Label */}
                  <span
                    className={`text-sm pt-0.5 ${
                      isCurrent
                        ? 'font-semibold text-primary'
                        : reached
                        ? 'text-green-700 font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {transactionStatusLabels[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Status Change */}
      {isAdmin && transaction && !isTerminalStatus(transaction.status) && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              প্রশাসক পদক্ষেপ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                প্রশাসক হিসেবে আপনি এই লেনদেনের অবস্থা পরিবর্তন করতে পারেন।
              </p>
              <div className="flex flex-wrap gap-2">
                {statusTimeline
                  .filter((s) => s !== transaction.status)
                  .map((status) => (
                    <AlertDialog key={status}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating}
                          className={`gap-1 ${
                            status === 'cancelled'
                              ? 'border-red-300 text-red-700 hover:bg-red-50'
                              : status === 'disputed'
                              ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                              : status === 'completed'
                              ? 'border-green-300 text-green-700 hover:bg-green-50'
                              : 'border-primary/30 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {transactionStatusLabels[status]}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>অবস্থা পরিবর্তন করুন</AlertDialogTitle>
                          <AlertDialogDescription>
                            আপনি কি নিশ্চিত যে লেনদেনের অবস্থা &quot;{transactionStatusLabels[transaction.status]}&quot; থেকে &quot;{transactionStatusLabels[status]}&quot; এ পরিবর্তন করতে চান?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>না, ফিরে যান</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleStatusUpdate(status)}
                            className={
                              status === 'cancelled'
                                ? 'bg-destructive text-white hover:bg-destructive/90'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }
                          >
                            হ্যাঁ, পরিবর্তন করুন
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons for Buyer/Seller */}
      {!isTerminalStatus(transaction.status) && (isBuyer || isSeller) && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              পদক্ষেপ গ্রহণ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Buyer: Submit Payment */}
              {transaction.status === 'pending_payment' && isBuyer && (
                <Button onClick={handlePaymentSubmit} disabled={updating} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  পেমেন্ট জমা দিন
                </Button>
              )}

              {/* Buyer/Seller: Cancel */}
              {transaction.status === 'pending_payment' && (isBuyer || isSeller) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={updating} className="gap-2">
                      বাতিল করুন
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>লেনদেন বাতিল করুন</AlertDialogTitle>
                      <AlertDialogDescription>
                        আপনি কি নিশ্চিত যে এই লেনদেন বাতিল করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>না, ফিরে যান</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusUpdate('cancelled')}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        হ্যাঁ, বাতিল করুন
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Buyer: Start Work */}
              {transaction.status === 'paid' && isBuyer && (
                <Button
                  onClick={() => handleStatusUpdate('work_in_progress')}
                  disabled={updating}
                  className="gap-2"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  কাজ শুরু করুন
                </Button>
              )}

              {/* Seller: Mark as Delivered */}
              {transaction.status === 'work_in_progress' && isSeller && (
                <Button
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={updating}
                  className="gap-2"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  কাজ সম্পন্ন
                </Button>
              )}

              {/* Buyer: Complete Transaction */}
              {transaction.status === 'delivered' && isBuyer && (
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="gap-2"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  লেনদেন সম্পন্ন করুন
                </Button>
              )}

              {/* Buyer: Open Dispute */}
              {['paid', 'work_in_progress', 'delivered'].includes(transaction.status) && isBuyer && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={updating} className="gap-2 text-destructive border-destructive hover:bg-destructive/10">
                      <AlertTriangle className="h-4 w-4" />
                      বিরোধ খুলুন
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>বিরোধ খুলুন</AlertDialogTitle>
                      <AlertDialogDescription>
                        আপনি কি নিশ্চিত যে এই লেনদেনে বিরোধ খুলতে চান? একবার বিরোধ খুললে অ্যাডমিন এটি পর্যালোচনা করবেন।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>না, ফিরে যান</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleOpenDispute}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        হ্যাঁ, বিরোধ খুলুন
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Section */}
      {transaction.payments && transaction.payments.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              পেমেন্টসমূহ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      রেফারেন্স: {payment.transactionRef}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.user?.name} • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      payment.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {paymentStatusLabels[payment.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disputes Section */}
      {transaction.disputes && transaction.disputes.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              বিরোধসমূহ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setPage('dispute-detail');
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">{dispute.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(dispute.createdAt)}
                      </p>
                      {dispute.resolution && (
                        <p className="text-xs text-green-700 mt-1">
                          সমাধান: {dispute.resolution}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        dispute.status === 'open'
                          ? 'bg-red-100 text-red-800'
                          : dispute.status === 'under_review'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {disputeStatusLabels[dispute.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
