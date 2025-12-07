'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import { useAuth } from './AuthProvider';

export default function Header() {
  const t = useTranslations('common');
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
          {t('appName')}
        </Link>

        {user ? (
          <UserMenu />
        ) : (
          <LanguageSelector />
        )}
      </div>
    </header>
  );
}
