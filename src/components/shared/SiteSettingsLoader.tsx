'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DEFAULT_SITE_SETTINGS } from '@/lib/store';

/**
 * This component loads site settings on mount and updates:
 * - Document title (browser tab)
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
          if (merged.site_name) {
            document.title = merged.seo_meta_title || `${merged.site_name} - নিরাপদ লেনদেনের প্ল্যাটফর্ম`;
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
