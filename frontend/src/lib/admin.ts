import { supabase } from './supabase';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows returned (user is not an admin)
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all beta invites (admin only)
 */
export async function getBetaInvites() {
  try {
    const { data, error } = await supabase.rpc('get_beta_invites');

    if (error) {
      console.error('Error fetching beta invites:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching beta invites:', error);
    throw error;
  }
}

/**
 * Create a new beta invite (admin only)
 */
export async function createBetaInvite(
  email: string,
  invitedBy?: string,
  notes?: string
) {
  try {
    const { data, error } = await supabase.rpc('create_beta_invite', {
      invite_email: email,
      invited_by_email: invitedBy || null,
      invite_notes: notes || null,
    });

    if (error) {
      console.error('Error creating beta invite:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating beta invite:', error);
    throw error;
  }
}

/**
 * Delete a beta invite (admin only)
 */
export async function deleteBetaInvite(inviteId: string) {
  try {
    const { data, error } = await supabase.rpc('delete_beta_invite', {
      invite_id: inviteId,
    });

    if (error) {
      console.error('Error deleting beta invite:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error deleting beta invite:', error);
    throw error;
  }
}

/**
 * Approve a beta invite (admin only)
 */
export async function approveBetaInvite(inviteId: string, adminUserId: string) {
  try {
    const { data, error } = await supabase.rpc('approve_beta_invite', {
      invite_id: inviteId,
      admin_user_id: adminUserId,
    });

    if (error) {
      console.error('Error approving beta invite:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error approving beta invite:', error);
    throw error;
  }
}

export interface BetaInvite {
  id: string;
  email: string;
  invited_by: string | null;
  notes: string | null;
  used: boolean;
  used_at: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  email_confirmed_at: string | null;
}

/**
 * Get all users (admin only)
 */
export async function getUsers() {
  try {
    const { data, error } = await supabase.rpc('get_users_overview');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export interface RacePlanStats {
  total_plans: number;
  total_users_with_plans: number;
  plans_per_race: Array<{
    race_id: string;
    race_name: string;
    plan_count: number;
    unique_users: number;
  }>;
}

export interface UserRacePlan {
  plan_id: string;
  race_name: string;
  race_id: string;
  planned_start_time: string;
  required_speed_kmh: number;
  created_at: string;
}

export interface UserRacePlans {
  user_id: string;
  user_email: string;
  plan_count: number;
  last_plan_created_at: string;
  plans: UserRacePlan[];
}

/**
 * Get race plans statistics (admin only)
 */
export async function getRacePlansStats() {
  try {
    const { data, error } = await supabase.rpc('get_race_plans_stats');

    if (error) {
      console.error('Error fetching race plans stats:', error);
      throw error;
    }

    return data[0] as RacePlanStats;
  } catch (error) {
    console.error('Error fetching race plans stats:', error);
    throw error;
  }
}

/**
 * Get user race plans (admin only)
 */
export async function getUserRacePlans() {
  try {
    const { data, error } = await supabase.rpc('get_user_race_plans');

    if (error) {
      console.error('Error fetching user race plans:', error);
      throw error;
    }

    return data as UserRacePlans[];
  } catch (error) {
    console.error('Error fetching user race plans:', error);
    throw error;
  }
}
