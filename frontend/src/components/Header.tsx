'use client';

import { useTranslations } from 'next-intl';
import UserMenu from './UserMenu';

export default function Header() {
  const t = useTranslations('common');

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
        <UserMenu />
            </div>
          </header>
        );
      }
