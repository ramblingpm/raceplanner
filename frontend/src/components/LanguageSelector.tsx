'use client';

import { useLocale } from 'next-intl';
import { locales, localeNames, Locale } from '@/i18n/config';

export default function LanguageSelector() {
  const currentLocale = useLocale() as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="flex gap-3 items-center">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`text-3xl transition-all ${
            currentLocale === locale
              ? 'ring-2 ring-gray-900 ring-offset-2 scale-110'
              : 'opacity-50 hover:opacity-100 hover:scale-105'
          }`}
          title={locale === 'sv' ? 'Svenska' : 'English'}
          aria-label={`Switch to ${locale === 'sv' ? 'Swedish' : 'English'}`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
