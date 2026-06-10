'use client';

import { Shield, Handshake } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSiteName, getSiteTagline, getSiteCopyright } from '@/lib/site-defaults';

export default function Footer() {
  const { setPage, siteSettings } = useAppStore();

  const siteName = getSiteName(siteSettings.site_name);
  const siteLogo = siteSettings.site_logo;
  const siteTagline = getSiteTagline(siteSettings.site_tagline);
  const siteCopyright = getSiteCopyright(siteSettings.site_copyright);

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto transition-theme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-8 object-contain rounded-lg" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Handshake className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <span className="text-base font-bold text-foreground">
                {siteName}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {siteTagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">দ্রুত লিংক</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setPage('home')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  হোম
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('how-it-works')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  কিভাবে কাজ করে
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('about')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  সম্পর্কে
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">আইনি</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  গোপনীয়তা নীতি
                </button>
              </li>
              <li>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  শর্তাবলী
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('home')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  যোগাযোগ
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {siteCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
