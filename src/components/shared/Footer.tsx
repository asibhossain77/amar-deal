'use client';

import { Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function Footer() {
  const { setPage } = useAppStore();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">
                বাংলা এসক্রো
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা
              উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              দ্রুত লিংক
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setPage('home')}
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  হোম
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('how-it-works')}
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  কিভাবে কাজ করে
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('about')}
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  সম্পর্কে
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              আইনি
            </h3>
            <ul className="space-y-2">
              <li>
                <button className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                  গোপনীয়তা নীতি
                </button>
              </li>
              <li>
                <button className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                  শর্তাবলী
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('home')}
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  যোগাযোগ
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">
            &copy; ২০২৪ বাংলা এসক্রো। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}
