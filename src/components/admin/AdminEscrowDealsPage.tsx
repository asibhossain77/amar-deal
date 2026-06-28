'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  formatBDT,
  formatDate,
  transactionStatusLabels,
  transactionStatusColors,
} from '@/lib/helpers';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftRight,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Shield,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import UserLink, { UserLinkMini } from '@/components/shared/UserLink';

type FilterStatus = 'all' | 'active' | 'completed' | 'disputed' | 'cancelled';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'সকল' },
  { value: 'active', label: 'চলমান' },
  { value: 'completed', label: 'সম্পন্ন' },
  { value: 'disputed', label: 'বিরোধিত' },
  { value: 'cancelled', label: 'বাতিল' },
];

const activeStatuses: TransactionStatus[] = [
  'pending_payment',
  'pending_verification',
  'paid',
  'work_in_progress',
  'delivered',
];

function filterByStatus(transactions: Transaction[], filter: FilterStatus): Transaction[] {
  switch (filter) {
    case 'active':
      return transactions.filter((t) => activeStatuses.includes(t.status));
    case 'completed':
      return transactions.filter((t) => t.status === 'completed');
    case 'disputed':
      return transactions.filter((t) => t.status === 'disputed');
    case 'cancelled':
      return transactions.filter((t) => t.status === 'cancelled');
    default:
      return transactions;
  }
}

export default function AdminEscrowDealsPage() {
  const { setPage, setSelectedTransactionId } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage_num] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions({
        page: page,
        limit: limit,
        status: statusFilter !== 'all' ? undefined : undefined,
      });

      const txList: Transaction[] = data.transactions || data || [];
      setTransactions(txList);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('ডিল লোড করতে ত্রুটি:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const filteredTransactions = filterByStatus(transactions, statusFilter);

  // Client-side search by title, buyer email, or seller email
  const displayTransactions = searchQuery.trim()
    ? filteredTransactions.filter((tx) => {
        const q = searchQuery.toLowerCase();
        return (
          tx.title.toLowerCase().includes(q) ||
          tx.buyer?.email?.toLowerCase().includes(q) ||
          tx.seller?.email?.toLowerCase().includes(q) ||
          tx.buyer?.name?.toLowerCase().includes(q) ||
          tx.seller?.name?.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q)
        );
      })
    : filteredTransactions;

  const handleViewDetails = (txId: string) => {
    setSelectedTransactionId(txId);
    setPage('admin-deal-detail');
  };

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="সকল এসক্রো ডিল"
        subtitle="সিস্টেমের সকল লেনদেন/ডিল দেখুন ও পরিচালনা করুন"
        icon={<Shield className="h-5 w-5 text-primary" />}
      />

      {/* Filters Bar */}
      <Card className="card-modern">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ডিল অনুসন্ধান (শিরোনাম, ইমেইল, ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as FilterStatus); setPage_num(1); }}>
                <SelectTrigger className="w-full sm:w-[160px] h-10">
                  <SelectValue placeholder="ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((sf) => (
                    <SelectItem key={sf.value} value={sf.value}>
                      {sf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {/* Desktop skeleton */}
          <div className="hidden md:block">
            <Card className="card-modern">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="card-modern">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : displayTransactions.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">কোনো ডিল পাওয়া যায়নি</p>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery
                ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো ডিল নেই'
                : 'এখনো কোনো লেনদেন তৈরি হয়নি'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>মোট <strong className="text-foreground">{displayTransactions.length}</strong> টি ডিল দেখানো হচ্ছে</span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="card-modern">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ডিল ID</TableHead>
                        <TableHead>শিরোনাম</TableHead>
                        <TableHead>ক্রেতা</TableHead>
                        <TableHead>বিক্রেতা</TableHead>
                        <TableHead className="text-right">পরিমাণ</TableHead>
                        <TableHead>অবস্থা</TableHead>
                        <TableHead className="text-right">তারিখ</TableHead>
                        <TableHead className="text-center">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {tx.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                            {tx.title}
                          </TableCell>
                          <TableCell>
                            {tx.buyer ? (
                              <div className="flex items-center gap-1.5">
                                <UserLinkMini user={tx.buyer} />
                                <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                                  {tx.buyer.email}
                                </span>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {tx.seller ? (
                              <div className="flex items-center gap-1.5">
                                <UserLinkMini user={tx.seller} />
                                <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                                  {tx.seller.email}
                                </span>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground">
                            {formatBDT(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${transactionStatusColors[tx.status]}`}
                            >
                              {transactionStatusLabels[tx.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-primary hover:text-primary/80"
                              onClick={() => handleViewDetails(tx.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              বিবরণ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {displayTransactions.map((tx) => (
              <Card
                key={tx.id}
                className="card-modern hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(tx.id)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight line-clamp-2">
                        {tx.title}
                      </h3>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        ID: {tx.id.substring(0, 12)}...
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${transactionStatusColors[tx.status]} shrink-0 text-[11px]`}
                    >
                      {transactionStatusLabels[tx.status]}
                    </Badge>
                  </div>

                  {/* Buyer + Seller */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12 shrink-0">ক্রেতা:</span>
                      <span className="text-xs font-medium truncate">
                        {tx.buyer?.name || '—'} {tx.buyer?.email ? `(${tx.buyer.email})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12 shrink-0">বিক্রেতা:</span>
                      <span className="text-xs font-medium truncate">
                        {tx.seller?.name || '—'} {tx.seller?.email ? `(${tx.seller.email})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Amount + Date + Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm">
                        {formatBDT(tx.amount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(tx.id);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      বিবরণ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage_num(page - 1)}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                আগে
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page + i - 2;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage_num(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage_num(page + 1)}
                className="h-8 gap-1"
              >
                পরে
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
