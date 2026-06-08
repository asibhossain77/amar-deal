'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Diamond,
  ShieldCheck,
  Building2,
  Crown,
  Check,
  ChevronRight,
  Zap,
  Calendar,
  CreditCard,
  AlertTriangle,
  Loader2,
  Sparkles,
  Shield,
  X,
  RefreshCw,
  BadgeCheck,
  TrendingUp,
  HeadphonesIcon,
  Eye,
  Lock,
  BarChart3,
  ImageIcon,
  Award,
  Users,
  Gavel,
  UserCheck,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/helpers';
import type { SubscriptionPlan, UserSubscription } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// ─── Feature Label Map (Bengali) ─────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  priorityListing: 'অগ্রাধিকার তালিকাভুক্তি',
  premiumProfile: 'প্রিমিয়াম প্রোফাইল',
  featuredProfile: 'ফিচার্ড প্রোফাইল',
  higherDealLimits: 'উচ্চতর ডিল সীমা',
  prioritySupport: 'অগ্রাধিকার সাপোর্ট',
  advancedAnalytics: 'অ্যাডভান্সড অ্যানালিটিক্স',
  customProfileBanner: 'কাস্টম প্রোফাইল ব্যানার',
  featuredSellerStatus: 'ফিচার্ড সেলার',
  featuredBuyerStatus: 'ফিচার্ড বায়ার',
  fasterDisputeResolution: 'দ্রুত বিরোধ সমাধান',
  profileVerification: 'প্রোফাইল ভেরিফিকেশন',
  vipSupport: 'VIP সাপোর্ট',
  maximumVisibility: 'সর্বোচ্চ দৃশ্যমানতা',
  exclusiveFeatures: 'এক্সক্লুসিভ ফিচার',
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  priorityListing: <TrendingUp className="h-3.5 w-3.5" />,
  premiumProfile: <Sparkles className="h-3.5 w-3.5" />,
  featuredProfile: <Star className="h-3.5 w-3.5" />,
  higherDealLimits: <BarChart3 className="h-3.5 w-3.5" />,
  prioritySupport: <HeadphonesIcon className="h-3.5 w-3.5" />,
  advancedAnalytics: <BarChart3 className="h-3.5 w-3.5" />,
  customProfileBanner: <ImageIcon className="h-3.5 w-3.5" />,
  featuredSellerStatus: <Award className="h-3.5 w-3.5" />,
  featuredBuyerStatus: <Users className="h-3.5 w-3.5" />,
  fasterDisputeResolution: <Gavel className="h-3.5 w-3.5" />,
  profileVerification: <UserCheck className="h-3.5 w-3.5" />,
  vipSupport: <Crown className="h-3.5 w-3.5" />,
  maximumVisibility: <Eye className="h-3.5 w-3.5" />,
  exclusiveFeatures: <Lock className="h-3.5 w-3.5" />,
};

const PLAN_FEATURE_FLAGS: (keyof SubscriptionPlan)[] = [
  'priorityListing',
  'premiumProfile',
  'featuredProfile',
  'higherDealLimits',
  'prioritySupport',
  'advancedAnalytics',
  'customProfileBanner',
  'featuredSellerStatus',
  'featuredBuyerStatus',
  'fasterDisputeResolution',
  'profileVerification',
  'vipSupport',
  'maximumVisibility',
  'exclusiveFeatures',
];

