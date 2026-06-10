'use client';

import { Shield, Target, Eye, Lock, EyeOff, Handshake, Zap, Users, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { getSiteName } from '@/lib/site-defaults';

const values = [
  {
    icon: Lock,
    label: 'নিরাপত্তা',
    description: 'আপনার অর্থ ও তথ্যের সর্বোচ্চ নিরাপত্তা',
    color: 'bg-primary/10 text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: Eye,
    label: 'স্বচ্ছতা',
    description: 'প্রতিটি লেনদেন স্বচ্ছ ও যাচাইযোগ্য',
    color: 'bg-green-50 text-green-600',
    iconBg: 'bg-green-100',
  },
  {
    icon: Handshake,
    label: 'বিশ্বস্ততা',
    description: 'ক্রেতা-বিক্রেতা উভয়ের প্রতি বিশ্বস্ত',
    color: 'bg-purple-50 text-purple-600',
    iconBg: 'bg-purple-100',
  },
  {
    icon: Zap,
    label: 'দ্রুততা',
    description: 'দ্রুত ও কার্যকর সেবা প্রদান',
    color: 'bg-amber-50 text-amber-600',
    iconBg: 'bg-amber-100',
  },
];

const team = [
  { name: 'রাহুল আহমেদ', role: 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী', initials: 'রআ' },
  { name: 'ফারহানা ইসলাম', role: 'প্রযুক্তি প্রধান', initials: 'ফই' },
  { name: 'সাকিব হাসান', role: 'প্রশাসন প্রধান', initials: 'সহ' },
  { name: 'নুসরাত জাহান', role: 'গ্রাহক সেবা প্রধান', initials: 'নজ' },
];

export default function AboutPage() {
  const { siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Shield className="h-9 w-9 text-white" />
          </div>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">আমাদের সম্পর্কে</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
            {siteName} হলো বাংলাদেশের একটি বিশ্বস্ত এসক্রো পরিষেবা প্ল্যাটফর্ম।
            আমরা ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ ও স্বচ্ছ লেনদেন নিশ্চিত করি।
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Mission */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-xl font-bold text-foreground">আমাদের লক্ষ্য</h2>
                <p className="leading-relaxed text-muted-foreground">
                  আমাদের লক্ষ্য হলো বাংলাদেশে নিরাপদ ডিজিটাল লেনদেন নিশ্চিত করা এবং
                  ক্রেতা-বিক্রেতা উভয়ের মধ্যে বিশ্বাস তৈরি করা।
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mb-3 text-xl font-bold text-foreground">আমাদের দৃষ্টিভঙ্গি</h2>
                <p className="leading-relaxed text-muted-foreground">
                  ডিজিটাল বাংলাদেশে প্রতিটি লেনদেন হবে নিরাপদ ও বিশ্বস্ত।
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground">আমাদের মূল্যবোধ</h2>
            <p className="text-muted-foreground">যে নীতিতে আমরা পরিচালিত</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.label} className="border-0 shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${value.iconBg}`}
                    >
                      <Icon className={`h-7 w-7 ${value.color.split(' ')[1]}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{value.label}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground">কেন আমাদের বিশ্বাস করবেন?</h2>
            <p className="text-muted-foreground">{siteName}এ আপনার বিশ্বাসের কারণ</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-semibold text-foreground">নিরাপদ লেনদেন</h3>
              <p className="text-sm text-muted-foreground">অর্থ এসক্রোতে থাকে যতক্ষণ কাজ সম্পন্ন না হয়</p>
            </div>
            <div className="rounded-xl border border-green-100 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/30 p-6 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-green-600 dark:text-green-400" />
              <h3 className="mb-1 font-semibold text-foreground">যাচাইকৃত পেমেন্ট</h3>
              <p className="text-sm text-muted-foreground">প্রতিটি পেমেন্ট প্রশাসক দ্বারা যাচাইকৃত</p>
            </div>
            <div className="rounded-xl border border-purple-100 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/30 p-6 text-center">
              <EyeOff className="mx-auto mb-3 h-8 w-8 text-purple-600 dark:text-purple-400" />
              <h3 className="mb-1 font-semibold text-foreground">বিরোধ নিষ্পত্তি</h3>
              <p className="text-sm text-muted-foreground">যেকোনো বিরোধে নিরপেক্ষ সমাধান</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground">আমাদের দল</h2>
            <p className="text-muted-foreground">অভিজ্ঞ ও নিবেদিতপ্রাণ পেশাদার দল</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.name} className="border-0 shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">{member.initials}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
