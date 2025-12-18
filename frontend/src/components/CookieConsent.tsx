'use client';

import { useEffect, useState } from 'react';
import { getConsentStatus, setConsentStatus } from '@/lib/consent';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show modal if consent is pending (not decided yet)
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
    <>
      {/* Backdrop overlay - blocks all interaction */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-[100] backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-surface-background rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-10 animate-in fade-in zoom-in duration-300 border border-border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🍪</div>
            <h2
              id="cookie-consent-title"
              className="text-2xl md:text-3xl font-bold text-text-primary mb-3"
            >
              We use cookies
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              We use cookies to improve your experience and analyze site usage with Google Analytics.{' '}
              <Link
                href="/privacy-policy"
                className="text-text-primary hover:text-text-secondary underline font-medium"
              >
                Learn more in our Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleReject}
              className="flex-1 px-6 py-4 text-base font-semibold text-text-primary bg-surface-background border-2 border-border rounded-lg hover:bg-surface-1 focus:outline-none focus:ring-4 focus:ring-border-focus transition-all"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-4 text-base font-semibold text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-4 focus:ring-secondary focus:ring-offset-2 transition-all"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
