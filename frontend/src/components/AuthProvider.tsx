'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, getCurrentUser, onAuthStateChange, setUserIdentityInAnalytics } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);

      // Set user identity in GA4 for session tracking (does not track login event)
      if (user) {
        setUserIdentityInAnalytics(user);
      }
    });

    // Listen for changes on auth state
    const { data: subscription } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);

      // Set user identity in GA4 for session tracking (does not track login event)
      if (user) {
        setUserIdentityInAnalytics(user);
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
