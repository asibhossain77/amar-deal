'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBDT, formatDate, transactionStatusLabels, transactionStatusColors } from '@/lib/helpers';
import type { Transaction, TransactionStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Inbox, Eye } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import UserLink, { UserLinkMini } from '@/components/shared/UserLink';

type FilterTab = 'all' | 'active' | 'completed' | 'disputed' | 'cancelled';

const filterTabs: { value: FilterTab; label: string }[] = [
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

function filterTransactions(transactions: Transaction[], tab: FilterTab): Transaction[] {
  switch (tab) {
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

function getUserRole(transaction: Transaction, userId: string): string {
  if (transaction.buyerId === userId) return 'ক্রেতা';
  if (transaction.sellerId === userId) return 'বিক্রেতা';
  return '';
}

function getCounterparty(transaction: Transaction, userId: string): { user: Transaction['buyer'] | Transaction['seller']; role: string } | null {
  if (transaction.buyerId === userId && transaction.seller) {
    return { user: transaction.seller, role: 'বিক্রেতা' };
  }
  if (transaction.sellerId === userId && transaction.buyer) {
    return { user: transaction.buyer, role: 'ক্রেতা' };
  }
  // For admin or other cases, show both
  if (transaction.buyer && transaction.seller) {
    return { user: transaction.seller, role: 'বিক্রেতা' };
  }
  return null;
}

export default function TransactionsPage() {
  const { user, setPage, setSelectedUserId, setSelectedTransactionId, transactions, setTransactions } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('লেনদেন লোড করতে ত্রুটি:', error);
    } finally {
      setLoading(false);
    }
  }, [setTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = filterTransactions(transactions, activeTab);

  const handleRowClick = (id: string) => {
    setSelectedTransactionId(id);
    setPage('transaction-detail');
  };

  const handleCreateClick = () => {
    setPage('create-transaction');
  };

  // Loading skeletons
  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        {/* Desktop table skeleton */}
        <div className="hidden md:block">
          <Card className="card-modern">
            <CardContent className="p-0">
              <div className="space-y-0">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Mobile card skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="card-modern">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <PageHeader
        title="লেনদেনসমূহ"
        subtitle="আপনার সকল লেনদেন দেখুন ও পরিচালনা করুন"
        icon={<FileText className="h-5 w-5 text-primary" />}
        actions={
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            নতুন লেনদেন
          </Button>
        }
      />

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {filterTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {filterTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filteredTransactions.length === 0 ? (
              <Card className="card-modern">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg font-medium">কোনো লেনদেন পাওয়া যায়নি</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {tab.value === 'all'
                      ? 'এখনো কোনো লেনদেন তৈরি হয়নি'
                      : `এই বিভাগে কোনো লেনদেন নেই`}
                  </p>
                  <Button onClick={handleCreateClick} variant="outline" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    নতুন লেনদেন তৈরি করুন
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Card className="card-modern">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>শিরোনাম</TableHead>
                            <TableHead>পরিমাণ</TableHead>
                            <TableHead>প্রতিপক্ষ</TableHead>
                            <TableHead>অবস্থা</TableHead>
                            <TableHead>তারিখ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow
                              key={transaction.id}
                              className="cursor-pointer"
                              onClick={() => handleRowClick(transaction.id)}
                            >
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {transaction.title}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatBDT(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                {user ? (() => {
                                  const counterparty = getCounterparty(transaction, user.id);
                                  return counterparty ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <UserLinkMini user={counterparty.user!} />
                                      <span className="text-[10px] text-muted-foreground">({counterparty.role})</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-primary/10 ml-0.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUserId(counterparty.user!.id);
                                          setPage('public-profile');
                                        }}
                                        title="প্রোফাইল দেখুন"
                                      >
                                        <Eye className="h-3 w-3 text-primary" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">{getUserRole(transaction, user.id)}</span>
                                  );
                                })() : ''}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={transactionStatusColors[transaction.status]}
                                >
                                  {transactionStatusLabels[transaction.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="card-modern cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleRowClick(transaction.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm leading-tight line-clamp-2">
                            {transaction.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${transactionStatusColors[transaction.status]} shrink-0 text-[11px]`}
                          >
                            {transactionStatusLabels[transaction.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {formatBDT(transaction.amount)}
                          </span>
                          {user ? (() => {
                            const counterparty = getCounterparty(transaction, user.id);
                            return counterparty ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <UserLinkMini user={counterparty.user!} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserId(counterparty.user!.id);
                                    setPage('public-profile');
                                  }}
                                  title="প্রোফাইল দেখুন"
                                >
                                  <Eye className="h-3 w-3 text-primary" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {getUserRole(transaction, user.id)}
                              </span>
                            );
                          })() : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
