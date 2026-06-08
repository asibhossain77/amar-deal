'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Settings, Loader2, Save, RotateCcw, Globe, Image as ImageIcon, 
  Shield, Search, Upload, X, Eye, Info, Trash2, CheckCircle2,
  Monitor, Smartphone, Palette, FileText, Copyright, Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { SiteSettings } from '@/lib/store';
import { DEFAULT_SITE_SETTINGS } from '@/lib/store';
import { getSiteName, getSiteCopyright, getSeoMetaTitle, getSeoMetaDescription, SITE_DEFAULTS } from '@/lib/site-defaults';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Image Upload Component
function ImageUploadField({ 
  label, 
  description, 
  value, 
  onChange, 
  onDelete,
  previewHeight = 'h-32',
}: { 
  label: string; 
  description: string; 
  value: string; 
  onChange: (v: string) => void; 
  onDelete: () => void;
  previewHeight?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('শুধুমাত্র PNG, JPG, JPEG, SVG, WebP ফাইল গ্রহণযোগ্য');
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`ফাইল সাইজ ${formatFileSize(MAX_FILE_SIZE)} এর কম হতে হবে। আপনার ফাইল: ${formatFileSize(file.size)}`);
    }

    setIsUploading(true);
    setUploadProgress(10);

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 90) + 10);
        }
      };
      reader.onloadend = () => {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          resolve(reader.result as string);
        }, 300);
      };
      reader.onerror = () => {
        setIsUploading(false);
        setUploadProgress(0);
        reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processFile(file);
      onChange(base64);
    } catch (err) {
      // Will be caught by parent
      throw err;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const base64 = await processFile(file);
      onChange(base64);
    } catch (err) {
      throw err;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Image Preview */}
      {value && (
        <div className="relative group">
          <div className={`${previewHeight} rounded-xl border-2 border-border overflow-hidden bg-muted`}>
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0 rounded-md"
              onClick={() => {
                // Open in new tab for full preview
                const w = window.open('');
                if (w) {
                  w.document.write(`<img src="${value}" style="max-width:100%;max-height:100vh;margin:auto;display:block" />`);
                }
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 w-7 p-0 rounded-md"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin" />
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">আপলোড হচ্ছে... {uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {value ? 'ইমেজ পরিবর্তন করুন' : 'ইমেজ আপলোড করুন'}
            </p>
            <p className="text-xs text-muted-foreground">
              ড্র্যাগ ও ড্রপ অথবা ক্লিক করুন
            </p>
            <p className="text-[10px] text-muted-foreground">
              PNG, JPG, SVG, WebP • সর্বোচ্চ 2MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULT_SITE_SETTINGS });
  const [savedSettings, setSavedSettings] = useState<SiteSettings>({ ...DEFAULT_SITE_SETTINGS });

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminSiteSettings();
      const s = data.settings || data;
      setSettings({ ...DEFAULT_SITE_SETTINGS, ...s });
      setSavedSettings({ ...DEFAULT_SITE_SETTINGS, ...s });
    } catch {
      toast({ title: 'ত্রুটি', description: 'সেটিংস লোড করতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateAdminSiteSettings(settings as Record<string, string>);
      setSavedSettings({ ...settings });
      toast({
        title: 'সফল!',
        description: 'ওয়েবসাইট সেটিংস সফলভাবে আপডেট হয়েছে',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'সেটিংস আপডেট করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...savedSettings });
    toast({ title: 'রিসেট', description: 'পরিবর্তনগুলো বাতিল করা হয়েছে' });
  };

  const handleImageDelete = async (key: keyof SiteSettings) => {
    try {
      await api.deleteSiteImage(key);
      setSettings(prev => ({ ...prev, [key]: '' }));
      setSavedSettings(prev => ({ ...prev, [key]: '' }));
      toast({ title: 'সফল!', description: 'ইমেজ সফলভাবে মুছে ফেলা হয়েছে' });
    } catch {
      toast({ title: 'ত্রুটি', description: 'ইমেজ মুছতে সমস্যা হয়েছে', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader
          title="ওয়েবসাইট সেটিংস"
          subtitle="লোড হচ্ছে..."
          icon={<Settings className="h-5 w-5 text-primary animate-spin" />}
        />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="card-modern animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-40 rounded bg-muted" />
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
        title="ওয়েবসাইট সেটিংস"
        subtitle="ওয়েবসাইটের ব্র্যান্ডিং ও কনফিগারেশন পরিচালনা করুন"
        icon={<Settings className="h-5 w-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || !hasChanges}
              className="gap-1.5 min-h-[40px]"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">বাতিল</span>
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

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 flex items-center gap-2 animate-fade-in">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            আপনি অসংরক্ষিত পরিবর্তন করেছেন। সংরক্ষণ করতে &quot;সংরক্ষণ করুন&quot; বাটনে ক্লিক করুন।
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="branding" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ব্র্যান্ডিং</span>
            <span className="sm:hidden">ব্র্যান্ড</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5 text-xs sm:text-sm">
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ইমেজ</span>
            <span className="sm:hidden">ইমেজ</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5 text-xs sm:text-sm">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SEO</span>
            <span className="sm:hidden">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5 text-xs sm:text-sm">
            <Wrench className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">অ্যাডভান্সড</span>
            <span className="sm:hidden">অ্যাডভান্স</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Branding ═══ */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                ওয়েবসাইট তথ্য
              </CardTitle>
              <CardDescription className="text-xs">ওয়েবসাইটের নাম ও বিবরণ পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-sm font-semibold">ওয়েবসাইটের নাম</Label>
                <Input
                  id="site_name"
                  placeholder={`যেমন: ${SITE_DEFAULTS.site_name}`}
                  value={settings.site_name}
                  onChange={(e) => updateField('site_name', e.target.value)}
                  className="min-h-[44px]"
                />
                <p className="text-[10px] text-muted-foreground">এই নাম ব্রাউজার টাইটেল, নেভিগেশন, ফুটার ও লগইন পেজে দেখাবে</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_tagline" className="text-sm font-semibold">ট্যাগলাইন / সংক্ষিপ্ত বিবরণ</Label>
                <Textarea
                  id="site_tagline"
                  placeholder="আপনার ওয়েবসাইটের সংক্ষিপ্ত বিবরণ লিখুন"
                  value={settings.site_tagline}
                  onChange={(e) => updateField('site_tagline', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_copyright" className="text-sm font-semibold flex items-center gap-1.5">
                  <Copyright className="h-3.5 w-3.5" />
                  কপিরাইট টেক্সট
                </Label>
                <Input
                  id="site_copyright"
                  placeholder={`যেমন: ${SITE_DEFAULTS.site_copyright}`}
                  value={settings.site_copyright}
                  onChange={(e) => updateField('site_copyright', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="card-modern border-primary/20">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                লাইভ প্রিভিউ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="border rounded-xl overflow-hidden bg-background">
                {/* Preview Header */}
                <div className="flex items-center gap-2.5 p-3 border-b bg-muted/30">
                  {settings.site_logo ? (
                    <img src={settings.site_logo} alt="Logo" className="h-7 w-7 object-contain rounded" />
                  ) : (
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-bold">{getSiteName(settings.site_name)}</span>
                </div>
                {/* Preview Body */}
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-full rounded bg-muted" />
                  <div className="h-2 w-2/3 rounded bg-muted" />
                </div>
                {/* Preview Footer */}
                <div className="p-3 border-t bg-muted/30">
                  <p className="text-[9px] text-muted-foreground truncate">{getSiteCopyright(settings.site_copyright)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2: Images ═══ */}
        <TabsContent value="images" className="space-y-4 mt-4">
          {/* Website Logo */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                ওয়েবসাইট লোগো
              </CardTitle>
              <CardDescription className="text-xs">নেভিগেশন বার, ফুটার ও ড্যাশবোর্ডে দেখাবে</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <ImageUploadField
                label="লোগো"
                description="PNG, SVG বা WebP ফরম্যাটে আপলোড করুন (পারদর্শী ব্যাকগ্রাউন্ড সুপারিশ)"
                value={settings.site_logo}
                onChange={(v) => updateField('site_logo', v)}
                onDelete={() => handleImageDelete('site_logo')}
                previewHeight="h-24"
              />
            </CardContent>
          </Card>

          {/* Favicon */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                ফেভিকন
              </CardTitle>
              <CardDescription className="text-xs">ব্রাউজার ট্যাবে দেখাবে (32x32 বা 64x64 সুপারিশ)</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <ImageUploadField
                label="ফেভিকন"
                description="ছোট আকারের ICO, PNG বা SVG ফাইল"
                value={settings.site_favicon}
                onChange={(v) => updateField('site_favicon', v)}
                onDelete={() => handleImageDelete('site_favicon')}
                previewHeight="h-20"
              />
            </CardContent>
          </Card>

          {/* Banner */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                ব্যানার / কভার ইমেজ
              </CardTitle>
              <CardDescription className="text-xs">হোমপেজ ব্যানার বা কভার ইমেজ</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <ImageUploadField
                label="ব্যানার"
                description="1200x400 বা তার বেশি রেজোলিউশন সুপারিশ"
                value={settings.site_banner}
                onChange={(v) => updateField('site_banner', v)}
                onDelete={() => handleImageDelete('site_banner')}
                previewHeight="h-32"
              />
            </CardContent>
          </Card>

          {/* Login Background */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                লগইন পেজ ব্যাকগ্রাউন্ড
              </CardTitle>
              <CardDescription className="text-xs">লগইন ও রেজিস্ট্রেশন পেজের ব্যাকগ্রাউন্ড ইমেজ</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <ImageUploadField
                label="লগইন ব্যাকগ্রাউন্ড"
                description="ফুল-স্ক্রিন ব্যাকগ্রাউন্ড ইমেজ (1920x1080 সুপারিশ)"
                value={settings.site_login_bg}
                onChange={(v) => updateField('site_login_bg', v)}
                onDelete={() => handleImageDelete('site_login_bg')}
                previewHeight="h-32"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 3: SEO ═══ */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                SEO সেটিংস
              </CardTitle>
              <CardDescription className="text-xs">সার্চ ইঞ্জিন অপটিমাইজেশন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="seo_meta_title" className="text-sm font-semibold">Meta Title</Label>
                <Input
                  id="seo_meta_title"
                  placeholder={`যেমন: ${SITE_DEFAULTS.seo_meta_title}`}
                  value={settings.seo_meta_title}
                  onChange={(e) => updateField('seo_meta_title', e.target.value)}
                  className="min-h-[44px]"
                  maxLength={70}
                />
                <div className="flex justify-between">
                  <p className="text-[10px] text-muted-foreground">ব্রাউজার ট্যাব ও সার্চ রেজাল্টে দেখাবে</p>
                  <p className="text-[10px] text-muted-foreground">{settings.seo_meta_title.length}/70</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_meta_description" className="text-sm font-semibold">Meta Description</Label>
                <Textarea
                  id="seo_meta_description"
                  placeholder="সার্চ ইঞ্জিনে দেখানোর জন্য সংক্ষিপ্ত বিবরণ"
                  value={settings.seo_meta_description}
                  onChange={(e) => updateField('seo_meta_description', e.target.value)}
                  rows={3}
                  maxLength={160}
                  className="resize-none"
                />
                <div className="flex justify-between">
                  <p className="text-[10px] text-muted-foreground">সার্চ রেজাল্টে বিবরণ হিসেবে দেখাবে</p>
                  <p className="text-[10px] text-muted-foreground">{settings.seo_meta_description.length}/160</p>
                </div>
              </div>

              {/* SEO Preview */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Google সার্চ প্রিভিউ</Label>
                <div className="p-3 rounded-lg border bg-white dark:bg-card">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium truncate">
                    {getSeoMetaTitle(settings.seo_meta_title)}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 truncate mt-0.5">
                    yourdomain.com
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {getSeoMetaDescription(settings.seo_meta_description)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: Advanced ═══ */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          {/* Maintenance Mode */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                মেইনটেন্যান্স মোড
              </CardTitle>
              <CardDescription className="text-xs">ওয়েবসাইট সাময়িকভাবে রক্ষণাবেক্ষণের জন্য বন্ধ করুন</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">মেইনটেন্যান্স মোড সক্রিয় করুন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    সক্রিয় করলে সাধারণ ব্যবহারকারীরা ওয়েবসাইট দেখতে পারবেন না। অ্যাডমিন প্যানেল সচল থাকবে।
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode === 'true'}
                  onCheckedChange={(checked) => updateField('maintenance_mode', checked ? 'true' : 'false')}
                />
              </div>
              {settings.maintenance_mode === 'true' && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠ মেইনটেন্যান্স মোড সক্রিয় আছে। সাধারণ ব্যবহারকারীরা সাইট অ্যাক্সেস করতে পারবেন না।
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Settings Summary */}
          <Card className="card-modern">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                সেটিংস সারাংশ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">সাইটের নাম</p>
                    <p className="font-medium truncate">{settings.site_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">লোগো</p>
                    <p className="font-medium">{settings.site_logo ? '✓ আপলোড করা হয়েছে' : '✗ নেই'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Monitor className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">ফেভিকন</p>
                    <p className="font-medium">{settings.site_favicon ? '✓ আপলোড করা হয়েছে' : '✗ নেই'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">মেইনটেন্যান্স</p>
                    <Badge variant={settings.maintenance_mode === 'true' ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0">
                      {settings.maintenance_mode === 'true' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
