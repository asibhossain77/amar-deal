'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate, getInitials } from '@/lib/helpers';

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      toast({
        title: 'ত্রুটি',
        description: 'নাম ফাঁকা রাখা যাবে না',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await api.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      const updatedUser = result.user || result;
      setUser({ ...user, ...updatedUser });

      toast({
        title: 'সফল',
        description: 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
      });
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">ব্যবহারকারীর তথ্য পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">প্রোফাইল পরিচালনা</h2>

      {/* Avatar & Basic Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge
                variant="secondary"
                className="mt-1 text-xs bg-blue-50 text-blue-700 border-0"
              >
                {user.role === 'admin' ? 'প্রশাসক' : 'ব্যবহারকারী'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">তথ্য সম্পাদনা</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                নাম
              </div>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                ফোন নম্বর
              </div>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="আপনার ফোন নম্বর লিখুন"
              className="max-w-md"
            />
          </div>

          <Separator />

          {/* Display-only fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  ইমেইল
                </div>
              </Label>
              <p className="text-sm text-gray-600 pl-6">{user.email}</p>
              <p className="text-xs text-gray-400 pl-6">ইমেইল পরিবর্তন করা যাবে না</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  ভূমিকা
                </div>
              </Label>
              <p className="text-sm text-gray-600 pl-6">
                {user.role === 'admin' ? 'প্রশাসক' : 'ব্যবহারকারী'}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  নিবন্ধনের তারিখ
                </div>
              </Label>
              <p className="text-sm text-gray-600 pl-6">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <Separator />

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট করুন'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
