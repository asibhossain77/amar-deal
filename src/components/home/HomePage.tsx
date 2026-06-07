'use client';

import { useState } from 'react';
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

/* ─────────────── Hero Section ─────────────── */
function HeroSection() {
  const { setPage, isAuthenticated } = useAppStore();

  return (
    <section className="relative bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
              নিরাপদ লেনদেন,{' '}
              <span className="text-blue-600">বিশ্বস্ত এসক্রো</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন
              আমাদের এসক্রো পরিষেবায়
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => setPage(isAuthenticated ? 'create-transaction' : 'register')}
                className="bg-blue-600 hover:bg-blue-700 gap-2 text-base px-8 h-12"
              >
                লেনদেন শুরু করুন
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage('how-it-works')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 text-base px-8 h-12"
              >
                কিভাবে কাজ করে জানুন
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-full max-w-md">
              {/* Main shield icon */}
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 bg-blue-200 rounded-full flex items-center justify-center">
                    <Shield className="w-24 h-24 text-blue-600" />
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute top-4 right-8 bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-700">নিরাপদ</span>
              </div>
              <div className="absolute bottom-8 left-4 bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">বিশ্বস্ত</span>
              </div>
              <div className="absolute top-20 left-0 bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">নিশ্চিত</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How Escrow Works Section ─────────────── */
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
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            এসক্রো কিভাবে কাজ করে?
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            মাত্র তিনটি সহজ ধাপে নিরাপদ লেনদেন সম্পন্ন করুন
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line - hidden on mobile */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-blue-100" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex flex-col items-center text-center">
                {/* Numbered circle with icon */}
                <div className="relative z-10 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Icon className="w-9 h-9 text-white" />
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
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

/* ─────────────── Benefits Section ─────────────── */
function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: 'নিরাপদ লেনদেন',
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
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            কেন আমাদের বেছে নেবেন?
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            আমাদের এসক্রো পরিষেবার অনন্য সুবিধাসমূহ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="bg-white border-slate-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
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
    { title: 'লেনদেন সম্পন্ন', status: 'completed' },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            লেনদেনের ধাপসমূহ
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            এসক্রো লেনদেনের প্রতিটি ধাপ স্পষ্টভাবে দেখুন
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {timelineSteps.map((step, index) => {
              const isLast = index === timelineSteps.length - 1;
              const isBlue = index < 3; // First 3 steps active/blue
              return (
                <div key={step.status} className="flex gap-4">
                  {/* Timeline line and dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isBlue
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-16 ${
                          index < 2 ? 'bg-blue-300' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                    <h3
                      className={`text-base font-semibold ${
                        isBlue ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
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
        'এসক্রো হলো একটি নিরাপদ লেনদেন পদ্ধতি যেখানে একটি তৃতীয় পক্ষ (এসক্রো প্রদানকারী) ক্রেতার অর্থ ধরে রাখে এবং কাজ সম্পন্ন হলে বিক্রেতাকে প্রদান করে।',
    },
    {
      question: 'পেমেন্ট কিভাবে করব?',
      answer:
        'আপনি bKash, Nagad, Rocket বা ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করতে পারেন। পেমেন্টের পর ট্রানজেকশন আইডি জমা দিন।',
    },
    {
      question: 'পেমেন্ট যাচাই কতক্ষণ সময় নেয়?',
      answer:
        'সাধারণত ২৪ ঘন্টার মধ্যে প্রশাসক আপনার পেমেন্ট যাচাই করেন।',
    },
    {
      question: 'বিরোধ হলে কি করব?',
      answer:
        'আপনি যেকোনো সময় বিরোধ খুলতে পারেন। প্রশাসক উভয় পক্ষের কথা শুনে সিদ্ধান্ত নেবেন।',
    },
    {
      question: 'পেমেন্ট বাতিল করা যায় কি?',
      answer:
        'হ্যাঁ, পেমেন্ট যাচাইর আগে আপনি লেনদেন বাতিল করতে পারেন।',
    },
    {
      question: 'এসক্রো পরিষেবা কি বিনামূল্যে?',
      answer:
        'না, প্রতিটি সফল লেনদেনে একটি ছোট সার্ভিস চার্জ প্রযোজ্য।',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            সাধারণ জিজ্ঞাসা
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            এসক্রো পরিষেবা সম্পর্কে সাধারণ প্রশ্নাবলী
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="px-6 text-right hover:no-underline hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <p className="text-sm text-slate-500 leading-relaxed">
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            যোগাযোগ করুন
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            যেকোনো প্রশ্ন বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  ঠিকানা
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  বাংলা এসক্রো লিমিটেড<br />
                  ১২৩, গুলশান এভিনিউ<br />
                  ঢাকা-১২১২, বাংলাদেশ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  ফোন
                </h3>
                <p className="text-sm text-slate-500">+৮৮০ ১৭০০-০০০০০০</p>
                <p className="text-sm text-slate-500">+৮৮০ ২-০০০০০০০</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  ইমেইল
                </h3>
                <p className="text-sm text-slate-500">support@banglaescrow.com</p>
                <p className="text-sm text-slate-500">info@banglaescrow.com</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    বার্তা পাঠানো হয়েছে!
                  </h3>
                  <p className="text-sm text-slate-500">
                    আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      নাম
                    </label>
                    <Input
                      placeholder="আপনার নাম লিখুন"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ইমেইল
                    </label>
                    <Input
                      type="email"
                      placeholder="আপনার ইমেইল লিখুন"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      বার্তা
                    </label>
                    <Textarea
                      placeholder="আপনার বার্তা লিখুন"
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
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
