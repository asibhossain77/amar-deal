'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  KeyRound, Loader2, Save, Eye, EyeOff, CheckCircle2, XCircle,
  AlertTriangle, Copy, ExternalLink, Shield, Info, Zap, ZapOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface GoogleSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string; // masked
  clientSecretSet: boolean;
  redirectUrl: string;
  status: string; // 'active' | 'disabled' | 'not_configured' | 'incomplete'
  isConfigured: boolean;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  active: { label: 'সক্রিয়', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  disabled: { label: 'বন্ধ', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: ZapOff },
  not_configured: { label: 'কনফিগার করা নেই', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  incomplete: { label: 'অসম্পূর্ণ', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: AlertTriangle },
};

export default function AdminGoogleLoginPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [data, setData] = useState<GoogleSettings | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/google-login', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
      setEnabled(json.enabled);
      setClientId(json.clientId || '');
      setClientSecret(''); // Don't show secret - user must re-enter to change
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'সেটিংস লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    // Validation
    if (enabled) {
      if (!clientId.trim()) {
        toast({
          title: 'Client ID প্রয়োজন',
          description: 'Google Client ID অবশ্যই দিতে হবে',
          variant: 'destructive',
        });
        return;
      }
      if (!clientSecret.trim() && !data?.clientSecretSet) {
        toast({
          title: 'Client Secret প্রয়োজন',
          description: 'Google Client Secret অবশ্যই দিতে হবে',
          variant: 'destructive',
        });
        return;
      }
    }

    // Confirm disable if was active
    if (!enabled && data?.status === 'active') {
      setShowDisableDialog(true);
      return;
    }

    await performSave();
  }

  async function performSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/google-login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Save failed');
      }

      toast({
        title: '✅ সফল',
        description: json.message || 'Google Login সেটিংস সংরক্ষণ হয়েছে',
      });

      // Reload
      await loadSettings();
      setClientSecret('');
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: error instanceof Error ? error.message : 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setShowDisableDialog(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/google-login', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: '✅ সফল',
          description: json.message,
        });
      } else {
        toast({
          title: '⚠️ সতর্কতা',
          description: json.message || json.error,
          variant: 'destructive',
        });
      }
      await loadSettings();
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'টেস্ট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  }

  async function copyRedirectUrl() {
    if (!data?.redirectUrl) return;
    try {
      await navigator.clipboard.writeText(data.redirectUrl);
      toast({
        title: '✅ কপি হয়েছে',
        description: 'Authorized Redirect URL কপি করা হয়েছে',
      });
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'কপি করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusInfo = data ? STATUS_MAP[data.status] : STATUS_MAP.not_configured;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Login সেটিংস"
        description="Google OAuth দিয়ে লগইন সিস্টেম পরিচালনা করুন"
        icon={KeyRound}
      />

      {/* Status Banner */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                <StatusIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">কানেকশন স্ট্যাটাস</p>
                <p className="text-xs text-muted-foreground">
                  Google Login বর্তমান অবস্থা
                </p>
              </div>
            </div>
            <Badge className={`px-3 py-1 text-sm ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            Google Login নিয়ন্ত্রণ
          </CardTitle>
          <CardDescription>
            Google দিয়ে লগইন সক্রিয় বা নিষ্ক্রিয় করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="google-enabled" className="text-base font-medium cursor-pointer">
                Google Login সক্রিয় করুন
              </Label>
              <p className="text-xs text-muted-foreground">
                চালু থাকলে ব্যবহারকারীরা Google অ্যাকাউন্ট দিয়ে লগইন করতে পারবে
              </p>
            </div>
            <Switch
              id="google-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Google API ক্রেডেনশিয়াল
          </CardTitle>
          <CardDescription>
            Google Cloud Console থেকে প্রাপ্ত OAuth 2.0 ক্রেডেনশিয়াল
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="client-id" className="flex items-center gap-1">
              Google Client ID
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-id"
              type="text"
              placeholder="123456789-abcdef.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={saving}
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Google Cloud Console → APIs &amp; Services → Credentials থেকে নিন
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="client-secret" className="flex items-center gap-1">
              Google Client Secret
              {!data?.clientSecretSet && <span className="text-destructive">*</span>}
              {data?.clientSecretSet && (
                <Badge variant="secondary" className="ml-2 text-[10px] py-0 h-4">
                  সেট করা আছে
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="client-secret"
                type={showSecret ? 'text' : 'password'}
                placeholder={
                  data?.clientSecretSet
                    ? 'নতুন secret দিন (ঐচ্ছিক)'
                    : 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx'
                }
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                disabled={saving}
                className="font-mono text-sm pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.clientSecretSet
                ? 'নতুন secret দিতে চাইলে উপরে লিখুন। না দিলে আগেরটাই থাকবে।'
                : 'Google Cloud Console থেকে Client Secret কপি করুন'}
            </p>
          </div>

          {/* Authorized Redirect URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Authorized Redirect URL
              <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">
                Read Only
              </Badge>
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={data?.redirectUrl || ''}
                readOnly
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyRedirectUrl}
                title="কপি করুন"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              এই URL টি Google Cloud Console-এর Authorized redirect URIs-এ যোগ করুন
            </p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || testing}
              className="flex-1 h-11"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  সেটিংস সংরক্ষণ করুন
                </>
              )}
            </Button>
            <Button
              onClick={handleTest}
              disabled={saving || testing || !data?.isConfigured}
              variant="outline"
              className="flex-1 h-11"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  টেস্ট হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  কানেকশন টেস্ট করুন
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5 text-blue-500" />
            কীভাবে সেটআপ করবেন?
          </CardTitle>
          <CardDescription>
            Google OAuth কনফিগার করার ধাপ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ১
              </span>
              <div>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Google Cloud Console
                  <ExternalLink className="w-3 h-3" />
                </a>
                -এ যান এবং একটি প্রজেক্ট তৈরি করুন
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ২
              </span>
              <div>
                <strong>APIs &amp; Services → Credentials</strong>-এ যান এবং
                <strong> OAuth client ID</strong> তৈরি করুন
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ৩
              </span>
              <div>
                Application type <strong>Web application</strong> সিলেক্ট করুন
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ৪
              </span>
              <div>
                <strong>Authorized redirect URIs</strong>-এ উপরের Redirect URL টি যোগ করুন
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ৫
              </span>
              <div>
                তৈরি হওয়া <strong>Client ID</strong> এবং <strong>Client Secret</strong> উপরের ফর্মে দিন
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                ৬
              </span>
              <div>
                <strong>সেটিংস সংরক্ষণ করুন</strong> বাটনে ক্লিক করুন এবং Google Login সক্রিয় করুন
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-yellow-700 dark:text-yellow-500">
                নিরাপত্তা নোট
              </p>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>API ক্রেডেনশিয়াল এনক্রিপ্টেডভাবে ডাটাবেসে সংরক্ষিত হয়</li>
                <li>শুধুমাত্র অ্যাডমিন এই সেটিংস দেখতে ও পরিবর্তন করতে পারবে</li>
                <li>Client Secret কখনো সম্পূর্ণরূপে প্রদর্শিত হবে না</li>
                <li>সন্দেহজনক কার্যকলাপ দেখলে অবিলম্বে Google Login বন্ধ করুন</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Google Login বন্ধ করবেন?
            </DialogTitle>
            <DialogDescription>
              Google Login বন্ধ করলে ব্যবহারকারীরা Google দিয়ে লগইন করতে পারবে না।
              তবে বিদ্যমান Google ব্যবহারকারীদের অ্যাকাউন্ট অপরিবর্তিত থাকবে।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              disabled={saving}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={performSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  বন্ধ হচ্ছে...
                </>
              ) : (
                'হ্যাঁ, বন্ধ করুন'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
