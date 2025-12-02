'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin } from '@/lib/admin';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (authLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const adminStatus = await isAdmin(user.id);
        setIsAdminUser(adminStatus);

        if (!adminStatus) {
          // User is authenticated but not an admin
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
        router.push('/dashboard');
      } finally {
        setChecking(false);
      }
    }

    checkAdminStatus();
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return null;
  }

  return <>{children}</>;
}
