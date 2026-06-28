'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, CheckCircle, Clock, AlertTriangle, Bell, ArrowRight, LayoutDashboard, ExternalLink, Eye } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Transaction, Notification as AppNotification } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  transactionStatusLabels,
  transactionStatusColors,
  formatBDT,
  formatDate,
  timeAgo,
} from '@/lib/helpers';
import UserLink, { UserLinkMini } from '@/components/shared/UserLink';

interface Stats {
  total: number;
  active: number;
  completed: number;
  disputed: number;
}

export default function DashboardPage() {
  const { user, setPage, setSelectedUserId, setSelectedTransactionId, setTransactions, setNotifications } = useAppStore();
  const [transactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [notifications, setLocalNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, disputed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txData, notifData] = await Promise.all([
          api.getTransactions(),
          api.getNotifications(),
        ]);

        const txList: Transaction[] = txData.transactions || txData || [];
        const notifList: AppNotification[] = notifData.notifications || notifData || [];

        setLocalTransactions(txList);
        setLocalNotifications(notifList);
        setTransactions(txList);
        setNotifications(notifList);

        setStats({
          total: txList.length,
          active: txList.filter((t: Transaction) =>
            ['pending_payment', 'pending_verification', 'paid', 'work_in_progress', 'delivered'].includes(t.status)
          ).length,
          completed: txList.filter((t: Transaction) => t.status === 'completed').length,
          disputed: txList.filter((t: Transaction) => t.status === 'disputed').length,
        });
      } catch {
        // Silently handle - will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setTransactions, setNotifications]);

  const recentTransactions = transactions.slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  const handleRowClick = (id: string) => {
    setSelectedTransactionId(id);
    setPage('transaction-detail');
  };

  const statCards = [
    {
      title: 'মোট লেনদেন',
      value: stats.total,
      icon: ArrowLeftRight,
      color: 'text-primary dark:text-primary',
      bgColor: 'bg-primary/10 dark:bg-primary/15',
      borderColor: 'border-primary/20 dark:border-primary/25',
    },
    {
      title: 'চলমান লেনদেন',
      value: stats.active,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-100 dark:border-amber-800/40',
    },
    {
      title: 'সম্পন্ন লেনদেন',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-100 dark:border-green-800/40',
    },
    {
      title: 'বিরোধিত লেনদেন',
      value: stats.disputed,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-100 dark:border-red-800/40',
    },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Welcome */}
      <PageHeader
        title={`স্বাগতম, ${user?.name || 'ব্যবহারকারী'}!`}
        subtitle="আপনার ড্যাশবোর্ড ওভারভিউ"
        icon={<LayoutDashboard className="h-5 w-5 text-primary" />}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="card-modern border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className={`card-modern border ${stat.borderColor} min-w-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium truncate">{stat.title}</p>
                        <p className="text-lg sm:text-xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Recent Transactions */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">সাম্প্রতিক লেনদেন</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => setPage('transactions')}
            >
              সকল দেখুন
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো লেনদেন নেই</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setPage('create-transaction')}
              >
                নতুন লেনদেন তৈরি করুন
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead className="hidden sm:table-cell">প্রতিপক্ষ</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead className="hidden sm:table-cell">তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(tx.id)}
                  >
                    <TableCell className="font-medium text-foreground max-w-[150px] truncate">
                      {tx.title}
                    </TableCell>
                    <TableCell className="text-foreground">{formatBDT(tx.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {(() => {
                        const isBuyer = tx.buyerId === user?.id;
                        const counterparty = isBuyer ? tx.seller : tx.buyer;
                        if (counterparty) {
                          return (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <UserLinkMini user={counterparty} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(counterparty.id);
                                  setPage('public-profile');
                                }}
                                title="প্রোফাইল দেখুন"
                              >
                                <Eye className="h-3 w-3 text-primary" />
                              </Button>
                            </div>
                          );
                        }
                        return <span className="text-xs text-muted-foreground">—</span>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 ${transactionStatusColors[tx.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {transactionStatusLabels[tx.status] || tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">সাম্প্রতিক বিজ্ঞপ্তি</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => setPage('notifications')}
            >
              সকল বিজ্ঞপ্তি দেখুন
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">কোনো বিজ্ঞপ্তি নেই</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentNotifications.map((notif, index) => (
                <React.Fragment key={notif.id}>
                  <div
                    className="flex items-start gap-3 py-3 cursor-pointer hover:bg-accent -mx-2 px-2 rounded-lg transition-colors"
                    onClick={async () => {
                      if (!notif.isRead) {
                        try {
                          await api.markNotificationsRead([notif.id]);
                          setLocalNotifications((prev) =>
                            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                          );
                        } catch {
                          // silently handle
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${notif.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                  {index < recentNotifications.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
