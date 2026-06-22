export type Language = 'bn' | 'en';

export type TranslationDict = Record<string, string>;

export interface SectionTranslations {
  bn: TranslationDict;
  en: TranslationDict;
}
