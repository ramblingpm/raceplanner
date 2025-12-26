'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user } = useAuth();

  // If not logged in, render without sidebar
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 bg-surface-background">
        {/* Add padding on mobile to account for the floating menu button */}
        <div className="lg:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
