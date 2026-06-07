'use client';

import {
  FileText,
  Wallet,
  ShieldCheck,
  Wrench,
  Package,
  CheckCircle2,
  Scale,
  ArrowDown,
  MessageSquare,
  Gavel,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    number: 1,
    icon: FileText,
    title: 'চুক্তি তৈরি',
    description:
      'ক্রেতা ও বিক্রেতা একসাথে একটি এসক্রো চুক্তি তৈরি করেন। চুক্তিতে লেনদেনের বিবরণ, পরিমাণ এবং শর্তাবলী উল্লেখ থাকে।',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  {
    number: 2,
    icon: Wallet,
    title: 'পেমেন্ট জমা',
    description:
      'ক্রেতা নির্দিষ্ট পেমেন্ট পদ্ধতিতে অর্থ প্রদান করেন এবং ট্রানজেকশন আইডি জমা দেন।',
    color: 'bg-amber-600',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: 'পেমেন্ট যাচাই',
    description:
      'আমাদের প্রশাসক ক্রেতার পেমেন্ট যাচাই করেন। যাচাই সফল হলে লেনদেন পরবর্তী ধাপে যায়।',
    color: 'bg-green-600',
    lightBg: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    number: 4,
    icon: Wrench,
    title: 'কাজ সম্পাদন',
    description:
      'বিক্রেতা চুক্তি অনুযায়ী কাজ সম্পাদন করেন। ক্রেতা কাজের অগ্রগতি ট্র্যাক করতে পারেন।',
    color: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    number: 5,
    icon: Package,
    title: 'কাজ সরবরাহ',
    description:
      'বিক্রেতা কাজ সম্পন্ন করে সরবরাহ করেন। ক্রেতা কাজ যাচাই করেন।',
    color: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    number: 6,
    icon: CheckCircle2,
    title: 'লেনদেন সম্পন্ন',
    description:
      'ক্রেতা কাজ গ্রহণ করলে লেনদেন সম্পন্ন হয় এবং পেমেন্ট বিক্রেতাকে প্রদান করা হয়।',
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
];

const disputeSteps = [
  {
    icon: MessageSquare,
    title: 'বিরোধ দায়ের',
    description: 'ক্রেতা বা বিক্রেতা যেকোনো সময় বিরোধ দায়ের করতে পারেন।',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  {
    icon: Gavel,
    title: 'পর্যালোচনা',
    description: 'প্রশাসক বিরোধের বিষয়টি পর্যালোচনা করেন এবং উভয় পক্ষের বক্তব্য শোনেন।',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  {
    icon: RefreshCw,
    title: 'নিষ্পত্তি',
    description: 'নিরপেক্ষ সিদ্ধান্তের মাধ্যমে বিরোধের নিষ্পত্তি করা হয়।',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Scale className="h-9 w-9 text-white" />
          </div>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">কিভাবে কাজ করে</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
            বাংলা এসক্রোতে লেনদেনের সম্পূর্ণ প্রক্রিয়া জানুন। আমাদের সহজ ও নিরাপদ
            পদ্ধতিতে ক্রেতা ও বিক্রেতা উভয়েই সুরক্ষিত থাকেন।
          </p>
        </div>
      </section>

      {/* Steps Timeline */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground">লেনদেনের ধাপসমূহ</h2>
            <p className="text-muted-foreground">এসক্রো লেনদেনের ৬টি সহজ ধাপ</p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted sm:left-8" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative flex gap-4 sm:gap-6">
                    {/* Step Number Circle */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg sm:h-16 sm:w-16 ${step.color}`}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <Card className={`flex-1 border ${step.borderColor} ${step.lightBg} shadow-sm`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step.color}`}>
                            {step.number}
                          </span>
                          <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                        </div>
                        <p className="leading-relaxed text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Dispute Resolution */}
      <section className="bg-muted px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
              <Scale className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">বিরোধ নিষ্পত্তি</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              লেনদেনে কোনো সমস্যা হলে, আমাদের বিরোধ নিষ্পত্তি প্রক্রিয়া আপনাকে
              নিরপেক্ষ সমাধান প্রদান করবে।
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {disputeSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="border-0 shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg}`}
                    >
                      <Icon className={`h-7 w-7 ${step.color}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold text-foreground">আপনার অর্থ সুরক্ষিত</h3>
            <p className="text-sm text-muted-foreground">
              বিরোধের সময় আপনার অর্থ এসক্রোতে নিরাপদে রাখা হয়। প্রশাসকের সিদ্ধান্তের
              পর যথাযথ পক্ষকে অর্থ প্রদান করা হয়।
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-2xl font-bold text-foreground">এখনই শুরু করুন</h2>
          <p className="mb-6 text-muted-foreground">
            নিরাপদ লেনদেনের জন্য আজই বাংলা এসক্রোতে যোগ দিন এবং নির্ভরযোগ্য
            এসক্রো পরিষেবা উপভোগ করুন।
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            নিরাপদ লেনদেন শুরু করুন
          </div>
        </div>
      </section>
    </div>
  );
}
