'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Award,
  Search,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Sparkles,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { toBanglaNumber, getInitials } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import BadgeDisplay, { getPlanBadgeStyle } from '@/components/shared/BadgeDisplay';
import { BadgeIcon } from '@/components/shared/BadgeIcon';
import type { SubscriptionPlan, AppUser } from '@/lib/types';

// ─── Badge Overview Card ─────────────────────────────────────
function BadgePlanCard({ plan }: { plan: SubscriptionPlan }) {
  return (
    <Card className="card-modern overflow-hidden group hover:shadow-md transition-shadow">
      {/* Color accent bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: plan.badgeColor }}
      />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Badge Icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundColor: plan.badgeColor + '20',
              color: plan.badgeColor,
              border: `1px solid ${plan.badgeColor}30`,
            }}
          >
            <BadgeIcon icon={plan.badgeIcon || 'star'} size="lg" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{plan.name}</h3>
              {plan.isActive ? (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-[10px] px-1.5">
                  সক্রিয়
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-[10px] px-1.5">
                  নিষ্ক্রিয়
                </Badge>
              )}
            </div>

            {/* Color swatch */}
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: plan.badgeColor, borderColor: plan.badgeColor }}
              />
              <span className="text-xs text-muted-foreground font-mono">{plan.badgeColor}</span>
            </div>

            {/* Subscriber Count */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{toBanglaNumber(plan.subscriberCount ?? 0)} গ্রাহক</span>
            </div>

            {/* Visual Badge Preview */}
            <div className="pt-1">
              <BadgeDisplay plan={plan} size="md" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── User Search Result Row ──────────────────────────────────
function UserRow({
  user,
  plans,
  onAssign,
  onRevoke,
  processing,
}: {
  user: AppUser;
  plans: SubscriptionPlan[];
  onAssign: (userId: string, planId: string) => void;
  onRevoke: (userId: string, planId: string) => void;
  processing: string | null;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'assign' | 'revoke'>('assign');
  const isProcessing = processing === user.id;

  const currentPlan = user.currentPlan || null;

  function handleAction(action: 'assign' | 'revoke') {
    if (action === 'assign' && !selectedPlanId) return;
    setConfirmAction(action);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (confirmAction === 'assign' && selectedPlanId) {
      onAssign(user.id, selectedPlanId);
    } else if (confirmAction === 'revoke' && currentPlan) {
      onRevoke(user.id, currentPlan.id);
    }
    setConfirmOpen(false);
  }

  // Filter out free plan and only show paid plans for assignment
  const assignablePlans = plans.filter((p) => p.slug !== 'basic' && p.isActive);
  // Can revoke only if user has a non-basic plan
  const canRevoke = currentPlan && currentPlan.slug !== 'basic';

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{user.name}</p>
              {currentPlan && <BadgeDisplay plan={currentPlan} size="sm" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assign Badge */}
          <div className="flex items-center gap-2">
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="প্ল্যান নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {assignablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <span className="flex items-center gap-1.5">
                      <BadgeIcon icon={plan.badgeIcon} size="sm" />
                      <span>{plan.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              disabled={!selectedPlanId || isProcessing}
              onClick={() => handleAction('assign')}
            >
              {isProcessing && confirmAction === 'assign' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Shield className="h-3 w-3" />
              )}
              প্রদান
            </Button>
          </div>

          {/* Revoke Badge */}
          {canRevoke && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
              disabled={isProcessing}
              onClick={() => handleAction('revoke')}
            >
              {isProcessing && confirmAction === 'revoke' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldX className="h-3 w-3" />
              )}
              বাতিল
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'assign' ? 'ব্যাজ প্রদান করুন' : 'ব্যাজ বাতিল করুন'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'assign' ? (
                <>
                  আপনি কি নিশ্চিত যে <strong>&quot;{user.name}&quot;</strong>-কে{' '}
                  <strong>&quot;{plans.find((p) => p.id === selectedPlanId)?.name}&quot;</strong> ব্যাজ প্রদান করতে চান?
                </>
              ) : (
                <>
                  আপনি কি নিশ্চিত যে <strong>&quot;{user.name}&quot;</strong>-এর{' '}
                  <strong>&quot;{currentPlan?.name}&quot;</strong> ব্যাজ বাতিল করতে চান?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction === 'revoke'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {confirmAction === 'assign' ? 'ব্যাজ প্রদান করুন' : 'ব্যাজ বাতিল করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Bulk Assignment Row ─────────────────────────────────────
function BulkAssignRow({
  plans,
  onBulkAssign,
  loading,
}: {
  plans: SubscriptionPlan[];
  onBulkAssign: (userIds: string[], planId: string) => void;
  loading: boolean;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [userIdsInput, setUserIdsInput] = useState<string>('');

  function handleBulk() {
    if (!selectedPlanId || !userIdsInput.trim()) return;
    const ids = userIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    onBulkAssign(ids, selectedPlanId);
  }

  const assignablePlans = plans.filter((p) => p.slug !== 'basic' && p.isActive);

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          দ্রুত ব্যাজ প্রদান
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          একাধিক ব্যবহারকারীকে একসাথে ব্যাজ প্রদান করুন। ব্যবহারকারী আইডি কমা দিয়ে আলাদা করুন।
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="bulk-user-ids" className="text-xs">ব্যবহারকারী আইডি</Label>
            <Input
              id="bulk-user-ids"
              placeholder="user-id-1, user-id-2, user-id-3"
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="w-full sm:w-[180px]">
            <Label className="text-xs">প্ল্যান নির্বাচন</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="প্ল্যান" />
              </SelectTrigger>
              <SelectContent>
                {assignablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <span className="flex items-center gap-1.5">
                      <BadgeIcon icon={plan.badgeIcon} size="sm" />
                      <span>{plan.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleBulk}
              disabled={!selectedPlanId || !userIdsInput.trim() || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              ব্যাজ প্রদান
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminBadgesPage() {
  const { toast } = useToast();

  // Badge plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Processing state
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ─── Fetch Badge Overview ─────────────────────────────────
  const fetchBadges = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const data = await api.getAdminBadges();
      const list: SubscriptionPlan[] = data.plans || data || [];
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setPlans(list);
    } catch (err) {
      setPlansError('ব্যাজ তথ্য লোড করতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ─── Fetch Users ──────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await api.getAdminUsers();
      const list: AppUser[] = data.users || data || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    fetchUsers();
  }, [fetchBadges, fetchUsers]);

  // ─── Filter Users ─────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [users, searchQuery]);

  // ─── Assign Badge ─────────────────────────────────────────
  async function handleAssignBadge(userId: string, planId: string) {
    try {
      setProcessingUserId(userId);
      await api.assignBadge(userId, planId);
      // Update user's current plan in local state
      const assignedPlan = plans.find((p) => p.id === planId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, currentPlan: assignedPlan } : u
        )
      );
      // Update plan subscriber count
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, subscriberCount: (p.subscriberCount ?? 0) + 1 }
            : p
        )
      );
      toast({ title: 'সফল!', description: 'ব্যাজ সফলভাবে প্রদান করা হয়েছে' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ব্যাজ প্রদান করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  }

  // ─── Revoke Badge ─────────────────────────────────────────
  async function handleRevokeBadge(userId: string, planId: string) {
    try {
      setProcessingUserId(userId);
      await api.revokeBadge(userId, planId);
      // Remove user's current plan
      const revokedPlan = plans.find((p) => p.id === planId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, currentPlan: undefined } : u
        )
      );
      // Update plan subscriber count
      if (revokedPlan) {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planId
              ? { ...p, subscriberCount: Math.max(0, (p.subscriberCount ?? 0) - 1) }
              : p
          )
        );
      }
      toast({ title: 'সফল!', description: 'ব্যাজ সফলভাবে বাতিল করা হয়েছে' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ব্যাজ বাতিল করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  }

  // ─── Bulk Assign ──────────────────────────────────────────
  async function handleBulkAssign(userIds: string[], planId: string) {
    try {
      setBulkLoading(true);
      let successCount = 0;
      let failCount = 0;
      for (const userId of userIds) {
        try {
          await api.assignBadge(userId, planId);
          successCount++;
        } catch {
          failCount++;
        }
      }
      // Refresh data
      fetchBadges();
      fetchUsers();
      toast({
        title: 'বাল্ক অপারেশন সম্পন্ন',
        description: `${toBanglaNumber(successCount)} জনকে ব্যাজ প্রদান করা হয়েছে${failCount > 0 ? `, ${toBanglaNumber(failCount)} জনে ব্যর্থ` : ''}`,
        variant: failCount > 0 ? 'destructive' : undefined,
      });
    } finally {
      setBulkLoading(false);
    }
  }

  // ─── Stats ────────────────────────────────────────────────
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscriberCount ?? 0), 0);
  const activePlans = plans.filter((p) => p.isActive).length;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="ব্যাজ ব্যবস্থাপনা"
        subtitle="ব্যবহারকারীদের ব্যাজ প্রদান এবং পরিচালনা করুন"
        icon={<Award className="h-5 w-5 text-primary" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{toBanglaNumber(plans.length)}</p>
                <p className="text-xs text-muted-foreground">মোট প্ল্যান</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{toBanglaNumber(activePlans)}</p>
                <p className="text-xs text-muted-foreground">সক্রিয় প্ল্যান</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{toBanglaNumber(totalSubscribers)}</p>
                <p className="text-xs text-muted-foreground">মোট গ্রাহক</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <Award className="h-4 w-4" />
            ব্যাজ ওভারভিউ
          </TabsTrigger>
          <TabsTrigger value="assign" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            ব্যাজ প্রদান
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-1.5">
            <Shield className="h-4 w-4" />
            দ্রুত ব্যবস্থাপনা
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════
            BADGE OVERVIEW TAB
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          {plansLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="card-modern animate-pulse">
                  <div className="h-2 w-full bg-muted rounded-t-lg" />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
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
                <Button variant="outline" className="mt-4" onClick={fetchBadges}>
                  আবার চেষ্টা করুন
                </Button>
              </CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <Award className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">কোনো ব্যাজ প্ল্যান পাওয়া যায়নি</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <BadgePlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            BADGE ASSIGNMENT TAB
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="assign" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="নাম, ইমেইল বা ইউজারনেম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="card-modern animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'কোনো ব্যবহারকারী পাওয়া যায়নি' : 'ব্যবহারকারী তালিকা লোড হচ্ছে...'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  plans={plans}
                  onAssign={handleAssignBadge}
                  onRevoke={handleRevokeBadge}
                  processing={processingUserId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            BADGE MANAGEMENT TAB (Quick Actions + Bulk)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="manage" className="space-y-4">
          {/* Bulk Assignment */}
          <BulkAssignRow plans={plans} onBulkAssign={handleBulkAssign} loading={bulkLoading} />

          {/* Quick Badge Overview Table */}
          <Card className="card-modern overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">প্ল্যান অনুযায়ী গ্রাহক সংখ্যা</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ব্যাজ</TableHead>
                      <TableHead>প্ল্যান</TableHead>
                      <TableHead>রং</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>গ্রাহক</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
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
                            <p className="font-medium text-sm">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.description?.slice(0, 50) || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: plan.badgeColor, borderColor: plan.badgeColor }}
                            />
                            <span className="text-xs font-mono text-muted-foreground">{plan.badgeColor}</span>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{toBanglaNumber(plan.subscriberCount ?? 0)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users with Badges */}
          <Card className="card-modern overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                ব্যাজধারী ব্যবহারকারী
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ব্যবহারকারী</TableHead>
                        <TableHead>ইমেইল</TableHead>
                        <TableHead>বর্তমান ব্যাজ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter((u) => u.currentPlan && u.currentPlan.slug !== 'basic')
                        .slice(0, 30)
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={user.avatar} alt={user.name} />
                                  <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              {user.currentPlan && (
                                <BadgeDisplay plan={user.currentPlan} size="sm" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {users.filter((u) => u.currentPlan && u.currentPlan.slug !== 'basic').length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      কোনো ব্যাজধারী ব্যবহারকারী নেই
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
