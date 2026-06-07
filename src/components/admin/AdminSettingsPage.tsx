'use client';

import { useEffect, useState } from 'react';
import { Settings, Phone, Building2, Wallet, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PaymentSettings {
  bkash_account: string;
  bkash_account_name: string;
  nagad_account: string;
  nagad_account_name: string;
  rocket_account: string;
  rocket_account_name: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
  bank_branch: string;
  bank_routing: string;
}

const defaultSettings: PaymentSettings = {
  bkash_account: '',
  bkash_account_name: '',
  nagad_account: '',
  nagad_account_name: '',
  rocket_account: '',
  rocket_account_name: '',
  bank_name: '',
  bank_account: '',
  bank_account_name: '',
  bank_branch: '',
  bank_routing: '',
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings?category=payment_accounts');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            bkash_account: data.bkash?.number || '',
            bkash_account_name: data.bkash?.name || '',
            nagad_account: data.nagad?.number || '',
            nagad_account_name: data.nagad?.name || '',
            rocket_account: data.rocket?.number || '',
            rocket_account_name: data.rocket?.name || '',
            bank_name: data.bank?.bankName || '',
            bank_account: data.bank?.accountNumber || '',
            bank_account_name: data.bank?.accountName || '',
            bank_branch: data.bank?.branch || '',
            bank_routing: data.bank?.routing || '',
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে' }));
        throw new Error(data.error || 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে');
      }

      toast({
        title: 'সফল!',
        description: 'পেমেন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে';
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof PaymentSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Settings className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট সেটিংস</h1>
            <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-32 rounded bg-gray-200" />
                  <div className="h-10 w-full rounded bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট সেটিংস</h1>
          <p className="text-sm text-gray-500">পেমেন্ট অ্যাকাউন্ট নাম্বার ও তথ্য কনফিগার করুন</p>
        </div>
      </div>

      {/* bKash Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-pink-600" />
            bKash অ্যাকাউন্ট
          </CardTitle>
          <CardDescription>ক্রেতারা bKash দিয়ে পেমেন্ট করলে এই অ্যাকাউন্টে Send Money করবে</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bkash_account">অ্যাকাউন্ট নাম্বার</Label>
              <Input
                id="bkash_account"
                placeholder="যেমন: 01712345678"
                value={settings.bkash_account}
                onChange={(e) => updateField('bkash_account', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bkash_account_name">অ্যাকাউন্টের নাম</Label>
              <Input
                id="bkash_account_name"
                placeholder="যেমন: আপনার নাম"
                value={settings.bkash_account_name}
                onChange={(e) => updateField('bkash_account_name', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nagad Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-orange-600" />
            Nagad অ্যাকাউন্ট
          </CardTitle>
          <CardDescription>ক্রেতারা Nagad দিয়ে পেমেন্ট করলে এই অ্যাকাউন্টে Send Money করবে</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nagad_account">অ্যাকাউন্ট নাম্বার</Label>
              <Input
                id="nagad_account"
                placeholder="যেমন: 01812345678"
                value={settings.nagad_account}
                onChange={(e) => updateField('nagad_account', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nagad_account_name">অ্যাকাউন্টের নাম</Label>
              <Input
                id="nagad_account_name"
                placeholder="যেমন: আপনার নাম"
                value={settings.nagad_account_name}
                onChange={(e) => updateField('nagad_account_name', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rocket Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-purple-600" />
            Rocket অ্যাকাউন্ট
          </CardTitle>
          <CardDescription>ক্রেতারা Rocket দিয়ে পেমেন্ট করলে এই অ্যাকাউন্টে Send Money করবে</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rocket_account">অ্যাকাউন্ট নাম্বার</Label>
              <Input
                id="rocket_account"
                placeholder="যেমন: 01912345678"
                value={settings.rocket_account}
                onChange={(e) => updateField('rocket_account', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rocket_account_name">অ্যাকাউন্টের নাম</Label>
              <Input
                id="rocket_account_name"
                placeholder="যেমন: আপনার নাম"
                value={settings.rocket_account_name}
                onChange={(e) => updateField('rocket_account_name', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-green-600" />
            ব্যাংক অ্যাকাউন্ট
          </CardTitle>
          <CardDescription>ব্যাংক ট্রান্সফারের তথ্য</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">ব্যাংকের নাম</Label>
              <Input
                id="bank_name"
                placeholder="যেমন: Dutch Bangla Bank Ltd."
                value={settings.bank_name}
                onChange={(e) => updateField('bank_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_name">অ্যাকাউন্টের নাম</Label>
              <Input
                id="bank_account_name"
                placeholder="যেমন: আপনার ব্যবসার নাম"
                value={settings.bank_account_name}
                onChange={(e) => updateField('bank_account_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">অ্যাকাউন্ট নাম্বার</Label>
              <Input
                id="bank_account"
                placeholder="যেমন: 1234567890123"
                value={settings.bank_account}
                onChange={(e) => updateField('bank_account', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_branch">শাখা</Label>
              <Input
                id="bank_branch"
                placeholder="যেমন: ঢাকা মেইন ব্রাঞ্চ"
                value={settings.bank_branch}
                onChange={(e) => updateField('bank_branch', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_routing">রাউটিং নাম্বার</Label>
              <Input
                id="bank_routing"
                placeholder="যেমন: 090123456"
                value={settings.bank_routing}
                onChange={(e) => updateField('bank_routing', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] min-w-[160px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              সংরক্ষণ করুন
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
