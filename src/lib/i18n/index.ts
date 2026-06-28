'use client';

import { useCallback, useMemo } from 'react';
import type { Language } from './types';
import { translations } from './sections';

/* ──────────────────────────────────────────────────────────────
 * Global (module-level) language state.
 *
 * The store is the source of truth and persists the user's choice.
 * This module-level mirror lets non-React helpers (formatDate, timeAgo,
 * status label lookups) read the current language without a hook.
 * It is kept in sync by the LanguageSync component + setGlobalLanguage.
 * ────────────────────────────────────────────────────────────── */
let currentLanguage: Language = 'bn';

export function setGlobalLanguage(lang: Language): void {
  currentLanguage = lang;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

/* ──────────────────────────────────────────────────────────────
 * Translation lookup helpers
 * ────────────────────────────────────────────────────────────── */

/**
 * Translate a key for a specific language. Usable outside React components.
 * Supports {placeholder} interpolation, e.g. t('time.daysAgo', { n: 5 }).
 */
export function tStatic(
  lang: Language,
  key: string,
  vars?: Record<string, string | number>
): string {
  let str = translations[lang][key] ?? translations.bn[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

/**
 * React hook for translations. Subscribes to the language from the store
 * so components re-render on language change.
 *
 * Usage:
 *   const { t, language, setLanguage } = useTranslation();
 *   <h1>{t('home.hero.title')}</h1>
 *   <p>{t('time.daysAgo', { n: 5 })}</p>
 */
export function useTranslation() {
  // Import lazily inside the hook to avoid a circular import at module load:
  // store.ts -> (nothing from i18n) and i18n -> store (here). Safe.
  const { useAppStore } = require('@/lib/store');
  const language: Language = useAppStore((s: { language: Language }) => s.language);
  const setLanguage = useAppStore((s: { setLanguage: (l: Language) => void }) => s.setLanguage);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      tStatic(language, key, vars),
    [language]
  );

  return useMemo(() => ({ t, language, setLanguage }), [t, language, setLanguage]);
}
