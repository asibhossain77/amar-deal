'use client';

import { useEffect, useState, useMemo } from 'react';
import { Scale, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatBDT, formatDate, timeAgo, disputeStatusLabels } from '@/lib/helpers';
import { useAppStore } from '@/lib/store';
import type { Dispute } from '@/lib/types';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('open');
  const { setSelectedDisputeId, setPage } = useAppStore();

  useEffect(() => {
    async function fetchDisputes() {
      try {
        setLoading(true);
        const data = await api.getDisputes();
        setDisputes(data.disputes || data);
      } catch (err) {
        setError('বিরোধ তালিকা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
  }, []);

  const filteredDisputes = useMemo(() => {
    if (activeTab === 'all') return disputes;
    return disputes.filter((d) => d.status === activeTab);
  }, [disputes, activeTab]);

  function handleViewDispute(disputeId: string) {
    setSelectedDisputeId(disputeId);
    setPage('dispute-detail');
  }

  function handleStartReview(disputeId: string) {
    setSelectedDisputeId(disputeId);
    setPage('dispute-detail');
  }

  function getDisputeStatusBadge(status: string) {
    const label = disputeStatusLabels[status] || status;
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
            {label}
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            {label}
          </Badge>
        );
      case 'resolved_buyer':
      case 'resolved_seller':
      case 'resolved_cancelled':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            {label}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{label}</Badge>;
    }
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="বিরোধ ব্যবস্থাপনা"
        subtitle="সকল বিরোধের ব্যবস্থাপনা ও নিষ্পত্তি"
        icon={<Scale className="h-5 w-5 text-red-600" />}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open">খোলা</TabsTrigger>
          <TabsTrigger value="under_review">পর্যালোচনাধীন</TabsTrigger>
          <TabsTrigger value="resolved_buyer">সমাধিত</TabsTrigger>
          <TabsTrigger value="all">সকল</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="card-modern animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-3 w-64 rounded bg-muted" />
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
          ) : filteredDisputes.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <Scale className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">কোনো বিরোধ পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => (
                <Card
                  key={dispute.id}
                  className="card-modern cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleViewDispute(dispute.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Dispute Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {dispute.transaction?.title || 'লেনদেন'}
                          </h3>
                          {getDisputeStatusBadge(dispute.status)}
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-muted-foreground">পরিমাণ: </span>
                            <span className="font-medium text-foreground">
                              {formatBDT(dispute.transaction?.amount || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ক্রেতা: </span>
                            <span className="text-foreground">
                              {dispute.buyer?.name || 'অজানা'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">বিক্রেতা: </span>
                            <span className="text-foreground">
                              {dispute.seller?.name || 'অজানা'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">খোলার তারিখ: </span>
                            <span className="text-foreground">
                              {formatDate(dispute.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="text-muted-foreground">কারণ: </span>
                          {dispute.reason.length > 100
                            ? dispute.reason.substring(0, 100) + '...'
                            : dispute.reason}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2">
                        {dispute.status === 'open' && (
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartReview(dispute.id);
                            }}
                          >
                            পর্যালোচনা শুরু
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDispute(dispute.id);
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          দেখুন
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
