'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DEFAULT_SITE_SETTINGS } from '@/lib/store';
import { getSiteName, getSeoMetaTitle, getSeoMetaDescription } from '@/lib/site-defaults';

/**
 * This component loads site settings on mount and updates:
 * - Document title (browser tab)
 * - Meta description
 * - Meta keywords
 * - Favicon
 * - Zustand store for all components to access
 *
 * Must be rendered inside the app tree.
 */
export default function SiteSettingsLoader() {
  const { setSiteSettings } = useAppStore();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings?category=site');
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || data;
          const merged = { ...DEFAULT_SITE_SETTINGS, ...settings };

          // Update Zustand store
          setSiteSettings(merged);

          // Update document title
          const metaTitle = getSeoMetaTitle(merged.seo_meta_title);
          document.title = metaTitle;

          // Update meta description
          const metaDesc = getSeoMetaDescription(merged.seo_meta_description);
          let descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute('content', metaDesc);
          } else {
            descMeta = document.createElement('meta');
            descMeta.setAttribute('name', 'description');
            descMeta.setAttribute('content', metaDesc);
            document.head.appendChild(descMeta);
          }

          // Update meta keywords
          const siteName = getSiteName(merged.site_name);
          let keywordsMeta = document.querySelector('meta[name="keywords"]');
          const keywords = `এসক্রো, ${siteName}, নিরাপদ লেনদেন, বাংলাদেশ, escrow, Bangladesh`;
          if (keywordsMeta) {
            keywordsMeta.setAttribute('content', keywords);
          } else {
            keywordsMeta = document.createElement('meta');
            keywordsMeta.setAttribute('name', 'keywords');
            keywordsMeta.setAttribute('content', keywords);
            document.head.appendChild(keywordsMeta);
          }

          // Update favicon dynamically
          if (merged.site_favicon) {
            const existingLink = document.querySelector("link[rel*='icon']");
            if (existingLink) {
              (existingLink as HTMLLinkElement).href = merged.site_favicon;
            } else {
              const link = document.createElement('link');
              link.rel = 'icon';
              link.href = merged.site_favicon;
              document.head.appendChild(link);
            }
          }
        }
      } catch {
        // Silently fail - defaults will be used
      }
    }

    loadSettings();

    // Refresh settings every 60 seconds to pick up admin changes
    const interval = setInterval(loadSettings, 60000);
    return () => clearInterval(interval);
  }, [setSiteSettings]);

  return null; // This component renders nothing
}
