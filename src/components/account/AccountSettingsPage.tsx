'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Shield,
  CheckCircle2,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  LogOut,
  Loader2,
  Hash,
  BadgeCheck,
  Settings,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  XCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  ShieldCheck,
  IdCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import { formatDate, getInitials, toBanglaNumber } from '@/lib/helpers';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/hooks/use-toast';

// ─── Document Type Options ──────────────────────────────
const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'জাতীয় পরিচয়পত্র (NID)' },
  { value: 'passport', label: 'পাসপোর্ট' },
  { value: 'driving_license', label: 'ড্রাইভিং লাইসেন্স' },
];

// ─── Password Strength Calculator ─────────────────────────
function getPasswordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '', textColor: '' };
  let score = 0;
  if (pwd.length >= 6) score += 20;
  if (pwd.length >= 8) score += 20;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
  if (/\d/.test(pwd)) score += 20;
  if (/[^a-zA-Z\d]/.test(pwd)) score += 20;
  if (score <= 20) return { score, label: 'দুর্বল', color: 'bg-red-500', textColor: 'text-red-500' };
  if (score <= 40) return { score, label: 'মাঝারি', color: 'bg-orange-500', textColor: 'text-orange-500' };
  if (score <= 60) return { score, label: 'ভালো', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
  if (score <= 80) return { score, label: 'শক্তিশালী', color: 'bg-green-500', textColor: 'text-green-500' };
  return { score, label: 'অত্যন্ত শক্তিশালী', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
}

// ─── KYC Verification Type ──────────────────────────────
interface KYCVerificationData {
  id: string;
  documentType: string;
  documentNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// ─── Profile Form State ──────────────────────────────
interface ProfileFormState {
  name: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AccountSettingsPage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();

  // ─── Core State ──────────────────────────────────
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Profile State ──────────────────────────────
  const [profile, setProfile] = useState<ProfileFormState>({
    name: '',
    username: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Security State ─────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // ─── Email Dialog State ─────────────────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // ─── Phone Dialog State ─────────────────────────
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(false);

  // ─── KYC / Verification State ──────────────────
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [kycVerification, setKycVerification] = useState<KYCVerificationData | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycForm, setKycForm] = useState({
    documentType: '',
    documentNumber: '',
    documentFront: '',
    documentBack: '',
    selfie: '',
  });
  const [documentFrontName, setDocumentFrontName] = useState('');
  const [documentBackName, setDocumentBackName] = useState('');
  const [selfieName, setSelfieName] = useState('');
  const documentFrontRef = useRef<HTMLInputElement>(null);
  const documentBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // ─── Password Strength ─────────────────────────
  const pwdStrength = getPasswordStrength(newPassword);

  // ═══════════════════════════════════════════════════════════
  //  DATA LOADING
  // ═══════════════════════════════════════════════════════════
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
        avatar: u.avatar || '',
      });
      setAvatarPreview(u.avatar || '');
      if (u.name && u.email) {
        setUser((prev) => (prev ? { ...prev, ...u } as typeof prev : u as typeof prev));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'প্রোফাইল লোড করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, setUser]);

  const loadKYCStatus = useCallback(async () => {
    try {
      setKycLoading(true);
      const data = await api.getKYCStatus();
      const verification = data.verification || null;
      const status = data.userStatus?.verificationStatus || data.verificationStatus || 'unverified';
      setKycVerification(verification);
      setVerificationStatus(status);
      // If unverified or rejected, show form by default
      if (status === 'unverified' || status === 'rejected') {
        setShowKycForm(true);
      } else {
        setShowKycForm(false);
      }
    } catch {
      // Silently fail — default to unverified
      setVerificationStatus('unverified');
      setShowKycForm(true);
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadKYCStatus();
  }, [loadProfile, loadKYCStatus]);

  // ═══════════════════════════════════════════════════════════
  //  PROFILE HANDLERS
  // ═══════════════════════════════════════════════════════════
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
        avatar: profile.avatar || undefined,
      });
      toast({ title: 'সফল!', description: 'প্রোফাইল সফলভাবে আপডেট হয়েছে' });
      setUser((prev) =>
        prev
          ? { ...prev, name: profile.name, username: profile.username, avatar: profile.avatar } as typeof prev
          : prev
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'আপডেট করতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
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

  // ═══════════════════════════════════════════════════════════
  //  SECURITY HANDLERS
  // ═══════════════════════════════════════════════════════════
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

  const handleLogoutAllDevices = async () => {
    try {
      setLoggingOutAll(true);
      await api.logout();
      toast({ title: 'সফল!', description: 'সকল ডিভাইস থেকে লগআউট হয়েছে' });
    } catch {
      toast({ title: 'ত্রুটি', description: 'লগআউট করতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setLoggingOutAll(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  KYC HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleKYCImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'documentFront' | 'documentBack' | 'selfie'
  ) => {
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
      setKycForm((prev) => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);

    const nameMap: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      documentFront: setDocumentFrontName,
      documentBack: setDocumentBackName,
      selfie: setSelfieName,
    };
    nameMap[field]?.(file.name);
  };

  const handleSubmitKYC = async () => {
    if (!kycForm.documentType) {
      toast({ title: 'ত্রুটি', description: 'ডকুমেন্টের ধরন নির্বাচন করুন', variant: 'destructive' });
      return;
    }
    if (!kycForm.documentNumber.trim()) {
      toast({ title: 'ত্রুটি', description: 'ডকুমেন্ট নম্বর দিন', variant: 'destructive' });
      return;
    }
    if (!kycForm.documentFront) {
      toast({ title: 'ত্রুটি', description: 'ডকুমেন্টের সামনের ছবি আপলোড করুন', variant: 'destructive' });
      return;
    }
    try {
      setKycSubmitting(true);
      await api.submitKYC({
        documentType: kycForm.documentType,
        documentNumber: kycForm.documentNumber,
        documentFront: kycForm.documentFront,
        documentBack: kycForm.documentBack || undefined,
        selfie: kycForm.selfie || undefined,
      });
      toast({ title: 'সফল!', description: 'যাচাইকরণ নথি সফলভাবে জমা হয়েছে' });
      setVerificationStatus('pending');
      setShowKycForm(false);
      // Reload KYC status
      await loadKYCStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'KYC জমা দিতে সমস্যা হয়েছে';
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' });
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleResubmitKYC = () => {
    setKycForm({
      documentType: '',
      documentNumber: '',
      documentFront: '',
      documentBack: '',
      selfie: '',
    });
    setDocumentFrontName('');
    setDocumentBackName('');
    setSelfieName('');
    setShowKycForm(true);
  };

  // ─── Document type label ─────────────────────────
  const getDocTypeLabel = (type: string) => {
    const found = DOCUMENT_TYPES.find((d) => d.value === type);
    return found?.label || type;
  };

  // ═══════════════════════════════════════════════════════════
  //  LOADING SKELETON
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="অ্যাকাউন্ট সেটিংস"
          icon={<Settings className="h-5 w-5 text-primary" />}
          backTo="dashboard"
        />
        <div className="space-y-4">
          <div className="animate-pulse h-10 bg-muted rounded-lg w-64" />
          <div className="animate-pulse h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="অ্যাকাউন্ট সেটিংস"
        subtitle="আপনার প্রোফাইল, নিরাপত্তা ও ভেরিফিকেশন পরিচালনা করুন"
        icon={<Settings className="h-5 w-5 text-primary" />}
        backTo="dashboard"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger
            value="profile"
            className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"
          >
            <User className="w-3.5 h-3.5" />
            প্রোফাইল
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            নিরাপত্তা
          </TabsTrigger>
          <TabsTrigger
            value="verification"
            className="gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:shadow-sm"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            ভেরিফিকেশন
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════
            TAB 1: প্রোফাইল (Profile)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Card */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-xl ring-2 ring-primary/20">
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

                {/* User Info */}
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-bold text-foreground truncate">
                      {profile.name || 'নামহীন ব্যবহারকারী'}
                    </h2>
                    {user?.isVerified && (
                      <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
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
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ছবি পরিবর্তন করতে ক্যামেরা আইকনে ক্লিক করুন • সর্বোচ্চ ২MB
                  </p>
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
            </CardHeader>
            <CardContent className="space-y-5">
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                      @
                    </span>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))
                      }
                      className="pl-8 h-10"
                      placeholder="username"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা ও আন্ডারস্কোর
                  </p>
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
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  সংরক্ষণ করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            TAB 2: নিরাপত্তা (Security)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                পাসওয়ার্ড পরিবর্তন
              </CardTitle>
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

              <Separator />

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
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">পাসওয়ার্ড শক্তি</span>
                      <span className={`text-xs font-medium ${pwdStrength.textColor}`}>
                        {pwdStrength.label}
                      </span>
                    </div>
                    <Progress value={pwdStrength.score} className="h-1.5" />
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
                    <XCircle className="w-3 h-3" />
                    পাসওয়ার্ড মিলছে না
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    পাসওয়ার্ড মিলেছে
                  </p>
                )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full sm:w-auto min-w-[160px] h-10"
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

          {/* Active Sessions Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                সক্রিয় সেশন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">বর্তমান ডিভাইস</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    আপনি এই ডিভাইস থেকে লগইন করেছেন। সেশন পরিচালনার জন্য নিচের বাটন ব্যবহার করুন।
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">সকল ডিভাইস থেকে লগআউট</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    অন্য সকল ডিভাইসের সেশন বাতিল করুন
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogoutAllDevices}
                  disabled={loggingOutAll}
                  className="shrink-0"
                >
                  {loggingOutAll ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-1.5" />
                  )}
                  সকল লগআউট
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
            TAB 3: ভেরিফিকেশন (Verification Center)
            ═══════════════════════════════════════════════════════ */}
        <TabsContent value="verification" className="space-y-6">
          {/* Verification Status Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                ভেরিফিকেশন স্ট্যাটাস
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kycLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* ─── VERIFIED ─── */}
                  {verificationStatus === 'verified' && (
                    <div className="flex flex-col items-center text-center py-6 space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          ভেরিফিকেশন সম্পন্ন
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-0 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            যাচাইকৃত
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          আপনার পরিচয় যাচাইকৃত
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─── PENDING ─── */}
                  {verificationStatus === 'pending' && (
                    <div className="flex flex-col items-center text-center py-6 space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                        <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          পর্যালোচনাধীন
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-0 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            অপেক্ষমাণ
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          আপনার নথি যাচাইয়ের জন্য পর্যালোচনাধীন রয়েছে
                        </p>
                      </div>
                      {kycVerification && (
                        <div className="w-full max-w-sm mt-4 p-4 rounded-xl bg-muted/30 border border-border/50 text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">ডকুমেন্টের ধরন</span>
                            <span className="text-sm font-medium text-foreground">
                              {getDocTypeLabel(kycVerification.documentType)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">জমার তারিখ</span>
                            <span className="text-sm font-medium text-foreground">
                              {kycVerification.submittedAt
                                ? formatDate(kycVerification.submittedAt)
                                : '—'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── REJECTED ─── */}
                  {verificationStatus === 'rejected' && (
                    <div className="flex flex-col items-center text-center py-6 space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          ভেরিফিকেশন প্রত্যাখ্যাত
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-0 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            প্রত্যাখ্যাত
                          </Badge>
                        </h3>
                      </div>

                      {kycVerification?.adminNote && (
                        <div className="w-full max-w-md mt-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-left">
                              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                প্রত্যাখ্যানের কারণ
                              </p>
                              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                {kycVerification.adminNote}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleResubmitKYC}
                        variant="outline"
                        className="mt-2"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        পুনরায় জমা দিন
                      </Button>
                    </div>
                  )}

                  {/* ─── UNVERIFIED ─── */}
                  {verificationStatus === 'unverified' && !showKycForm && (
                    <div className="flex flex-col items-center text-center py-6 space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <IdCard className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          ভেরিফিকেশন হয়নি
                          <Badge variant="secondary" className="text-xs">
                            অযাচাইকৃত
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          আপনার পরিচয় যাচাই করতে নিচের বাটনে ক্লিক করুন
                        </p>
                      </div>
                      <Button onClick={() => setShowKycForm(true)}>
                        <IdCard className="w-4 h-4 mr-2" />
                        যাচাইকরণ শুরু করুন
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* KYC Submission Form */}
          {showKycForm && (verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  যাচাইকরণ নথি জমা দিন
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Document Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    ডকুমেন্টের ধরন <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={kycForm.documentType}
                    onValueChange={(v) => setKycForm((p) => ({ ...p, documentType: v }))}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="ডকুমেন্টের ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Number */}
                <div className="space-y-2">
                  <Label htmlFor="documentNumber" className="text-sm font-medium">
                    ডকুমেন্ট নম্বর <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentNumber"
                    value={kycForm.documentNumber}
                    onChange={(e) => setKycForm((p) => ({ ...p, documentNumber: e.target.value }))}
                    className="h-10"
                    placeholder="আপনার ডকুমেন্ট নম্বর লিখুন"
                  />
                </div>

                {/* Document Front Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    ডকুমেন্টের সামনের ছবি <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors cursor-pointer bg-muted/10"
                    onClick={() => documentFrontRef.current?.click()}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {documentFrontName || 'সামনের ছবি আপলোড করুন'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP — সর্বোচ্চ ২MB</p>
                    </div>
                    {kycForm.documentFront && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <input
                    ref={documentFrontRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleKYCImageUpload(e, 'documentFront')}
                  />
                </div>

                {/* Document Back Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    ডকুমেন্টের পেছনের ছবি <span className="text-muted-foreground text-xs">(ঐচ্ছিক)</span>
                  </Label>
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors cursor-pointer bg-muted/10"
                    onClick={() => documentBackRef.current?.click()}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {documentBackName || 'পেছনের ছবি আপলোড করুন'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP — সর্বোচ্চ ২MB</p>
                    </div>
                    {kycForm.documentBack && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <input
                    ref={documentBackRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleKYCImageUpload(e, 'documentBack')}
                  />
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    সেলফি <span className="text-muted-foreground text-xs">(ঐচ্ছিক)</span>
                  </Label>
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors cursor-pointer bg-muted/10"
                    onClick={() => selfieRef.current?.click()}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {selfieName || 'সেলফি আপলোড করুন'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP — সর্বোচ্চ ২MB</p>
                    </div>
                    {kycForm.selfie && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleKYCImageUpload(e, 'selfie')}
                  />
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitKYC}
                    disabled={kycSubmitting}
                    className="min-w-[160px] h-10 shadow-md hover:shadow-lg transition-all"
                  >
                    {kycSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    জমা দিন
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
