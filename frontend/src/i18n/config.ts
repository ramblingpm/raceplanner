export const locales = ['sv', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'sv';

export const localeNames: Record<Locale, string> = {
  sv: '🇸🇪',
  en: '🇬🇧',
};
