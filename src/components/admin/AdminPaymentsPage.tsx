'use client';

import { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, Check, X, Eye, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formatBDT, formatDate, timeAgo, paymentStatusLabels } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import type { Payment } from '@/lib/types';

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Screenshot dialog
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const data = await api.getPayments();
        setPayments(data.payments || []);
      } catch (err) {
        setError('পেমেন্ট তালিকা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (activeTab === 'all') return payments;
    return payments.filter((p) => p.status === activeTab);
  }, [payments, activeTab]);

  async function handleApprove(paymentId: string) {
    try {
      setProcessingId(paymentId);
      await api.verifyPayment(paymentId, { status: 'approved' });
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: 'approved' as const } : p
        )
      );
      toast({ title: 'সফল!', description: 'পেমেন্ট অনুমোদিত হয়েছে' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পেমেন্ট অনুমোদন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  }

  function handleRejectClick(paymentId: string) {
    setRejectPaymentId(paymentId);
    setAdminNote('');
    setRejectDialogOpen(true);
  }

  async function handleRejectConfirm() {
    if (!rejectPaymentId) return;
    try {
      setProcessingId(rejectPaymentId);
      await api.verifyPayment(rejectPaymentId, {
        status: 'rejected',
        adminNote,
      });
      setPayments((prev) =>
        prev.map((p) =>
          p.id === rejectPaymentId
            ? { ...p, status: 'rejected' as const, adminNote }
            : p
        )
      );
      setRejectDialogOpen(false);
      setRejectPaymentId(null);
      setAdminNote('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পেমেন্ট প্রত্যাখ্যান করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  }

  function getPaymentStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
            {paymentStatusLabels.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            {paymentStatusLabels.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
            {paymentStatusLabels.rejected}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট যাচাইকরণ</h1>
          <p className="text-sm text-gray-500">ব্যবহারকারীদের পেমেন্ট যাচাই ও অনুমোদন</p>
        </div>
      </div>

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">অপেক্ষমাণ</TabsTrigger>
          <TabsTrigger value="approved">অনুমোদিত</TabsTrigger>
          <TabsTrigger value="rejected">প্রত্যাখ্যাত</TabsTrigger>
          <TabsTrigger value="all">সকল</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-48 rounded bg-gray-200" />
                      <div className="h-3 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-64 rounded bg-gray-200" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">কোনো পেমেন্ট পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Payment Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {payment.transaction?.title || 'লেনদেন'}
                          </h3>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-gray-500">পরিমাণ: </span>
                            <span className="font-medium text-gray-900">
                              {formatBDT(payment.transaction?.amount || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">পেমেন্ট পদ্ধতি: </span>
                            <span className="text-gray-700">{payment.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">ট্রানজেকশন রেফ: </span>
                            <span className="font-mono text-sm text-gray-700">
                              {payment.transactionRef}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">জমাদাতা: </span>
                            <span className="text-gray-700">
                              {payment.user?.name || 'অজানা'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">জমার তারিখ: </span>
                            <span className="text-gray-700">
                              {formatDate(payment.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">সময়: </span>
                            <span className="text-gray-700">
                              {timeAgo(payment.createdAt)}
                            </span>
                          </div>
                        </div>
                        {payment.screenshot && (
                          <button
                            onClick={() => {
                              setScreenshotUrl(payment.screenshot!);
                              setScreenshotDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ImageIcon className="h-4 w-4" />
                            স্ক্রিনশট দেখুন
                          </button>
                        )}
                        {payment.adminNote && (
                          <div className="mt-2 rounded-md bg-gray-50 p-2 text-sm">
                            <span className="text-gray-500">প্রশাসক মন্তব্য: </span>
                            <span className="text-gray-700">{payment.adminNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {payment.status === 'pending' && (
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={processingId === payment.id}
                            onClick={() => handleApprove(payment.id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            অনুমোদন
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={processingId === payment.id}
                            onClick={() => handleRejectClick(payment.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            প্রত্যাখ্যান
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পেমেন্ট প্রত্যাখ্যান</DialogTitle>
            <DialogDescription>
              পেমেন্ট প্রত্যাখ্যানের কারণ উল্লেখ করুন।
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="প্রত্যাখ্যানের কারণ লিখুন..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processingId !== null || !adminNote.trim()}
            >
              প্রত্যাখ্যান করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screenshot Dialog */}
      <Dialog open={screenshotDialogOpen} onOpenChange={setScreenshotDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>পেমেন্ট স্ক্রিনশট</DialogTitle>
          </DialogHeader>
          {screenshotUrl && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={screenshotUrl}
                alt="পেমেন্ট স্ক্রিনশট"
                className="h-auto w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
