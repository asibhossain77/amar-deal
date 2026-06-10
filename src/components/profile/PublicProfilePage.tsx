'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { PublicProfile, PublicReview } from '@/lib/types';
import { getInitials, toBanglaNumber, formatDate, timeAgo } from '@/lib/helpers';
import PageHeader from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  Star,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  Flag,
  Copy,
  Check,
  ChevronLeft,
  MessageSquare,
  Store,
  ShoppingBag,
  ShieldCheck,
  ShieldX,
  CalendarDays,
  Handshake,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Star Rating Component ─────────────────────────
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : star - 0.5 <= rating
              ? 'text-amber-400 fill-amber-200'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Interactive Star Rating (for review dialog) ─────────────────────────
function InteractiveStarRating({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${toBanglaNumber(star)} তারা`}
        >
          <Star
            className={`w-7 h-7 ${
              star <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Trust Score Ring ─────────────────────────
function TrustScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#16a34a';
    if (s >= 60) return '#2563eb';
    if (s >= 40) return '#d97706';
    return '#dc2626';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'চমৎকার';
    if (s >= 60) return 'ভালো';
    if (s >= 40) return 'মোটামুটি';
    return 'কম';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{toBanglaNumber(Math.round(score))}</span>
        <span className="text-[10px] text-muted-foreground">{getLabel(score)}</span>
      </div>
    </div>
  );
}

// ─── Review Card ─────────────────────────
function ReviewCard({ review, onUserClick }: { review: PublicReview; onUserClick: (userId: string) => void }) {
  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onUserClick(review.fromUser.id)}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-9 w-9">
            {review.fromUser.avatar ? (
              <AvatarImage src={review.fromUser.avatar} alt={review.fromUser.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(review.fromUser.name)}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onUserClick(review.fromUser.id)}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {review.fromUser.name}
            </button>
            {review.fromUser.isVerified && (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            )}
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">{toBanglaNumber(review.rating)}.০</span>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.comment}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
            {review.reviewType !== 'general' && (
              <Badge variant="secondary" className="text-[10px] border-0 bg-primary/10 text-primary">
                {review.reviewType === 'buyer' ? 'ক্রেতা' : 'বিক্রেতা'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────
export default function PublicProfilePage() {
  const { selectedUserId, user: currentUser, setPage, setSelectedUserId } = useAppStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewType, setReviewType] = useState<'buyer' | 'seller' | 'general'>('general');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const data = await api.getPublicProfile(selectedUserId);
      setProfile(data.profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'প্রোফাইল লোড করতে ত্রুটি হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setPage('public-profile');
  };

  const handleSubmitReview = async () => {
    if (!selectedUserId || reviewRating < 1) return;
    setSubmittingReview(true);
    try {
      await api.submitReview(selectedUserId, {
        rating: reviewRating,
        comment: reviewComment || undefined,
        reviewType,
      });
      toast({ title: 'সফল', description: 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে' });
      setReviewRating(0);
      setReviewComment('');
      setReviewType('general');
      setReviewDialogOpen(false);
      fetchProfile();
    } catch (err: unknown) {
      toast({
        title: 'ত্রুটি',
        description: err instanceof Error ? err.message : 'রিভিউ জমা দিতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedUserId || !reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await api.reportUser(selectedUserId, {
        reason: reportReason.trim(),
        description: reportDescription.trim() || undefined,
      });
      toast({ title: 'সফল', description: 'রিপোর্ট জমা দেওয়া হয়েছে। প্রশাসক শীঘ্রই পর্যালোচনা করবেন।' });
      setReportReason('');
      setReportDescription('');
      setReportDialogOpen(false);
    } catch (err: unknown) {
      toast({
        title: 'ত্রুটি',
        description: err instanceof Error ? err.message : 'রিপোর্ট জমা দিতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const profileUrl = `${window.location.origin}?user=${selectedUserId}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: 'কপি হয়েছে', description: 'প্রোফাইল লিংক কপি করা হয়েছে' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'ত্রুটি', description: 'লিংক কপি করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'buyer': return 'ক্রেতা';
      case 'seller': return 'বিক্রেতা';
      default: return 'ক্রেতা ও বিক্রেতা';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'buyer': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'seller': return <Store className="w-3.5 h-3.5" />;
      default: return <ArrowLeftRight className="w-3.5 h-3.5" />;
    }
  };

  // ─── Loading State ─────────────────────────
  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                <div className="flex gap-2 justify-center sm:justify-start">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Error State ─────────────────────────
  if (error || !profile) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">প্রোফাইল পাওয়া যায়নি</h2>
          <p className="text-muted-foreground mb-6">{error || 'এই ব্যবহারকারীর প্রোফাইল লোড করা যায়নি'}</p>
          <Button variant="outline" onClick={() => setPage('dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            ড্যাশবোর্ডে ফিরুন
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const reviews = profile.reviews ?? [];

  return (
    <div className="page-container space-y-6">
      {/* ─── Header ───────────────────────── */}
      <PageHeader
        title="পাবলিক প্রোফাইল"
        subtitle="ব্যবহারকারীর পরিচিতি ও বিশ্বাসযোগ্যতা"
        icon={<User className="h-5 w-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copied ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>প্রোফাইল লিংক কপি করুন</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!isOwnProfile && (
              <>
                {/* Report User Button */}
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900">
                      <Flag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">রিপোর্ট</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" />
                        ব্যবহারকারী রিপোর্ট করুন
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          {profile.avatar ? <AvatarImage src={profile.avatar} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{profile.name}</p>
                          {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">রিপোর্টের কারণ *</label>
                        <Textarea
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          placeholder="রিপোর্টের কারণ লিখুন..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">বিস্তারিত (ঐচ্ছিক)</label>
                        <Textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="আরও বিস্তারিত লিখুন..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">বাতিল</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleSubmitReport}
                        disabled={!reportReason.trim() || submittingReport}
                      >
                        {submittingReport ? 'জমা দেওয়া হচ্ছে...' : 'রিপোর্ট জমা দিন'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Leave Review Button */}
                {profile.canReview && !profile.hasReviewed && (
                  <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">রিভিউ দিন</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                          রিভিউ দিন
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5 py-2">
                        {/* User being reviewed */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Avatar className="h-8 w-8">
                            {profile.avatar ? <AvatarImage src={profile.avatar} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(profile.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{profile.name}</p>
                            {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                          </div>
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">রেটিং *</label>
                          <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                          {reviewRating === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">রেটিং দিতে তারায় ক্লিক করুন</p>
                          )}
                        </div>

                        {/* Review Type */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">রিভিউয়ের ধরন</label>
                          <div className="flex gap-2">
                            {([
                              { value: 'general', label: 'সাধারণ' },
                              { value: 'buyer', label: 'ক্রেতা হিসেবে' },
                              { value: 'seller', label: 'বিক্রেতা হিসেবে' },
                            ] as const).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setReviewType(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  reviewType === opt.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">মন্তব্য</label>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="আপনার অভিজ্ঞতা সম্পর্কে লিখুন..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">বাতিল</Button>
                        </DialogClose>
                        <Button
                          onClick={handleSubmitReview}
                          disabled={reviewRating < 1 || submittingReview}
                        >
                          {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </div>
        }
      />

      {/* ─── Profile Header Card ───────────────────────── */}
      <Card className="overflow-hidden">
        {/* Subtle banner */}
        <div className="h-20 sm:h-28 bg-gradient-to-r from-primary/15 via-primary/5 to-emerald-500/10" />
        <CardContent className="p-4 sm:p-6 -mt-10 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-lg shrink-0">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name, Username, Badges */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.name}</h1>
                {profile.isVerified && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                    <CheckCircle className="w-3 h-3" />
                    ভেরিফাইড
                  </Badge>
                )}
              </div>
              {profile.username && (
                <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {/* Account Type */}
                <Badge variant="outline" className="text-xs gap-1">
                  {getAccountTypeIcon(profile.accountType)}
                  {getAccountTypeLabel(profile.accountType)}
                </Badge>
                {/* Verification Status */}
                {profile.isVerified ? (
                  <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
                    <ShieldCheck className="w-3 h-3" />
                    ভেরিফাইড
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1 border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    <ShieldX className="w-3 h-3" />
                    অনভেরিফাইড
                  </Badge>
                )}
                {/* Join Date */}
                <Badge variant="outline" className="text-xs gap-1">
                  <CalendarDays className="w-3 h-3" />
                  যোগ দিয়েছেন {formatDate(profile.createdAt)}
                </Badge>
              </div>
            </div>

            {/* Trust Score - Desktop */}
            <div className="hidden md:block shrink-0">
              <TrustScoreRing score={profile.trustScore} size={90} />
            </div>
          </div>

          {/* Trust Score - Mobile */}
          <div className="flex justify-center mt-4 md:hidden">
            <TrustScoreRing score={profile.trustScore} size={90} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Stats Grid ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Buyer Rating */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-medium">ক্রেতা রেটিং</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {profile.buyerRating > 0 ? toBanglaNumber(profile.buyerRating) : '—'}
            </p>
            {profile.buyerRating > 0 && <StarRating rating={profile.buyerRating} size="sm" />}
            <p className="text-xs text-muted-foreground mt-1">
              {toBanglaNumber(profile.buyerReviewCount)} রিভিউ
            </p>
          </CardContent>
        </Card>

        {/* Seller Rating */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <Store className="w-4 h-4" />
              <span className="text-xs font-medium">বিক্রেতা রেটিং</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {profile.sellerRating > 0 ? toBanglaNumber(profile.sellerRating) : '—'}
            </p>
            {profile.sellerRating > 0 && <StarRating rating={profile.sellerRating} size="sm" />}
            <p className="text-xs text-muted-foreground mt-1">
              {toBanglaNumber(profile.sellerReviewCount)} রিভিউ
            </p>
          </CardContent>
        </Card>

        {/* Completed Deals */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <Handshake className="w-4 h-4" />
              <span className="text-xs font-medium">সম্পন্ন ডিল</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{toBanglaNumber(profile.completedDeals)}</p>
            <p className="text-xs text-muted-foreground mt-1">ট্রানজেকশন</p>
          </CardContent>
        </Card>

        {/* Trust Score Card */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-medium">ট্রাস্ট স্কোর</span>
            </div>
            <TrustScoreRing score={profile.trustScore} size={64} />
          </CardContent>
        </Card>

        {/* Join Date */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">সদস্য হিসেবে</span>
            </div>
            <p className="text-lg font-bold text-foreground leading-tight">
              {formatDate(profile.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              মোট রিভিউ: {toBanglaNumber(profile.totalReviews)}
            </p>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-medium">মোট রিভিউ</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{toBanglaNumber(profile.totalReviews)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {toBanglaNumber(profile.buyerReviewCount)} ক্রেতা + {toBanglaNumber(profile.sellerReviewCount)} বিক্রেতা
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Reviews Section ───────────────────────── */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              সাম্প্রতিক রিভিউ
              <Badge variant="secondary" className="ml-1 text-xs">
                {toBanglaNumber(reviews.length)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} onUserClick={handleUserClick} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty Reviews ───────────────────────── */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">এখনো কোনো রিভিউ নেই</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwnProfile
                ? 'আপনার সম্পর্কে এখনো কেউ রিভিউ দেয়নি'
                : 'এই ব্যবহারকারী সম্পর্কে এখনো কেউ রিভিউ দেয়নি'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Already Reviewed Notice ───────────────────────── */}
      {!isOwnProfile && profile.hasReviewed && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">আপনি ইতিমধ্যে রিভিউ দিয়েছেন</p>
              <p className="text-xs text-muted-foreground">এই ব্যবহারকারীকে আপনি আগেই রিভিউ দিয়েছেন</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
