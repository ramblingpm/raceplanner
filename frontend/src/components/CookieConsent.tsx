'use client';

import { useEffect, useState } from 'react';
import { getConsentStatus, setConsentStatus } from '@/lib/consent';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show banner if consent is pending (not decided yet)
    const status = getConsentStatus();
    if (status === 'pending') {
      // Small delay to avoid flash on page load
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const handleAccept = () => {
    setConsentStatus('accepted');
    setShow(false);
  };

  const handleReject = () => {
    setConsentStatus('rejected');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
              🍪 We use cookies
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              We use cookies to improve your experience and analyze site usage with Google Analytics.{' '}
              <Link href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
                Learn more in our Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
