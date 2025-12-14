'use client';

import { AdminRoute } from '@/components/AdminRoute';
import Link from 'next/link';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: '/admin', label: 'Overview', enabled: true },
    { href: '/admin/beta-invites', label: 'Beta Invites', enabled: true },
    { href: '/admin/users', label: 'Users', enabled: true },
    { href: '/admin/races', label: 'Races', enabled: true },
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Admin Panel
                </h1>
              </div>
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="hidden sm:inline">← Back to Dashboard</span>
                <span className="sm:hidden">← Dashboard</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200">
            <nav className="max-w-7xl mx-auto px-4 py-3">
              <ul className="space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium rounded-md ${
                        item.enabled
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {item.label}
                      {!item.enabled && (
                        <span className="text-xs ml-2">(Coming soon)</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <ul className="space-y-2">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-4 py-2 text-sm font-medium rounded-md ${
                          item.enabled
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {item.label}
                        {!item.enabled && (
                          <span className="text-xs ml-2">(Coming soon)</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
