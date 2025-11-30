'use client';

import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {user && (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors"
              >
                {tNav('logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
