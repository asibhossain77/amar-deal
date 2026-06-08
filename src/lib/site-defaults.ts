/**
 * Centralized Site Defaults — Single Source of Truth
 *
 * All default branding values are defined here.
 * Every component, API route, and layout must import from this file
 * instead of hardcoding fallback strings.
 *
 * When the admin updates site settings in the database, the dynamic
 * values take precedence. These defaults are only used as fallbacks
 * when no database value exists.
 */

export const SITE_DEFAULTS = {
  site_name: 'বাংলা এসক্রো',
  site_tagline: 'বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।',
  site_logo: '',
  site_favicon: '',
  site_banner: '',
  site_login_bg: '',
  site_copyright: '© ২০২৪ বাংলা এসক্রো। সর্বস্বত্ব সংরক্ষিত।',
  seo_meta_title: 'বাংলা এসক্রো - নিরাপদ লেনদেনের প্ল্যাটফর্ম',
  seo_meta_description: 'বাংলাদেশের সবচেয়ে বিশ্বস্ত এসক্রো পরিষেবা। ক্রেতা ও বিক্রেতা উভয়ের জন্য নিরাপদ লেনদেন নিশ্চিত করুন।',
  maintenance_mode: 'false',
} as const;

/**
 * Helper: Get site name with fallback.
 * Returns the provided name if truthy, otherwise the default site name.
 */
export function getSiteName(name?: string | null): string {
  return name || SITE_DEFAULTS.site_name;
}

/**
 * Helper: Get tagline with fallback.
 */
export function getSiteTagline(tagline?: string | null): string {
  return tagline || SITE_DEFAULTS.site_tagline;
}

/**
 * Helper: Get copyright text with fallback.
 */
export function getSiteCopyright(copyright?: string | null): string {
  return copyright || SITE_DEFAULTS.site_copyright;
}

/**
 * Helper: Get SEO meta title with fallback.
 */
export function getSeoMetaTitle(seoTitle?: string | null): string {
  return seoTitle || SITE_DEFAULTS.seo_meta_title;
}

/**
 * Helper: Get SEO meta description with fallback.
 */
export function getSeoMetaDescription(seoDescription?: string | null): string {
  return seoDescription || SITE_DEFAULTS.seo_meta_description;
}
