'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { PublicProfile, EarnedBadge, PublicReview } from '@/lib/types';
import { getInitials, toBanglaNumber, formatDate, timeAgo } from '@/lib/helpers';
import { getPlanBadgeStyle } from '@/components/shared/BadgeDisplay';
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
  Shield,
  Star,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  TrendingUp,
  Flag,
  Copy,
  Check,
  ChevronLeft,
  MessageSquare,
  Award,
  Crown,
  Store,
  ShoppingBag,
  ThumbsUp,
  AlertTriangle,
  Eye,
  EyeOff,
  BarChart3,
  Zap,
  Globe,
  Lock,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { BadgeIcon, VerificationBadge } from '@/components/shared/BadgeIcon';
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
        <span className="text-[10px] text-muted-foreground">ট্রাস্ট স্কোর</span>
      </div>
    </div>
  );
}

// ─── Privacy Protected Indicator ─────────────────────────
function PrivacyProtectedIndicator({ size = 120 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30"
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <Lock className="text-muted-foreground/60" style={{ width: size * 0.25, height: size * 0.25 }} />
        <span className="text-[10px] text-muted-foreground text-center leading-tight px-2">
          গোপনীয়<br />সুরক্ষিত
        </span>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────
function ProgressBar({ value, max = 100, color = '#16a34a', label }: { value: number; max?: number; color?: string; label: string }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{max === 5 ? `${toBanglaNumber(value)}/৫` : `${toBanglaNumber(Math.round(percent))}%`}</span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Badge Card ─────────────────────────
function BadgeCard({ badge, onClick }: { badge: EarnedBadge; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left w-full ${
        badge.earned
          ? 'border-border bg-card hover:bg-accent shadow-sm'
          : 'border-dashed border-muted-foreground/30 bg-muted/20 opacity-50 cursor-default'
      }`}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
        style={{ backgroundColor: badge.earned ? badge.color + '20' : '#9ca3af20', color: badge.earned ? badge.color : '#9ca3af' }}
      >
        <BadgeIcon icon={badge.icon} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {badge.label}
          </p>
          {badge.earned && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
      </div>
    </button>
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
              <VerificationBadge size="sm" />
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
  const [privacyLevel, setPrivacyLevel] = useState<'full' | 'shared' | 'limited'>('full');
  const [canRequestAccess, setCanRequestAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewType, setReviewType] = useState('general');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessRequestOpen, setAccessRequestOpen] = useState(false);
  const [submittingAccessRequest, setSubmittingAccessRequest] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPublicProfile(selectedUserId);
      setProfile(data.profile);
      setPrivacyLevel(data.privacyLevel || 'full');
      setCanRequestAccess(data.canRequestAccess || false);
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
        comment: reviewComment,
        reviewType,
      });
      toast({ title: 'সফল', description: 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে' });
      setReviewRating(0);
      setReviewComment('');
      setReviewType('general');
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

  const handleRequestAccess = async () => {
    setSubmittingAccessRequest(true);
    try {
      // Simulate sending a request — just show a toast for now
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast({ title: 'সফল', description: 'অনুরোধ পাঠানো হয়েছে' });
      setAccessRequestOpen(false);
    } catch {
      toast({ title: 'ত্রুটি', description: 'অনুরোধ পাঠাতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setSubmittingAccessRequest(false);
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
      case 'buyer': return <ShoppingBag className="w-4 h-4" />;
      case 'seller': return <Store className="w-4 h-4" />;
      default: return <ArrowLeftRight className="w-4 h-4" />;
    }
  };

  const getMemberSinceLabel = (badge: string) => {
    switch (badge) {
      case 'new': return 'নতুন সদস্য';
      case 'beginner': return 'প্রাথমিক সদস্য';
      case 'intermediate': return 'মধ্যম সদস্য';
      case 'experienced': return 'অভিজ্ঞ সদস্য';
      case 'veteran': return 'প্রবীণ সদস্য';
      default: return 'সদস্য';
    }
  };

  const getMemberSinceColor = (badge: string) => {
    switch (badge) {
      case 'new': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'beginner': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'intermediate': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'experienced': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'veteran': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // ─── Derived privacy flags ─────────────────────────
  const isLimited = privacyLevel === 'limited';
  const isShared = privacyLevel === 'shared';
  const isFull = privacyLevel === 'full';

  // ─── Loading State ─────────────────────────
  if (loading) {
    return (
      <div className="page-container space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="card-modern">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────
  if (error || !profile) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
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

  // Safe accessors for optional fields
  const overallRating = profile.overallRating ?? 0;
  const totalReviews = profile.totalReviews ?? 0;
  const completedDeals = profile.completedDeals ?? 0;
  const trustScore = profile.trustScore ?? 0;
  const buyerRating = profile.buyerRating ?? 0;
  const sellerRating = profile.sellerRating ?? 0;
  const positiveReviewPercentage = profile.positiveReviewPercentage ?? 0;
  const successRate = profile.successRate ?? 0;
  const disputeRate = profile.disputeRate ?? 0;
  const successfulTransactions = profile.successfulTransactions ?? 0;
  const reviews = profile.reviews ?? [];
  const stats = profile.stats;

  return (
    <div className="page-container space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="পাবলিক প্রোফাইল"
          subtitle="ব্যবহারকারীর বিস্তারিত তথ্য ও রেপুটেশন"
          icon={<User className="h-5 w-5 text-primary" />}
        />
        <div className="flex items-center gap-2">
          {/* Privacy Level Indicator */}
          {isLimited && (
            <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
              <EyeOff className="w-3 h-3" />
              সীমিত দৃশ্যমানতা
            </Badge>
          )}
          {isShared && (
            <Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
              <Share2 className="w-3 h-3" />
              শেয়ার করা অ্যাক্সেস
            </Badge>
          )}
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
            <Dialog>
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
          )}
        </div>
      </div>

      {/* ─── Profile Hero Card ───────────────────────── */}
      <Card className="card-modern overflow-hidden">
        {/* Banner gradient */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-500/10 relative">
          {profile.currentPlan && profile.currentPlan.slug !== 'basic' && (
            <div className="absolute top-3 right-3">
              <Badge
                variant="outline"
                className={`${getPlanBadgeStyle(profile.currentPlan.slug, profile.currentPlan.badgeColor)} text-xs font-medium`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {profile.currentPlan.name}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-lg">
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              {profile.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center ring-2 ring-background shadow">
                  <VerificationBadge size="sm" />
                </div>
              )}
            </div>
            
            {/* Name & Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.name}</h1>
                {profile.isVerified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    ভেরিফাইড
                  </Badge>
                )}
              </div>
              {profile.username && (
                <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="outline" className="text-xs gap-1">
                  {getAccountTypeIcon(profile.accountType)}
                  {getAccountTypeLabel(profile.accountType)}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getMemberSinceColor(profile.memberSinceBadge)}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {getMemberSinceLabel(profile.memberSinceBadge)}
                </Badge>
                {profile.country && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Globe className="w-3 h-3" />
                    {profile.country}
                  </Badge>
                )}
              </div>
              {/* Privacy indicator badges for limited view */}
              {isLimited && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  {profile.trustIndicators?.includes('trusted_user') && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      বিশ্বস্ত ব্যবহারকারী
                    </Badge>
                  )}
                  {profile.trustIndicators?.includes('new_user') && (
                    <Badge variant="outline" className="text-xs gap-1 border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      নতুন ব্যবহারকারী
                    </Badge>
                  )}
                  {profile.ratingIndicators?.includes('positive_rating') && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      ইতিবাচক রেটিং
                    </Badge>
                  )}
                  {profile.ratingIndicators?.includes('has_reviews') && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      <MessageSquare className="w-3 h-3" />
                      রিভিউ আছে
                    </Badge>
                  )}
                </div>
              )}
              {/* Shared access indicator for shared view */}
              {isShared && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs gap-1">
                    <Share2 className="w-3 h-3" />
                    শেয়ার করা অ্যাক্সেস
                  </Badge>
                  {profile.trustIndicators?.includes('trusted_user') && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      বিশ্বস্ত ব্যবহারকারী
                    </Badge>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                সর্বশেষ সক্রিয়: {timeAgo(profile.lastActive)}
              </p>
            </div>

            {/* Quick Stats - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                {isLimited ? (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground mt-1">রেটিং গোপনীয়</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">{toBanglaNumber(overallRating)}</p>
                    <StarRating rating={overallRating} size="sm" />
                    <p className="text-xs text-muted-foreground mt-0.5">{toBanglaNumber(totalReviews)} রিভিউ</p>
                  </>
                )}
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                {isLimited ? (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">সম্পন্ন ডিল</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">{toBanglaNumber(completedDeals)}</p>
                    <p className="text-xs text-muted-foreground">সম্পন্ন ডিল</p>
                  </>
                )}
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                {isLimited ? (
                  <PrivacyProtectedIndicator size={70} />
                ) : isShared && !profile.trustScore ? (
                  <PrivacyProtectedIndicator size={70} />
                ) : (
                  <TrustScoreRing score={trustScore} size={70} />
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats - Mobile */}
          <div className="grid grid-cols-3 gap-3 mt-4 lg:hidden">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              {isLimited ? (
                <>
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">রেটিং গোপনীয়</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">{toBanglaNumber(overallRating)}</p>
                  <StarRating rating={overallRating} size="sm" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{toBanglaNumber(totalReviews)} রিভিউ</p>
                </>
              )}
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              {isLimited ? (
                <>
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground">সম্পন্ন ডিল</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">{toBanglaNumber(completedDeals)}</p>
                  <p className="text-[10px] text-muted-foreground">সম্পন্ন ডিল</p>
                </>
              )}
            </div>
            <div className="flex items-center justify-center p-3 rounded-lg bg-muted/30">
              {isLimited ? (
                <PrivacyProtectedIndicator size={50} />
              ) : isShared && !profile.trustScore ? (
                <PrivacyProtectedIndicator size={50} />
              ) : (
                <TrustScoreRing score={trustScore} size={50} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Main Content Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Trust Panel */}
        <div className="space-y-6">
          {/* Trust Score Card */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                ট্রাস্ট প্যানেল
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trust Score Ring or Privacy Indicator */}
              <div className="flex justify-center">
                {isLimited ? (
                  <PrivacyProtectedIndicator size={120} />
                ) : isShared && !profile.trustScore ? (
                  <PrivacyProtectedIndicator size={120} />
                ) : (
                  <TrustScoreRing score={trustScore} size={120} />
                )}
              </div>

              {/* Privacy indicator badges for limited */}
              {isLimited && (
                <div className="flex flex-wrap justify-center gap-2">
                  {profile.trustIndicators?.includes('trusted_user') && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      বিশ্বস্ত ব্যবহারকারী
                    </Badge>
                  )}
                  {profile.trustIndicators?.includes('new_user') && (
                    <Badge variant="outline" className="text-xs gap-1 border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      নতুন ব্যবহারকারী
                    </Badge>
                  )}
                </div>
              )}

              {/* Shared access badge for shared */}
              {isShared && (
                <div className="flex justify-center">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs gap-1">
                    <Share2 className="w-3 h-3" />
                    শেয়ার করা অ্যাক্সেস
                  </Badge>
                </div>
              )}

              <Separator />

              {/* Progress bars — hidden for limited, partial for shared, full for full */}
              {isLimited ? (
                <div className="py-4 text-center">
                  <Lock className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">রেটিং তথ্য গোপনীয়</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(isFull || profile.overallRating !== undefined) && (
                    <ProgressBar value={overallRating} max={5} color="#f59e0b" label={`রেটিং: ${toBanglaNumber(overallRating)}/৫`} />
                  )}
                  {(isFull || profile.successRate !== undefined) && (
                    <ProgressBar value={successRate} color="#16a34a" label={`সাফল্যের হার: ${toBanglaNumber(successRate)}%`} />
                  )}
                  {isFull && (
                    <ProgressBar value={Math.max(100 - disputeRate * 10, 0)} color={disputeRate < 5 ? '#16a34a' : disputeRate < 15 ? '#d97706' : '#dc2626'} label={`বিরোধ হার: ${toBanglaNumber(disputeRate)}%`} />
                  )}
                </div>
              )}

              <Separator />

              {/* Stats grid — hidden for limited, partial for shared, full for full */}
              {isLimited ? (
                <div className="py-2 text-center">
                  <EyeOff className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">পরিসংখ্যান গোপনীয়</p>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-foreground">{toBanglaNumber(stats.totalTransactions)}</p>
                    <p className="text-[10px] text-muted-foreground">মোট লেনদেন</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-foreground">{toBanglaNumber(successfulTransactions)}</p>
                    <p className="text-[10px] text-muted-foreground">সফল এসক্রো</p>
                  </div>
                  {isFull && (
                    <>
                      <div className="p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">{toBanglaNumber(stats.buyerTransactionCount)}</p>
                        <p className="text-[10px] text-muted-foreground">ক্রেতা হিসেবে</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">{toBanglaNumber(stats.sellerTransactionCount)}</p>
                        <p className="text-[10px] text-muted-foreground">বিক্রেতা হিসেবে</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center">
                  <EyeOff className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">পরিসংখ্যান গোপনীয়</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Badge */}
          {profile.currentPlan && profile.currentPlan.slug !== 'basic' && (
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  সাবস্ক্রিপশন ব্যাজ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: profile.currentPlan.badgeColor + '15' }}>
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full"
                    style={{ backgroundColor: profile.currentPlan.badgeColor + '25', color: profile.currentPlan.badgeColor }}
                  >
                    <BadgeIcon icon={profile.currentPlan.badgeIcon} size="lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{profile.currentPlan.name}</p>
                    <p className="text-xs text-muted-foreground">{profile.currentPlan.description}</p>
                  </div>
                </div>
                {profile.currentSubscription && (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>সাবস্ক্রিপশন: <span className="text-foreground font-medium">{profile.currentSubscription.status === 'active' ? 'সক্রিয়' : profile.currentSubscription.status}</span></p>
                    <p>শুরু: <span className="text-foreground font-medium">{formatDate(profile.currentSubscription.startDate)}</span></p>
                    {profile.currentSubscription.endDate && (
                      <p>মেয়াদ: <span className="text-foreground font-medium">{formatDate(profile.currentSubscription.endDate)}</span></p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Member Info */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                সদস্য তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">সদস্য হয়েছেন</span>
                <span className="font-medium text-foreground">{formatDate(profile.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">অ্যাকাউন্ট ধরন</span>
                <span className="font-medium text-foreground">{getAccountTypeLabel(profile.accountType)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ভেরিফিকেশন</span>
                <span className={`font-medium flex items-center gap-1 ${profile.isVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {profile.isVerified ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> ভেরিফাইড</>
                  ) : 'ভেরিফাইড নয়'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">সর্বশেষ সক্রিয়</span>
                <span className="font-medium text-foreground">{timeAgo(profile.lastActive)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Badges & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Earned Badges / Reputation Section */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                রেপুটেশন ব্যাজ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile.earnedBadges.map((badge) => (
                  <BadgeCard key={badge.key} badge={badge} onClick={() => badge.earned && setSelectedBadge(badge)} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats Card — hidden for limited, partial for shared, full for full */}
          {isLimited ? (
            <Card className="card-modern border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  লেনদেন পরিসংখ্যান
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-6 text-center">
                  <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">পরিসংখ্যান গোপনীয়</p>
                  <p className="text-xs text-muted-foreground">এই ব্যবহারকারীর বিস্তারিত পরিসংখ্যান গোপনীয়তা সুরক্ষিত</p>
                </div>
                {/* Privacy indicator badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {profile.ratingIndicators?.includes('positive_rating') && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      ইতিবাচক রেটিং
                    </Badge>
                  )}
                  {profile.ratingIndicators?.includes('has_reviews') && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      <MessageSquare className="w-3 h-3" />
                      রিভিউ আছে
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  লেনদেন পরিসংখ্যান
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 text-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">{toBanglaNumber(stats.completedTransactions)}</p>
                      <p className="text-[10px] text-muted-foreground">সম্পন্ন</p>
                    </div>
                    {isFull && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
                        <Zap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{toBanglaNumber(stats.inProgressTransactions)}</p>
                        <p className="text-[10px] text-muted-foreground">চলমান</p>
                      </div>
                    )}
                    {isFull && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-700 dark:text-red-400">{toBanglaNumber(stats.disputedTransactions)}</p>
                        <p className="text-[10px] text-muted-foreground">বিরোধিত</p>
                      </div>
                    )}
                    <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 text-center">
                      <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-primary">{toBanglaNumber(successRate)}%</p>
                      <p className="text-[10px] text-muted-foreground">সাফল্যের হার</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <EyeOff className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">পরিসংখ্যান গোপনীয়</p>
                  </div>
                )}
                
                {/* Rating breakdown — hidden for limited, shown for shared/full */}
                {isLimited ? (
                  <div className="mt-4 py-4 text-center">
                    <Lock className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">রেটিং তথ্য গোপনীয়</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">রেটিং বিবরণ</p>
                    {(isFull || profile.buyerRating !== undefined) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ক্রেতা রেটিং</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={buyerRating} size="sm" />
                          <span className="text-sm font-medium text-foreground">{toBanglaNumber(buyerRating)}</span>
                        </div>
                      </div>
                    )}
                    {(isFull || profile.sellerRating !== undefined) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">বিক্রেতা রেটিং</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={sellerRating} size="sm" />
                          <span className="text-sm font-medium text-foreground">{toBanglaNumber(sellerRating)}</span>
                        </div>
                      </div>
                    )}
                    {(isFull || profile.positiveReviewPercentage !== undefined) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">ইতিবাচক রিভিউ</span>
                        <span className="text-sm font-medium text-foreground">{toBanglaNumber(positiveReviewPercentage)}%</span>
                      </div>
                    )}
                    {isShared && profile.buyerRating === undefined && profile.sellerRating === undefined && profile.positiveReviewPercentage === undefined && (
                      <div className="py-3 text-center">
                        <Lock className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">রেটিং তথ্য গোপনীয়</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Write Review Section — available for all privacy levels if canReview */}
          {!isOwnProfile && profile.canReview && !profile.hasReviewed && (
            <Card className="card-modern border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  রিভিউ দিন
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">রেটিং *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {toBanglaNumber(reviewRating)}/৫
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">রিভিউ ধরন</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'general', label: 'সাধারণ' },
                      { value: 'buyer', label: 'ক্রেতা হিসেবে' },
                      { value: 'seller', label: 'বিক্রেতা হিসেবে' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setReviewType(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          reviewType === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">মন্তব্য (ঐচ্ছিক)</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="আপনার অভিজ্ঞতা সম্পর্কে লিখুন..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewRating < 1 || submittingReview}
                  className="w-full sm:w-auto"
                >
                  {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
                </Button>
              </CardContent>
            </Card>
          )}

          {profile.hasReviewed && !isOwnProfile && (
            <Card className="card-modern bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900">
              <CardContent className="p-4 flex items-center gap-3">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">আপনি ইতিমধ্যে এই ব্যবহারকারীকে রিভিউ দিয়েছেন</p>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section — conditional based on privacy level */}
          {isLimited ? (
            <Card className="card-modern border-amber-200 dark:border-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  রিভিউ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-6 text-center">
                  <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">রিভিউ দেখার অনুমতি নেই</p>
                  <p className="text-xs text-muted-foreground mb-4">এই ব্যবহারকারীর রিভিউ গোপনীয়তা সুরক্ষিত</p>
                  {/* Rating indicator badges */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {profile.ratingIndicators?.includes('positive_rating') && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        ইতিবাচক রেটিং
                      </Badge>
                    )}
                    {profile.ratingIndicators?.includes('has_reviews') && (
                      <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                        <MessageSquare className="w-3 h-3" />
                        রিভিউ আছে
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Request Access button */}
                {canRequestAccess && (
                  <div className="flex justify-center mt-2">
                    <Dialog open={accessRequestOpen} onOpenChange={setAccessRequestOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          রিভিউ দেখার অনুরোধ করুন
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            রিভিউ দেখার অনুরোধ
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                            <Avatar className="h-10 w-10">
                              {profile.avatar ? <AvatarImage src={profile.avatar} alt={profile.name} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(profile.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{profile.name}</p>
                              {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            এই ব্যবহারকারীর রিভিউ ও রেটিং দেখতে অনুমতি চান?
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            অনুরোধ পাঠানোর পর, ব্যবহারকারী সিদ্ধান্ত নেবেন তিনি আপনার সাথে রিভিউ শেয়ার করতে চান কিনা।
                          </p>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">বাতিল</Button>
                          </DialogClose>
                          <Button onClick={handleRequestAccess} disabled={submittingAccessRequest}>
                            {submittingAccessRequest ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    পাবলিক রিভিউ ({toBanglaNumber(reviews.length)})
                  </CardTitle>
                  {totalReviews > 0 && (isFull || profile.overallRating !== undefined) && (
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={overallRating} size="sm" />
                      <span className="text-sm font-medium text-foreground">{toBanglaNumber(overallRating)}</span>
                    </div>
                  )}
                </div>
                {isShared && (
                  <div className="mt-2">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs gap-1">
                      <Share2 className="w-3 h-3" />
                      শেয়ার করা রিভিউ দেখছেন
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">এখনো কোনো রিভিউ নেই</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} onUserClick={handleUserClick} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Badge Detail Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent>
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                    style={{ backgroundColor: selectedBadge.color + '20', color: selectedBadge.color }}
                  >
                    {selectedBadge.icon}
                  </div>
                  {selectedBadge.label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">{selectedBadge.description}</p>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">ব্যাজ পাওয়ার শর্ত:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedBadge.key === 'trusted-seller' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />কমপক্ষে ১০টি সফল বিক্রয় লেনদেন</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />বিক্রেতা রেটিং ৪.০ বা তার বেশি</li>
                      </>
                    )}
                    {selectedBadge.key === 'trusted-buyer' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />কমপক্ষে ১০টি সফল ক্রয় লেনদেন</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />ক্রেতা রেটিং ৪.০ বা তার বেশি</li>
                      </>
                    )}
                    {selectedBadge.key === 'verified' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />পরিচয় যাচাইকরণ সম্পন্ন</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />প্রশাসক কর্তৃক অনুমোদিত</li>
                      </>
                    )}
                    {selectedBadge.key === 'premium' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />পেমেন্ট সম্পন্ন হয়েছে</li>
                      </>
                    )}
                    {selectedBadge.key === 'top-rated' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />সামগ্রিক রেটিং ৪.৫ বা তার বেশি</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />কমপক্ষে ২০টি রিভিউ</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ব্যাজ সুবিধাসমূহ:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedBadge.key === 'trusted-seller' && (
                      <><li>• বিক্রেতা তালিকায় অগ্রাধিকার</li><li>• বিশ্বস্ততার প্রতীক প্রদর্শন</li><li>• ক্রেতাদের আস্থা বৃদ্ধি</li></>
                    )}
                    {selectedBadge.key === 'trusted-buyer' && (
                      <><li>• বিক্রেতাদের আস্থা বৃদ্ধি</li><li>• দ্রুত লেনদেন প্রক্রিয়াকরণ</li><li>• বিশ্বস্ততার প্রতীক প্রদর্শন</li></>
                    )}
                    {selectedBadge.key === 'verified' && (
                      <><li>• ভেরিফাইড ব্যাজ প্রদর্শন</li><li>• উচ্চ ট্রাস্ট স্কোর</li><li>• প্রোফাইলে বিশ্বাসযোগ্যতা বৃদ্ধি</li></>
                    )}
                    {selectedBadge.key === 'premium' && (
                      <><li>• প্রিমিয়াম ব্যাজ প্রদর্শন</li><li>• সকল প্রিমিয়াম ফিচার অ্যাক্সেস</li><li>• অগ্রাধিকার সাপোর্ট</li></>
                    )}
                    {selectedBadge.key === 'top-rated' && (
                      <><li>• শীর্ষ রেটেড ব্যাজ প্রদর্শন</li><li>• ফিচার্ড প্রোফাইল সুযোগ</li><li>• সর্বোচ্চ দৃশ্যমানতা</li></>
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
