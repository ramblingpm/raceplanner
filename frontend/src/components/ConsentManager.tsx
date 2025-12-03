'use client';

import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { hasConsent, initializeGoogleAnalytics, setLoggedInConsent } from '@/lib/consent';

/**
 * ConsentManager handles Google Analytics initialization
 * - Loads GA immediately if consent is already given
 * - Auto-consents for logged-in users (they agreed during signup)
 */
export default function ConsentManager() {
  const { user } = useAuth();

  useEffect(() => {
    // If user is logged in, they've already consented during signup
    if (user) {
      setLoggedInConsent();
    }

    // Initialize GA if consent is given
    if (hasConsent()) {
      initializeGoogleAnalytics();
    }
  }, [user]);

  return null;
}
