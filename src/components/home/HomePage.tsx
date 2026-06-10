'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Wallet,
  ShieldCheck,
  Eye,
  Scale,
  Zap,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAppStore } from '@/lib/store';
import { getSiteName, getSiteTagline, getContactAddress, getContactPhone, getContactEmail } from '@/lib/site-defaults';

/* ─────────────── Hero Section ─────────────── */
function HeroSection() {
  const { setPage, isAuthenticated, siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);

  return (
    <section className="relative bg-gradient-to-b from-background to-accent/50 py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Handshake className="w-4 h-4" />
              নিরাপদ ডিল প্ল্যাটফর্ম
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              নিরাপদ ডিল,{' '}
              <span className="text-primary">বিশ্বস্ত পার্টনার</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              {getSiteTagline(siteSettings.site_tagline || undefined)}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => setPage(isAuthenticated ? 'create-transaction' : 'register')}
                className="bg-primary hover:bg-primary/90 gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                ডিল শুরু করুন
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage('how-it-works')}
                className="border-primary/20 text-primary hover:bg-accent text-base px-8 h-12 rounded-xl"
              >
                কিভাবে কাজ করে
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-full max-w-md">
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 shadow-xl">
                  <div className="w-48 h-48 bg-primary/15 rounded-2xl flex items-center justify-center -rotate-3">
                    <Handshake className="w-24 h-24 text-primary" />
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-8 bg-card rounded-xl shadow-lg p-3 flex items-center gap-2 border border-border">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-foreground">নিরাপদ</span>
              </div>
              <div className="absolute bottom-8 left-4 bg-card rounded-xl shadow-lg p-3 flex items-center gap-2 border border-border">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">বিশ্বস্ত</span>
              </div>
              <div className="absolute top-20 left-0 bg-card rounded-xl shadow-lg p-3 flex items-center gap-2 border border-border">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">নিশ্চিত</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How It Works Section ─────────────── */
