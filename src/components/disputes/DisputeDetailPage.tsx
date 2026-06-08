'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, Shield, User, Store, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Dispute, DisputeMessage } from '@/lib/types';
import { disputeStatusLabels, formatBDT, formatDate, timeAgo, getInitials } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import UserLink from '@/components/shared/UserLink';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      return 'bg-muted text-foreground';
    default:
      return 'bg-muted text-foreground';
  }
}

const resolutionOptions = [
  { value: 'resolved_buyer', label: 'ক্রেতার পক্ষে' },
  { value: 'resolved_seller', label: 'বিক্রেতার পক্ষে' },
  { value: 'resolved_cancelled', label: 'বাতিল' },
];

export default function DisputeDetailPage() {
  const { selectedDisputeId, setPage, user } = useAppStore();
  const { toast } = useToast();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Message form
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Admin resolution
  const [resolutionStatus, setResolutionStatus] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const fetchDispute = useCallback(async () => {
    if (!selectedDisputeId) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getDispute(selectedDisputeId);
      const d: Dispute = data.dispute || data;
      setDispute(d);
    } catch {
      setError('বিরোধের তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [selectedDisputeId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      await api.addDisputeMessage(selectedDisputeId!, messageText.trim());
      setMessageText('');
      await fetchDispute();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'বার্তা পাঠাতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionStatus) return;
    if (!resolutionText.trim()) return;

    setResolving(true);
    try {
      await api.resolveDispute(selectedDisputeId!, {
        outcome: resolutionStatus,
        resolution: resolutionText.trim(),
      });
      setShowAdminPanel(false);
      setResolutionStatus('');
      setResolutionText('');
      await fetchDispute();
      toast({ title: 'সফল!', description: 'বিরোধ সফলভাবে নিষ্পত্তি হয়েছে' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'বিরোধ নিষ্পত্তি করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setResolving(false);
    }
  };

  const isBuyer = (msg: DisputeMessage) => dispute?.buyerId === msg.userId;
  const isSeller = (msg: DisputeMessage) => dispute?.sellerId === msg.userId;
  const isAdmin = (msg: DisputeMessage) => !isBuyer(msg) && !isSeller(msg);
  const isResolved = dispute?.status.startsWith('resolved');

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'বিরোধের তথ্য পাওয়া যায়নি'}</p>
          <Button variant="outline" className="mt-3" onClick={() => setPage('disputes')}>
            বিরোধ তালিকায় ফিরুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <PageHeader
        title="বিরোধের বিবরণ"
        subtitle={`${dispute.transaction?.title || 'লেনদেন'} - ${formatDate(dispute.createdAt)}`}
        icon={<Shield className="h-5 w-5 text-primary" />}
        backTo="disputes"
        actions={
          <Badge
            variant="secondary"
            className={`text-xs border-0 ${getDisputeStatusColor(dispute.status)}`}
          >
            {disputeStatusLabels[dispute.status] || dispute.status}
          </Badge>
        }
      />

      {/* Dispute Info Card */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">বিরোধের তথ্য</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">লেনদেন</span>
              <span className="text-sm font-semibold text-foreground">
                {dispute.transaction?.title || 'লেনদেন'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">পরিমাণ</span>
              <span className="text-sm font-bold text-primary">
                {dispute.transaction ? formatBDT(dispute.transaction.amount) : '—'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ক্রেতা</span>
              {dispute.buyer ? (
                <UserLink user={dispute.buyer} showAvatar={false} size="sm" showBadge={false} />
              ) : (
                <span className="text-sm font-medium text-foreground">ক্রেতা</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">বিক্রেতা</span>
              {dispute.seller ? (
                <UserLink user={dispute.seller} showAvatar={false} size="sm" showBadge={false} />
              ) : (
                <span className="text-sm font-medium text-foreground">বিক্রেতা</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground shrink-0">কারণ</span>
              <span className="text-sm text-foreground text-right max-w-[70%]">
                {dispute.reason}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">খোলার তারিখ</span>
              <span className="text-sm text-foreground">{formatDate(dispute.createdAt)}</span>
            </div>
            {dispute.resolution && (
              <>
                <Separator />
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 mb-1">সমাধান</p>
                  <p className="text-sm text-green-800">{dispute.resolution}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Section */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">বার্তাসমূহ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages List */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1 mb-4">
            {(!dispute.messages || dispute.messages.length === 0) ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">কোনো বার্তা নেই</p>
              </div>
            ) : (
              dispute.messages
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((msg) => {
                  const fromBuyer = isBuyer(msg);
                  const fromSeller = isSeller(msg);
                  const fromAdmin = isAdmin(msg);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${fromAdmin ? 'justify-center' : fromBuyer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] ${
                          fromAdmin
                            ? 'bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center'
                            : fromBuyer
                            ? 'bg-primary/10 border border-primary/20 rounded-xl rounded-tl-sm px-4 py-3'
                            : 'bg-muted border border-border rounded-xl rounded-tr-sm px-4 py-3'
                        }`}
                      >
                        {/* Sender info */}
                        <div className="flex items-center gap-2 mb-1.5">
                          {fromAdmin ? (
                            <Shield className="w-3.5 h-3.5 text-amber-600" />
                          ) : fromBuyer ? (
                            <User className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-gray-600" />
                          )}
                          <span
                            className={`text-xs font-semibold ${
                              fromAdmin
                                ? 'text-amber-700'
                                : fromBuyer
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {fromAdmin
                              ? 'অ্যাডমিন'
                              : msg.user?.name || (fromBuyer ? 'ক্রেতা' : 'বিক্রেতা')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(msg.createdAt)}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Add Message Form - only if dispute is not resolved */}
          {!isResolved && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label className="text-sm font-medium">নতুন বার্তা</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="আপনার বার্তা লিখুন..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageText.trim()}
                    className="bg-primary hover:bg-primary/90 shrink-0 self-end"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Resolution Section */}
      {user?.role === 'admin' && !isResolved && (
        <Card className="card-modern border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-base">অ্যাডমিন প্যানেল</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                {showAdminPanel ? 'বন্ধ করুন' : 'বিরোধ পর্যালোচনা'}
              </Button>
            </div>
          </CardHeader>

          {showAdminPanel && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">সিদ্ধান্ত</Label>
                <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="সিদ্ধান্ত নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">সমাধানের বিবরণ</Label>
                <Textarea
                  placeholder="আপনার সিদ্ধান্তের কারণ লিখুন..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleResolve}
                disabled={resolving || !resolutionStatus || !resolutionText.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {resolving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    প্রক্রিয়াধীন...
                  </>
                ) : (
                  'সিদ্ধান্ত নিন'
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Participants Quick Info */}
      <Card className="card-modern">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {dispute.buyer ? (
                <UserLink user={dispute.buyer} showAvatar size="sm" showBadge={false} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{getInitials('ক্রেতা')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">ক্রেতা</p>
                    <p className="text-xs text-muted-foreground">ক্রেতা</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {dispute.seller ? (
                <UserLink user={dispute.seller} showAvatar size="sm" showBadge={false} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{getInitials('বিক্রেতা')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">বিক্রেতা</p>
                    <p className="text-xs text-muted-foreground">বিক্রেতা</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
