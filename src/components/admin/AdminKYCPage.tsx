'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  FileText,
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/PageHeader';
import { api } from '@/lib/api';
import { getInitials, formatDate, toBanglaNumber } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import type { KYCDocumentType } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────
interface KYCUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

interface KYCReviewer {
  id: string;
  name: string;
  role: string;
}

interface KYCSubmission {
  id: string;
  userId: string;
  documentType: KYCDocumentType;
  documentNumber: string;
  documentFront: string;
  documentBack?: string;
  selfie?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  user: KYCUser;
  reviewer?: KYCReviewer;
}

interface KYCSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// ─── Document type config ──────────────────────────────────
const documentTypeConfig: Record<
  KYCDocumentType,
  { label: string; icon: typeof CreditCard }
> = {
  national_id: { label: 'জাতীয় পরিচয়পত্র', icon: CreditCard },
  passport: { label: 'পাসপোর্ট', icon: FileText },
  driving_license: { label: 'ড্রাইভিং লাইসেন্স', icon: ShieldCheck },
};

// ─── Status config ─────────────────────────────────────────
const statusConfig = {
  pending: {
    label: 'অপেক্ষমাণ',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
    icon: Clock,
  },
  approved: {
    label: 'অনুমোদিত',
    badgeClass:
      'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'প্রত্যাখ্যাত',
    badgeClass:
      'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
    icon: XCircle,
  },
};

