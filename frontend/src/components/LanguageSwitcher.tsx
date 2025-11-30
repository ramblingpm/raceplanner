'use client';

import { useLocale } from 'next-intl';
import { locales, localeNames, Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie and reload
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-3 py-2 rounded-md text-2xl transition-all ${
            currentLocale === locale
              ? 'ring-2 ring-primary-600 ring-offset-2 scale-110'
              : 'opacity-60 hover:opacity-100 hover:scale-105'
          }`}
          title={locale === 'sv' ? 'Svenska' : 'English'}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
