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
      {/* Mobile bottom navigation bar - visible on small screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-background border-t border-border safe-bottom print:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors tap-transparent
                  ${
                    active
                      ? 'text-primary'
                      : 'text-text-muted'
                  }
                `}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar - hidden on mobile */}
      <aside
        className="hidden lg:flex lg:sticky top-[57px] lg:top-[57px] left-0 h-[calc(100vh-57px)] bg-surface-1 border-r border-border z-10 w-64 flex-col print:hidden"
      >
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
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
