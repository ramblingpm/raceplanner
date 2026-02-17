'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from '@/design-system';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const t = useTranslations('common');
  const { user } = useAuth();

  return (
    <header className={`bg-surface-background border-b border-border shadow-sm ${user ? 'sticky top-0 z-30' : ''} ${className}`}>
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-lg sm:text-2xl font-bold text-text-primary hover:text-text-secondary transition-colors truncate">
            {t('appName')}
          </Link>

          {!user && (
            <nav className="hidden sm:flex items-center gap-3 sm:gap-4">
              <Link
                href="/try"
                className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors font-medium whitespace-nowrap"
              >
                Prova gratis
              </Link>
              <Link
                href="/vatternrundan"
                className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors font-medium whitespace-nowrap"
              >
                Vätternrundan
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle size="sm" />
          {user ? (
            <UserMenu />
          ) : (
            <LanguageSelector />
          )}
        </div>
      </div>
    </header>
  );
}