// ─── Component ─────────────────────────────────────────────
export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [summary, setSummary] = useState<KYCSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<KYCSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Document preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<KYCSubmission | null>(null);

  const { toast } = useToast();

  // ─── Fetch submissions ──────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = activeTab === 'all' ? undefined : activeTab;
      const data = await api.getAdminKYCSubmissions(statusParam);
      setSubmissions(data.submissions || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError('KYC জমা তালিকা লোড করতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ─── Filter by search (client-side) ─────────────────────
  const filteredSubmissions = search.trim()
    ? submissions.filter(
        (s) =>
          s.user.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.user.username && s.user.username.toLowerCase().includes(search.toLowerCase())) ||
          s.user.email.toLowerCase().includes(search.toLowerCase()) ||
          s.documentNumber.toLowerCase().includes(search.toLowerCase())
      )
    : submissions;

  // ─── Review handlers ────────────────────────────────────
  function openReviewDialog(submission: KYCSubmission, action: 'approved' | 'rejected') {
    setReviewSubmission(submission);
    setReviewAction(action);
    setAdminNote('');
    setReviewDialogOpen(true);
  }

  async function handleConfirmReview() {
    if (!reviewSubmission || !reviewAction) return;

    try {
      setReviewLoading(true);
      await api.reviewKYC(reviewSubmission.id, {
        status: reviewAction,
        adminNote: adminNote || undefined,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === reviewSubmission.id
            ? {
                ...s,
                status: reviewAction,
                adminNote: adminNote || undefined,
                reviewedAt: new Date().toISOString(),
              }
            : s
        )
      );

      // Update summary counts
      setSummary((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        [reviewAction]: prev[reviewAction] + 1,
      }));

      toast({
        title: 'সফল!',
        description:
          reviewAction === 'approved'
            ? 'KYC যাচাই সফলভাবে অনুমোদিত হয়েছে'
            : 'KYC যাচাই প্রত্যাখ্যাত হয়েছে',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'KYC রিভিউ করতে সমস্যা হয়েছে';
      console.error('Failed to review KYC:', err);
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setReviewLoading(false);
      setReviewDialogOpen(false);
      setReviewSubmission(null);
      setReviewAction(null);
      setAdminNote('');
    }
  }

  function openPreviewDialog(submission: KYCSubmission) {
    setPreviewSubmission(submission);
    setPreviewDialogOpen(true);
  }

  // ─── Render helpers ─────────────────────────────────────
  function getDocumentTypeIcon(type: KYCDocumentType) {
    const config = documentTypeConfig[type];
    if (!config) return <FileText className="h-4 w-4" />;
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  }

  function getDocumentTypeLabel(type: KYCDocumentType) {
    return documentTypeConfig[type]?.label || type;
  }

  function getStatusBadge(status: 'pending' | 'approved' | 'rejected') {
    const config = statusConfig[status];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={`${config.badgeClass} text-[11px] gap-1`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  // ─── Skeleton loading ───────────────────────────────────
  function renderSkeletons() {
    return Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="card-modern">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-auto" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }

  // ─── Empty state ────────────────────────────────────────
  function renderEmptyState() {
    const emptyMessages: Record<string, { title: string; description: string }> = {
      all: { title: 'কোনো KYC জমা নেই', description: 'এখনো কোনো ব্যবহারকারী KYC জমা দেননি' },
      pending: { title: 'কোনো অপেক্ষমাণ জমা নেই', description: 'সকল KYC যাচাই পর্যালোচনা সম্পন্ন হয়েছে' },
      approved: { title: 'কোনো অনুমোদিত জমা নেই', description: 'এখনো কোনো KYC অনুমোদিত হয়নি' },
      rejected: { title: 'কোনো প্রত্যাখ্যাত জমা নেই', description: 'এখনো কোনো KYC প্রত্যাখ্যাত হয়নি' },
    };
    const msg = emptyMessages[activeTab] || emptyMessages.all;

    return (
      <Card className="card-modern">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground">{msg.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{msg.description}</p>
        </CardContent>
      </Card>
    );
  }

  // ─── Submission card ────────────────────────────────────
  function renderSubmissionCard(submission: KYCSubmission) {
    const isPending = submission.status === 'pending';

    return (
      <Card key={submission.id} className="card-modern hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Top row: User info + Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  {submission.user.avatar && (
                    <AvatarImage src={submission.user.avatar} alt={submission.user.name} />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(submission.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {submission.user.name}
                    </span>
                    {submission.user.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    {submission.user.username && (
                      <span className="text-xs text-muted-foreground">
                        @{submission.user.username}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {submission.user.email}
                    </span>
                  </div>
                </div>
              </div>
              {getStatusBadge(submission.status)}
            </div>

            <Separator />

            {/* Document details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  {getDocumentTypeIcon(submission.documentType)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">নথির ধরন</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {getDocumentTypeLabel(submission.documentType)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">নথি নম্বর</p>
                  <p className="text-sm font-medium text-foreground font-mono truncate">
                    {submission.documentNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">জমার তারিখ</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(submission.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviewed info for non-pending */}
            {!isPending && submission.reviewedAt && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    {submission.status === 'approved' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-muted-foreground">পর্যালোচনার তারিখ:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(submission.reviewedAt)}
                    </span>
                  </div>
                  {submission.reviewer && (
                    <span className="text-muted-foreground text-xs">
                      ({submission.reviewer.name} দ্বারা পর্যালোচিত)
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Admin note for reviewed items */}
            {!isPending && submission.adminNote && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">
                  প্রশাসক নোট
                </p>
                <p className="text-sm text-foreground">{submission.adminNote}</p>
              </div>
            )}

            {/* Action buttons for pending items */}
            {isPending && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openPreviewDialog(submission)}
                  >
                    <Eye className="h-4 w-4" />
                    নথি দেখুন
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openReviewDialog(submission, 'approved')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    অনুমোদন
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => openReviewDialog(submission, 'rejected')}
                  >
                    <XCircle className="h-4 w-4" />
                    প্রত্যাখ্যান
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Summary stat card ──────────────────────────────────
  function renderStatCard(
    label: string,
    value: number,
    icon: React.ReactNode,
    colorClass: string,
    isActive: boolean
  ) {
    return (
      <Card
        className={`card-modern transition-all ${
          isActive ? 'ring-2 ring-primary/30 shadow-md' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${colorClass}`}
            >
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {toBanglaNumber(value)}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="KYC যাচাই ব্যবস্থাপনা"
        subtitle="ব্যবহারকারীর KYC জমা পর্যালোচনা ও অনুমোদন"
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubmissions}
            disabled={loading}
            className="gap-1.5"
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </Button>
        }
      />

      {/* ─── Summary Stats ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {renderStatCard(
          'অপেক্ষমাণ',
          summary.pending,
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          'bg-amber-100 dark:bg-amber-950/40',
          activeTab === 'pending'
        )}
        {renderStatCard(
          'অনুমোদিত',
          summary.approved,
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
          'bg-green-100 dark:bg-green-950/40',
          activeTab === 'approved'
        )}
        {renderStatCard(
          'প্রত্যাখ্যাত',
          summary.rejected,
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
          'bg-red-100 dark:bg-red-950/40',
          activeTab === 'rejected'
        )}
        {renderStatCard(
          'মোট',
          summary.total,
          <Users className="h-5 w-5 text-primary" />,
          'bg-primary/10',
          activeTab === 'all'
        )}
      </div>

      {/* ─── Filter Tabs + Search ────────────────────────── */}
      <Card className="card-modern">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="gap-1">
                  <Users className="h-3.5 w-3.5" />
                  সকল
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  অপেক্ষমাণ
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  অনুমোদিত
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  প্রত্যাখ্যাত
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="নাম, ইমেইল বা নথি নম্বর..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Submissions List ─────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">{renderSkeletons()}</div>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <ShieldX className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubmissions}
              className="mt-3"
            >
              আবার চেষ্টা করুন
            </Button>
          </CardContent>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 scrollbar-thin">
          {filteredSubmissions.map((submission) => renderSubmissionCard(submission))}
        </div>
      )}

      {/* ─── Review Confirmation Dialog ──────────────────── */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approved' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  KYC অনুমোদন
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  KYC প্রত্যাখ্যান
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Submission summary in dialog */}
          {reviewSubmission && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {reviewSubmission.user.avatar && (
                    <AvatarImage
                      src={reviewSubmission.user.avatar}
                      alt={reviewSubmission.user.name}
                    />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(reviewSubmission.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {reviewSubmission.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reviewSubmission.user.email}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">নথির ধরন</span>
                  <p className="font-medium text-foreground">
                    {getDocumentTypeLabel(reviewSubmission.documentType)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">নথি নম্বর</span>
                  <p className="font-medium text-foreground font-mono">
                    {reviewSubmission.documentNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              প্রশাসক নোট {reviewAction === 'rejected' && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              placeholder={
                reviewAction === 'approved'
                  ? 'অনুমোদনের কারণ বা মন্তব্য লিখুন (ঐচ্ছিক)...'
                  : 'প্রত্যাখ্যানের কারণ লিখুন...'
              }
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            />
            {reviewAction === 'rejected' && !adminNote.trim() && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                প্রত্যাখ্যানের কারণ উল্লেখ করা সুপারিশকৃত
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewLoading}
            >
              বাতিল
            </Button>
            <Button
              className={
                reviewAction === 'approved'
                  ? 'bg-green-600 hover:bg-green-700 text-white gap-1.5'
                  : 'bg-red-600 hover:bg-red-700 text-white gap-1.5'
              }
              onClick={handleConfirmReview}
              disabled={reviewLoading}
            >
              {reviewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {reviewAction === 'approved' ? 'অনুমোদন করুন' : 'প্রত্যাখ্যান করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Document Preview Dialog ─────────────────────── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              নথি প্রিভিউ
            </DialogTitle>
          </DialogHeader>

          {previewSubmission && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {previewSubmission.user.avatar && (
                    <AvatarImage
                      src={previewSubmission.user.avatar}
                      alt={previewSubmission.user.name}
                    />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(previewSubmission.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {previewSubmission.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewSubmission.user.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Document details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">নথির ধরন</span>
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    {getDocumentTypeIcon(previewSubmission.documentType)}
                    {getDocumentTypeLabel(previewSubmission.documentType)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">নথি নম্বর</span>
                  <p className="font-medium text-foreground font-mono">
                    {previewSubmission.documentNumber}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">জমার তারিখ</span>
                  <p className="font-medium text-foreground">
                    {formatDate(previewSubmission.submittedAt)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">স্ট্যাটাস</span>
                  <div className="mt-0.5">{getStatusBadge(previewSubmission.status)}</div>
                </div>
              </div>

              <Separator />

              {/* Document images */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">আপলোডকৃত নথি</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {previewSubmission.documentFront && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">সামনের দিক</p>
                      <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                        <img
                          src={previewSubmission.documentFront}
                          alt="নথি - সামনের দিক"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {previewSubmission.documentBack && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">পেছনের দিক</p>
                      <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                        <img
                          src={previewSubmission.documentBack}
                          alt="নথি - পেছনের দিক"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {previewSubmission.selfie && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">সেলফি</p>
                      <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                        <img
                          src={previewSubmission.selfie}
                          alt="সেলফি"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick action buttons for pending */}
              {previewSubmission.status === 'pending' && (
                <>
                  <Separator />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => {
                        setPreviewDialogOpen(false);
                        openReviewDialog(previewSubmission, 'rejected');
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      প্রত্যাখ্যান
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setPreviewDialogOpen(false);
                        openReviewDialog(previewSubmission, 'approved');
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      অনুমোদন
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
