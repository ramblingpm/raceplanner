'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from '@/design-system';

export default function Header() {
  const t = useTranslations('common');
  const { user } = useAuth();

  return (
    <header className="bg-surface-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-text-primary hover:text-text-secondary transition-colors">
            {t('appName')}
          </Link>

          {!user && (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/try"
                className="text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Prova gratis
              </Link>
              <Link
                href="/vatternrundan"
                className="text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Vätternrundan
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle size="md" />
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
