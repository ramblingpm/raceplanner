/**
 * Cookie consent management
 * Handles tracking consent for GDPR/CCPA compliance
 */

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';

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
      console.log('✅ Google Analytics already loaded');
      resolve(true);
      return;
    }

    console.log('⏳ Waiting for Google Analytics to load...');
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if ((window as any).gtag) {
        clearInterval(checkInterval);
        const waitTime = Date.now() - startTime;
        console.log(`✅ Google Analytics loaded after ${waitTime}ms`);
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval);
        console.warn('❌ Google Analytics failed to load within timeout');
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
    console.warn('❌ Google Analytics not initialized: NEXT_PUBLIC_GA4_MEASUREMENT_ID is not set');
    return;
  }

  // Check if already initialized
  if ((window as any).gtag) {
    console.log('ℹ️ Google Analytics already initialized');
    return;
  }

  console.log('📊 Initializing Google Analytics with ID:', GA4_MEASUREMENT_ID);

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_MEASUREMENT_ID}');
  `;
  document.head.appendChild(script2);

  console.log('📊 Google Analytics scripts added to page');
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
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return;

  const gtag = (window as any).gtag;
  if (!gtag) {
    console.warn('⚠️ Cannot track event: gtag not available');
    return;
  }

  console.log('📤 Tracking event:', eventName, eventParams);
  gtag('event', eventName, eventParams);
  console.log('✅ Event tracked successfully');
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
  if (typeof window === 'undefined') {
    console.warn('⚠️ setUserId: Window is undefined');
    return;
  }

  if (!hasConsent()) {
    console.warn('⚠️ setUserId: No consent given');
    return;
  }

  if (!GA4_MEASUREMENT_ID) {
    console.warn('⚠️ setUserId: GA4_MEASUREMENT_ID not configured');
    return;
  }

  console.log('🔄 setUserId called with:', userId);

  // Wait for GA to be ready
  const isReady = await waitForGoogleAnalytics();
  if (!isReady) {
    console.warn('❌ Cannot set user ID: Google Analytics not ready');
    return;
  }

  const gtag = (window as any).gtag;
  if (!gtag) {
    console.warn('❌ gtag function not available');
    return;
  }

  if (userId) {
    console.log('📤 Sending user_id to GA4:', userId);

    // Set user_id using the recommended method
    gtag('set', 'user_id', userId);

    // Also set in config for backwards compatibility
    gtag('config', GA4_MEASUREMENT_ID, {
      user_id: userId,
    });

    console.log('✅ GA4 User ID set successfully:', userId);

    // Log the dataLayer to verify
    console.log('📊 Current dataLayer:', (window as any).dataLayer);
  } else {
    console.log('🧹 Clearing user_id from GA4');
    // Clear user_id
    gtag('set', 'user_id', null);
    console.log('✅ GA4 User ID cleared');
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

  console.log('🔄 setUserProperties called with:', properties);

  // Wait for GA to be ready
  const isReady = await waitForGoogleAnalytics();
  if (!isReady) {
    console.warn('❌ Cannot set user properties: Google Analytics not ready');
    return;
  }

  const gtag = (window as any).gtag;
  if (!gtag) return;

  console.log('📤 Sending user properties to GA4:', properties);
  gtag('set', 'user_properties', properties);
  console.log('✅ User properties set successfully');
}

/**
 * Track user login and set user ID
 * Call this after successful login/signup
 *
 * @param userId - The user's unique ID
 * @param email - The user's email (for identifying beta users)
 * @param isBetaUser - Whether the user is a beta user
 *
 * @example
 * trackUserLogin('user-id-123', 'user@example.com', true)
 */
export async function trackUserLogin(userId: string, email: string, isBetaUser: boolean = false) {
  console.log('🔍 trackUserLogin called:', { userId, email, isBetaUser });

  if (typeof window === 'undefined') {
    console.warn('⚠️ Window is undefined, skipping tracking');
    return;
  }

  if (!hasConsent()) {
    console.warn('⚠️ No consent, skipping tracking');
    return;
  }

  console.log('✅ Setting user ID:', userId);
  // Set the user ID for this session
  await setUserId(userId);

  console.log('✅ Setting user properties');
  // Set user properties
  await setUserProperties({
    beta_user: isBetaUser ? 'yes' : 'no',
    user_email_domain: email.split('@')[1] || 'unknown',
  });

  console.log('✅ Tracking login event');
  // Track the login event
  trackEvent('login', {
    method: 'email',
    beta_user: isBetaUser,
  });
}

/**
 * Clear user tracking (call on logout)
 */
export async function clearUserTracking() {
  if (typeof window === 'undefined') return;

  await setUserId(null);
}
