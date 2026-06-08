'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Shield,
  Award,
  Save,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Globe,
  Languages,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Monitor,
  Smartphone,
  Bell,
  ChevronRight,
  Loader2,
  Hash,
  BadgeCheck,
  Target,
  BarChart3,
  Sprout,
  BookOpen,
  Zap,
  Trophy,
  Medal,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatDate, getInitials, toBanglaNumber, formatBDT } from '@/lib/helpers';
import type { ReputationData, SubscriptionPlan, UserSubscription, PrivacySettings, VisibilityGrant } from '@/lib/types';
import PageHeader from '@/components/shared/PageHeader';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import { useToast } from '@/hooks/use-toast';

// ─── Country Options ─────────────────────────────────
const COUNTRIES = [
  { value: 'BD', label: 'বাংলাদেশ' },
  { value: 'IN', label: 'ভারত' },
  { value: 'PK', label: 'পাকিস্তান' },
  { value: 'NP', label: 'নেপাল' },
  { value: 'LK', label: 'শ্রীলঙ্কা' },
  { value: 'MM', label: 'মিয়ানমার' },
  { value: 'MY', label: 'মালয়েশিয়া' },
  { value: 'SA', label: 'সৌদি আরব' },
  { value: 'AE', label: 'সংযুক্ত আরব আমিরাত' },
  { value: 'US', label: 'যুক্তরাষ্ট্র' },
  { value: 'GB', label: 'যুক্তরাজ্য' },
  { value: 'OTHER', label: 'অন্যান্য' },
];

const LANGUAGES = [
  { value: 'bn', label: 'বাংলা' },
  { value: 'en', label: 'English' },
];

