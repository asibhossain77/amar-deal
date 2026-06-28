'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  Image as ImageIcon,
  Loader2,
  CreditCard,
  Phone,
  Building2,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { formatBDT, formatDate, timeAgo, paymentStatusLabels } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import type { GatewayTransaction } from '@/lib/types';

function getGatewayIcon(accountType: string) {
  switch (accountType) {
    case 'mobile_banking':
      return <Phone className="h-4 w-4" />;
    case 'bank':
      return <Building2 className="h-4 w-4" />;
    default:
      return <Wallet className="h-4 w-4" />;
  }
}

export default function AdminGatewayPaymentsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<GatewayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTransactionId, setRejectTransactionId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Screenshot dialog
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const data = await api.getGatewayTransactions();
        setTransactions(data.transactions || data || []);
      } catch (err) {
        setError('গেটওয়ে পেমেন্ট তালিকা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    return transactions.filter((t) => t.status === activeTab);
  }, [transactions, activeTab]);

  async function handleApprove(transactionId: string) {
    try {
      setProcessingId(transactionId);
      await api.verifyGatewayTransaction(transactionId, { status: 'approved' });
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, status: 'approved' as const } : t
        )
      );
      toast({ title: 'সফল!', description: 'গেটওয়ে পেমেন্ট অনুমোদিত হয়েছে' });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'গেটওয়ে পেমেন্ট অনুমোদন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  }

  function handleRejectClick(transactionId: string) {
    setRejectTransactionId(transactionId);
    setAdminNote('');
    setRejectDialogOpen(true);
  }

  async function handleRejectConfirm() {
    if (!rejectTransactionId) return;
    try {
      setProcessingId(rejectTransactionId);
      await api.verifyGatewayTransaction(rejectTransactionId, {
        status: 'rejected',
        adminNote,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === rejectTransactionId
            ? { ...t, status: 'rejected' as const, adminNote }
            : t
        )
      );
      setRejectDialogOpen(false);
      setRejectTransactionId(null);
      setAdminNote('');
      toast({ title: 'সফল!', description: 'গেটওয়ে পেমেন্ট প্রত্যাখ্যাত হয়েছে' });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'গেটওয়ে পেমেন্ট প্রত্যাখ্যান করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-700"
          >
            {paymentStatusLabels.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant="outline"
            className="border-green-300 bg-green-50 text-green-700"
          >
            {paymentStatusLabels.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700"
          >
            {paymentStatusLabels.rejected}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="গেটওয়ে পেমেন্ট যাচাইকরণ"
        subtitle="ব্যবহারকারীদের পেমেন্ট যাচাই ও অনুমোদন"
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
      />

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="pending">অপেক্ষমাণ</TabsTrigger>
          <TabsTrigger value="approved">অনুমোদিত</TabsTrigger>
          <TabsTrigger value="rejected">প্রত্যাখ্যাত</TabsTrigger>
          <TabsTrigger value="all">সকল</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="card-modern">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">কোনো গেটওয়ে পেমেন্ট পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((txn) => (
                <Card key={txn.id} className="card-modern overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Transaction Info */}
                      <div className="space-y-3 flex-1">
                        {/* Gateway Name & Transaction Title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                            {txn.gateway?.logo ? (
                              <img
                                src={txn.gateway.logo}
                                alt={txn.gateway.name}
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <span className="text-muted-foreground">
                                {getGatewayIcon(txn.gateway?.accountType || '')}
                              </span>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {txn.gateway?.name || 'অজানা গেটওয়ে'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {txn.transaction?.title || 'লেনদেন'}
                          </h3>
                          {getStatusBadge(txn.status)}
                        </div>

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">পরিমাণ: </span>
                            <span className="font-medium text-foreground">
                              {formatBDT(txn.amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ট্রানজেকশন রেফ: </span>
                            <span className="font-mono text-sm text-foreground">
                              {txn.transactionRef}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">জমাদাতা: </span>
                            <span className="text-foreground">
                              {txn.user?.name || 'অজানা'}
                            </span>
                            {txn.user?.email && (
                              <span className="text-muted-foreground text-xs ml-1">
                                ({txn.user.email})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">জমার তারিখ: </span>
                            <span className="text-foreground">
                              {formatDate(txn.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">সময়: </span>
                            <span className="text-foreground">
                              {timeAgo(txn.createdAt)}
                            </span>
                          </div>
                          {txn.gateway?.accountNumber && (
                            <div className="flex items-center gap-1.5">
                              {getGatewayIcon(txn.gateway.accountType)}
                              <span className="text-muted-foreground">অ্যাকাউন্ট নম্বর: </span>
                              <span className="font-mono text-sm text-foreground">
                                {txn.gateway.accountNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Screenshot */}
                        {txn.screenshot && (
                          <button
                            onClick={() => {
                              setScreenshotUrl(txn.screenshot!);
                              setScreenshotDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 hover:underline"
                          >
                            <Eye className="h-4 w-4" />
                            স্ক্রিনশট দেখুন
                          </button>
                        )}

                        {/* User Note */}
                        {txn.note && (
                          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-2 text-sm">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">ব্যবহারকারী মন্তব্য: </span>
                            <span className="text-blue-800 dark:text-blue-300">{txn.note}</span>
                          </div>
                        )}

                        {/* Admin Note */}
                        {txn.adminNote && (
                          <div className="rounded-md bg-muted p-2 text-sm">
                            <span className="text-muted-foreground">প্রশাসক মন্তব্য: </span>
                            <span className="text-foreground">{txn.adminNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {txn.status === 'pending' && (
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={processingId === txn.id}
                            onClick={() => handleApprove(txn.id)}
                          >
                            {processingId === txn.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-4 w-4" />
                            )}
                            অনুমোদন
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={processingId === txn.id}
                            onClick={() => handleRejectClick(txn.id)}
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
            <DialogTitle>গেটওয়ে পেমেন্ট প্রত্যাখ্যান</DialogTitle>
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
              {processingId ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
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
