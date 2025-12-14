-- Add function to get user information for admin dashboard
-- Returns user data including email, created date, last sign in, and admin status

CREATE OR REPLACE FUNCTION get_users_overview()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN,
  email_confirmed_at TIMESTAMP WITH TIME ZONE
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
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    EXISTS(SELECT 1 FROM admin_users WHERE user_id = u.id) as is_admin,
    u.email_confirmed_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_users_overview() IS 'Returns all users with their basic info and last sign-in time. Admin only.';
