'use client';

import React, { useEffect, useState } from 'react';
import { Scale, Plus, Loader2, AlertTriangle, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Dispute, Transaction } from '@/lib/types';
import { disputeStatusLabels, formatBDT, formatDate, timeAgo } from '@/lib/helpers';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterStatus = 'all' | 'open' | 'under_review' | 'resolved';

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'সকল' },
  { value: 'open', label: 'খোলা' },
  { value: 'under_review', label: 'পর্যালোচনাধীন' },
  { value: 'resolved', label: 'সমাধিত' },
];

function getDisputeStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800';
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved_buyer':
    case 'resolved_seller':
      return 'bg-green-100 text-green-800';
    case 'resolved_cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function isResolved(status: string): boolean {
  return status.startsWith('resolved');
}

export default function DisputesPage() {
  const { setPage, setSelectedDisputeId, user } = useAppStore();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // New dispute dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDisputeTxId, setNewDisputeTxId] = useState('');
  const [newDisputeReason, setNewDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [dispData, txData] = await Promise.all([
          api.getDisputes(),
          api.getTransactions(),
        ]);
        const dispList: Dispute[] = dispData.disputes || dispData || [];
        const txList: Transaction[] = txData.transactions || txData || [];
        setDisputes(dispList);
        setTransactions(txList);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'resolved') return isResolved(d.status);
    return d.status === filterStatus;
  });

  const handleDisputeClick = (id: string) => {
    setSelectedDisputeId(id);
    setPage('dispute-detail');
  };

  const handleOpenDispute = async () => {
    if (!newDisputeTxId) {
      setSubmitError('একটি লেনদেন নির্বাচন করুন');
      return;
    }
    if (!newDisputeReason.trim()) {
      setSubmitError('বিরোধের কারণ লিখুন');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await api.openDispute({
        transactionId: newDisputeTxId,
        reason: newDisputeReason.trim(),
      });
      // Refresh disputes list
      const dispData = await api.getDisputes();
      const dispList: Dispute[] = dispData.disputes || dispData || [];
      setDisputes(dispList);
      setDialogOpen(false);
      setNewDisputeTxId('');
      setNewDisputeReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'বিরোধ খুলতে সমস্যা হয়েছে';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Transactions eligible for dispute (not already disputed and not completed/cancelled)
  const eligibleTransactions = transactions.filter(
    (tx) =>
      tx.status !== 'disputed' &&
      tx.status !== 'completed' &&
      tx.status !== 'cancelled' &&
      (tx.buyerId === user?.id || tx.sellerId === user?.id)
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2563eb]/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#2563eb]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">বিরোধসমূহ</h1>
            <p className="text-sm text-gray-500 mt-0.5">আপনার সকল বিরোধ দেখুন ও পরিচালনা করুন</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Plus className="w-4 h-4 mr-2" />
              নতুন বিরোধ খুলুন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন বিরোধ খুলুন</DialogTitle>
              <DialogDescription>
                একটি লেনদেনের বিরোধ খুলুন। আমাদের টিম দ্রুত পর্যালোচনা করবে।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>লেনদেন নির্বাচন করুন</Label>
                <Select value={newDisputeTxId} onValueChange={setNewDisputeTxId}>
                  <SelectTrigger>
                    <SelectValue placeholder="লেনদেন বাছাই করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleTransactions.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        বিরোধযোগ্য লেনদেন নেই
                      </div>
                    ) : (
                      eligibleTransactions.map((tx) => (
                        <SelectItem key={tx.id} value={tx.id}>
                          {tx.title} - {formatBDT(tx.amount)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>বিরোধের কারণ</Label>
                <Textarea
                  placeholder="বিরোধের কারণ বিস্তারিত লিখুন..."
                  value={newDisputeReason}
                  onChange={(e) => setNewDisputeReason(e.target.value)}
                  rows={4}
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                বাতিল
              </Button>
              <Button
                onClick={handleOpenDispute}
                disabled={submitting}
                className="bg-[#2563eb] hover:bg-[#1d4ed8]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  'বিরোধ খুলুন'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                filterStatus === opt.value
                  ? 'bg-[#2563eb] text-white border-[#2563eb]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">কোনো বিরোধ পাওয়া যায়নি</p>
              <p className="text-sm text-gray-400 mt-1">
                {filterStatus !== 'all'
                  ? 'অন্য ফিল্টার দিয়ে খুঁজুন'
                  : 'আপনার কোনো বিরোধ নেই'}
              </p>
              {filterStatus !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setFilterStatus('all')}
                >
                  সকল দেখুন
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filteredDisputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 hover:border-l-[#2563eb]"
              style={{
                borderLeftColor:
                  dispute.status === 'open'
                    ? '#ef4444'
                    : dispute.status === 'under_review'
                    ? '#f59e0b'
                    : isResolved(dispute.status)
                    ? '#22c55e'
                    : '#e5e7eb',
              }}
              onClick={() => handleDisputeClick(dispute.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {dispute.transaction?.title || 'লেনদেন'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {dispute.reason}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(dispute.createdAt)}
                      </span>
                      {dispute.transaction && (
                        <span className="text-xs text-gray-400">
                          {formatBDT(dispute.transaction.amount)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {timeAgo(dispute.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs border-0 shrink-0 ${getDisputeStatusColor(dispute.status)}`}
                  >
                    {disputeStatusLabels[dispute.status] || dispute.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
