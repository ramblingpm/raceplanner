-- Update get_beta_invites function to include approved fields
-- Migration 010 added approved, approved_at, approved_by columns
-- but migration 008's get_beta_invites() function wasn't updated

-- Drop the old function first since we're changing the return type
DROP FUNCTION IF EXISTS get_beta_invites();

CREATE OR REPLACE FUNCTION get_beta_invites()
RETURNS TABLE (
  id UUID,
  email TEXT,
  invited_by TEXT,
  notes TEXT,
  used BOOLEAN,
  used_at TIMESTAMP WITH TIME ZONE,
  approved BOOLEAN,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    bi.approved,
    bi.approved_at,
    bi.approved_by,
    bi.created_at,
    bi.updated_at
  FROM beta_invites bi
  ORDER BY bi.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_beta_invites() IS 'Returns all beta invites with approval status. Admin only.';
