'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Shield,
  RefreshCw,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { formatDate, toBanglaNumber, getInitials } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import type { AdminReview } from '@/lib/types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'hide' | 'show' | 'delete' | null>(null);
  const [dialogReview, setDialogReview] = useState<AdminReview | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Expanded comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAdminReviews({
          status: statusFilter,
          page,
          limit: pagination.limit,
        });
        setReviews(data.reviews || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        setError('রিভিউ তালিকা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, pagination.limit]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [statusFilter]);

  function handlePageChange(page: number) {
    fetchReviews(page);
  }

  function handleRefresh() {
    fetchReviews(pagination.page);
  }

  function openActionDialog(review: AdminReview, action: 'hide' | 'show' | 'delete') {
    setDialogReview(review);
    setDialogAction(action);
    setAdminNote('');
    setDialogOpen(true);
  }

  async function handleConfirmAction() {
    if (!dialogReview || !dialogAction) return;

    try {
      setActionLoading(dialogReview.id);
      await api.moderateReview(dialogReview.id, dialogAction, adminNote || undefined);

      // Update local state
      if (dialogAction === 'delete') {
        setReviews((prev) => prev.filter((r) => r.id !== dialogReview.id));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / prev.limit),
        }));
      } else if (dialogAction === 'hide') {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === dialogReview.id ? { ...r, isHidden: true, adminNote: adminNote || r.adminNote } : r
          )
        );
      } else if (dialogAction === 'show') {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === dialogReview.id ? { ...r, isHidden: false } : r
          )
        );
      }

      const actionLabels = {
        hide: 'লুকানো',
        show: 'দৃশ্যমান',
        delete: 'মুছে ফেলা',
      };
      toast({
        title: 'সফল!',
        description: `রিভিউ সফলভাবে ${actionLabels[dialogAction]} হয়েছে`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'কাজ সম্পাদন করতে সমস্যা হয়েছে';
      console.error('Failed to moderate review:', err);
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setDialogOpen(false);
      setDialogReview(null);
      setDialogAction(null);
      setAdminNote('');
    }
  }

  function toggleCommentExpand(reviewId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  }

  // Filter by search on client side
  const filteredReviews = search.trim()
    ? reviews.filter(
        (r) =>
          r.fromUser.name.toLowerCase().includes(search.toLowerCase()) ||
          r.toUser.name.toLowerCase().includes(search.toLowerCase()) ||
          (r.fromUser.email && r.fromUser.email.toLowerCase().includes(search.toLowerCase())) ||
          (r.toUser.email && r.toUser.email.toLowerCase().includes(search.toLowerCase()))
      )
    : reviews;

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-foreground ml-1">
          {toBanglaNumber(rating)}
        </span>
      </div>
    );
  }

  function renderUserCell(user: AdminReview['fromUser'] | AdminReview['toUser']) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {user.name}
            </span>
            {user.isVerified && (
              <Shield className="h-3 w-3 text-primary shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  function getReviewTypeBadge(type: string) {
    switch (type) {
      case 'buyer':
        return (
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400 text-[11px]">
            ক্রেতা
          </Badge>
        );
      case 'seller':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 text-[11px]">
            বিক্রেতা
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:border-gray-700 dark:text-gray-400 text-[11px]">
            সাধারণ
          </Badge>
        );
    }
  }

  function getStatusBadge(isHidden: boolean) {
    if (isHidden) {
      return (
        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 text-[11px]">
          লুকানো
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 text-[11px]">
        দৃশ্যমান
      </Badge>
    );
  }

  function renderComment(comment: string | undefined | null, reviewId: string) {
    if (!comment) {
      return <span className="text-muted-foreground text-xs italic">মন্তব্য নেই</span>;
    }
    const isExpanded = expandedComments.has(reviewId);
    const shouldTruncate = comment.length > 80;

    return (
      <div className="max-w-[200px]">
        <p
          className={`text-sm text-foreground ${
            !isExpanded && shouldTruncate ? 'line-clamp-2' : ''
          }`}
        >
          {comment}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => toggleCommentExpand(reviewId)}
            className="text-xs text-primary hover:underline mt-0.5"
          >
            {isExpanded ? 'সংকুচিত' : 'আরও দেখুন'}
          </button>
        )}
      </div>
    );
  }

  function getDialogTitle() {
    switch (dialogAction) {
      case 'hide':
        return 'রিভিউ লুকানো';
      case 'show':
        return 'রিভিউ দৃশ্যমান করা';
      case 'delete':
        return 'রিভিউ মুছে ফেলা';
      default:
        return '';
    }
  }

  function getDialogDescription() {
    switch (dialogAction) {
      case 'hide':
        return 'আপনি কি নিশ্চিত যে এই রিভিউটি লুকাতে চান? লুকানো রিভিউ সাধারণ ব্যবহারকারীদের কাছে দৃশ্যমান হবে না।';
      case 'show':
        return 'আপনি কি নিশ্চিত যে এই রিভিউটি দৃশ্যমান করতে চান?';
      case 'delete':
        return 'এই রিভিউ মুছে ফেলা হবে এবং ব্যবহারকারীর রেটিং পুনঃগণনা করা হবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।';
      default:
        return '';
    }
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="রিভিউ মডারেশন"
        subtitle="সকল রিভিউ পর্যালোচনা ও মডারেশন"
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="card-modern">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল</SelectItem>
                  <SelectItem value="visible">দৃশ্যমান</SelectItem>
                  <SelectItem value="hidden">লুকানো</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ব্যবহারকারীর নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      {loading ? (
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              আবার চেষ্টা করুন
            </Button>
          </CardContent>
        </Card>
      ) : filteredReviews.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো রিভিউ পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              মোট রিভিউ: {toBanglaNumber(pagination.total)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">থেকে</TableHead>
                    <TableHead className="whitespace-nowrap">প্রতি</TableHead>
                    <TableHead className="whitespace-nowrap">রেটিং</TableHead>
                    <TableHead className="whitespace-nowrap">মন্তব্য</TableHead>
                    <TableHead className="whitespace-nowrap">ধরন</TableHead>
                    <TableHead className="whitespace-nowrap">স্ট্যাটাস</TableHead>
                    <TableHead className="whitespace-nowrap">তারিখ</TableHead>
                    <TableHead className="whitespace-nowrap text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      {/* From User */}
                      <TableCell className="whitespace-nowrap">
                        {renderUserCell(review.fromUser)}
                      </TableCell>

                      {/* To User */}
                      <TableCell className="whitespace-nowrap">
                        {renderUserCell(review.toUser)}
                      </TableCell>

                      {/* Rating */}
                      <TableCell className="whitespace-nowrap">
                        {renderStars(review.rating)}
                      </TableCell>

                      {/* Comment */}
                      <TableCell>
                        {renderComment(review.comment, review.id)}
                      </TableCell>

                      {/* Type */}
                      <TableCell className="whitespace-nowrap">
                        {getReviewTypeBadge(review.reviewType)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(review.isHidden)}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatDate(review.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={actionLoading === review.id}
                            >
                              {actionLoading === review.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {review.isHidden ? (
                              <DropdownMenuItem
                                onClick={() => openActionDialog(review, 'show')}
                                className="gap-2 text-green-600 focus:text-green-600"
                              >
                                <Eye className="h-4 w-4" />
                                দৃশ্যমান করুন
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => openActionDialog(review, 'hide')}
                                className="gap-2 text-amber-600 focus:text-amber-600"
                              >
                                <EyeOff className="h-4 w-4" />
                                লুকান
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => openActionDialog(review, 'delete')}
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              মুছে ফেলুন
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  পৃষ্ঠা {toBanglaNumber(pagination.page)} / {toBanglaNumber(pagination.totalPages)} — মোট {toBanglaNumber(pagination.total)}টি রিভিউ
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: pagination.totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Show first, last, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {toBanglaNumber(pageNum)}
                        </Button>
                      );
                    }
                    if (
                      pageNum === pagination.page - 2 ||
                      pageNum === pagination.page + 2
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'delete' && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              {dialogAction === 'hide' && (
                <EyeOff className="h-5 w-5 text-amber-500" />
              )}
              {dialogAction === 'show' && (
                <Eye className="h-5 w-5 text-green-500" />
              )}
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          {/* Review summary */}
          {dialogReview && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {dialogReview.fromUser.avatar && (
                      <AvatarImage src={dialogReview.fromUser.avatar} alt={dialogReview.fromUser.name} />
                    )}
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {getInitials(dialogReview.fromUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{dialogReview.fromUser.name}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <Avatar className="h-6 w-6">
                    {dialogReview.toUser.avatar && (
                      <AvatarImage src={dialogReview.toUser.avatar} alt={dialogReview.toUser.name} />
                    )}
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {getInitials(dialogReview.toUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{dialogReview.toUser.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(dialogReview.rating)}
                {getReviewTypeBadge(dialogReview.reviewType)}
              </div>
              {dialogReview.comment && (
                <p className="text-sm text-foreground">{dialogReview.comment}</p>
              )}
            </div>
          )}

          {/* Admin note for hide action */}
          {dialogAction === 'hide' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                প্রশাসক নোট (ঐচ্ছিক)
              </label>
              <Textarea
                placeholder="লুকানোর কারণ লিখুন..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading === dialogReview?.id}
            >
              বাতিল
            </Button>
            <Button
              variant={
                dialogAction === 'delete'
                  ? 'destructive'
                  : dialogAction === 'hide'
                  ? 'secondary'
                  : 'default'
              }
              onClick={handleConfirmAction}
              disabled={actionLoading === dialogReview?.id}
              className="gap-1.5"
            >
              {actionLoading === dialogReview?.id && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              {dialogAction === 'hide' && 'লুকান'}
              {dialogAction === 'show' && 'দৃশ্যমান করুন'}
              {dialogAction === 'delete' && 'মুছে ফেলুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
