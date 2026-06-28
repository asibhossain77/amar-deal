import type { TranslationDict, SectionTranslations } from '../types';
import { commonTranslations } from './common';
import { homeTranslations } from './home';
import { authTranslations } from './auth';
import { layoutTranslations } from './layout';
import { transactionsTranslations } from './transactions';
import { accountTranslations } from './account';
import { adminTranslations } from './admin';

/**
 * Combines all section translations into a single dictionary per language.
 * Section files are maintained independently to avoid edit conflicts;
 * this index just merges them. Keys must be unique across sections.
 */
const allSections: SectionTranslations[] = [
  commonTranslations,
  homeTranslations,
  authTranslations,
  layoutTranslations,
  transactionsTranslations,
  accountTranslations,
  adminTranslations,
];

function merge(lang: 'bn' | 'en'): TranslationDict {
  const out: TranslationDict = {};
  for (const section of allSections) {
    Object.assign(out, section[lang]);
  }
  return out;
}

export const translations: { bn: TranslationDict; en: TranslationDict } = {
  bn: merge('bn'),
  en: merge('en'),
};
