import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { setUserIdentity, clearUserTracking } from './consent';

export interface AuthUser extends User {}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  // Clear user tracking in GA4
  await clearUserTracking();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

export async function resetPasswordRequest(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Check if a user is a beta user (invited via beta_invites table)
 */
export async function isBetaUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('is_email_invited', { check_email: email });

    if (error) {
      console.error('Error checking beta status:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking beta status:', error);
    return false;
  }
}

/**
 * Set user identity in GA4 for session tracking
 * Call this when loading an authenticated user (page loads, auth state changes)
 * This does NOT track a login event - it only sets the user ID for GA4
 */
export async function setUserIdentityInAnalytics(user: AuthUser) {
  if (!user.email) return;

  const isBeta = await isBetaUser(user.email);
  await setUserIdentity(user.id, user.email, isBeta);
}

/**
 * Track user signup event in Google Analytics
 * Call this ONLY after successful signup
 */
export async function trackUserSignup(user: AuthUser) {
  if (!user.email) return;

  const isBeta = await isBetaUser(user.email);

  // Set user identity
  await setUserIdentity(user.id, user.email, isBeta);

  // Import trackEvent to fire signup event
  const { trackEvent } = await import('./consent');
  await trackEvent('sign_up', {
    method: 'email',
    beta_user: isBeta,
  });
}

/**
 * Track user login event in Google Analytics
 * Call this ONLY after successful login
 */
export async function trackUserLogin(user: AuthUser) {
  if (!user.email) return;

  const isBeta = await isBetaUser(user.email);

  // Set user identity
  await setUserIdentity(user.id, user.email, isBeta);

  // Import trackEvent to fire login event
  const { trackEvent } = await import('./consent');
  await trackEvent('login', {
    method: 'email',
    beta_user: isBeta,
  });
}
