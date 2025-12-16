-- Create a secure function for beta signup that doesn't expose user data
-- Returns a generic success message to prevent email enumeration
CREATE OR REPLACE FUNCTION request_beta_access(
  signup_email TEXT,
  signup_notes TEXT DEFAULT 'Beta signup request from landing page'
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
  existing_invite RECORD;
BEGIN
  -- Check if email already exists
  SELECT * INTO existing_invite
  FROM beta_invites
  WHERE LOWER(email) = LOWER(signup_email);

  -- If already exists (either pending or approved), silently succeed
  -- This prevents email enumeration while avoiding duplicate requests
  IF existing_invite.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Request submitted successfully'
    );
  END IF;

  -- Insert new beta signup request
  INSERT INTO beta_invites (email, invited_by, notes, approved)
  VALUES (LOWER(signup_email), 'self-signup', signup_notes, FALSE);

  RETURN json_build_object(
    'success', true,
    'message', 'Request submitted successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    -- In case of race condition, still return success
    RETURN json_build_object(
      'success', true,
      'message', 'Request submitted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION request_beta_access(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION request_beta_access(TEXT, TEXT) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION request_beta_access(TEXT, TEXT) IS
  'Securely handles beta access requests without exposing user data. Returns status without revealing if emails exist in the system.';
