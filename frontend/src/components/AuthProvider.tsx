'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, getCurrentUser, onAuthStateChange, trackUserAuthentication } from '@/lib/auth';

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

      // Track user in GA4 if they're already logged in
      if (user) {
        trackUserAuthentication(user);
      }
    });

    // Listen for changes on auth state
    const { data: subscription } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);

      // Track user in GA4 when auth state changes
      if (user) {
        trackUserAuthentication(user);
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