function HowItWorksSection() {
  const steps = [
    {
      number: '১',
      icon: FileText,
      title: 'চুক্তি তৈরি',
      description: 'ক্রেতা ও বিক্রেতা একটি এসক্রো চুক্তি তৈরি করেন',
    },
    {
      number: '২',
      icon: Wallet,
      title: 'পেমেন্ট জমা',
      description: 'ক্রেতা পেমেন্ট এসক্রো অ্যাকাউন্টে জমা দেন',
    },
    {
      number: '৩',
      icon: ShieldCheck,
      title: 'নিরাপদ হস্তান্তর',
      description: 'কাজ সম্পন্ন হলে পেমেন্ট বিক্রেতাকে প্রদান করা হয়',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            এসক্রো কিভাবে কাজ করে?
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            মাত্র তিনটি সহজ ধাপে নিরাপদ ডিল সম্পন্ন করুন
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-primary/10" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <Icon className="w-9 h-9 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Features/Benefits Section ─────────────── */
function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: 'নিরাপদ ডিল',
      description: 'আপনার অর্থ সর্বদা নিরাপদে রাখা হয়',
    },
    {
      icon: Eye,
      title: 'স্বচ্ছ প্রক্রিয়া',
      description: 'প্রতিটি ধাপ স্বচ্ছ এবং ট্র্যাকযোগ্য',
    },
    {
      icon: Scale,
      title: 'বিরোধ নিষ্পত্তি',
      description: 'বিরোধ হলে প্রশাসক মধ্যস্থতা করেন',
    },
    {
      icon: Zap,
      title: 'দ্রুত প্রক্রিয়াকরণ',
      description: 'পেমেন্ট দ্রুত যাচাই ও প্রক্রিয়া করা হয়',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            কেন আমাদের বেছে নেবেন?
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            আমাদের এসক্রো পরিষেবার অনন্য সুবিধাসমূহ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="bg-card border-border hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Process Timeline Section ─────────────── */
function ProcessTimelineSection() {
  const timelineSteps = [
    { title: 'চুক্তি তৈরি', status: 'pending_payment' },
    { title: 'পেমেন্ট জমা', status: 'pending_verification' },
    { title: 'পেমেন্ট যাচাই', status: 'paid' },
    { title: 'কাজ চলমান', status: 'work_in_progress' },
    { title: 'কাজ সম্পন্ন', status: 'delivered' },
    { title: 'ডিল সম্পন্ন', status: 'completed' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            ডিলের ধাপসমূহ
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            এসক্রো ডিলের প্রতিটি ধাপ স্পষ্টভাবে দেখুন
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {timelineSteps.map((step, index) => {
              const isLast = index === timelineSteps.length - 1;
              const isActive = index < 3;
              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-16 ${
                          index < 2 ? 'bg-primary/30' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>

                  <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                    <h3
                      className={`text-base font-semibold ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      অবস্থা: {step.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FAQ Section ─────────────── */
function FAQSection() {
  const faqs = [
    {
      question: 'এসক্রো কি?',
      answer:
        'এসক্রো হলো একটি নিরাপদ ডিল পদ্ধতি যেখানে একটি তৃতীয় পক্ষ (এসক্রো প্রদানকারী) ক্রেতার অর্থ ধরে রাখে এবং কাজ সম্পন্ন হলে বিক্রেতাকে প্রদান করে।',
    },
    {
      question: 'পেমেন্ট কিভাবে করব?',
      answer:
        'আপনি bKash, Nagad, Rocket বা ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করতে পারেন। পেমেন্টের পর ট্রানজেকশন আইডি জমা দিন।',
    },
    {
      question: 'পেমেন্ট যাচাই কতক্ষণ সময় নেয়?',
      answer: 'সাধারণত ২৪ ঘন্টার মধ্যে প্রশাসক আপনার পেমেন্ট যাচাই করেন।',
    },
    {
      question: 'বিরোধ হলে কি করব?',
      answer: 'আপনি যেকোনো সময় বিরোধ খুলতে পারেন। প্রশাসক উভয় পক্ষের কথা শুনে সিদ্ধান্ত নেবেন।',
    },
    {
      question: 'পেমেন্ট বাতিল করা যায় কি?',
      answer: 'হ্যাঁ, পেমেন্ট যাচাইর আগে আপনি ডিল বাতিল করতে পারেন।',
    },
    {
      question: 'এসক্রো পরিষেবা কি বিনামূল্যে?',
      answer: 'না, প্রতিটি সফল ডিলে একটি ছোট সার্ভিস চার্জ প্রযোজ্য।',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-muted/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            সাধারণ জিজ্ঞাসা
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            এসক্রো পরিষেবা সম্পর্কে সাধারণ প্রশ্নাবলী
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="px-6 text-right hover:no-underline hover:bg-muted transition-colors">
                  <span className="text-sm font-medium text-foreground">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Contact Section ─────────────── */
function ContactSection() {
  const { siteSettings } = useAppStore();
  const siteName = getSiteName(siteSettings.site_name);
  const contactAddress = getContactAddress(siteSettings.contact_address);
  const contactPhone = getContactPhone(siteSettings.contact_phone);
  const contactEmail = getContactEmail(siteSettings.contact_email);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            যোগাযোগ করুন
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            যেকোনো প্রশ্ন বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">ঠিকানা</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {contactAddress}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">ফোন</h3>
                <p className="text-sm text-muted-foreground">{contactPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">ইমেইল</h3>
                <p className="text-sm text-muted-foreground">{contactEmail}</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    বার্তা পাঠানো হয়েছে!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">নাম</label>
                    <Input
                      placeholder="আপনার নাম লিখুন"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">ইমেইল</label>
                    <Input
                      type="email"
                      placeholder="আপনার ইমেইল লিখুন"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">বার্তা</label>
                    <Textarea
                      placeholder="আপনার বার্তা লিখুন"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 gap-2">
                    <Send className="w-4 h-4" />
                    বার্তা পাঠান
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Main HomePage ─────────────── */
export default function HomePage() {
  const { scrollTarget, setScrollTarget } = useAppStore();

  useEffect(() => {
    if (!scrollTarget) return;
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const el = document.getElementById(scrollTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setScrollTarget(null);
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollTarget, setScrollTarget]);

  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <ProcessTimelineSection />
      <FAQSection />
      <ContactSection />
    </main>
  );
}