// ─── Member Badge Mapping ──────────────────────────────
const MEMBER_BADGE_MAP: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  new: { icon: <Sprout className="w-4 h-4" />, label: 'নতুন', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/50' },
  beginner: { icon: <BookOpen className="w-4 h-4" />, label: 'শুরু', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-950/50' },
  intermediate: { icon: <Zap className="w-4 h-4" />, label: 'মধ্যম', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50' },
  experienced: { icon: <Trophy className="w-4 h-4" />, label: 'অভিজ্ঞ', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/50' },
  veteran: { icon: <Medal className="w-4 h-4" />, label: 'প্রবীণ', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/50' },
};

// ─── Circular Progress Component ─────────────────────────
function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  const getColor = (v: number) => {
    if (v >= 80) return '#22c55e';
    if (v >= 60) return '#3b82f6';
    if (v >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{toBanglaNumber(value)}</span>
        <span className="text-[10px] text-muted-foreground">স্কোর</span>
      </div>
    </div>
  );
}

// ─── Star Rating Display ──────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${
            i < Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : i < rating
                ? 'text-amber-400 fill-amber-400/50'
                : 'text-muted/40'
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-foreground">
        {toBanglaNumber(parseFloat(rating.toFixed(1)))}
      </span>
    </div>
  );
}

// ─── Profile Form State ──────────────────────────────
interface ProfileFormState {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  languagePreference: string;
  avatar: string;
}

export default function AccountSettingsPage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();

  // ─── State ──────────────────────────────────
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState<ProfileFormState>({
    name: '',
    username: '',
    email: '',
    phone: '',
    country: 'BD',
    languagePreference: 'bn',
    avatar: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Phone change dialog
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(false);

  // Security notifications
  const [securityNotifications, setSecurityNotifications] = useState(true);

  // Reputation
  const [reputation, setReputation] = useState<ReputationData | null>(null);

  // Subscription
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Privacy
  const [privacySettings, setPrivacySettings] = useState<{
    ratingVisibility: string;
    reviewVisibility: string;
    trustScoreVisibility: string;
  }>({
    ratingVisibility: 'private',
    reviewVisibility: 'private',
    trustScoreVisibility: 'private',
  });
  const [visibilityGrantsGiven, setVisibilityGrantsGiven] = useState<VisibilityGrant[]>([]);
  const [visibilityGrantsReceived, setVisibilityGrantsReceived] = useState<VisibilityGrant[]>([]);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [grantActionLoading, setGrantActionLoading] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load Data ──────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAccountProfile();
      const u = data.user || data;
      setProfile({
        name: u.name || '',
        username: u.username || '',
        email: u.email || '',
        phone: u.phone || '',
        country: u.country || 'BD',
        languagePreference: u.languagePreference || 'bn',
        avatar: u.avatar || '',
      });
      setAvatarPreview(u.avatar || '');

      if (data.subscription) {
        setSubscription(data.subscription);
      }
      if (data.plan || data.currentPlan) {
        setCurrentPlan(data.plan || data.currentPlan);
      }
      // Also update store user - use functional update to avoid stale closure
      if (u.name && u.email) {
        setUser((prev) => prev ? { ...prev, ...u } as typeof prev : u as typeof prev);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'প্রোফাইল লোড করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, setUser]);

  const loadReputation = useCallback(async () => {
    try {
      const data = await api.getReputation();
      setReputation(data);
    } catch {
      // Silently fail - reputation tab can show defaults
    }
  }, []);

  const loadPrivacySettings = useCallback(async () => {
    try {
      setPrivacyLoading(true);
      const data = await api.getPrivacySettings();
      // API returns { settings: { ratingVisibility, reviewVisibility, trustScoreVisibility }, ... }
      const s = data.settings || data;
      setPrivacySettings({
        ratingVisibility: s.ratingVisibility || 'private',
        reviewVisibility: s.reviewVisibility || 'private',
        trustScoreVisibility: s.trustScoreVisibility || 'private',
      });
    } catch {
      // Silently fail - privacy tab will show defaults
    } finally {
      setPrivacyLoading(false);
    }
  }, []);

  const loadVisibilityGrants = useCallback(async () => {
    try {
      const [givenData, receivedData] = await Promise.all([
        api.getVisibilityGrants('given'),
        api.getVisibilityGrants('received'),
      ]);
      setVisibilityGrantsGiven(Array.isArray(givenData) ? givenData : givenData?.grants || []);
      setVisibilityGrantsReceived(Array.isArray(receivedData) ? receivedData : receivedData?.grants || []);
    } catch {
      // Silently fail - grants will show empty
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadReputation();
    loadPrivacySettings();
    loadVisibilityGrants();
  }, [loadProfile, loadReputation, loadPrivacySettings, loadVisibilityGrants]);

  // ─── Handlers ───────────────────────────────
  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'নাম খালি রাখা যাবে না', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await api.updateAccountProfile({
        name: profile.name,
        username: profile.username || undefined,
        phone: profile.phone || undefined,
        country: profile.country,
        languagePreference: profile.languagePreference,
        avatar: profile.avatar || undefined,
      });
      toast({ title: 'সফল!', description: 'প্রোফাইল সফলভাবে আপডেট হয়েছে' });
      // Update store using functional update to avoid stale closure
      setUser((prev) => prev ? { ...prev, name: profile.name, username: profile.username, phone: profile.phone, country: profile.country, languagePreference: profile.languagePreference, avatar: profile.avatar } as typeof prev : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'আপডেট করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'ত্রুটি', description: 'শুধুমাত্র ছবি ফাইল আপলোড করুন', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'ত্রুটি', description: 'ছবি ২MB এর বেশি হতে পারবে না', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setProfile((p) => ({ ...p, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'ত্রুটি', description: 'সকল ফিল্ড পূরণ করুন', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'ত্রুটি', description: 'নতুন পাসওয়ার্ড মিলছে না', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'ত্রুটি', description: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', variant: 'destructive' });
      return;
    }
    try {
      setChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      toast({ title: 'সফল!', description: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast({ title: 'ত্রুটি', description: 'সকল ফিল্ড পূরণ করুন', variant: 'destructive' });
      return;
    }
    try {
      setChangingEmail(true);
      await api.changeEmail(newEmail, emailPassword);
      setProfile((p) => ({ ...p, email: newEmail }));
      toast({ title: 'সফল!', description: 'ইমেইল সফলভাবে পরিবর্তন হয়েছে' });
      setEmailDialogOpen(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ইমেইল পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePhone = async () => {
    if (!newPhone) {
      toast({ title: 'ত্রুটি', description: 'ফোন নম্বর দিন', variant: 'destructive' });
      return;
    }
    try {
      setChangingPhone(true);
      await api.changePhone(newPhone);
      setProfile((p) => ({ ...p, phone: newPhone }));
      toast({ title: 'সফল!', description: 'ফোন নম্বর সফলভাবে পরিবর্তন হয়েছে' });
      setPhoneDialogOpen(false);
      setNewPhone('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ফোন নম্বর পরিবর্তন করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setChangingPhone(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await api.logout();
      toast({ title: 'সফল!', description: 'সকল ডিভাইস থেকে লগআউট হয়েছে' });
    } catch {
      toast({ title: 'ত্রুটি', description: 'লগআউট করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
  };

  // ─── Password Strength ─────────────────────────
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 8) score += 20;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
    if (/\d/.test(pwd)) score += 20;
    if (/[^a-zA-Z\d]/.test(pwd)) score += 20;
    if (score <= 20) return { score, label: 'দুর্বল', color: 'bg-red-500' };
    if (score <= 40) return { score, label: 'মাঝারি', color: 'bg-orange-500' };
    if (score <= 60) return { score, label: 'ভালো', color: 'bg-yellow-500' };
    if (score <= 80) return { score, label: 'শক্তিশালী', color: 'bg-green-500' };
    return { score, label: 'অত্যন্ত শক্তিশালী', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  // ─── Loading State ─────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PageHeader title="অ্যাকাউন্ট সেটিংস" icon={<Settings className="h-5 w-5 text-primary" />} backTo="dashboard" />
        <div className="space-y-4">
          <div className="animate-pulse h-10 bg-muted rounded-lg w-64" />
          <div className="animate-pulse h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const memberBadge = reputation?.memberSinceBadge || 'new';
  const memberBadgeInfo = MEMBER_BADGE_MAP[memberBadge] || MEMBER_BADGE_MAP.new;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="অ্যাকাউন্ট সেটিংস"
        subtitle="আপনার প্রোফাইল, নিরাপত্তা ও সুনাম পরিচালনা করুন"
        icon={<Settings className="h-5 w-5 text-primary" />}
        backTo="dashboard"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-10 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="profile" className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm">
            <User className="w-3.5 h-3.5" />
            প্রোফাইল
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            নিরাপত্তা
          </TabsTrigger>
          <TabsTrigger value="reputation" className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm">
            <Award className="w-3.5 h-3.5" />
            সুনাম
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            গোপনীয়তা
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════
            TAB 1: প্রোফাইল (Profile Information)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Header Card */}
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative px-4 sm:px-6 pb-6 -mt-12 sm:-mt-16">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt={profile.name} />
                    ) : (
                      <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary/10 text-primary">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all opacity-80 group-hover:opacity-100"
                    aria-label="প্রোফাইল ছবি পরিবর্তন করুন"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name & Info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                      {profile.name || 'নামহীন ব্যবহারকারী'}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      {user?.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
                      )}
                      <BadgeDisplay plan={currentPlan} size="sm" showLabel={true} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                    {profile.username && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {profile.username}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {profile.email}
                    </span>
                    {user?.createdAt && (
                      <span className="flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5" />
                        সদস্য: {formatDate(user.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                প্রোফাইল তথ্য সম্পাদনা
              </CardTitle>
              <CardDescription>আপনার ব্যক্তিগত তথ্য আপডেট করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* পুরো নাম */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    পুরো নাম
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className="pl-9 h-10"
                      placeholder="আপনার পুরো নাম"
                    />
                  </div>
                </div>

                {/* ইউজারনেম */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    ইউজারনেম
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                      className="pl-8 h-10"
                      placeholder="username"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা ও আন্ডারস্কোর</p>
                </div>

                {/* ইমেইল */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ইমেইল</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.email}
                        readOnly
                        className="pl-9 h-10 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 shrink-0">
                          পরিবর্তন
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            ইমেইল পরিবর্তন
                          </DialogTitle>
                          <DialogDescription>
                            আপনার নতুন ইমেইল এড্রেস এবং পাসওয়ার্ড দিন
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>বর্তমান ইমেইল</Label>
                            <Input value={profile.email} readOnly className="bg-muted/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newEmail">নতুন ইমেইল</Label>
                            <Input
                              id="newEmail"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="new@email.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emailPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                            <Input
                              id="emailPassword"
                              type="password"
                              value={emailPassword}
                              onChange={(e) => setEmailPassword(e.target.value)}
                              placeholder="••••••"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                            বাতিল
                          </Button>
                          <Button onClick={handleChangeEmail} disabled={changingEmail}>
                            {changingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            ইমেইল পরিবর্তন করুন
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* ফোন নম্বর */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ফোন নম্বর</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.phone || 'ফোন নম্বর দেওয়া হয়নি'}
                        readOnly
                        className="pl-9 h-10 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 shrink-0">
                          পরিবর্তন
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-primary" />
                            ফোন নম্বর পরিবর্তন
                          </DialogTitle>
                          <DialogDescription>
                            আপনার নতুন ফোন নম্বর দিন
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="newPhone">নতুন ফোন নম্বর</Label>
                            <Input
                              id="newPhone"
                              type="tel"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              placeholder="+880 1XXX-XXXXXX"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPhoneDialogOpen(false)}>
                            বাতিল
                          </Button>
                          <Button onClick={handleChangePhone} disabled={changingPhone}>
                            {changingPhone && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            ফোন পরিবর্তন করুন
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* দেশ */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">দেশ</Label>
                  <Select
                    value={profile.country}
                    onValueChange={(v) => setProfile((p) => ({ ...p, country: v }))}
                  >
                    <SelectTrigger className="w-full h-10">
                      <Globe className="w-4 h-4 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="দেশ নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ভাষা */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ভাষা</Label>
                  <Select
                    value={profile.languagePreference}
                    onValueChange={(v) => setProfile((p) => ({ ...p, languagePreference: v }))}
                  >
                    <SelectTrigger className="w-full h-10">
                      <Languages className="w-4 h-4 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="ভাষা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* প্রোফাইল ছবি আপলোড */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">প্রোফাইল ছবি</Label>
                <div
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const result = reader.result as string;
                        setAvatarPreview(result);
                        setProfile((p) => ({ ...p, avatar: result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Preview" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium text-foreground">ছবি আপলোড করতে ক্লিক করুন অথবা টেনে আনুন</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP — সর্বোচ্চ ২MB</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Camera className="w-4 h-4 mr-1.5" />
                    ছবি নির্বাচন
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="min-w-[140px] h-10 shadow-md hover:shadow-lg transition-all"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  সংরক্ষণ করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            TAB 2: নিরাপত্তা (Security Settings)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="security" className="space-y-6">
          {/* পাসওয়ার্ড পরিবর্তন */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                পাসওয়ার্ড পরিবর্তন
              </CardTitle>
              <CardDescription>নিয়মিত পাসওয়ার্ড পরিবর্তন আপনার অ্যাকাউন্ট নিরাপদ রাখে</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* বর্তমান পাসওয়ার্ড */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  বর্তমান পাসওয়ার্ড
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-9 pr-10 h-10"
                    placeholder="বর্তমান পাসওয়ার্ড"
                  />
                  <button
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrentPassword ? 'লুকান' : 'দেখান'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* নতুন পাসওয়ার্ড */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  নতুন পাসওয়ার্ড
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10 h-10"
                    placeholder="নতুন পাসওয়ার্ড"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? 'লুকান' : 'দেখান'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Progress value={pwdStrength.score} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground min-w-[80px]">{pwdStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* নতুন পাসওয়ার্ড নিশ্চিত করুন */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10 h-10"
                    placeholder="নতুন পাসওয়ার্ড আবার দিন"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'লুকান' : 'দেখান'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    পাসওয়ার্ড মিলছে না
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    পাসওয়ার্ড মিলেছে
                  </p>
                )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="min-w-[160px] h-10 shadow-md hover:shadow-lg transition-all"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                পাসওয়ার্ড পরিবর্তন করুন
              </Button>
            </CardContent>
          </Card>

          {/* ইমেইল পরিবর্তন */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                ইমেইল পরিবর্তন
              </CardTitle>
              <CardDescription>আপনার লগইন ইমেইল পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">বর্তমান ইমেইল</p>
                    <p className="text-sm font-medium text-foreground truncate">{profile.email}</p>
                  </div>
                </div>
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      ইমেইল পরিবর্তন
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        ইমেইল পরিবর্তন
                      </DialogTitle>
                      <DialogDescription>
                        আপনার নতুন ইমেইল এড্রেস এবং পাসওয়ার্ড দিন
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>বর্তমান ইমেইল</Label>
                        <Input value={profile.email} readOnly className="bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secNewEmail">নতুন ইমেইল</Label>
                        <Input
                          id="secNewEmail"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secEmailPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                        <Input
                          id="secEmailPassword"
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="••••••"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                        বাতিল
                      </Button>
                      <Button onClick={handleChangeEmail} disabled={changingEmail}>
                        {changingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        ইমেইল পরিবর্তন করুন
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* সক্রিয় সেশন */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                সক্রিয় সেশন
              </CardTitle>
              <CardDescription>আপনার বর্তমান লগইন সেশনের তথ্য</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 shrink-0">
                    <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">বর্তমান ডিভাইস</p>
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0">
                        সক্রিয়
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-1)[0] : 'ব্রাউজার'} • এই ডিভাইস
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleLogoutAllDevices}
                className="w-full sm:w-auto h-10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                সকল ডিভাইস থেকে লগআউট
              </Button>
            </CardContent>
          </Card>

          {/* নিরাপত্তা বিজ্ঞপ্তি */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                নিরাপত্তা বিজ্ঞপ্তি
              </CardTitle>
              <CardDescription>সনাতনী লগইন এবং সুরক্ষা সতর্কতা সম্পর্কে বিজ্ঞপ্তি পান</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 shrink-0">
                    <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">নিরাপত্তা সতর্কতা</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      অস্বাভাবিক লগইন এবং অ্যাকাউন্ট পরিবর্তনের বিজ্ঞপ্তি
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securityNotifications}
                  onCheckedChange={setSecurityNotifications}
                  aria-label="নিরাপত্তা বিজ্ঞপ্তি টগল"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            TAB 3: সুনাম (Reputation System)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="reputation" className="space-y-6">
          {/* Trust Score Hero Card */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-card to-primary/5 p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <CircularProgress
                  value={reputation?.trustScore ?? user?.trustScore ?? 0}
                  size={140}
                  strokeWidth={12}
                />
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">ট্রাস্ট স্কোর</h3>
                  <p className="text-sm text-muted-foreground">
                    আপনার বিশ্বস্ততা স্কোর আপনার রেটিং, লেনদেন এবং বিরোধের ভিত্তিতে গণনা করা হয়।
                    উচ্চ স্কোর আপনার বিশ্বস্ততা প্রমাণ করে।
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                    <BadgeDisplay plan={currentPlan} size="md" showLabel={true} />
                    {user?.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        ভেরিফাইড
                      </Badge>
                    )}
                    <Badge className={`${memberBadgeInfo.bg} ${memberBadgeInfo.color} border-0`}>
                      {memberBadgeInfo.icon}
                      <span className="ml-1">{reputation?.memberSinceLabel || memberBadgeInfo.label}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Rating Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ক্রেতা রেটিং */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50 shrink-0">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ক্রেতা রেটিং</p>
                    <p className="text-sm font-semibold text-foreground">Buyer Rating</p>
                  </div>
                </div>
                <StarRating rating={reputation?.buyerRating ?? user?.buyerRating ?? 0} />
              </CardContent>
            </Card>

            {/* বিক্রেতা রেটিং */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/50 shrink-0">
                    <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">বিক্রেতা রেটিং</p>
                    <p className="text-sm font-semibold text-foreground">Seller Rating</p>
                  </div>
                </div>
                <StarRating rating={reputation?.sellerRating ?? user?.sellerRating ?? 0} />
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* মোট রিভিউ */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50 mx-auto mb-2">
                  <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {toBanglaNumber(reputation?.totalReviews ?? user?.totalReviews ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">মোট রিভিউ</p>
              </CardContent>
            </Card>

            {/* সম্পন্ন ডিল */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/50 mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {toBanglaNumber(reputation?.completedDeals ?? user?.completedDeals ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">সম্পন্ন ডিল</p>
              </CardContent>
            </Card>

            {/* সফল লেনদেন */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50 mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {toBanglaNumber(reputation?.successfulTransactions ?? user?.successfulTransactions ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">সফল লেনদেন</p>
              </CardContent>
            </Card>

            {/* বিরোধ হার */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50 mx-auto mb-2">
                  <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {toBanglaNumber(parseFloat((reputation?.disputeRate ?? user?.disputeRate ?? 0).toFixed(1)))}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">বিরোধ হার</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reputation Breakdown */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                সুনামের বিস্তারিত তথ্য
              </CardTitle>
              <CardDescription>আপনার সুনাম স্কোরের বিশদ বিশ্লেষণ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trust Score Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ক্রেতা রেটিং (৪০%)</span>
                  <span className="text-sm font-medium text-foreground">
                    {toBanglaNumber(parseFloat(((reputation?.buyerRating ?? 0) * 20).toFixed(0)))}/১০০
                  </span>
                </div>
                <Progress value={(reputation?.buyerRating ?? 0) * 20} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">সম্পন্ন ডিল (৩০%)</span>
                  <span className="text-sm font-medium text-foreground">
                    {toBanglaNumber(Math.min(100, (reputation?.completedDeals ?? 0) * 2))}/১০০
                  </span>
                </div>
                <Progress value={Math.min(100, (reputation?.completedDeals ?? 0) * 2)} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">নিম্ন বিরোধ হার (৩০%)</span>
                  <span className="text-sm font-medium text-foreground">
                    {toBanglaNumber(Math.max(0, 100 - (reputation?.disputeRate ?? 0) * 10).toFixed(0))}/১০০
                  </span>
                </div>
                <Progress value={Math.max(0, 100 - (reputation?.disputeRate ?? 0) * 10)} className="h-2" />
              </div>

              <Separator />

              {/* Member Badge Explanation */}
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-sm font-medium text-foreground mb-3">সদস্যতা ব্যাজ স্তর</p>
                <div className="space-y-2.5">
                  {Object.entries(MEMBER_BADGE_MAP).map(([key, info]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                        memberBadge === key
                          ? `${info.bg} ${info.color} font-medium`
                          : 'text-muted-foreground'
                      }`}
                    >
                      {info.icon}
                      <span>{info.label}</span>
                      {memberBadge === key && (
                        <Badge variant="secondary" className="ml-auto text-[10px] border-0 bg-background/50">
                          বর্তমান
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {toBanglaNumber(reputation?.totalTransactions ?? 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">মোট লেনদেন</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {toBanglaNumber(reputation?.disputedCount ?? 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">বিরোধিত লেনদেন</p>
                </div>
              </div>

              {/* Subscription Info */}
              {subscription && (
                <>
                  <Separator />
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          সাবস্ক্রিপশন: {currentPlan?.name || 'ফ্রি'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.status === 'active'
                            ? `সক্রিয় — ${subscription.billingCycle === 'monthly' ? 'মাসিক' : 'বার্ষিক'}`
                            : subscription.status === 'cancelled'
                              ? 'বাতিল হয়েছে'
                              : 'মেয়াদোত্তীর্ণ'}
                          {subscription.endDate && ` • মেয়াদ: ${formatDate(subscription.endDate)}`}
                        </p>
                      </div>
                      <BadgeDisplay plan={currentPlan} size="sm" showLabel={false} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            TAB 4: গোপনীয়তা (Privacy Settings)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="privacy" className="space-y-6">
          {/* Rating Visibility */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                রেটিং দৃশ্যমানতা
              </CardTitle>
              <CardDescription>আপনার রেটিং তথ্য কারা দেখতে পাবেন তা নিয়ন্ত্রণ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={privacySettings.ratingVisibility}
                onValueChange={(v) => setPrivacySettings((p) => ({ ...p, ratingVisibility: v }))}
              >
                <SelectTrigger className="w-full h-10">
                  <Eye className="w-4 h-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="দৃশ্যমানতা নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      ব্যক্তিগত — শুধুমাত্র আপনি এবং প্রশাসক দেখতে পাবেন
                    </span>
                  </SelectItem>
                  <SelectItem value="limited">
                    <span className="flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5" />
                      সীমিত — সারসংক্ষেপ সূচক দেখাবে
                    </span>
                  </SelectItem>
                  <SelectItem value="public">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      সর্বজনীন — সকলে দেখতে পারবেন
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                {privacySettings.ratingVisibility === 'private' && '🔒 শুধুমাত্র আপনি এবং প্রশাসক আপনার রেটিং দেখতে পারবেন'}
                {privacySettings.ratingVisibility === 'limited' && '👁️ অন্যরা শুধুমাত্র সারসংক্ষেপ সূচক দেখতে পাবেন (যেমন: "ইতিবাচক রেটিং")'}
                {privacySettings.ratingVisibility === 'public' && '🌐 সকলে আপনার বিস্তারিত রেটিং তথ্য দেখতে পারবেন'}
              </div>
            </CardContent>
          </Card>

          {/* Review Visibility */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                রিভিউ দৃশ্যমানতা
              </CardTitle>
              <CardDescription>আপনার রিভিউ তালিকা কারা দেখতে পাবেন তা নিয়ন্ত্রণ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={privacySettings.reviewVisibility}
                onValueChange={(v) => setPrivacySettings((p) => ({ ...p, reviewVisibility: v }))}
              >
                <SelectTrigger className="w-full h-10">
                  <Eye className="w-4 h-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="দৃশ্যমানতা নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      ব্যক্তিগত — কেউ রিভিউ দেখতে পারবে না
                    </span>
                  </SelectItem>
                  <SelectItem value="shared">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      শেয়ারকৃত — শুধুমাত্র অনুমোদিত ব্যবহারকারীরা
                    </span>
                  </SelectItem>
                  <SelectItem value="public">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      সর্বজনীন — সকলে দেখতে পারবেন
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                {privacySettings.reviewVisibility === 'private' && '🔒 কেউ আপনার রিভিউ দেখতে পারবে না'}
                {privacySettings.reviewVisibility === 'shared' && '🤝 শুধুমাত্র অনুমোদিত ব্যবহারকারীরা আপনার রিভিউ দেখতে পারবেন'}
                {privacySettings.reviewVisibility === 'public' && '🌐 সকলে আপনার রিভিউ তালিকা দেখতে পারবেন'}
              </div>
            </CardContent>
          </Card>

          {/* Trust Score Visibility */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                ট্রাস্ট স্কোর দৃশ্যমানতা
              </CardTitle>
              <CardDescription>আপনার ট্রাস্ট স্কোর কারা দেখতে পাবেন তা নিয়ন্ত্রণ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={privacySettings.trustScoreVisibility}
                onValueChange={(v) => setPrivacySettings((p) => ({ ...p, trustScoreVisibility: v }))}
              >
                <SelectTrigger className="w-full h-10">
                  <Eye className="w-4 h-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="দৃশ্যমানতা নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      ব্যক্তিগত
                    </span>
                  </SelectItem>
                  <SelectItem value="limited">
                    <span className="flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5" />
                      সীমিত
                    </span>
                  </SelectItem>
                  <SelectItem value="public">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      সর্বজনীন
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                {privacySettings.trustScoreVisibility === 'private' && '🔒 আপনার ট্রাস্ট স্কোর কেউ দেখতে পারবে না'}
                {privacySettings.trustScoreVisibility === 'limited' && '👁️ অন্যরা শুধুমাত্র সূচক দেখতে পাবেন (যেমন: "বিশ্বস্ত ব্যবহারকারী")'}
                {privacySettings.trustScoreVisibility === 'public' && '🌐 সকলে আপনার বিস্তারিত ট্রাস্ট স্কোর দেখতে পারবেন'}
              </div>
            </CardContent>
          </Card>

          {/* Visibility Grants */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                দৃশ্যমানতা অনুদান
              </CardTitle>
              <CardDescription>
                আপনার রিভিউ দেখার জন্য অনুমোদিত ব্যবহারকারীদের পরিচালনা করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Grants Given */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  প্রদত্ত অনুদান ({toBanglaNumber(visibilityGrantsGiven.length)})
                </h4>
                {visibilityGrantsGiven.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/20 text-center text-sm text-muted-foreground">
                    কোনো অনুদান দেওয়া হয়নি
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {visibilityGrantsGiven.map((grant) => (
                      <div
                        key={grant.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 shrink-0">
                            {grant.grantee?.avatar ? (
                              <AvatarImage src={grant.grantee.avatar} alt={grant.grantee.name} />
                            ) : (
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {getInitials(grant.grantee?.name || '?')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {grant.grantee?.name || 'অজানা'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {grant.review?.reviewType === 'buyer' ? 'ক্রেতা রিভিউ' :
                               grant.review?.reviewType === 'seller' ? 'বিক্রেতা রিভিউ' : 'রিভিউ'}
                              {grant.review?.rating ? ` • ⭐ ${grant.review.rating}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={grant.status === 'accepted' ? 'default' : grant.status === 'pending' ? 'secondary' : 'outline'}
                            className="text-[10px] px-2"
                          >
                            {grant.status === 'accepted' ? 'গৃহীত' : grant.status === 'pending' ? 'অপেক্ষমান' : 'বাতিল'}
                          </Badge>
                          {grant.status === 'accepted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              disabled={grantActionLoading === grant.id}
                              onClick={async () => {
                                try {
                                  setGrantActionLoading(grant.id);
                                  await api.respondToVisibilityGrant(grant.id, 'revoke');
                                  toast({ title: 'সফল!', description: 'অনুদান বাতিল করা হয়েছে' });
                                  loadVisibilityGrants();
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : 'বাতিল করতে সমস্যা হয়েছে';
                                  toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
                                } finally {
                                  setGrantActionLoading(null);
                                }
                              }}
                            >
                              {grantActionLoading === grant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'বাতিল'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Grants Received */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  প্রাপ্ত অনুদান ({toBanglaNumber(visibilityGrantsReceived.length)})
                </h4>
                {visibilityGrantsReceived.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/20 text-center text-sm text-muted-foreground">
                    কোনো অনুদান পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {visibilityGrantsReceived.map((grant) => (
                      <div
                        key={grant.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 shrink-0">
                            {grant.grantor?.avatar ? (
                              <AvatarImage src={grant.grantor.avatar} alt={grant.grantor.name} />
                            ) : (
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {getInitials(grant.grantor?.name || '?')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {grant.grantor?.name || 'অজানা'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {grant.review?.reviewType === 'buyer' ? 'ক্রেতা রিভিউ' :
                               grant.review?.reviewType === 'seller' ? 'বিক্রেতা রিভিউ' : 'রিভিউ'}
                              {grant.review?.rating ? ` • ⭐ ${grant.review.rating}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={grant.status === 'accepted' ? 'default' : grant.status === 'pending' ? 'secondary' : 'outline'}
                            className="text-[10px] px-2"
                          >
                            {grant.status === 'accepted' ? 'গৃহীত' : grant.status === 'pending' ? 'অপেক্ষমান' : 'বাতিল'}
                          </Badge>
                          {grant.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs px-2"
                                disabled={grantActionLoading === grant.id}
                                onClick={async () => {
                                  try {
                                    setGrantActionLoading(grant.id);
                                    await api.respondToVisibilityGrant(grant.id, 'accept');
                                    toast({ title: 'সফল!', description: 'অনুদান গ্রহণ করা হয়েছে' });
                                    loadVisibilityGrants();
                                  } catch (err) {
                                    const message = err instanceof Error ? err.message : 'গ্রহণ করতে সমস্যা হয়েছে';
                                    toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
                                  } finally {
                                    setGrantActionLoading(null);
                                  }
                                }}
                              >
                                {grantActionLoading === grant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'গ্রহণ'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                disabled={grantActionLoading === grant.id}
                                onClick={async () => {
                                  try {
                                    setGrantActionLoading(grant.id);
                                    await api.respondToVisibilityGrant(grant.id, 'reject');
                                    toast({ title: 'সফল!', description: 'অনুদান প্রত্যাখ্যান করা হয়েছে' });
                                    loadVisibilityGrants();
                                  } catch (err) {
                                    const message = err instanceof Error ? err.message : 'প্রত্যাখ্যান করতে সমস্যা হয়েছে';
                                    toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
                                  } finally {
                                    setGrantActionLoading(null);
                                  }
                                }}
                              >
                                প্রত্যাখ্যান
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Save Privacy Settings */}
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  setPrivacySaving(true);
                  await api.updatePrivacySettings({
                    ratingVisibility: privacySettings.ratingVisibility,
                    reviewVisibility: privacySettings.reviewVisibility,
                    trustScoreVisibility: privacySettings.trustScoreVisibility,
                  });
                  toast({ title: 'সফল!', description: 'গোপনীয়তা সেটিংস সফলভাবে আপডেট হয়েছে' });
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'আপডেট করতে সমস্যা হয়েছে';
                  toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
                } finally {
                  setPrivacySaving(false);
                }
              }}
              disabled={privacySaving || privacyLoading}
              className="min-w-[140px] h-10 shadow-md hover:shadow-lg transition-all"
            >
              {privacySaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              সংরক্ষণ করুন
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
