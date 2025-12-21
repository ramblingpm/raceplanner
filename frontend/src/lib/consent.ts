/**
 * Cookie consent management
 * Handles tracking consent for GDPR/CCPA compliance
 */

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

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
 * Wait for Google Analytics to be ready
 * Returns a promise that resolves when gtag is available
 */
function waitForGoogleAnalytics(maxWaitMs: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).gtag) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if ((window as any).gtag) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Initialize Google Analytics
 * Only call this after consent is given
 */
export function initializeGoogleAnalytics() {
  if (typeof window === 'undefined') return;

  // Check if GA4 ID is configured
  if (!GA4_MEASUREMENT_ID) {
    console.error('[GA4] No measurement ID configured. Set NEXT_PUBLIC_GA4_MEASUREMENT_ID');
    return;
  }

  // Check if already initialized
  if ((window as any).gtag) {
    console.log('[GA4] Already initialized');
    return;
  }

  console.log('[GA4] Initializing with ID:', GA4_MEASUREMENT_ID);

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  script1.onload = () => console.log('[GA4] Script loaded successfully');
  script1.onerror = () => console.error('[GA4] Failed to load script');
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_MEASUREMENT_ID}', {
      debug_mode: ${IS_DEVELOPMENT}
    });
    console.log('[GA4] Configuration complete');
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

/**
 * Track a custom event in Google Analytics
 * Only sends if consent is given
 *
 * @param eventName - Name of the event (e.g., 'button_click', 'plan_created')
 * @param eventParams - Additional parameters for the event
 *
 * @example
 * trackEvent('plan_created', { race_name: 'Vätternrundan 315', plan_label: 'Conservative Plan' })
 * trackEvent('button_click', { button_name: 'add_plan', location: 'dashboard' })
 */
export async function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') {
    console.log('[GA4] Skipped (server-side):', eventName);
    return;
  }

  if (!hasConsent()) {
    console.log('[GA4] Skipped (no consent):', eventName);
    return;
  }

  // Wait for GA to be ready
  const isReady = await waitForGoogleAnalytics();
  if (!isReady) {
    console.error('[GA4] Failed to load - event not sent:', eventName);
    return;
  }

  const gtag = (window as any).gtag;
  if (!gtag) {
    console.error('[GA4] gtag not available:', eventName);
    return;
  }

  // Add debug_mode to event parameters for DebugView (only in development)
  const params = IS_DEVELOPMENT ? {
    ...eventParams,
    debug_mode: true,
  } : eventParams;

  console.log('[GA4] Event sent:', eventName, params);
  gtag('event', eventName, params);
}

/**
 * Track a page view
 * Useful for SPA route changes
 *
 * @param path - The page path (e.g., '/dashboard', '/login')
 * @param title - Optional page title
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return;
  if (!GA4_MEASUREMENT_ID) return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  gtag('config', GA4_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Set the user ID for tracking specific users across sessions
 * This allows you to see individual user activity in GA4
 *
 * @param userId - The user's unique ID (e.g., from Supabase auth)
 *
 * @example
 * setUserId('123e4567-e89b-12d3-a456-426614174000')
 */
export async function setUserId(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return;
  if (!GA4_MEASUREMENT_ID) return;

  // Wait for GA to be ready
  const isReady = await waitForGoogleAnalytics();
  if (!isReady) return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  if (userId) {
    // Set user_id using the recommended method
    gtag('set', 'user_id', userId);

    // Also set in config for backwards compatibility
    gtag('config', GA4_MEASUREMENT_ID, {
      user_id: userId,
    });
  } else {
    // Clear user_id
    gtag('set', 'user_id', null);
  }
}

/**
 * Set user properties in Google Analytics
 * These properties persist across sessions and help segment users
 *
 * @param properties - Object containing user properties
 *
 * @example
 * setUserProperties({
 *   beta_user: 'yes',
 *   user_type: 'premium',
 *   signup_date: '2025-01-15'
 * })
 */
export async function setUserProperties(properties: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return;

  // Wait for GA to be ready
  const isReady = await waitForGoogleAnalytics();
  if (!isReady) return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  gtag('set', 'user_properties', properties);
}

// Track the last user ID we set to prevent duplicate tracking
let lastIdentifiedUserId: string | null = null;

/**
 * Set user identity in GA4 without tracking a login event
 * Call this when loading a user session (page loads, auth state changes)
 * This ensures GA4 knows who the user is across all their events
 *
 * @param userId - The user's unique ID
 * @param email - The user's email (for identifying beta users)
 * @param isBetaUser - Whether the user is a beta user
 *
 * @example
 * setUserIdentity('user-id-123', 'user@example.com', true)
 */
export async function setUserIdentity(userId: string, email: string, isBetaUser: boolean = false) {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return;

  // Only set identity once per user session
  if (lastIdentifiedUserId === userId) {
    return;
  }

  lastIdentifiedUserId = userId;

  // Set the user ID for this session
  await setUserId(userId);

  // Set user properties
  await setUserProperties({
    beta_user: isBetaUser ? 'yes' : 'no',
    user_email_domain: email.split('@')[1] || 'unknown',
  });
}


/**
 * Clear user tracking (call on logout)
 */
export async function clearUserTracking() {
  if (typeof window === 'undefined') return;

  // Track logout event before clearing user ID
  await trackEvent('user_logout', {
    method: 'manual',
  });

  // Reset identity cache
  lastIdentifiedUserId = null;

  await setUserId(null);
}
