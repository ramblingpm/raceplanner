import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { trackUserLogin, clearUserTracking } from './consent';

export interface AuthUser extends User {}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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
 * Track user authentication in Google Analytics
 * Call this after successful login or when loading an authenticated user
 */
export async function trackUserAuthentication(user: AuthUser) {
  console.log('🔍 trackUserAuthentication called with user:', user.id);

  if (!user.email) {
    console.warn('⚠️ No user email found, skipping tracking');
    return;
  }

  const isBeta = await isBetaUser(user.email);
  console.log('✅ Calling trackUserLogin with:', { userId: user.id, email: user.email, isBeta });

  await trackUserLogin(user.id, user.email, isBeta);
}
