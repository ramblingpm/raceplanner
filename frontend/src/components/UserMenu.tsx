'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { locales, localeNames, Locale } from '@/i18n/config';
import Link from 'next/link';
import { trackLanguageChanged } from '@/lib/analytics';

export default function UserMenu() {
  const { user } = useAuth();
  const tNav = useTranslations('nav');
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleLocaleChange = (newLocale: Locale) => {
    trackLanguageChanged(currentLocale, newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        try {
          const adminStatus = await isAdmin(user.id);
          setIsAdminUser(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        }
      }
    }
    checkAdmin();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold flex items-center justify-center transition-colors"
        aria-label="User menu"
      >
        {user ? (
          userInitial
        ) : (
          <UserCircleIcon className="w-6 h-6" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-background rounded-lg shadow-lg border border-border py-2 z-50">
          {/* User email section - only show if logged in */}
          {user && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm text-text-secondary">Signed in as</p>
              <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
            </div>
          )}

          {/* Language selection */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-text-secondary mb-2">Language</p>
            <div className="flex gap-2">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`px-3 py-2 rounded-md text-2xl transition-all ${
                    currentLocale === locale
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={locale === 'sv' ? 'Svenska' : 'English'}
                >
                  {localeNames[locale]}
                </button>
              ))}
            </div>
          </div>

          {/* Admin link - only show if user is admin */}
          {user && isAdminUser && (
            <div className="px-2 py-2 border-b border-border">
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-primary-subtle rounded-md transition-colors"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                Admin Panel
              </Link>
            </div>
          )}

          {/* Logout button - only show if logged in */}
          {user && (
            <div className="px-2 py-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-1 rounded-md transition-colors"
              >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                {tNav('logout')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
