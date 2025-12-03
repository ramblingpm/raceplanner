/**
 * Cookie consent management
 * Handles tracking consent for GDPR/CCPA compliance
 */

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

/**
 * Get the current consent status
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof document === 'undefined') return 'pending';

  const consent = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (consent === 'accepted') return 'accepted';
  if (consent === 'rejected') return 'rejected';
  return 'pending';
}

/**
 * Set consent status
 */
export function setConsentStatus(status: 'accepted' | 'rejected') {
  if (typeof document === 'undefined') return;

  document.cookie = `${CONSENT_COOKIE_NAME}=${status}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Strict`;

  // If accepted, initialize Google Analytics
  if (status === 'accepted') {
    initializeGoogleAnalytics();
  }
}

/**
 * Check if user has given consent (either explicitly or via signup)
 */
export function hasConsent(): boolean {
  return getConsentStatus() === 'accepted';
}

/**
 * Initialize Google Analytics
 * Only call this after consent is given
 */
export function initializeGoogleAnalytics() {
  if (typeof window === 'undefined') return;

  // Check if already initialized
  if ((window as any).gtag) return;

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-83ZSZHNKMB';
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-83ZSZHNKMB');
  `;
  document.head.appendChild(script2);
}

/**
 * Set consent for logged-in users (they agreed during signup)
 */
export function setLoggedInConsent() {
  if (getConsentStatus() === 'pending') {
    setConsentStatus('accepted');
  }
}
