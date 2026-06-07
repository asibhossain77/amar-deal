'use client';

import { useEffect, useState, useMemo } from 'react';
import { Scale, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
          <Scale className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">বিরোধ ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500">সকল বিরোধের ব্যবস্থাপনা ও নিষ্পত্তি</p>
        </div>
      </div>

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
          ) : filteredDisputes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Scale className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">কোনো বিরোধ পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => (
                <Card
                  key={dispute.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleViewDispute(dispute.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Dispute Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {dispute.transaction?.title || 'লেনদেন'}
                          </h3>
                          {getDisputeStatusBadge(dispute.status)}
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-gray-500">পরিমাণ: </span>
                            <span className="font-medium text-gray-900">
                              {formatBDT(dispute.transaction?.amount || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">ক্রেতা: </span>
                            <span className="text-gray-700">
                              {dispute.buyer?.name || 'অজানা'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">বিক্রেতা: </span>
                            <span className="text-gray-700">
                              {dispute.seller?.name || 'অজানা'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">খোলার তারিখ: </span>
                            <span className="text-gray-700">
                              {formatDate(dispute.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="text-gray-500">কারণ: </span>
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
