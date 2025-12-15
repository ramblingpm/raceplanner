import { supabase } from './supabase';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFeatureFlag {
  id: string;
  user_id: string;
  flag_key: string;
  enabled: boolean;
  created_at: string;
}

// Get all feature flags
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Check if a specific feature is enabled for current user
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_feature_enabled', { check_flag_key: flagKey });

  if (error) {
    console.error(`Error checking feature flag ${flagKey}:`, error);
    return false;
  }

  return data === true;
}

// Admin: Toggle a global feature flag
export async function toggleFeatureFlag(flagKey: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('flag_key', flagKey);

  if (error) throw error;
}

// Admin: Enable feature for specific user
export async function enableFeatureForUser(flagKey: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_feature_flags')
    .upsert({ flag_key: flagKey, user_id: userId, enabled: true });

  if (error) throw error;
}

// Admin: Disable feature for specific user
export async function disableFeatureForUser(flagKey: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_feature_flags')
    .delete()
    .eq('flag_key', flagKey)
    .eq('user_id', userId);

  if (error) throw error;
}

// Admin: Get user overrides for a flag
export async function getUserFlagOverrides(flagKey: string): Promise<UserFeatureFlag[]> {
  const { data, error } = await supabase
    .from('user_feature_flags')
    .select('*')
    .eq('flag_key', flagKey);

  if (error) throw error;
  return data || [];
}
