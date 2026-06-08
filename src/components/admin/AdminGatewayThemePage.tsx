'use client';

import { useEffect, useState, useCallback } from 'react';
import { Palette, RotateCcw, Save, Loader2, Eye, Info, Check, Smartphone, Monitor } from 'lucide-react';
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
import { getGatewayLogoComponent, getGatewayBrandColor } from '@/components/payments/GatewayLogos';
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
  const [activeTab, setActiveTab] = useState('colors');

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="card-modern animate-pulse">
              <CardContent className="p-4 sm:p-6">
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
    <div className="page-container space-y-4 sm:space-y-6">
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
              className="gap-1.5 min-h-[40px]"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">ডিফল্টে ফিরুন</span>
              <span className="sm:hidden">রিসেট</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="gap-1.5 min-h-[40px]"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  সংরক্ষণ...
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
        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">প্রতিটি গেটওয়ের নিজস্ব থিম</p>
            <p className="text-xs text-muted-foreground mt-1">
              প্রতিটি পেমেন্ট গেটওয়ের জন্য আলাদা রং সেট করুন। থিম নিষ্ক্রিয় করলে ডিফল্ট সবুজ রং ব্যবহৃত হবে।
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Left: Gateway Selection - Always visible */}
          <div className="lg:col-span-3 space-y-3">
            <Card className="card-modern">
              <CardHeader className="pb-2 p-3 sm:p-4 sm:pb-3">
                <CardTitle className="text-sm sm:text-base">গেটওয়ে নির্বাচন</CardTitle>
                <CardDescription className="text-xs">যে গেটওয়ের থিম পরিবর্তন করতে চান</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 p-3 sm:p-4 pt-0">
                {gateways.map((gateway) => {
                  const gwForm = formMap[gateway.id];
                  const isSelected = selectedGatewayId === gateway.id;
                  const brandColor = getGatewayBrandColor(gateway.slug);
                  const LogoComponent = getGatewayLogoComponent(gateway.slug);
                  const defaults = getGatewayDefault(gateway.slug);
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
                      className={`w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      {/* Gateway logo */}
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: gwForm?.themeEnabled ? `${gwForm.primaryColor}15` : '#6BBF5915' }}
                      >
                        {gateway.logo ? (
                          <img src={gateway.logo} alt="" className="h-full w-full object-contain rounded-lg" />
                        ) : LogoComponent ? (
                          <LogoComponent size={40} />
                        ) : (
                          <span className="text-white text-xs font-bold rounded-lg w-full h-full flex items-center justify-center" style={{ backgroundColor: gwForm?.themeEnabled ? gwForm.primaryColor : '#6BBF59' }}>
                            {gateway.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-medium truncate">{gateway.name}</p>
                          {!gwForm?.themeEnabled && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0">নিষ্ক্রিয়</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex gap-0.5">
                            <div className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: gwForm?.primaryColor || '#6BBF59' }} />
                            <div className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: gwForm?.buttonColor || '#6BBF59' }} />
                            <div className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: gwForm?.backgroundColor || '#f0f7ee' }} />
                          </div>
                          {hasUnsaved && (
                            <span className="text-[9px] text-amber-600 font-medium">• অসংরক্ষিত</span>
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

          {/* Center + Right: Color Pickers + Preview */}
          <div className="lg:col-span-9">
            {form && selectedGateway ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4 grid grid-cols-2">
                  <TabsTrigger value="colors" className="gap-1.5 text-xs sm:text-sm">
                    <Palette className="h-3.5 w-3.5" />
                    রং কনফিগারেশন
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1.5 text-xs sm:text-sm">
                    <Eye className="h-3.5 w-3.5" />
                    লাইভ প্রিভিউ
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theme Enable Toggle */}
                    <Card className="card-modern md:col-span-2">
                      <CardContent className="p-3 sm:p-4">
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

                    {form.themeEnabled && (
                      <>
                        {/* Primary Color */}
                        <ColorPickerCard
                          title="প্রাথমিক রং"
                          description="কার্ড সিলেকশন, হাইলাইট ও অ্যাকসেন্ট"
                          value={form.primaryColor}
                          onChange={(v) => handleColorChange('primaryColor', v)}
                        />
                        {/* Button Color */}
                        <ColorPickerCard
                          title="বাটন রং"
                          description="&quot;পেমেন্ট জমা দিন&quot; বাটনের রং"
                          value={form.buttonColor}
                          onChange={(v) => handleColorChange('buttonColor', v)}
                        />
                        {/* Border Color */}
                        <ColorPickerCard
                          title="বর্ডার/অ্যাকসেন্ট রং"
                          description="কার্ডের বর্ডার ও অ্যাকসেন্ট"
                          value={form.borderColor}
                          onChange={(v) => handleColorChange('borderColor', v)}
                        />
                        {/* Background Color */}
                        <ColorPickerCard
                          title="ব্যাকগ্রাউন্ড রং"
                          description="হাইলাইট ব্যাকগ্রাউন্ড"
                          value={form.backgroundColor}
                          onChange={(v) => handleColorChange('backgroundColor', v)}
                        />
                      </>
                    )}
                  </div>

                  {hasChanges && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠ আপনি পরিবর্তন করেছেন যা এখনো সংরক্ষণ করেননি।
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="mt-0 space-y-4">
                  <Card className="card-modern border-primary/20">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        লাইভ প্রিভিউ
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedGateway.name} — {form.themeEnabled ? 'কাস্টম থিম' : 'ডিফল্ট থিম'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div
                        className="payment-gateway-module space-y-3 p-3 sm:p-4 rounded-xl border border-border bg-background"
                        style={form.themeEnabled ? {
                          '--gateway-primary-color': form.primaryColor,
                          '--gateway-button-color': form.buttonColor,
                          '--gateway-border-color': form.borderColor,
                          '--gateway-bg-color': form.backgroundColor,
                        } as React.CSSProperties : {}}
                      >
                        {/* Preview: Gateway Header */}
                        <div className="gateway-header-accent">
                          <h3 className="gateway-section-title text-sm">পেমেন্ট জমা দিন</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">আপনার পেমেন্টের বিবরণ পূরণ করুন</p>
                        </div>

                        {/* Preview: Gateway Cards */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="gateway-card gateway-card-selected rounded-xl p-2.5 flex items-center gap-2">
                            <div
                              className="gateway-logo-container"
                              style={{ width: 32, height: 32, borderRadius: 8 }}
                            >
                              <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: form.themeEnabled ? form.primaryColor : '#6BBF59' }}>
                                <span className="text-white text-[8px] font-bold">{selectedGateway.name.charAt(0)}</span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold truncate">{selectedGateway.name}</p>
                              <p className="text-[8px] text-muted-foreground">
                                {selectedGateway.accountType === 'personal' ? 'পার্সোনাল' : selectedGateway.accountType === 'merchant' ? 'মার্চেন্ট' : 'ব্যাংক'}
                              </p>
                            </div>
                          </div>
                          <div className="gateway-card rounded-xl p-2.5 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted-foreground/15 flex items-center justify-center">
                              <span className="text-muted-foreground text-[8px]">+</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium truncate text-muted-foreground">অন্যান্য</p>
                            </div>
                          </div>
                        </div>

                        {/* Preview: Detail Card */}
                        <div className="gateway-detail-card rounded-xl p-2.5">
                          <p className="gateway-detail-header text-[10px] font-semibold mb-1.5">
                            {selectedGateway.name} পেমেন্টের তথ্য
                          </p>
                          <div className="gateway-detail-inner space-y-1.5 p-2">
                            <div>
                              <p className="text-[8px] text-muted-foreground">অ্যাকাউন্ট নাম্বার</p>
                              <p className="text-xs font-bold font-mono">{selectedGateway.accountNumber}</p>
                            </div>
                          </div>
                        </div>

                        {/* Preview: Instructions */}
                        <div className="gateway-instructions flex items-start gap-1.5 p-2">
                          <span className="instructions-icon text-[10px]">ℹ</span>
                          <p className="instructions-text text-[9px]">
                            উপরের নাম্বারে <strong>Send Money</strong> করুন
                          </p>
                        </div>

                        {/* Preview: Input */}
                        <div>
                          <p className="text-[8px] text-muted-foreground mb-0.5">ট্রানজেকশন আইডি</p>
                          <div className="gateway-input rounded-lg px-2.5 py-1.5 text-[10px] bg-white dark:bg-card">
                            TXN123456789
                          </div>
                        </div>

                        <Separator />

                        {/* Preview: Submit Button */}
                        <button className="gateway-submit-btn w-full text-xs py-2 rounded-lg flex items-center justify-center gap-1.5">
                          💳 পেমেন্ট জমা দিন
                        </button>

                        {/* Preview: Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="gateway-badge-pending text-[8px]">অপেক্ষমাণ</span>
                          <span className="gateway-badge-verified text-[8px]">যাচাইকৃত</span>
                          <span className="gateway-badge-rejected text-[8px]">প্রত্যাখ্যাত</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Color Summary */}
                  <Card className="card-modern">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm">রং সারাংশ — {selectedGateway.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {[
                          { label: 'প্রাথমিক', color: form.themeEnabled ? form.primaryColor : '#6BBF59' },
                          { label: 'বাটন', color: form.themeEnabled ? form.buttonColor : '#6BBF59' },
                          { label: 'বর্ডার', color: form.themeEnabled ? form.borderColor : '#6BBF59' },
                          { label: 'ব্যাকগ্রাউন্ড', color: form.themeEnabled ? form.backgroundColor : '#f0f7ee' },
                        ].map(({ label, color }) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md border shrink-0" style={{ backgroundColor: color }} />
                            <div className="min-w-0">
                              <p className="text-[9px] text-muted-foreground">{label}</p>
                              <p className="text-[10px] font-mono font-medium truncate">{color}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!form.themeEnabled && (
                        <div className="mt-2 p-2 rounded-lg bg-muted border border-border">
                          <p className="text-[10px] text-muted-foreground">
                            কাস্টম থিম নিষ্ক্রিয় — ডিফল্ট সবুজ রং ব্যবহৃত হবে
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="card-modern">
                <CardContent className="p-6 text-center text-muted-foreground">
                  গেটওয়ে নির্বাচন করুন থিম কনফিগার করতে
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Color Picker Card Component ──────────────────────────
function ColorPickerCard({ 
  title, 
  description, 
  value, 
  onChange 
}: { 
  title: string; 
  description: string; 
  value: string; 
  onChange: (v: string) => void;
}) {
  return (
    <Card className="card-modern">
      <CardHeader className="pb-2 p-3 sm:p-4">
        <CardTitle className="text-xs sm:text-sm">{title}</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-3 sm:p-4 pt-0">
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={isValidHex(value) ? value : GLOBAL_DEFAULT.primaryColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-border cursor-pointer p-0.5 shrink-0"
            style={{ backgroundColor: value }}
          />
          <div className="flex-1 min-w-0">
            <Label className="text-[10px] text-muted-foreground">HEX কোড</Label>
            <Input
              placeholder="#E2136E"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`font-mono text-sm ${!isValidHex(value) ? 'border-red-400' : ''}`}
              maxLength={7}
            />
          </div>
        </div>
        <div className="flex gap-1 h-2.5 rounded overflow-hidden">
          <div className="flex-1" style={{ backgroundColor: value }} />
          <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(value) ? value : GLOBAL_DEFAULT.primaryColor, 0.3) }} />
          <div className="flex-1" style={{ backgroundColor: lightenColor(isValidHex(value) ? value : GLOBAL_DEFAULT.primaryColor, 0.6) }} />
          <div className="flex-1" style={{ backgroundColor: darkenColor(isValidHex(value) ? value : GLOBAL_DEFAULT.primaryColor, 0.2) }} />
        </div>
      </CardContent>
    </Card>
  );
}
