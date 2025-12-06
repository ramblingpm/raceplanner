'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/consent';

/**
 * Component to track page views with specific page names
 * Place this in your page component to track when users visit
 */
export default function PageViewTracker({ pageName }: { pageName: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track the page view with the specific page name
    trackPageView(pathname, pageName);
  }, [pathname, pageName]);

  return null; // This component doesn't render anything
}
