'use client';

import { useEffect, useState, useCallback } from 'react';
import { Palette, RotateCcw, Save, Loader2, Eye, Info, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { PaymentGateway } from '@/lib/types';

// Default colors for each gateway type
const GATEWAY_DEFAULTS: Record<string, { primaryColor: string; buttonColor: string; borderColor: string; backgroundColor: string }> = {
  'bkash-personal': { primaryColor: '#E2136E', buttonColor: '#E2136E', borderColor: '#E2136E', backgroundColor: '#FDE8F1' },
  'bkash-merchant': { primaryColor: '#E2136E', buttonColor: '#C4105E', borderColor: '#E2136E', backgroundColor: '#FDE8F1' },
  'nagad': { primaryColor: '#F6921E', buttonColor: '#F6921E', borderColor: '#F6921E', backgroundColor: '#FEF3E2' },
  'rocket': { primaryColor: '#8B2F8B', buttonColor: '#8B2F8B', borderColor: '#8B2F8B', backgroundColor: '#F5E6F5' },
  'upay': { primaryColor: '#1A7DC4', buttonColor: '#1A7DC4', borderColor: '#1A7DC4', backgroundColor: '#E1F0FB' },
  'bank-transfer': { primaryColor: '#1E5AA8', buttonColor: '#1E5AA8', borderColor: '#1E5AA8', backgroundColor: '#E3EEF8' },
};

const GLOBAL_DEFAULT = { primaryColor: '#6BBF59', buttonColor: '#6BBF59', borderColor: '#6BBF59', backgroundColor: '#f0f7ee' };

function getGatewayDefault(slug: string) {
  return GATEWAY_DEFAULTS[slug] || GLOBAL_DEFAULT;
}

interface GatewayThemeForm {
  themeEnabled: boolean;
  primaryColor: string;
  buttonColor: string;
  borderColor: string;
  backgroundColor: string;
}

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

export default function AdminGatewayThemePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
  const [formMap, setFormMap] = useState<Record<string, GatewayThemeForm>>({});
  const [savedMap, setSavedMap] = useState<Record<string, GatewayThemeForm>>({});

  // Get selected gateway
  const selectedGateway = gateways.find(g => g.id === selectedGatewayId) || null;
  const form = selectedGatewayId ? formMap[selectedGatewayId] : null;
  const savedForm = selectedGatewayId ? savedMap[selectedGatewayId] : null;

  const fetchGateways = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminGateways();
      const list: PaymentGateway[] = data.gateways || data || [];
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      setGateways(list);

      // Build form map
      const newFormMap: Record<string, GatewayThemeForm> = {};
      const newSavedMap: Record<string, GatewayThemeForm> = {};
      for (const gw of list) {
        const f: GatewayThemeForm = {
          themeEnabled: gw.themeEnabled,
          primaryColor: gw.primaryColor,
          buttonColor: gw.buttonColor,
          borderColor: gw.borderColor,
          backgroundColor: gw.backgroundColor,
        };
        newFormMap[gw.id] = f;
        newSavedMap[gw.id] = { ...f };
      }
      setFormMap(newFormMap);
      setSavedMap(newSavedMap);

      if (list.length > 0 && !selectedGatewayId) {
        setSelectedGatewayId(list[0].id);
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'গেটওয়ে লোড করতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedGatewayId, toast]);

  useEffect(() => {
    fetchGateways();
  }, []);

  const updateForm = (field: keyof GatewayThemeForm, value: string | boolean) => {
    if (!selectedGatewayId) return;
    setFormMap(prev => ({
      ...prev,
      [selectedGatewayId]: {
        ...prev[selectedGatewayId],
        [field]: value,
      },
    }));
  };

  const handleColorChange = (field: keyof GatewayThemeForm, value: string) => {
    let cleaned = value.trim();
    if (cleaned && !cleaned.startsWith('#')) {
      cleaned = '#' + cleaned;
    }
    updateForm(field, cleaned);
  };

  const hasChanges = form && savedForm ? (
    form.themeEnabled !== savedForm.themeEnabled ||
    form.primaryColor !== savedForm.primaryColor ||
    form.buttonColor !== savedForm.buttonColor ||
    form.borderColor !== savedForm.borderColor ||
    form.backgroundColor !== savedForm.backgroundColor
  ) : false;

  const handleReset = () => {
    if (!selectedGateway) return;
    const defaults = getGatewayDefault(selectedGateway.slug);
    const newForm: GatewayThemeForm = {
      themeEnabled: true,
      ...defaults,
    };
    setFormMap(prev => ({ ...prev, [selectedGatewayId]: newForm }));
  };

  const handleSave = async () => {
    if (!selectedGateway || !form) return;

    // Validate colors
    const colorFields: { key: keyof GatewayThemeForm; label: string }[] = [
      { key: 'primaryColor', label: 'প্রাথমিক রং' },
      { key: 'buttonColor', label: 'বাটন রং' },
      { key: 'borderColor', label: 'বর্ডার রং' },
      { key: 'backgroundColor', label: 'ব্যাকগ্রাউন্ড রং' },
    ];
    for (const { key, label } of colorFields) {
      if (form.themeEnabled && !isValidHex(form[key] as string)) {
        toast({ title: 'ত্রুটি', description: `${label} সঠিক HEX কালার ফরম্যাটে দিন`, variant: 'destructive' });
        return;
      }
    }

    try {
      setSaving(true);
      await api.updateGateway(selectedGateway.id, {
        themeEnabled: form.themeEnabled,
        primaryColor: form.primaryColor,
        buttonColor: form.buttonColor,
        borderColor: form.borderColor,
        backgroundColor: form.backgroundColor,
      });
      setSavedMap(prev => ({ ...prev, [selectedGatewayId]: { ...form! } }));
      // Also update the local gateways state
      setGateways(prev => prev.map(g => g.id === selectedGatewayId ? { ...g, ...form } : g));
      toast({ title: 'সফল!', description: `"${selectedGateway.name}" গেটওয়ের থিম সফলভাবে আপডেট হয়েছে` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'থিম আপডেট করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader
          title="গেটওয়ে থিম সেটিংস"
          subtitle="লোড হচ্ছে..."
          icon={<Palette className="h-5 w-5 text-primary animate-spin" />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="card-modern animate-pulse">
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
    <div className="page-container space-y-6">
      <PageHeader
        title="পেমেন্ট গেটওয়ে থিম সেটিংস"
        subtitle="প্রতিটি পেমেন্ট গেটওয়ের জন্য আলাদা রং সেট করুন"
        icon={<Palette className="h-5 w-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || !selectedGateway}
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
        }
      />

      {/* Info Notice */}
      <Card className="card-modern border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">প্রতিটি গেটওয়ের নিজস্ব থিম</p>
            <p className="text-xs text-muted-foreground mt-1">
              প্রতিটি পেমেন্ট গেটওয়ের জন্য আলাদা রং সেট করুন। ব্যবহারকারী গেটওয়ে নির্বাচন করলে সেই গেটওয়ের থিম অটোমেটিক প্রযোজ্য হবে। থিম নিষ্ক্রিয় করলে ডিফল্ট সবুজ রং ব্যবহৃত হবে।
            </p>
          </div>
        </CardContent>
      </Card>

      {gateways.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <Palette className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো পেমেন্ট গেটওয়ে পাওয়া যায়নি</p>
            <p className="text-xs text-muted-foreground mt-1">প্রথমে পেমেন্ট গেটওয়ে যোগ করুন</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Gateway Selection */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">গেটওয়ে নির্বাচন করুন</CardTitle>
                <CardDescription>যে গেটওয়ের থিম পরিবর্তন করতে চান</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {gateways.map((gateway) => {
                  const gwForm = formMap[gateway.id];
                  const isSelected = selectedGatewayId === gateway.id;
                  const defaults = getGatewayDefault(gateway.slug);
                  const isDefault = gwForm ? (
                    gwForm.primaryColor === defaults.primaryColor &&
                    gwForm.buttonColor === defaults.buttonColor &&
                    gwForm.borderColor === defaults.borderColor &&
                    gwForm.backgroundColor === defaults.backgroundColor
                  ) : true;
                  const hasUnsaved = gwForm && savedMap[gateway.id] ? (
                    gwForm.primaryColor !== savedMap[gateway.id].primaryColor ||
                    gwForm.buttonColor !== savedMap[gateway.id].buttonColor ||
                    gwForm.borderColor !== savedMap[gateway.id].borderColor ||
                    gwForm.backgroundColor !== savedMap[gateway.id].backgroundColor ||
                    gwForm.themeEnabled !== savedMap[gateway.id].themeEnabled
                  ) : false;

                  return (
                    <button
                      key={gateway.id}
                      onClick={() => setSelectedGatewayId(gateway.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      {/* Gateway color dot */}
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: gwForm?.themeEnabled ? gwForm.primaryColor : '#6BBF59' }}
                      >
                        {gateway.logo ? (
                          <img src={gateway.logo} alt="" className="h-5 w-5 object-contain rounded" />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {gateway.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{gateway.name}</p>
                          {!gwForm?.themeEnabled && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">নিষ্ক্রিয়</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: gwForm?.primaryColor || '#6BBF59' }} />
                            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: gwForm?.buttonColor || '#6BBF59' }} />
                            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: gwForm?.borderColor || '#6BBF59' }} />
                            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: gwForm?.backgroundColor || '#f0f7ee' }} />
                          </div>
                          {isDefault && gwForm?.themeEnabled && (
                            <span className="text-[9px] text-muted-foreground">ডিফল্ট</span>
                          )}
                          {hasUnsaved && (
                            <span className="text-[9px] text-amber-600">• অসংরক্ষিত</span>
                          )}
                        </div>
                      </div>

                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Center: Color Pickers */}
          <div className="lg:col-span-1 space-y-4">
            {form && selectedGateway ? (
              <>
                {/* Theme Enable Toggle */}
                <Card className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">কাস্টম থিম সক্রিয়</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          নিষ্ক্রিয় করলে ডিফল্ট সবুজ রং ব্যবহৃত হবে
                        </p>
                      </div>
                      <Switch
                        checked={form.themeEnabled}
                        onCheckedChange={(checked) => updateForm('themeEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Color Pickers - only show when theme is enabled */}
                {form.themeEnabled && (
                  <>
                    {/* Primary Color */}
                    <Card className="card-modern">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">প্রাথমিক রং</CardTitle>
                        <CardDescription>কার্ড সিলেকশন, হাইলাইট ও অ্যাকসেন্ট</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={isValidHex(form.primaryColor) ? form.primaryColor : GLOBAL_DEFAULT.primaryColor}
                            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                            style={{ backgroundColor: form.primaryColor }}
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">HEX কোড</Label>
                            <Input
                              placeholder="#E2136E"
                              value={form.primaryColor}
                              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                              className={`font-mono ${!isValidHex(form.primaryColor) ? 'border-red-400' : ''}`}
                              maxLength={7}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 h-3 rounded overflow-hidden">
                          <div className="flex-1" style={{ backgroundColor: form.primaryColor }} />
                          <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.primaryColor) ? form.primaryColor : GLOBAL_DEFAULT.primaryColor, 0.3) }} />
                          <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.primaryColor) ? form.primaryColor : GLOBAL_DEFAULT.primaryColor, 0.6) }} />
                          <div className="flex-1" style={{ backgroundColor: darkenColor(isValidHex(form.primaryColor) ? form.primaryColor : GLOBAL_DEFAULT.primaryColor, 0.2) }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Button Color */}
                    <Card className="card-modern">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">বাটন রং</CardTitle>
                        <CardDescription>&quot;পেমেন্ট জমা দিন&quot; বাটনের রং</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={isValidHex(form.buttonColor) ? form.buttonColor : GLOBAL_DEFAULT.buttonColor}
                            onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                            style={{ backgroundColor: form.buttonColor }}
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">HEX কোড</Label>
                            <Input
                              placeholder="#E2136E"
                              value={form.buttonColor}
                              onChange={(e) => handleColorChange('buttonColor', e.target.value)}
                              className={`font-mono ${!isValidHex(form.buttonColor) ? 'border-red-400' : ''}`}
                              maxLength={7}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 h-3 rounded overflow-hidden">
                          <div className="flex-1" style={{ backgroundColor: form.buttonColor }} />
                          <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(form.buttonColor) ? form.buttonColor : GLOBAL_DEFAULT.buttonColor, 0.3) }} />
                          <div className="flex-1" style={{ backgroundColor: darkenColor(isValidHex(form.buttonColor) ? form.buttonColor : GLOBAL_DEFAULT.buttonColor, 0.15) }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Border/Accent Color */}
                    <Card className="card-modern">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">বর্ডার/অ্যাকসেন্ট রং</CardTitle>
                        <CardDescription>কার্ডের বর্ডার ও অ্যাকসেন্ট</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={isValidHex(form.borderColor) ? form.borderColor : GLOBAL_DEFAULT.borderColor}
                            onChange={(e) => handleColorChange('borderColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                            style={{ backgroundColor: form.borderColor }}
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">HEX কোড</Label>
                            <Input
                              placeholder="#E2136E"
                              value={form.borderColor}
                              onChange={(e) => handleColorChange('borderColor', e.target.value)}
                              className={`font-mono ${!isValidHex(form.borderColor) ? 'border-red-400' : ''}`}
                              maxLength={7}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 h-3 rounded overflow-hidden">
                          <div className="flex-1" style={{ backgroundColor: form.borderColor }} />
                          <div className="flex-1" style={{ backgroundColor: hexToRgba(isValidHex(form.borderColor) ? form.borderColor : GLOBAL_DEFAULT.borderColor, 0.3) }} />
                          <div className="flex-1" style={{ backgroundColor: hexToRgba(isValidHex(form.borderColor) ? form.borderColor : GLOBAL_DEFAULT.borderColor, 0.1) }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Background Color */}
                    <Card className="card-modern">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">ব্যাকগ্রাউন্ড রং</CardTitle>
                        <CardDescription>হাইলাইট ব্যাকগ্রাউন্ড</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={isValidHex(form.backgroundColor) ? form.backgroundColor : GLOBAL_DEFAULT.backgroundColor}
                            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer p-0.5"
                            style={{ backgroundColor: form.backgroundColor }}
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">HEX কোড</Label>
                            <Input
                              placeholder="#FDE8F1"
                              value={form.backgroundColor}
                              onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                              className={`font-mono ${!isValidHex(form.backgroundColor) ? 'border-red-400' : ''}`}
                              maxLength={7}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {hasChanges && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      ⚠ আপনি পরিবর্তন করেছেন যা এখনো সংরক্ষণ করেননি।
                    </p>
                  </div>
                )}
              </>
            ) : (
              <Card className="card-modern">
                <CardContent className="p-6 text-center text-muted-foreground">
                  বাম পাশ থেকে একটি গেটওয়ে নির্বাচন করুন
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-1 space-y-4">
            {form && selectedGateway ? (
              <>
                <Card className="card-modern border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      লাইভ প্রিভিউ
                    </CardTitle>
                    <CardDescription>
                      {selectedGateway.name} — {form.themeEnabled ? 'কাস্টম থিম' : 'ডিফল্ট থিম'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="payment-gateway-module space-y-4 p-4 rounded-lg border border-border bg-background"
                      style={form.themeEnabled ? {
                        '--gateway-primary-color': form.primaryColor,
                        '--gateway-button-color': form.buttonColor,
                        '--gateway-border-color': form.borderColor,
                        '--gateway-bg-color': form.backgroundColor,
                      } as React.CSSProperties : {}}
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
                            style={{ backgroundColor: form.themeEnabled ? form.primaryColor : '#6BBF59' }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{selectedGateway.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {selectedGateway.accountType === 'personal' ? 'পার্সোনাল' : selectedGateway.accountType === 'merchant' ? 'মার্চেন্ট' : 'ব্যাংক'}
                            </p>
                          </div>
                        </div>
                        <div className="gateway-card rounded-lg p-2.5 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0 bg-muted-foreground/30" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">অন্যান্য</p>
                            <p className="text-[10px] text-muted-foreground">অপশন</p>
                          </div>
                        </div>
                      </div>

                      {/* Preview: Gateway Detail Card */}
                      <div className="gateway-detail-card rounded-lg p-3">
                        <p className="gateway-detail-header text-xs font-semibold mb-2">
                          {selectedGateway.name} পেমেন্টের তথ্য
                        </p>
                        <div className="gateway-detail-inner space-y-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">অ্যাকাউন্ট নাম্বার</p>
                            <p className="text-sm font-bold font-mono">{selectedGateway.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">অ্যাকাউন্টের নাম</p>
                            <p className="text-xs font-medium">{selectedGateway.accountName}</p>
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
                          className="gateway-input rounded-md px-3 py-1.5 text-xs bg-white dark:bg-card"
                          style={{ borderColor: form.themeEnabled ? form.borderColor : undefined }}
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
                      <button className="gateway-submit-btn w-full text-sm py-2 rounded-md flex items-center justify-center gap-2">
                        <span>💳</span> পেমেন্ট জমা দিন
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
                <Card className="card-modern">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">রং সারাংশ — {selectedGateway.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: form.themeEnabled ? form.primaryColor : '#6BBF59' }}
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground">প্রাথমিক</p>
                          <p className="text-xs font-mono font-medium">{form.themeEnabled ? form.primaryColor : '#6BBF59'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: form.themeEnabled ? form.buttonColor : '#6BBF59' }}
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground">বাটন</p>
                          <p className="text-xs font-mono font-medium">{form.themeEnabled ? form.buttonColor : '#6BBF59'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: form.themeEnabled ? form.borderColor : '#6BBF59' }}
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground">বর্ডার</p>
                          <p className="text-xs font-mono font-medium">{form.themeEnabled ? form.borderColor : '#6BBF59'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border"
                          style={{ backgroundColor: form.themeEnabled ? form.backgroundColor : '#f0f7ee' }}
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground">ব্যাকগ্রাউন্ড</p>
                          <p className="text-xs font-mono font-medium">{form.themeEnabled ? form.backgroundColor : '#f0f7ee'}</p>
                        </div>
                      </div>
                    </div>

                    {!form.themeEnabled && (
                      <div className="mt-3 p-2 rounded bg-muted border border-border">
                        <p className="text-xs text-muted-foreground">
                          কাস্টম থিম নিষ্ক্রিয় — ডিফল্ট সবুজ রং ব্যবহৃত হবে
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-modern">
                <CardContent className="p-6 text-center text-muted-foreground">
                  গেটওয়ে নির্বাচন করুন প্রিভিউ দেখতে
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
