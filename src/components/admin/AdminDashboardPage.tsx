'use client';

import { useEffect, useState } from 'react';
import { Users, ArrowLeftRight, Clock, Hourglass, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { api } from '@/lib/api';
import { toBanglaNumber } from '@/lib/helpers';
import type { DashboardStats } from '@/lib/types';

const statCards = [
  {
    key: 'totalUsers' as const,
    label: 'মোট ব্যবহারকারী',
    icon: Users,
    colorClass: 'bg-primary/10 text-primary border-primary/20',
    iconBg: 'bg-primary/10',
    valueColor: 'text-primary',
  },
  {
    key: 'totalTransactions' as const,
    label: 'মোট লেনদেন',
    icon: ArrowLeftRight,
    colorClass: 'bg-purple-50 text-purple-600 border-purple-200',
    iconBg: 'bg-purple-100',
    valueColor: 'text-purple-700',
  },
  {
    key: 'activeTransactions' as const,
    label: 'চলমান লেনদেন',
    icon: Clock,
    colorClass: 'bg-amber-50 text-amber-600 border-amber-200',
    iconBg: 'bg-amber-100',
    valueColor: 'text-amber-700',
  },
  {
    key: 'pendingTransactions' as const,
    label: 'অপেক্ষমাণ লেনদেন',
    icon: Hourglass,
    colorClass: 'bg-orange-50 text-orange-600 border-orange-200',
    iconBg: 'bg-orange-100',
    valueColor: 'text-orange-700',
  },
  {
    key: 'completedTransactions' as const,
    label: 'সম্পন্ন লেনদেন',
    icon: CheckCircle,
    colorClass: 'bg-green-50 text-green-600 border-green-200',
    iconBg: 'bg-green-100',
    valueColor: 'text-green-700',
  },
  {
    key: 'disputedTransactions' as const,
    label: 'বিরোধিত লেনদেন',
    icon: AlertTriangle,
    colorClass: 'bg-red-50 text-red-600 border-red-200',
    iconBg: 'bg-red-100',
    valueColor: 'text-red-700',
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        setError('পরিসংখ্যান লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="প্রশাসন ড্যাশবোর্ড"
        subtitle="প্ল্যাটফর্মের সামগ্রিক পরিসংখ্যান"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="card-modern animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-5 w-12 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            const value = stats ? stats[card.key] : 0;
            return (
              <Card key={card.key} className={`card-modern border ${card.colorClass}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-80">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.valueColor}`}>
                        {toBanglaNumber(value)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Activity Summary */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            সাম্প্রতিক কার্যক্রম
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                <span className="text-sm text-foreground">মোট ব্যবহারকারী</span>
                <span className="font-semibold text-primary">{toBanglaNumber(stats.totalUsers)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm text-foreground">সম্পন্ন লেনদেন</span>
                <span className="font-semibold text-green-700">{toBanglaNumber(stats.completedTransactions)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <span className="text-sm text-foreground">চলমান লেনদেন</span>
                <span className="font-semibold text-amber-700">{toBanglaNumber(stats.activeTransactions)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                <span className="text-sm text-foreground">বিরোধিত লেনদেন</span>
                <span className="font-semibold text-red-700">{toBanglaNumber(stats.disputedTransactions)}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">কোনো তথ্য পাওয়া যায়নি</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
