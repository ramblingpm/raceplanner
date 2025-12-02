import { AdminRoute } from '@/components/AdminRoute';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Panel
                </h1>
              </div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/beta-invites"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Beta Invites
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md"
                    >
                      Users <span className="text-xs">(Coming soon)</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/races"
                      className="block px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md"
                    >
                      Races <span className="text-xs">(Coming soon)</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
