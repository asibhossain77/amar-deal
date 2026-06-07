'use client';

import { useEffect, useState, useCallback } from 'react';
import { Palette, RotateCcw, Save, Loader2, Eye, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { PaymentGatewayTheme } from '@/lib/types';

const DEFAULT_THEME: PaymentGatewayTheme = {
  primaryColor: '#6BBF59',
  buttonColor: '#6BBF59',
  borderColor: '#6BBF59',
  backgroundColor: '#f0f7ee',
};

interface ThemeFormState {
  primaryColor: string;
  buttonColor: string;
  borderColor: string;
  backgroundColor: string;
}

export default function AdminGatewayThemePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ThemeFormState>({
    primaryColor: DEFAULT_THEME.primaryColor,
    buttonColor: DEFAULT_THEME.buttonColor,
    borderColor: DEFAULT_THEME.borderColor,
    backgroundColor: DEFAULT_THEME.backgroundColor,
  });
  const [savedTheme, setSavedTheme] = useState<ThemeFormState>({ ...form });

  const fetchTheme = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGatewayTheme();
      const theme = data.theme || data;
      const state: ThemeFormState = {
        primaryColor: theme.primaryColor || DEFAULT_THEME.primaryColor,
        buttonColor: theme.buttonColor || DEFAULT_THEME.buttonColor,
        borderColor: theme.borderColor || DEFAULT_THEME.borderColor,
        backgroundColor: theme.backgroundColor || DEFAULT_THEME.backgroundColor,
      };
      setForm(state);
      setSavedTheme(state);
    } catch {
      // Use defaults on error
      setForm({ ...DEFAULT_THEME });
      setSavedTheme({ ...DEFAULT_THEME });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  // Helper to compute a lighter version of a hex color for preview
  function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  function darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  function hexToRgba(hex: string, alpha: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

  const hasChanges =
    form.primaryColor !== savedTheme.primaryColor ||
    form.buttonColor !== savedTheme.buttonColor ||
    form.borderColor !== savedTheme.borderColor ||
    form.backgroundColor !== savedTheme.backgroundColor;

  const handleColorChange = (field: keyof ThemeFormState, value: string) => {
    // Allow typing, auto-add # if missing
    let cleaned = value.trim();
    if (cleaned && !cleaned.startsWith('#')) {
      cleaned = '#' + cleaned;
    }
    setForm((prev) => ({ ...prev, [field]: cleaned }));
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_THEME });
  };

  const handleSave = async () => {
    // Validate all colors
    for (const [key, value] of Object.entries(form)) {
      if (!isValidHex(value)) {
        toast({
          title: 'ত্রুটি',
          description: `${key} সঠিক HEX কালার ফরম্যাটে দিন (যেমন: #6BBF59)`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSaving(true);
      await api.updateGatewayTheme(form);
      setSavedTheme({ ...form });
      toast({
        title: 'সফল!',
        description: 'পেমেন্ট গেটওয়ে থিম সফলভাবে আপডেট হয়েছে',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'থিম আপডেট করতে সমস্যা হয়েছে';
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">গেটওয়ে থিম সেটিংস</h1>
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 w-40 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">পেমেন্ট গেটওয়ে থিম সেটিংস</h1>
            <p className="text-sm text-muted-foreground">শুধুমাত্র পেমেন্ট গেটওয়ে পেজের রঙ পরিবর্তন করুন</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            ডিফল্টে ফিরুন
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
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

      {/* Info Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">শুধুমাত্র পেমেন্ট গেটওয়ে সেকশন</p>
            <p className="text-xs text-amber-700 mt-1">
              এই থিম পরিবর্তন শুধুমাত্র পেমেন্ট গেটওয়ে পেজে প্রযোজ্য হবে। ওয়েবসাইটের অন্যান্য অংশ, ড্যাশবোর্ড বা অ্যাডমিন প্যানেলে কোনো প্রভাব পড়বে না।
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Color Pickers */}
        <div className="space-y-4">
          {/* Primary Color */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">প্রাথমিক রং (Primary Color)</CardTitle>
              <CardDescription>গেটওয়ে কার্ড সিলেকশন, হাইলাইট ও অ্যাকসেন্ট রং</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={isValidHex(form.primaryColor) ? form.primaryColor : DEFAULT_THEME.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="primaryColor" className="text-xs text-muted-foreground">
                    HEX কোড
                  </Label>
                  <Input
                    id="primaryColor"
                    placeholder="#6BBF59"
                    value={form.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className={`font-mono ${!isValidHex(form.primaryColor) ? 'border-red-400' : ''}`}
                    maxLength={7}
                  />
                </div>
              </div>
              {!isValidHex(form.primaryColor) && (
                <p className="text-xs text-red-500">সঠিক HEX ফরম্যাট দিন (যেমন: #6BBF59)</p>
              )}
              {/* Color preview strip */}
              <div className="flex gap-1 h-3 rounded overflow-hidden">
                <div className="flex-1" style={{ backgroundColor: form.primaryColor }} />
                <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.primaryColor) ? form.primaryColor : DEFAULT_THEME.primaryColor, 0.3) }} />
                <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.primaryColor) ? form.primaryColor : DEFAULT_THEME.primaryColor, 0.6) }} />
                <div className="flex-1" style={{ backgroundColor: darkenColor(isValidHex(form.primaryColor) ? form.primaryColor : DEFAULT_THEME.primaryColor, 0.2) }} />
              </div>
            </CardContent>
          </Card>

          {/* Button Color */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">বাটন রং (Button Color)</CardTitle>
              <CardDescription>&quot;পেমেন্ট জমা দিন&quot; বাটনের রং</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={isValidHex(form.buttonColor) ? form.buttonColor : DEFAULT_THEME.buttonColor}
                    onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: form.buttonColor }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="buttonColor" className="text-xs text-muted-foreground">
                    HEX কোড
                  </Label>
                  <Input
                    id="buttonColor"
                    placeholder="#6BBF59"
                    value={form.buttonColor}
                    onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                    className={`font-mono ${!isValidHex(form.buttonColor) ? 'border-red-400' : ''}`}
                    maxLength={7}
                  />
                </div>
              </div>
              {!isValidHex(form.buttonColor) && (
                <p className="text-xs text-red-500">সঠিক HEX ফরম্যাট দিন (যেমন: #6BBF59)</p>
              )}
              <div className="flex gap-1 h-3 rounded overflow-hidden">
                <div className="flex-1" style={{ backgroundColor: form.buttonColor }} />
                <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.buttonColor) ? form.buttonColor : DEFAULT_THEME.buttonColor, 0.3) }} />
                <div className="flex-1" style={{ backgroundColor: darkenColor(isValidHex(form.buttonColor) ? form.buttonColor : DEFAULT_THEME.buttonColor, 0.15) }} />
              </div>
            </CardContent>
          </Card>

          {/* Border/Accent Color */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">বর্ডার/অ্যাকসেন্ট রং</CardTitle>
              <CardDescription>গেটওয়ে কার্ডের বর্ডার ও অ্যাকসেন্ট লাইন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={isValidHex(form.borderColor) ? form.borderColor : DEFAULT_THEME.borderColor}
                    onChange={(e) => handleColorChange('borderColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: form.borderColor }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="borderColor" className="text-xs text-muted-foreground">
                    HEX কোড
                  </Label>
                  <Input
                    id="borderColor"
                    placeholder="#6BBF59"
                    value={form.borderColor}
                    onChange={(e) => handleColorChange('borderColor', e.target.value)}
                    className={`font-mono ${!isValidHex(form.borderColor) ? 'border-red-400' : ''}`}
                    maxLength={7}
                  />
                </div>
              </div>
              {!isValidHex(form.borderColor) && (
                <p className="text-xs text-red-500">সঠিক HEX ফরম্যাট দিন (যেমন: #6BBF59)</p>
              )}
              <div className="flex gap-1 h-3 rounded overflow-hidden">
                <div className="flex-1" style={{ backgroundColor: form.borderColor }} />
                <div className="flex-1" style={{ backgroundColor: hexToRgba(isValidHex(form.borderColor) ? form.borderColor : DEFAULT_THEME.borderColor, 0.3) }} />
                <div className="flex-1" style={{ backgroundColor: hexToRgba(isValidHex(form.borderColor) ? form.borderColor : DEFAULT_THEME.borderColor, 0.1) }} />
              </div>
            </CardContent>
          </Card>

          {/* Background Highlight Color */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ব্যাকগ্রাউন্ড হাইলাইট রং</CardTitle>
              <CardDescription>পেমেন্ট বক্সের ব্যাকগ্রাউন্ড হাইলাইট</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={isValidHex(form.backgroundColor) ? form.backgroundColor : DEFAULT_THEME.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                    style={{ backgroundColor: form.backgroundColor }}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="backgroundColor" className="text-xs text-muted-foreground">
                    HEX কোড
                  </Label>
                  <Input
                    id="backgroundColor"
                    placeholder="#f0f7ee"
                    value={form.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className={`font-mono ${!isValidHex(form.backgroundColor) ? 'border-red-400' : ''}`}
                    maxLength={7}
                  />
                </div>
              </div>
              {!isValidHex(form.backgroundColor) && (
                <p className="text-xs text-red-500">সঠিক HEX ফরম্যাট দিন (যেমন: #f0f7ee)</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                লাইভ প্রিভিউ
              </CardTitle>
              <CardDescription>পেমেন্ট গেটওয়ে পেজে কেমন দেখাবে তার প্রিভিউ</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="payment-gateway-module space-y-4 p-4 rounded-lg border border-border bg-background"
                style={{
                  '--gateway-primary-color': form.primaryColor,
                  '--gateway-button-color': form.buttonColor,
                  '--gateway-border-color': form.borderColor,
                  '--gateway-bg-color': form.backgroundColor,
                } as React.CSSProperties}
              >
                {/* Preview: Gateway Header */}
                <div className="gateway-header-accent">
                  <h3 className="gateway-section-title text-base">পেমেন্ট জমা দিন</h3>
                  <p className="text-xs text-muted-foreground mt-1">আপনার পেমেন্টের বিবরণ পূরণ করুন</p>
                </div>

                {/* Preview: Gateway Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="gateway-card gateway-card-selected rounded-lg p-2.5 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: form.primaryColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">bKash</p>
                      <p className="text-[10px] text-muted-foreground">পার্সোনাল</p>
                    </div>
                  </div>
                  <div className="gateway-card rounded-lg p-2.5 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0 bg-muted-foreground/30" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">Nagad</p>
                      <p className="text-[10px] text-muted-foreground">মার্চেন্ট</p>
                    </div>
                  </div>
                </div>

                {/* Preview: Gateway Detail Card */}
                <div className="gateway-detail-card rounded-lg p-3">
                  <p className="gateway-detail-header text-xs font-semibold mb-2">bKash পেমেন্টের তথ্য</p>
                  <div className="gateway-detail-inner space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">অ্যাকাউন্ট নাম্বার</p>
                      <p className="text-sm font-bold font-mono">017XXXXXXXX</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">অ্যাকাউন্টের নাম</p>
                      <p className="text-xs font-medium">বাংলা এসক্রো</p>
                    </div>
                  </div>
                </div>

                {/* Preview: Instructions Box */}
                <div className="gateway-instructions flex items-start gap-2">
                  <span className="instructions-icon text-xs">ℹ</span>
                  <p className="instructions-text text-[10px]">
                    উপরের নাম্বারে <strong>Send Money</strong> করুন এবং ট্রানজেকশন আইডি নিচে দিন।
                  </p>
                </div>

                {/* Preview: Transaction Input */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">ট্রানজেকশন আইডি</p>
                  <div
                    className="gateway-input rounded-md px-3 py-1.5 text-xs bg-white"
                    style={{ borderColor: form.borderColor }}
                  >
                    TXN123456789
                  </div>
                </div>

                {/* Preview: Upload Area */}
                <div className="gateway-upload-area p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">স্ক্রিনশট আপলোড করুন</p>
                </div>

                <Separator />

                {/* Preview: Submit Button */}
                <button className="gateway-submit-btn w-full text-sm py-2 rounded-md">
                  পেমেন্ট জমা দিন
                </button>

                {/* Preview: Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="gateway-badge-pending">অপেক্ষমাণ</span>
                  <span className="gateway-badge-verified">যাচাইকৃত</span>
                  <span className="gateway-badge-rejected">প্রত্যাখ্যাত</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">রং সারাংশ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground">প্রাথমিক</p>
                    <p className="text-xs font-mono font-medium">{form.primaryColor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border"
                    style={{ backgroundColor: form.buttonColor }}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground">বাটন</p>
                    <p className="text-xs font-mono font-medium">{form.buttonColor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border"
                    style={{ backgroundColor: form.borderColor }}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground">বর্ডার</p>
                    <p className="text-xs font-mono font-medium">{form.borderColor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border"
                    style={{ backgroundColor: form.backgroundColor }}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground">ব্যাকগ্রাউন্ড</p>
                    <p className="text-xs font-mono font-medium">{form.backgroundColor}</p>
                  </div>
                </div>
              </div>

              {hasChanges && (
                <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700">
                    ⚠ আপনি পরিবর্তন করেছেন যা এখনো সংরক্ষণ করেননি।
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
