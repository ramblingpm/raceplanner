-- Migration: Add admin access control for beta_invites table
-- This enables superusers (admin_users) to manage beta invites through the UI

-- Ensure the admin_users table exists (in case migration 005 wasn't applied)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Only admins can view admin list" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;

-- Simple policy: users can check if they themselves are an admin
-- This is all we need for the client-side admin check
CREATE POLICY "Users can view their own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure the is_admin function exists
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for beta_invites table
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to view all beta invites
CREATE POLICY "Admins can view all beta invites"
  ON beta_invites
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Allow admins to insert new beta invites
CREATE POLICY "Admins can insert beta invites"
  ON beta_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Allow admins to update beta invites
CREATE POLICY "Admins can update beta invites"
  ON beta_invites
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Allow admins to delete beta invites
CREATE POLICY "Admins can delete beta invites"
  ON beta_invites
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Allow public to check if email is invited (for signup page)
-- This maintains existing functionality while securing management
CREATE POLICY "Anyone can check invite status"
  ON beta_invites
  FOR SELECT
  TO anon
  USING (true);

-- Add helper function to get all beta invites (admin only)
CREATE OR REPLACE FUNCTION get_beta_invites()
RETURNS TABLE (
  id UUID,
  email TEXT,
  invited_by TEXT,
  notes TEXT,
  used BOOLEAN,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    bi.id,
    bi.email,
    bi.invited_by,
    bi.notes,
    bi.used,
    bi.used_at,
    bi.created_at,
    bi.updated_at
  FROM beta_invites bi
  ORDER BY bi.created_at DESC;
END;
$$;

-- Add helper function to create beta invite (admin only)
CREATE OR REPLACE FUNCTION create_beta_invite(
  invite_email TEXT,
  invited_by_email TEXT DEFAULT NULL,
  invite_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_invite_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Insert new invite
  INSERT INTO beta_invites (email, invited_by, notes)
  VALUES (LOWER(invite_email), invited_by_email, invite_notes)
  RETURNING id INTO new_invite_id;

  RETURN new_invite_id;
END;
$$;

-- Add helper function to delete beta invite (admin only)
CREATE OR REPLACE FUNCTION delete_beta_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  DELETE FROM beta_invites WHERE id = invite_id;

  RETURN FOUND;
END;
$$;

-- Comment for documentation
COMMENT ON FUNCTION get_beta_invites() IS 'Returns all beta invites. Admin only.';
COMMENT ON FUNCTION create_beta_invite(TEXT, TEXT, TEXT) IS 'Creates a new beta invite. Admin only. Email is automatically lowercased.';
COMMENT ON FUNCTION delete_beta_invite(UUID) IS 'Deletes a beta invite. Admin only. Returns true if deleted, false if not found.';
