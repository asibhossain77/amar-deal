'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ArrowLeftRight, CreditCard, AlertTriangle, Settings, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Notification as AppNotification } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { timeAgo } from '@/lib/helpers';

function getNotifIcon(type: string) {
  switch (type) {
    case 'transaction':
      return ArrowLeftRight;
    case 'payment':
      return CreditCard;
    case 'dispute':
      return AlertTriangle;
    case 'system':
      return Settings;
    default:
      return Bell;
  }
}

function getNotifIconBg(type: string) {
  switch (type) {
    case 'transaction':
      return 'bg-primary/10 text-primary';
    case 'payment':
      return 'bg-green-50 text-green-600';
    case 'dispute':
      return 'bg-red-50 text-red-600';
    case 'system':
      return 'bg-purple-50 text-purple-600';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function NotificationsPage() {
  const { setNotifications, setSelectedTransactionId, setPage } = useAppStore();
  const [notifications, setLocalNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getNotifications();
        const notifList: AppNotification[] = data.notifications || data || [];
        setLocalNotifications(notifList);
        setNotifications(notifList);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationsRead([id]);
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'বিজ্ঞপ্তি পড়া হিসেবে চিহ্নিত করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) return;

      await api.markNotificationsRead(unreadIds);
      setLocalNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      toast({
        title: 'সফল',
        description: 'সকল বিজ্ঞপ্তি পড়া হিসেবে চিহ্নিত হয়েছে',
      });
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'সকল বিজ্ঞপ্তি পড়া হিসেবে চিহ্নিত করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    // Navigate to related item if available
    if (notif.transactionId) {
      setSelectedTransactionId(notif.transactionId);
      setPage('transaction-detail');
    }
  };

  return (
    <div className="page-container max-w-3xl space-y-6">
      {/* Header */}
      <PageHeader
        title="বিজ্ঞপ্তিসমূহ"
        subtitle={unreadCount > 0 ? `${unreadCount}টি নতুন বিজ্ঞপ্তি` : 'সকল বিজ্ঞপ্তি পড়া হয়েছে'}
        icon={<Bell className="h-5 w-5 text-primary" />}
        backTo="dashboard"
        actions={unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-primary border-primary/20 hover:bg-primary/10"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            {markingAll ? 'চিহ্নিত হচ্ছে...' : 'সকল পড়া হয়েছে'}
          </Button>
        ) : undefined}
      />

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">কোনো বিজ্ঞপ্তি নেই</h3>
            <p className="text-sm text-muted-foreground">নতুন বিজ্ঞপ্তি এলে এখানে দেখা যাবে</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getNotifIcon(notif.type);
            const iconBg = getNotifIconBg(notif.type);

            return (
              <Card
                key={notif.id}
                className={`card-modern cursor-pointer transition-colors hover:bg-accent ${
                  !notif.isRead ? 'border-l-4 border-l-primary' : ''
                }`}
                onClick={() => handleNotifClick(notif)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${notif.isRead ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
