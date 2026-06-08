'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  Search,
  Eye,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { formatBDT, formatDate, toBanglaNumber } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import { BadgeIcon } from '@/components/shared/BadgeIcon';
import type { SubscriptionPlan, UserSubscription } from '@/lib/types';

// ─── Plan Form Data ──────────────────────────────────────────
interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  sortOrder: number;
  priorityListing: boolean;
  premiumProfile: boolean;
  featuredProfile: boolean;
  higherDealLimits: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customProfileBanner: boolean;
  featuredSellerStatus: boolean;
  featuredBuyerStatus: boolean;
  fasterDisputeResolution: boolean;
  profileVerification: boolean;
  vipSupport: boolean;
  maximumVisibility: boolean;
  exclusiveFeatures: boolean;
}

const EMPTY_PLAN_FORM: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  badgeIcon: 'star',
  badgeColor: '#6B7280',
  monthlyPrice: 0,
  yearlyPrice: 0,
  isActive: true,
  sortOrder: 0,
  priorityListing: false,
  premiumProfile: false,
  featuredProfile: false,
  higherDealLimits: false,
  prioritySupport: false,
  advancedAnalytics: false,
  customProfileBanner: false,
  featuredSellerStatus: false,
  featuredBuyerStatus: false,
  fasterDisputeResolution: false,
  profileVerification: false,
  vipSupport: false,
  maximumVisibility: false,
  exclusiveFeatures: false,
};

const STATUS_LABELS: Record<string, string> = {
  active: 'সক্রিয়',
  expired: 'মেয়াদোত্তীর্ণ',
  cancelled: 'বাতিল',
  pending: 'অপেক্ষমাণ',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  expired: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  cancelled: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  pending: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
  cancelled: <Ban className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
};