// Plan-specific gradient classes
const PLAN_GRADIENTS: Record<string, { bg: string; card: string; border: string; glow: string; badge: string }> = {
  basic: {
    bg: 'from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900',
    card: 'from-white to-slate-50 dark:from-slate-900 dark:to-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    glow: 'shadow-slate-200/50 dark:shadow-slate-800/50',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  premium: {
    bg: 'from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20',
    card: 'from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    glow: 'shadow-amber-200/50 dark:shadow-amber-800/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  'verified-pro': {
    bg: 'from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/20',
    card: 'from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    glow: 'shadow-emerald-200/50 dark:shadow-emerald-800/30',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  business: {
    bg: 'from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20',
    card: 'from-white to-violet-50 dark:from-gray-900 dark:to-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/50',
    glow: 'shadow-violet-200/50 dark:shadow-violet-800/30',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  'trusted-elite': {
    bg: 'from-rose-50 to-orange-100 dark:from-rose-950/30 dark:to-orange-900/20',
    card: 'from-white to-rose-50 dark:from-gray-900 dark:to-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    glow: 'shadow-rose-200/50 dark:shadow-rose-800/30',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

function getPlanIcon(slug: string) {
  switch (slug) {
    case 'basic':
      return <Star className="h-8 w-8" />;
    case 'premium':
      return <Diamond className="h-8 w-8" />;
    case 'verified-pro':
      return <ShieldCheck className="h-8 w-8" />;
    case 'business':
      return <Building2 className="h-8 w-8" />;
    case 'trusted-elite':
      return <Crown className="h-8 w-8" />;
    default:
      return <Zap className="h-8 w-8" />;
  }
}

function getPlanGradient(slug: string) {
  return PLAN_GRADIENTS[slug] || PLAN_GRADIENTS['basic'];
}

// ─── Skeleton Loader ─────────────────────────────────────
function PlansSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 py-8">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <div className="flex justify-center pt-4">
          <Skeleton className="h-10 w-52" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="items-center text-center pb-2">
              <Skeleton className="h-16 w-16 rounded-2xl mb-2" />
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-28 mx-auto" />
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
            <CardFooter className="justify-center">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function SubscriptionPlansPage() {
  const { user } = useAppStore();
  const { toast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Subscribe dialog state
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [dialogBilling, setDialogBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionRef, setTransactionRef] = useState('');

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Auto renew toggle
  const [autoRenew, setAutoRenew] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        api.getSubscriptionPlans(),
        user ? api.getSubscriptionStatus().catch(() => ({ subscription: null, plan: null })) : Promise.resolve({ subscription: null, plan: null }),
      ]);
      setPlans(plansRes.plans || []);
      if (subRes.subscription) {
        setSubscription(subRes.subscription);
        setCurrentPlan(subRes.plan || null);
        setAutoRenew(subRes.subscription.autoRenew ?? true);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      toast({
        title: 'ত্রুটি',
        description: 'প্ল্যান তথ্য লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    if (!subscription || !currentPlan) return plan.slug === 'basic' && !subscription;
    return currentPlan.id === plan.id;
  };

  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'প্ল্যানে সাবস্ক্রাইব করতে প্রথমে লগইন করুন',
        variant: 'destructive',
      });
      return;
    }

    if (isCurrentPlan(plan)) return;

    setSelectedPlan(plan);
    setDialogBilling(billingCycle);
    setPaymentMethod('bkash');
    setTransactionRef('');
    setSubscribeDialogOpen(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    if (selectedPlan.slug === 'basic') {
      // Free plan - instant activation
      setSubscribing(true);
      try {
        await api.subscribeToPlan({
          planId: selectedPlan.id,
          billingCycle: 'monthly',
        });
        toast({
          title: 'সফল!',
          description: 'বেসিক প্ল্যান সক্রিয় করা হয়েছে',
        });
        setSubscribeDialogOpen(false);
        loadData();
      } catch (err: unknown) {
        toast({
          title: 'ত্রুটি',
          description: err instanceof Error ? err.message : 'সাবস্ক্রিপশন করতে সমস্যা হয়েছে',
          variant: 'destructive',
        });
      } finally {
        setSubscribing(false);
      }
      return;
    }

    // Paid plan - validate payment info
    if (!transactionRef.trim()) {
      toast({
        title: 'ত্রুটি',
        description: 'ট্রানজেকশন রেফারেন্স দিন',
        variant: 'destructive',
      });
      return;
    }

    setSubscribing(true);
    try {
      await api.subscribeToPlan({
        planId: selectedPlan.id,
        billingCycle: dialogBilling,
        paymentMethod,
        transactionRef: transactionRef.trim(),
      });
      toast({
        title: 'সফল!',
        description: 'সাবস্ক্রিপশন অনুরোধ জমা হয়েছে। যাচাই করার পর সক্রিয় হবে।',
      });
      setSubscribeDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      toast({
        title: 'ত্রুটি',
        description: err instanceof Error ? err.message : 'সাবস্ক্রিপশন করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelSubscription();
      toast({
        title: 'সফল',
        description: 'সাবস্ক্রিপশন বাতিল করা হয়েছে',
      });
      setCancelDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      toast({
        title: 'ত্রুটি',
        description: err instanceof Error ? err.message : 'বাতিল করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.renewSubscription();
      toast({
        title: 'সফল',
        description: 'সাবস্ক্রিপশন নবায়ন করা হয়েছে',
      });
      loadData();
    } catch (err: unknown) {
      toast({
        title: 'ত্রুটি',
        description: err instanceof Error ? err.message : 'নবায়ন করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setRenewing(false);
    }
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.monthlyPrice === 0) return 0;
    return plan.monthlyPrice * 12 - plan.yearlyPrice;
  };

  const getPrice = (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') => {
    if (plan.monthlyPrice === 0) return 'বিনামূল্যে';
    if (cycle === 'monthly') return `${formatBDT(plan.monthlyPrice)}/মাস`;
    return `${formatBDT(plan.yearlyPrice)}/বছর`;
  };

  const getActiveFeatures = (plan: SubscriptionPlan): string[] => {
    return PLAN_FEATURE_FLAGS.filter((flag) => plan[flag] === true).map(
      (flag) => FEATURE_LABELS[flag] || flag
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="সাবস্ক্রিপশন প্ল্যান"
        subtitle="আপনার প্রয়োজন অনুযায়ী সেরা প্ল্যান নির্বাচন করুন"
        backTo="dashboard"
        icon={<Crown className="h-5 w-5 text-primary" />}
      />

      {loading ? (
        <PlansSkeleton />
      ) : (
        <>
          {/* ─── Hero Section ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/5" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            {/* Decorative orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative px-4 py-8 md:px-8 md:py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4"
              >
                <Sparkles className="h-4 w-4" />
                প্রিমিয়াম সুবিধা উপভোগ করুন
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3"
              >
                আপনার প্ল্যান বেছে নিন
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-6"
              >
                আপনার প্রয়োজন অনুযায়ী সেরা প্ল্যান নির্বাচন করুন
              </motion.p>

              {/* Billing toggle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="inline-flex items-center gap-3 bg-card border rounded-full px-3 py-2 shadow-sm"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  মাসিক
                </span>
                <button
                  onClick={() =>
                    setBillingCycle((prev) =>
                      prev === 'monthly' ? 'yearly' : 'monthly'
                    )
                  }
                  className="relative"
                  aria-label="বিলিং সাইকেল পরিবর্তন"
                >
                  <div
                    className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                      billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 mt-0.5 ${
                        billingCycle === 'yearly' ? 'translate-x-6.5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>
                <span
                  className={`text-sm font-medium transition-colors ${
                    billingCycle === 'yearly'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  বার্ষিক
                </span>
                {billingCycle === 'yearly' && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs">
                    <Zap className="h-3 w-3 mr-0.5" />
                    সাশ্রয়!
                  </Badge>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* ─── Plan Cards ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
            <AnimatePresence mode="popLayout">
              {plans.map((plan, index) => {
                const gradient = getPlanGradient(plan.slug);
                const isActive = isCurrentPlan(plan);
                const isPopular = plan.slug === 'premium';
                const isRecommended = plan.slug === 'verified-pro';
                const savings = getSavings(plan);
                const features = getActiveFeatures(plan);

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.4, type: 'spring' }}
                    className="relative"
                  >
                    {/* Recommended ribbon */}
                    {isRecommended && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-b-lg shadow-lg flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          সুপারিশকৃত
                        </div>
                      </div>
                    )}

                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-4 py-1.5 rounded-b-lg shadow-lg flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" />
                          সবচেয়ে জনপ্রিয়
                        </div>
                      </div>
                    )}

                    <Card
                      className={`relative overflow-hidden transition-all duration-300 group hover:shadow-lg ${
                        isRecommended
                          ? `ring-2 ring-emerald-400 dark:ring-emerald-600 ${gradient.glow} shadow-lg`
                          : isActive
                          ? 'ring-2 ring-primary shadow-md'
                          : `hover:shadow-md ${gradient.glow}`
                      } ${isRecommended || isPopular ? 'pt-3' : ''}`}
                    >
                      {/* Gradient overlay for card top */}
                      <div
                        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${
                          plan.slug === 'basic'
                            ? 'from-slate-400 to-slate-500'
                            : plan.slug === 'premium'
                            ? 'from-amber-400 to-yellow-500'
                            : plan.slug === 'verified-pro'
                            ? 'from-emerald-400 to-teal-500'
                            : plan.slug === 'business'
                            ? 'from-violet-400 to-purple-500'
                            : 'from-rose-400 to-orange-500'
                        }`}
                      />

                      <CardHeader className="items-center text-center pb-1">
                        {/* Badge icon */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl mb-2 ${
                            plan.slug === 'basic'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : plan.slug === 'premium'
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                              : plan.slug === 'verified-pro'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : plan.slug === 'business'
                              ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {getPlanIcon(plan.slug)}
                          {/* Shimmer for premium plans */}
                          {plan.monthlyPrice > 0 && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite]" />
                          )}
                        </motion.div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                            {plan.description}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 text-center">
                        {/* Price */}
                        <div className="space-y-1">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`${plan.id}-${billingCycle}`}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-baseline justify-center gap-1"
                            >
                              <span
                                className={`text-2xl md:text-3xl font-bold ${
                                  plan.monthlyPrice === 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-foreground'
                                }`}
                              >
                                {getPrice(plan, billingCycle)}
                              </span>
                            </motion.div>
                          </AnimatePresence>

                          {billingCycle === 'yearly' && savings > 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                            >
                              {formatBDT(savings)} সাশ্রয়!
                            </motion.p>
                          )}
                        </div>

                        <Separator />

                        {/* Features */}
                        <div className="space-y-2 text-left min-h-[120px]">
                          {plan.slug !== 'basic' && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="text-foreground">স্ট্যান্ডার্ড ফিচার</span>
                            </div>
                          )}
                          {features.map((feature, fIdx) => {
                            const flagKey = PLAN_FEATURE_FLAGS.find(
                              (f) => FEATURE_LABELS[f] === feature
                            );
                            return (
                              <motion.div
                                key={fIdx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + fIdx * 0.05 }}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-foreground flex items-center gap-1.5">
                                  {flagKey && FEATURE_ICONS[flagKey] && (
                                    <span className="text-muted-foreground">
                                      {FEATURE_ICONS[flagKey]}
                                    </span>
                                  )}
                                  {feature}
                                </span>
                              </motion.div>
                            );
                          })}
                          {plan.slug === 'basic' && features.length === 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="text-foreground">স্ট্যান্ডার্ড ফিচার</span>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="flex-col gap-2">
                        {isActive ? (
                          <Button
                            variant="outline"
                            className="w-full cursor-default"
                            disabled
                          >
                            <BadgeCheck className="h-4 w-4 mr-1.5" />
                            বর্তমান প্ল্যান
                          </Button>
                        ) : (
                          <Button
                            className={`w-full group/btn relative overflow-hidden ${
                              plan.slug === 'verified-pro'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md'
                                : plan.slug === 'trusted-elite'
                                ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-md'
                                : plan.slug === 'business'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md'
                                : plan.slug === 'premium'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md'
                                : ''
                            }`}
                            onClick={() => handleSubscribeClick(plan)}
                          >
                            <span className="relative z-10 flex items-center gap-1.5">
                              {plan.monthlyPrice === 0 ? (
                                <>
                                  <Zap className="h-4 w-4" />
                                  সক্রিয় করুন
                                </>
                              ) : (
                                <>
                                  <Rocket className="h-4 w-4" />
                                  আপগ্রেড করুন
                                </>
                              )}
                            </span>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ─── Current Subscription Section ─────────── */}
          {subscription && currentPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Card className="overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        বর্তমান সাবস্ক্রিপশন
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        আপনার সক্রিয় প্ল্যানের তথ্য
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Plan info */}
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${getPlanGradient(currentPlan.slug).badge}`}
                      >
                        {getPlanIcon(currentPlan.slug)}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">প্ল্যান</p>
                        <p className="font-bold text-foreground">
                          {currentPlan.name}
                        </p>
                      </div>
                    </div>

                    {/* Billing cycle */}
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">বিলিং সাইকেল</p>
                        <p className="font-bold text-foreground">
                          {subscription.billingCycle === 'monthly'
                            ? 'মাসিক'
                            : 'বার্ষিক'}
                        </p>
                      </div>
                    </div>

                    {/* Start date */}
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">শুরুর তারিখ</p>
                        <p className="font-bold text-foreground">
                          {formatDate(subscription.startDate)}
                        </p>
                      </div>
                    </div>

                    {/* End date / Status */}
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          subscription.status === 'active'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : subscription.status === 'cancelled'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {subscription.status === 'active' ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : subscription.status === 'cancelled' ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {subscription.endDate ? 'মেয়াদোত্তীর্ণ' : 'স্ট্যাটাস'}
                        </p>
                        <p className="font-bold text-foreground">
                          {subscription.endDate
                            ? formatDate(subscription.endDate)
                            : subscription.status === 'active'
                            ? 'সক্রিয়'
                            : subscription.status === 'cancelled'
                            ? 'বাতিল'
                            : 'অপেক্ষমাণ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-5" />

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="auto-renew"
                        className="text-sm font-medium cursor-pointer"
                      >
                        স্বয়ংক্রিয় নবায়ন
                      </Label>
                      <Switch
                        id="auto-renew"
                        checked={autoRenew}
                        onCheckedChange={(checked) => {
                          setAutoRenew(checked);
                          toast({
                            title: checked ? 'স্বয়ংক্রিয় নবায়ন চালু' : 'স্বয়ংক্রিয় নবায়ন বন্ধ',
                            description: checked
                              ? 'মেয়াদ শেষে স্বয়ংক্রিয়ভাবে নবায়ন হবে'
                              : 'মেয়াদ শেষে স্বয়ংক্রিয়ভাবে নবায়ন হবে না',
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {subscription.status === 'cancelled' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleRenew}
                          disabled={renewing}
                        >
                          {renewing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                          )}
                          নবায়ন করুন
                        </Button>
                      )}
                      {subscription.status === 'active' &&
                        currentPlan.slug !== 'basic' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelDialogOpen(true)}
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            সাবস্ক্রিপশন বাতিল
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Comparison Section ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      প্ল্যান তুলনা
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      সকল প্ল্যানের ফিচার এক নজরে
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 text-muted-foreground font-medium">
                          ফিচার
                        </th>
                        {plans.map((plan) => (
                          <th
                            key={plan.id}
                            className="text-center py-3 px-2 font-medium min-w-[80px]"
                          >
                            <span className="text-foreground">{plan.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PLAN_FEATURE_FLAGS.map((flag) => (
                        <tr key={flag} className="border-b last:border-0">
                          <td className="py-2.5 pr-4 text-muted-foreground flex items-center gap-2">
                            {FEATURE_ICONS[flag] && (
                              <span className="shrink-0">
                                {FEATURE_ICONS[flag]}
                              </span>
                            )}
                            {FEATURE_LABELS[flag]}
                          </td>
                          {plans.map((plan) => (
                            <td key={plan.id} className="text-center py-2.5 px-2">
                              {plan[flag] ? (
                                <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* ─── Subscribe Dialog ──────────────────────────── */}
      <Dialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlan && (
                <>
                  <span
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${getPlanGradient(selectedPlan.slug).badge}`}
                  >
                    {getPlanIcon(selectedPlan.slug)}
                  </span>
                  {selectedPlan.name} প্ল্যান
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.monthlyPrice === 0
                ? 'বিনামূল্যে বেসিক প্ল্যান সক্রিয় করুন'
                : 'পেমেন্ট তথ্য দিয়ে সাবস্ক্রিপশন সম্পন্ন করুন'}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5">
              {/* Plan summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">প্ল্যান</span>
                  <span className="font-medium text-foreground">
                    {selectedPlan.name}
                  </span>
                </div>
                <Separator />
                {/* Billing cycle selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">বিলিং সাইকেল</Label>
                  <RadioGroup
                    value={dialogBilling}
                    onValueChange={(v) =>
                      setDialogBilling(v as 'monthly' | 'yearly')
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="dialog-monthly"
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        dialogBilling === 'monthly'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="monthly" id="dialog-monthly" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">মাসিক</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlan.monthlyPrice === 0
                            ? 'বিনামূল্যে'
                            : formatBDT(selectedPlan.monthlyPrice)}
                          /মাস
                        </p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="dialog-yearly"
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        dialogBilling === 'yearly'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="yearly" id="dialog-yearly" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">বার্ষিক</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlan.yearlyPrice === 0
                            ? 'বিনামূল্যে'
                            : formatBDT(selectedPlan.yearlyPrice)}
                          /বছর
                        </p>
                      </div>
                    </Label>
                  </RadioGroup>
                  {dialogBilling === 'yearly' && getSavings(selectedPlan) > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      {formatBDT(getSavings(selectedPlan))} সাশ্রয়!
                    </p>
                  )}
                </div>
              </div>

              {/* Payment method - only for paid plans */}
              {selectedPlan.monthlyPrice > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">পেমেন্ট পদ্ধতি</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      {
                        value: 'bkash',
                        label: 'বিকাশ',
                        color: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
                      },
                      {
                        value: 'nagad',
                        label: 'নগদ',
                        color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                      },
                      {
                        value: 'rocket',
                        label: 'রকেট',
                        color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                      },
                      {
                        value: 'bank',
                        label: 'ব্যাংক',
                        color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
                      },
                    ].map((method) => (
                      <Label
                        key={method.value}
                        htmlFor={`pay-${method.value}`}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === method.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem
                          value={method.value}
                          id={`pay-${method.value}`}
                        />
                        <span
                          className={`text-sm font-medium px-2 py-0.5 rounded-md ${method.color}`}
                        >
                          {method.label}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>

                  {/* Transaction reference */}
                  <div className="space-y-2">
                    <Label htmlFor="txn-ref" className="text-sm font-medium">
                      ট্রানজেকশন রেফারেন্স
                    </Label>
                    <Input
                      id="txn-ref"
                      placeholder="যেমন: TXN123456789"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      পেমেন্ট পাঠানোর পর ট্রানজেকশন আইডি এখানে দিন
                    </p>
                  </div>
                </div>
              )}

              {/* Total amount */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">মোট পরিমাণ</p>
                <p className="text-2xl font-bold text-foreground">
                  {getPrice(selectedPlan, dialogBilling)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  প্রক্রিয়াধীন...
                </>
              ) : selectedPlan?.monthlyPrice === 0 ? (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  সক্রিয় করুন
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-1.5" />
                  সাবস্ক্রাইব করুন
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setSubscribeDialogOpen(false)}
            >
              বাতিল
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Confirmation Dialog ────────────────── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              সাবস্ক্রিপশন বাতিল করুন?
            </AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি আপনার সাবস্ক্রিপশন বাতিল করতে চান?
              বাতিল করলে মেয়াদ শেষ হওয়ার পর আপনি প্রিমিয়াম সুবিধাগুলো হারাবেন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              ফিরে যান
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  বাতিল হচ্ছে...
                </>
              ) : (
                'বাতিল করুন'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
