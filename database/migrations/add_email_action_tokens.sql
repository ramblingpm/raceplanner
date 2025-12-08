-- Create table for storing email action tokens
CREATE TABLE IF NOT EXISTS email_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'deny')),
  beta_invite_id UUID NOT NULL REFERENCES beta_invites(id) ON DELETE CASCADE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_action_tokens_token ON email_action_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_action_tokens_expires_at ON email_action_tokens(expires_at);

-- Enable RLS
ALTER TABLE email_action_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotent migrations)
DROP POLICY IF EXISTS "No direct access to email action tokens" ON email_action_tokens;

-- RLS policies (tokens should only be accessible via RPC functions)
CREATE POLICY "No direct access to email action tokens"
  ON email_action_tokens
  FOR ALL
  USING (FALSE);

-- Function to create an email action token
CREATE OR REPLACE FUNCTION create_email_action_token(
  p_email TEXT,
  p_action TEXT,
  p_beta_invite_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate a random token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Set expiry to 72 hours from now
  v_expires_at := NOW() + INTERVAL '72 hours';

  -- Insert the token
  INSERT INTO email_action_tokens (token, email, action, beta_invite_id, expires_at)
  VALUES (v_token, p_email, p_action, p_beta_invite_id, v_expires_at);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process email action (approve or deny)
CREATE OR REPLACE FUNCTION process_email_action(
  p_token TEXT
) RETURNS JSONB AS $$
DECLARE
  v_action_record RECORD;
  v_invite_record RECORD;
  v_admin_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get and validate the token
  SELECT * INTO v_action_record
  FROM email_action_tokens
  WHERE token = p_token
    AND used = FALSE
    AND expires_at > NOW();

  -- Check if token exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_or_expired_token',
      'message', 'The action link is invalid or has expired'
    );
  END IF;

  -- Get the beta invite
  SELECT * INTO v_invite_record
  FROM beta_invites
  WHERE id = v_action_record.beta_invite_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invite_not_found',
      'message', 'Beta invite not found'
    );
  END IF;

  -- Check if already processed
  IF v_invite_record.approved = TRUE THEN
    -- Mark token as used
    UPDATE email_action_tokens
    SET used = TRUE, used_at = NOW()
    WHERE token = p_token;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_approved',
      'message', 'This invite has already been approved',
      'email', v_action_record.email
    );
  END IF;

  -- Get the first admin user (for system actions)
  SELECT user_id INTO v_admin_user_id
  FROM admin_users
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_admin_configured',
      'message', 'No admin user configured in the system'
    );
  END IF;

  -- Perform the action
  IF v_action_record.action = 'approve' THEN
    -- Approve the invite
    UPDATE beta_invites
    SET
      approved = TRUE,
      approved_at = NOW(),
      approved_by = v_admin_user_id,
      updated_at = NOW()
    WHERE id = v_action_record.beta_invite_id;

    v_result := jsonb_build_object(
      'success', true,
      'action', 'approved',
      'message', 'Beta invite approved successfully',
      'email', v_action_record.email
    );
  ELSIF v_action_record.action = 'deny' THEN
    -- Delete the invite
    DELETE FROM beta_invites
    WHERE id = v_action_record.beta_invite_id;

    v_result := jsonb_build_object(
      'success', true,
      'action', 'denied',
      'message', 'Beta invite denied and removed',
      'email', v_action_record.email
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_action',
      'message', 'Invalid action type'
    );
  END IF;

  -- Mark token as used
  UPDATE email_action_tokens
  SET used = TRUE, used_at = NOW()
  WHERE token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_email_action_token(TEXT, TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION process_email_action(TEXT) TO authenticated, anon;

-- Cleanup function to remove expired tokens (run this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_email_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM email_action_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
