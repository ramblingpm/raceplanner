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

export interface BetaInvite {
  id: string;
  email: string;
  invited_by: string | null;
  notes: string | null;
  used: boolean;
  used_at: string | null;
  created_at: string;
  updated_at: string;
}
