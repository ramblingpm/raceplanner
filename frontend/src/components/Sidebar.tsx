'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { HomeIcon, FlagIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: t('availableRaces'),
      href: '/available-races',
      icon: Squares2X2Icon,
    },
    {
      name: t('myRaces'),
      href: '/my-plans',
      icon: FlagIcon,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-surface-1 border border-border rounded-lg shadow-md hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
        aria-label={t('menu')}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6 text-text-primary" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-text-primary" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-[73px] left-0 h-screen lg:h-[calc(100vh-73px)] bg-surface-1 border-r border-border z-40 lg:z-10
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex flex-col
        `}
      >
        {/* Sidebar header - only visible on mobile */}
        <div className="lg:hidden p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{t('menu')}</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