const FEATURE_LABELS: Record<string, string> = {
  priorityListing: 'অগ্রাধিকার তালিকাভুক্তি',
  premiumProfile: 'প্রিমিয়াম প্রোফাইল',
  featuredProfile: 'ফিচার্ড প্রোফাইল',
  higherDealLimits: 'উচ্চতর ডিল সীমা',
  prioritySupport: 'অগ্রাধিকার সহায়তা',
  advancedAnalytics: 'উন্নত বিশ্লেষণ',
  customProfileBanner: 'কাস্টম প্রোফাইল ব্যানার',
  featuredSellerStatus: 'ফিচার্ড বিক্রেতা স্ট্যাটাস',
  featuredBuyerStatus: 'ফিচার্ড ক্রেতা স্ট্যাটাস',
  fasterDisputeResolution: 'দ্রুত বিরোধ সমাধান',
  profileVerification: 'প্রোফাইল ভেরিফিকেশন',
  vipSupport: 'ভিআইপি সহায়তা',
  maximumVisibility: 'সর্বোচ্চ দৃশ্যমানতা',
  exclusiveFeatures: 'এক্সক্লুসিভ ফিচার',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Subscription Detail Dialog ──────────────────────────────
function SubscriptionDetailDialog({
  subscription,
  open,
  onClose,
}: {
  subscription: UserSubscription | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>সাবস্ক্রিপশন বিস্তারিত</DialogTitle>
          <DialogDescription>ব্যবহারকারীর সাবস্ক্রিপশন তথ্য</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* User Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">ব্যবহারকারী</p>
            <p className="font-semibold">{subscription.user?.name || 'অজানা'}</p>
            <p className="text-sm text-muted-foreground">{subscription.user?.email || ''}</p>
          </div>

          {/* Plan Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">প্ল্যান</p>
              {subscription.plan && <BadgeDisplay plan={subscription.plan} size="sm" />}
            </div>
            <p className="font-semibold">{subscription.plan?.name || 'অজানা প্ল্যান'}</p>
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">বিলিং সাইকেল</p>
              <p className="font-medium text-sm mt-0.5">
                {subscription.billingCycle === 'monthly' ? 'মাসিক' : 'বার্ষিক'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
              <Badge variant="outline" className={`mt-0.5 ${STATUS_COLORS[subscription.status] || ''}`}>
                {STATUS_ICONS[subscription.status]}
                <span className="ml-1">{STATUS_LABELS[subscription.status] || subscription.status}</span>
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">শুরু তারিখ</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(subscription.startDate)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">মেয়াদ শেষ</p>
              <p className="font-medium text-sm mt-0.5">
                {subscription.endDate ? formatDate(subscription.endDate) : 'সীমাহীন'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">স্বয়ংক্রিয় নবায়ন</p>
              <p className="font-medium text-sm mt-0.5">
                {subscription.autoRenew ? 'হ্যাঁ' : 'না'}
              </p>
            </div>
            {subscription.cancelledAt && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">বাতিলের তারিখ</p>
                <p className="font-medium text-sm mt-0.5">{formatDate(subscription.cancelledAt)}</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>বন্ধ করুন</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const { toast } = useToast();

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>({ ...EMPTY_PLAN_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle processing
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Subscription detail dialog
  const [detailSub, setDetailSub] = useState<UserSubscription | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ─── Fetch Plans ──────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const data = await api.getSubscriptionPlans();
      const list: SubscriptionPlan[] = data.plans || data || [];
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setPlans(list);
    } catch (err) {
      setPlansError('প্ল্যান তালিকা লোড করতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ─── Fetch Subscriptions ──────────────────────────────────
  const fetchSubscriptions = useCallback(async (status?: string) => {
    try {
      setSubsLoading(true);
      setSubsError(null);
      const data = await api.getAdminSubscriptions(status && status !== 'all' ? status : undefined);
      const list: UserSubscription[] = data.subscriptions || data || [];
      setSubscriptions(list);
    } catch (err) {
      setSubsError('সাবস্ক্রিপশন তালিকা লোড করতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [fetchPlans, fetchSubscriptions]);

  // ─── Filter Subscriptions ──────────────────────────────────
  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.user?.name?.toLowerCase().includes(q) ||
          s.user?.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [subscriptions, searchQuery]);

  // ─── Plan Dialog Helpers ──────────────────────────────────
  function openAddPlanDialog() {
    setEditingPlan(null);
    setPlanForm({
      ...EMPTY_PLAN_FORM,
      sortOrder: plans.length > 0 ? Math.max(...plans.map((p) => p.sortOrder)) + 1 : 0,
    });
    setSlugManuallyEdited(false);
    setPlanDialogOpen(true);
  }

  function openEditPlanDialog(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      badgeIcon: plan.badgeIcon || 'star',
      badgeColor: plan.badgeColor || '#6B7280',
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      priorityListing: plan.priorityListing,
      premiumProfile: plan.premiumProfile,
      featuredProfile: plan.featuredProfile,
      higherDealLimits: plan.higherDealLimits,
      prioritySupport: plan.prioritySupport,
      advancedAnalytics: plan.advancedAnalytics,
      customProfileBanner: plan.customProfileBanner,
      featuredSellerStatus: plan.featuredSellerStatus,
      featuredBuyerStatus: plan.featuredBuyerStatus,
      fasterDisputeResolution: plan.fasterDisputeResolution,
      profileVerification: plan.profileVerification,
      vipSupport: plan.vipSupport,
      maximumVisibility: plan.maximumVisibility,
      exclusiveFeatures: plan.exclusiveFeatures,
    });
    setSlugManuallyEdited(true);
    setPlanDialogOpen(true);
  }

  function handleNameChange(name: string) {
    setPlanForm((prev) => {
      const updated = { ...prev, name };
      if (!slugManuallyEdited) {
        updated.slug = slugify(name);
      }
      return updated;
    });
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setPlanForm((prev) => ({ ...prev, slug }));
  }

  async function handlePlanSubmit() {
    if (!planForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'প্ল্যানের নাম আবশ্যক', variant: 'destructive' });
      return;
    }
    if (!planForm.slug.trim()) {
      toast({ title: 'ত্রুটি', description: 'স্লাগ আবশ্যক', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        name: planForm.name.trim(),
        slug: planForm.slug.trim(),
        description: planForm.description.trim(),
        badgeIcon: planForm.badgeIcon,
        badgeColor: planForm.badgeColor,
        monthlyPrice: planForm.monthlyPrice,
        yearlyPrice: planForm.yearlyPrice,
        isActive: planForm.isActive,
        sortOrder: planForm.sortOrder,
        priorityListing: planForm.priorityListing,
        premiumProfile: planForm.premiumProfile,
        featuredProfile: planForm.featuredProfile,
        higherDealLimits: planForm.higherDealLimits,
        prioritySupport: planForm.prioritySupport,
        advancedAnalytics: planForm.advancedAnalytics,
        customProfileBanner: planForm.customProfileBanner,
        featuredSellerStatus: planForm.featuredSellerStatus,
        featuredBuyerStatus: planForm.featuredBuyerStatus,
        fasterDisputeResolution: planForm.fasterDisputeResolution,
        profileVerification: planForm.profileVerification,
        vipSupport: planForm.vipSupport,
        maximumVisibility: planForm.maximumVisibility,
        exclusiveFeatures: planForm.exclusiveFeatures,
      };

      if (editingPlan) {
        await api.updateSubscriptionPlan(editingPlan.id, payload);
        toast({ title: 'সফল!', description: 'প্ল্যান আপডেট হয়েছে' });
      } else {
        await api.createSubscriptionPlan(payload);
        toast({ title: 'সফল!', description: 'নতুন প্ল্যান যোগ হয়েছে' });
      }
      setPlanDialogOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'প্ল্যান সংরক্ষণ করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Toggle Plan Active ──────────────────────────────────
  async function handleToggleActive(plan: SubscriptionPlan) {
    const newActive = !plan.isActive;
    try {
      setTogglingId(plan.id);
      await api.updateSubscriptionPlan(plan.id, { isActive: newActive });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: newActive } : p))
      );
      toast({
        title: 'সফল!',
        description: newActive ? 'প্ল্যান সক্রিয় করা হয়েছে' : 'প্ল্যান নিষ্ক্রিয় করা হয়েছে',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  }

  // ─── Delete Plan ──────────────────────────────────────────
  function openDeleteDialog(plan: SubscriptionPlan) {
    setDeletingPlan(plan);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingPlan) return;
    try {
      setDeleting(true);
      await api.deleteSubscriptionPlan(deletingPlan.id);
      setPlans((prev) => prev.filter((p) => p.id !== deletingPlan.id));
      toast({ title: 'সফল!', description: 'প্ল্যান মুছে ফেলা হয়েছে' });
      setDeleteDialogOpen(false);
      setDeletingPlan(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'প্ল্যান মুছতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  // ─── View Subscription Detail ──────────────────────────────
  function handleViewSubscription(sub: UserSubscription) {
    setDetailSub(sub);
    setDetailOpen(true);
  }

  // ─── Feature toggle helper ────────────────────────────────
  function toggleFeature(key: keyof PlanFormData) {
    setPlanForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="সাবস্ক্রিপশন ব্যবস্থাপনা"
        subtitle="সাবস্ক্রিপশন প্ল্যান এবং গ্রাহকদের পরিচালনা করুন"
        icon={<CreditCard className="h-5 w-5 text-primary" />}
      />

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans" className="gap-1.5">
            <Crown className="h-4 w-4" />
            প্ল্যান ব্যবস্থাপনা
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1.5">
            <Users className="h-4 w-4" />
            গ্রাহক তালিকা
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════
            PLANS TAB
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddPlanDialog}>
              <Plus className="mr-2 h-4 w-4" />
              নতুন প্ল্যান যোগ করুন
            </Button>
          </div>

          {plansLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="card-modern animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plansError ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{plansError}</p>
                <Button variant="outline" className="mt-4" onClick={fetchPlans}>
                  আবার চেষ্টা করুন
                </Button>
              </CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <Crown className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">কোনো সাবস্ক্রিপশন প্ল্যান পাওয়া যায়নি</p>
                <Button variant="outline" className="mt-4" onClick={openAddPlanDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  নতুন প্ল্যান যোগ করুন
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-modern overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  মোট প্ল্যান: {toBanglaNumber(plans.length)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ব্যাজ</TableHead>
                        <TableHead>নাম</TableHead>
                        <TableHead>মাসিক মূল্য</TableHead>
                        <TableHead>বার্ষিক মূল্য</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead>গ্রাহক</TableHead>
                        <TableHead className="text-right">কার্যক্রম</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                          <TableCell>
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-lg"
                              style={{
                                backgroundColor: plan.badgeColor + '20',
                                color: plan.badgeColor,
                              }}
                            >
                              <BadgeIcon icon={plan.badgeIcon || 'star'} size="md" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{plan.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {plan.monthlyPrice === 0 ? (
                              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                বিনামূল্যে
                              </Badge>
                            ) : (
                              formatBDT(plan.monthlyPrice)
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {plan.yearlyPrice === 0 ? (
                              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                বিনামূল্যে
                              </Badge>
                            ) : (
                              formatBDT(plan.yearlyPrice)
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={plan.isActive}
                                onCheckedChange={() => handleToggleActive(plan)}
                                disabled={togglingId === plan.id}
                              />
                              <Badge
                                variant="outline"
                                className={
                                  plan.isActive
                                    ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                    : 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                }
                              >
                                {plan.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{toBanglaNumber(plan.subscriberCount ?? 0)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditPlanDialog(plan)}
                                title="সম্পাদনা"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => openDeleteDialog(plan)}
                                title="মুছুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            SUBSCRIBERS TAB
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="subscribers" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); fetchSubscriptions(val); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল</SelectItem>
                <SelectItem value="active">সক্রিয়</SelectItem>
                <SelectItem value="expired">মেয়াদোত্তীর্ণ</SelectItem>
                <SelectItem value="cancelled">বাতিল</SelectItem>
                <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {subsLoading ? (
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : subsError ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{subsError}</p>
                <Button variant="outline" className="mt-4" onClick={() => fetchSubscriptions(statusFilter)}>
                  আবার চেষ্টা করুন
                </Button>
              </CardContent>
            </Card>
          ) : filteredSubscriptions.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">কোনো সাবস্ক্রিপশন পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-modern overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  মোট সাবস্ক্রিপশন: {toBanglaNumber(filteredSubscriptions.length)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ব্যবহারকারী</TableHead>
                        <TableHead>প্ল্যান</TableHead>
                        <TableHead>বিলিং</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead>শুরু</TableHead>
                        <TableHead>মেয়াদ শেষ</TableHead>
                        <TableHead className="text-right">দেখুন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{sub.user?.name || 'অজানা'}</p>
                              <p className="text-xs text-muted-foreground">{sub.user?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.plan ? (
                              <BadgeDisplay plan={sub.plan} size="sm" />
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {sub.billingCycle === 'monthly' ? 'মাসিক' : 'বার্ষিক'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${STATUS_COLORS[sub.status] || ''}`}>
                              {STATUS_ICONS[sub.status]}
                              <span>{STATUS_LABELS[sub.status] || sub.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(sub.startDate)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.endDate ? formatDate(sub.endDate) : 'সীমাহীন'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewSubscription(sub)}
                              title="বিস্তারিত দেখুন"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Plan Create/Edit Dialog ─────────────────────────── */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'প্ল্যান সম্পাদনা' : 'নতুন প্ল্যান যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'সাবস্ক্রিপশন প্ল্যানের তথ্য আপডেট করুন'
                : 'নতুন সাবস্ক্রিপশন প্ল্যান যোগ করতে নিচের ফর্ম পূরণ করুন'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-5 py-2">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  মৌলিক তথ্য
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">
                      প্ল্যানের নাম <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="plan-name"
                      placeholder="যেমন: Premium, Business"
                      value={planForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-slug">
                      স্লাগ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="plan-slug"
                      placeholder="auto-generated-from-name"
                      value={planForm.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-description">বিবরণ</Label>
                  <Textarea
                    id="plan-description"
                    placeholder="প্ল্যানের বিবরণ লিখুন..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  মূল্য নির্ধারণ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-monthly-price">মাসিক মূল্য (৳)</Label>
                    <Input
                      id="plan-monthly-price"
                      type="number"
                      min={0}
                      value={planForm.monthlyPrice}
                      onChange={(e) =>
                        setPlanForm((prev) => ({ ...prev, monthlyPrice: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-yearly-price">বার্ষিক মূল্য (৳)</Label>
                    <Input
                      id="plan-yearly-price"
                      type="number"
                      min={0}
                      value={planForm.yearlyPrice}
                      onChange={(e) =>
                        setPlanForm((prev) => ({ ...prev, yearlyPrice: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Badge & Appearance */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  ব্যাজ এবং চেহারা
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-badge-icon">ব্যাজ আইকন</Label>
                    <Input
                      id="plan-badge-icon"
                      placeholder="star, diamond, crown..."
                      value={planForm.badgeIcon}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, badgeIcon: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-badge-color">ব্যাজ রং</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={planForm.badgeColor}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={planForm.badgeColor}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                        className="font-mono text-xs h-8"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-sort-order">ক্রম</Label>
                    <Input
                      id="plan-sort-order"
                      type="number"
                      min={0}
                      value={planForm.sortOrder}
                      onChange={(e) =>
                        setPlanForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                  <span className="text-sm text-muted-foreground">ব্যাজ প্রিভিউ:</span>
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor: planForm.badgeColor + '20',
                      color: planForm.badgeColor,
                      border: `1px solid ${planForm.badgeColor}40`,
                    }}
                  >
                    <BadgeIcon icon={planForm.badgeIcon || 'star'} size="md" />
                    <span>{planForm.name || 'প্ল্যানের নাম'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>প্ল্যান স্ট্যাটাস</Label>
                  <p className="text-xs text-muted-foreground">
                    {planForm.isActive ? 'প্ল্যান বর্তমানে সক্রিয় এবং ক্রয়যোগ্য' : 'প্ল্যান বর্তমানে নিষ্ক্রিয়'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {planForm.isActive ? (
                    <Power className="h-4 w-4 text-green-600" />
                  ) : (
                    <PowerOff className="h-4 w-4 text-red-500" />
                  )}
                  <Switch
                    checked={planForm.isActive}
                    onCheckedChange={(checked) => setPlanForm((prev) => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Feature Flags */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  প্ল্যান ফিচারসমূহ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(FEATURE_LABELS) as Array<keyof typeof FEATURE_LABELS>).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleFeature(key)}
                    >
                      <div className="flex items-center gap-2">
                        {planForm[key] ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                        <span className="text-sm">{FEATURE_LABELS[key]}</span>
                      </div>
                      <Switch
                        checked={planForm[key] as boolean}
                        onCheckedChange={() => toggleFeature(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={submitting}>
              বাতিল
            </Button>
            <Button onClick={handlePlanSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : editingPlan ? (
                'আপডেট করুন'
              ) : (
                'যোগ করুন'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ──────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>প্ল্যান মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি <strong>&quot;{deletingPlan?.name}&quot;</strong> প্ল্যানটি মুছে
              ফেলতে চান? সক্রিয় সাবস্ক্রিপশন থাকলে প্ল্যান মুছে ফেলা যাবে না। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  মুছছে...
                </>
              ) : (
                'মুছে ফেলুন'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Subscription Detail Dialog ───────────────────────── */}
      <SubscriptionDetailDialog
        subscription={detailSub}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
