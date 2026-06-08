'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Upload,
  Power,
  PowerOff,
  Phone,
  Building2,
  CreditCard,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatBDT } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import type { PaymentGateway } from '@/lib/types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  personal: 'পার্সোনাল',
  merchant: 'মার্চেন্ট',
  bank: 'ব্যাংক',
};

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  personal: <Phone className="h-3.5 w-3.5" />,
  merchant: <CreditCard className="h-3.5 w-3.5" />,
  bank: <Building2 className="h-3.5 w-3.5" />,
};

function maskAccountNumber(accNum: string): string {
  if (!accNum) return '';
  if (accNum.length <= 4) return accNum;
  const visible = accNum.slice(-4);
  const masked = '•'.repeat(Math.min(accNum.length - 4, 6));
  return `${masked}${visible}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface GatewayFormData {
  name: string;
  slug: string;
  logo: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  minDeposit: number;
  maxDeposit: number;
  isActive: boolean;
  sortOrder: number;
  themeEnabled: boolean;
  primaryColor: string;
  buttonColor: string;
  borderColor: string;
  backgroundColor: string;
}

const EMPTY_FORM: GatewayFormData = {
  name: '',
  slug: '',
  logo: '',
  accountType: 'personal',
  accountNumber: '',
  accountName: '',
  instructions: '',
  minDeposit: 0,
  maxDeposit: 999999,
  isActive: true,
  sortOrder: 0,
  themeEnabled: true,
  primaryColor: '#6BBF59',
  buttonColor: '#6BBF59',
  borderColor: '#6BBF59',
  backgroundColor: '#f0f7ee',
};

export default function AdminGatewaysPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [form, setForm] = useState<GatewayFormData>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGateway, setDeletingGateway] = useState<PaymentGateway | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle processing
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Reorder processing
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const fetchGateways = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminGateways();
      const list: PaymentGateway[] = data.gateways || data || [];
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setGateways(list);
    } catch (err) {
      setError('গেটওয়ে তালিকা লোড করতে সমস্যা হয়েছে');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  // ─── Dialog helpers ───────────────────────────────────────────

  function openAddDialog() {
    setEditingGateway(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: gateways.length > 0 ? Math.max(...gateways.map((g) => g.sortOrder)) + 1 : 0,
    });
    setSlugManuallyEdited(false);
    setDialogOpen(true);
  }

  function openEditDialog(gateway: PaymentGateway) {
    setEditingGateway(gateway);
    setForm({
      name: gateway.name,
      slug: gateway.slug,
      logo: gateway.logo || '',
      accountType: gateway.accountType,
      accountNumber: gateway.accountNumber,
      accountName: gateway.accountName,
      instructions: gateway.instructions || '',
      minDeposit: gateway.minDeposit,
      maxDeposit: gateway.maxDeposit,
      isActive: gateway.isActive,
      sortOrder: gateway.sortOrder,
      themeEnabled: gateway.themeEnabled,
      primaryColor: gateway.primaryColor,
      buttonColor: gateway.buttonColor,
      borderColor: gateway.borderColor,
      backgroundColor: gateway.backgroundColor,
    });
    setSlugManuallyEdited(true); // don't overwrite slug when editing
    setDialogOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((prev) => {
      const updated = { ...prev, name };
      if (!slugManuallyEdited) {
        updated.slug = slugify(name);
      }
      return updated;
    });
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'ত্রুটি', description: 'লোগো ফাইল ২MB এর বেশি হতে পারবে না', variant: 'destructive' });
      return;
    }
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setForm((prev) => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: 'ত্রুটি', description: 'লোগো আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'গেটওয়ের নাম আবশ্যক', variant: 'destructive' });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: 'ত্রুটি', description: 'স্লাগ আবশ্যক', variant: 'destructive' });
      return;
    }
    if (!form.accountNumber.trim()) {
      toast({ title: 'ত্রুটি', description: 'অ্যাকাউন্ট নাম্বার আবশ্যক', variant: 'destructive' });
      return;
    }
    if (!form.accountName.trim()) {
      toast({ title: 'ত্রুটি', description: 'অ্যাকাউন্টের নাম আবশ্যক', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        logo: form.logo || undefined,
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        accountName: form.accountName.trim(),
        instructions: form.instructions.trim() || undefined,
        minDeposit: form.minDeposit,
        maxDeposit: form.maxDeposit,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        themeEnabled: form.themeEnabled,
        primaryColor: form.primaryColor,
        buttonColor: form.buttonColor,
        borderColor: form.borderColor,
        backgroundColor: form.backgroundColor,
      };

      if (editingGateway) {
        await api.updateGateway(editingGateway.id, payload);
        toast({ title: 'সফল!', description: 'গেটওয়ে আপডেট হয়েছে' });
      } else {
        await api.createGateway(payload);
        toast({ title: 'সফল!', description: 'নতুন গেটওয়ে যোগ হয়েছে' });
      }
      setDialogOpen(false);
      fetchGateways();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'গেটওয়ে সংরক্ষণ করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Toggle active ─────────────────────────────────────────────

  async function handleToggleActive(gateway: PaymentGateway) {
    const newActive = !gateway.isActive;
    try {
      setTogglingId(gateway.id);
      await api.updateGateway(gateway.id, { isActive: newActive });
      setGateways((prev) =>
        prev.map((g) => (g.id === gateway.id ? { ...g, isActive: newActive } : g))
      );
      toast({
        title: 'সফল!',
        description: newActive ? 'গেটওয়ে সক্রিয় করা হয়েছে' : 'গেটওয়ে নিষ্ক্রিয় করা হয়েছে',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  }

  // ─── Reorder ───────────────────────────────────────────────────

  async function handleReorder(gatewayId: string, direction: 'up' | 'down') {
    const sorted = [...gateways].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((g) => g.id === gatewayId);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    try {
      setReorderingId(gatewayId);
      const orders = sorted.map((g, i) => ({ id: g.id, sortOrder: i }));
      // swap the two items
      const temp = orders[idx].sortOrder;
      orders[idx].sortOrder = orders[swapIdx].sortOrder;
      orders[swapIdx].sortOrder = temp;

      await api.reorderGateways(orders);
      // Optimistic update
      setGateways((prev) => {
        const list = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
        const i = list.findIndex((g) => g.id === gatewayId);
        const j = direction === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return prev;
        [list[i], list[j]] = [list[j], list[i]];
        return list.map((g, newIdx) => ({ ...g, sortOrder: newIdx }));
      });
      toast({ title: 'সফল!', description: 'ক্রম পরিবর্তন হয়েছে' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ক্রম পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
      fetchGateways(); // revert
    } finally {
      setReorderingId(null);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────

  function openDeleteDialog(gateway: PaymentGateway) {
    setDeletingGateway(gateway);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingGateway) return;
    try {
      setDeleting(true);
      await api.deleteGateway(deletingGateway.id);
      setGateways((prev) => prev.filter((g) => g.id !== deletingGateway.id));
      toast({ title: 'সফল!', description: 'গেটওয়ে মুছে ফেলা হয়েছে' });
      setDeleteDialogOpen(false);
      setDeletingGateway(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'গেটওয়ে মুছতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="পেমেন্ট গেটওয়ে ব্যবস্থাপনা"
        subtitle="পেমেন্ট পদ্ধতি যোগ করুন, সম্পাদনা করুন এবং পরিচালনা করুন"
        icon={<Wallet className="h-5 w-5 text-primary" />}
        actions={
          <Button onClick={openAddDialog} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            নতুন গেটওয়ে যোগ করুন
          </Button>
        }
      />

      {/* Gateway List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="card-modern animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchGateways}>
              আবার চেষ্টা করুন
            </Button>
          </CardContent>
        </Card>
      ) : gateways.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <Wallet className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো পেমেন্ট গেটওয়ে পাওয়া যায়নি</p>
            <Button variant="outline" className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              নতুন গেটওয়ে যোগ করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gateways
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((gateway, idx, arr) => (
              <Card key={gateway.id} className={`card-modern overflow-hidden ${!gateway.isActive ? 'opacity-70' : ''}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Logo + Info */}
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border"
                        style={gateway.themeEnabled ? { borderColor: gateway.primaryColor, backgroundColor: gateway.backgroundColor } : {}}
                      >
                        {gateway.logo ? (
                          <img
                            src={gateway.logo}
                            alt={gateway.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <Wallet className="h-6 w-6" style={gateway.themeEnabled ? { color: gateway.primaryColor } : {}} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{gateway.name}</h3>
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700"
                          >
                            {ACCOUNT_TYPE_ICONS[gateway.accountType]}
                            {ACCOUNT_TYPE_LABELS[gateway.accountType] || gateway.accountType}
                          </Badge>
                          {gateway.isActive ? (
                            <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                              সক্রিয়
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                              নিষ্ক্রিয়
                            </Badge>
                          )}
                          {gateway.themeEnabled ? (
                            <Badge
                              variant="outline"
                              className="gap-1"
                              style={{ borderColor: gateway.primaryColor, color: gateway.primaryColor, backgroundColor: gateway.backgroundColor }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gateway.primaryColor }} />
                              কাস্টম থিম
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-600">
                              ডিফল্ট থিম
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-muted-foreground">অ্যাকাউন্ট নাম্বার: </span>
                            <span className="font-mono text-foreground">
                              {maskAccountNumber(gateway.accountNumber)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">অ্যাকাউন্টের নাম: </span>
                            <span className="text-foreground">{gateway.accountName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">সর্বনিম্ন জমা: </span>
                            <span className="font-medium text-foreground">
                              {formatBDT(gateway.minDeposit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">সর্বোচ্চ জমা: </span>
                            <span className="font-medium text-foreground">
                              {formatBDT(gateway.maxDeposit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      {/* Toggle Switch */}
                      <div className="flex items-center gap-2">
                        {gateway.isActive ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-red-500" />
                        )}
                        <Switch
                          checked={gateway.isActive}
                          onCheckedChange={() => handleToggleActive(gateway)}
                          disabled={togglingId === gateway.id}
                        />
                      </div>

                      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

                      {/* Reorder Buttons */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0 || reorderingId === gateway.id}
                        onClick={() => handleReorder(gateway.id, 'up')}
                        title="উপরে সরান"
                      >
                        {reorderingId === gateway.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === arr.length - 1 || reorderingId === gateway.id}
                        onClick={() => handleReorder(gateway.id, 'down')}
                        title="নিচে সরান"
                      >
                        {reorderingId === gateway.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </Button>

                      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(gateway)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        সম্পাদনা
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(gateway)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        মুছুন
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* ─── Add/Edit Gateway Dialog ────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? 'গেটওয়ে সম্পাদনা' : 'নতুন গেটওয়ে যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingGateway
                ? 'পেমেন্ট গেটওয়ের তথ্য আপডেট করুন'
                : 'নতুন পেমেন্ট গেটওয়ে যোগ করতে নিচের ফর্ম পূরণ করুন'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Gateway Name */}
            <div className="space-y-2">
              <Label htmlFor="gw-name">
                গেটওয়ের নাম <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gw-name"
                placeholder="যেমন: bKash, Nagad, Rocket"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="gw-slug">
                স্লাগ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gw-slug"
                placeholder="auto-generated-from-name"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়, প্রয়োজনে পরিবর্তন করুন
              </p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="gw-logo">লোগো</Label>
              <div className="flex items-center gap-4">
                {form.logo ? (
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                    <img
                      src={form.logo}
                      alt="লোগো প্রিভিউ"
                      className="h-10 w-10 object-contain"
                    />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                      onClick={() => setForm((prev) => ({ ...prev, logo: '' }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
                <label
                  htmlFor="gw-logo"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  লোগো আপলোড করুন
                </label>
                <input
                  id="gw-logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">সর্বোচ্চ ২MB, PNG/JPG/SVG</p>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="gw-account-type">
                অ্যাকাউন্ট টাইপ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.accountType}
                onValueChange={(value) => setForm((prev) => ({ ...prev, accountType: value }))}
              >
                <SelectTrigger id="gw-account-type">
                  <SelectValue placeholder="টাইপ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      পার্সোনাল
                    </span>
                  </SelectItem>
                  <SelectItem value="merchant">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      মার্চেন্ট
                    </span>
                  </SelectItem>
                  <SelectItem value="bank">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      ব্যাংক
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="gw-account-number">
                অ্যাকাউন্ট নাম্বার <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gw-account-number"
                placeholder="017XXXXXXXX"
                value={form.accountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
              />
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="gw-account-name">
                অ্যাকাউন্টের নাম <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gw-account-name"
                placeholder="অ্যাকাউন্টের নাম লিখুন"
                value={form.accountName}
                onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="gw-instructions">পেমেন্ট নির্দেশনা</Label>
              <Textarea
                id="gw-instructions"
                placeholder="পেমেন্ট সম্পর্কে বিশেষ নির্দেশনা লিখুন..."
                value={form.instructions}
                onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Min / Max Deposit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gw-min-deposit">সর্বনিম্ন জমা</Label>
                <Input
                  id="gw-min-deposit"
                  type="number"
                  min={0}
                  value={form.minDeposit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minDeposit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gw-max-deposit">সর্বোচ্চ জমা</Label>
                <Input
                  id="gw-max-deposit"
                  type="number"
                  min={0}
                  value={form.maxDeposit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxDeposit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>স্ট্যাটাস</Label>
                <p className="text-xs text-muted-foreground">
                  {form.isActive ? 'গেটওয়ে বর্তমানে সক্রিয়' : 'গেটওয়ে বর্তমানে নিষ্ক্রিয়'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {form.isActive ? (
                  <Power className="h-4 w-4 text-green-600" />
                ) : (
                  <PowerOff className="h-4 w-4 text-red-500" />
                )}
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="gw-sort-order">ক্রম</Label>
              <Input
                id="gw-sort-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                কম সংখ্যা প্রথমে দেখাবে
              </p>
            </div>

            {/* Theme Colors Section */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">কাস্টম থিম রং</p>
                  <p className="text-xs text-muted-foreground">এই গেটওয়ের জন্য আলাদা রং সেট করুন</p>
                </div>
                <Switch
                  checked={form.themeEnabled}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, themeEnabled: checked }))}
                />
              </div>

              {form.themeEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">প্রাথমিক রং</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.primaryColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="font-mono text-xs h-8"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">বাটন রং</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.buttonColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, buttonColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.buttonColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, buttonColor: e.target.value }))}
                        className="font-mono text-xs h-8"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">বর্ডার রং</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.borderColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, borderColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.borderColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, borderColor: e.target.value }))}
                        className="font-mono text-xs h-8"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ব্যাকগ্রাউন্ড রং</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.backgroundColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-8 h-8 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={form.backgroundColor}
                        onChange={(e) => setForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="font-mono text-xs h-8"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground col-span-2">
                    বিস্তারিত থিম কাস্টমাইজেশনের জন্য &quot;গেটওয়ে থিম সেটিংস&quot; পেজে যান
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              বাতিল
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : editingGateway ? (
                'আপডেট করুন'
              ) : (
                'যোগ করুন'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation AlertDialog ────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>গেটওয়ে মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি <strong>&quot;{deletingGateway?.name}&quot;</strong> গেটওয়েটি মুছে
              ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
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
    </div>
  );
}
