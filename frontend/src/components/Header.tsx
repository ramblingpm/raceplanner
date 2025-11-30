'use client';

import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

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
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-md transition-colors"
          title={tNav('logout')}
              >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
            </div>
          </header>
        );
      }
