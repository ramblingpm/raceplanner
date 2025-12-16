-- Emergency rollback of migration 020
-- This restores the original function definitions without SET search_path

-- 1. Restore update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Restore is_email_invited function
CREATE OR REPLACE FUNCTION is_email_invited(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_invites
    WHERE LOWER(email) = LOWER(check_email) AND approved = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Restore mark_invite_used function
CREATE OR REPLACE FUNCTION mark_invite_used(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE beta_invites
  SET used = TRUE, used_at = NOW()
  WHERE LOWER(email) = LOWER(user_email) AND used = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Restore is_admin function
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Restore get_beta_invites function
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

-- 6. Restore create_beta_invite function
CREATE OR REPLACE FUNCTION create_beta_invite(
  invite_email TEXT,
  invited_by_email TEXT DEFAULT NULL,
  invite_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 7. Restore delete_beta_invite function
CREATE OR REPLACE FUNCTION delete_beta_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 8. Restore approve_beta_invite function
CREATE OR REPLACE FUNCTION approve_beta_invite(invite_id UUID, admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE beta_invites
  SET approved = TRUE,
      approved_at = NOW(),
      approved_by = admin_user_id
  WHERE id = invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Restore request_beta_access function
CREATE OR REPLACE FUNCTION request_beta_access(
  signup_email TEXT,
  signup_notes TEXT DEFAULT 'Beta signup request from landing page'
)
RETURNS JSON AS $$
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

-- 10. Restore get_users_overview function
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

-- 11. Restore get_race_plans_stats function
CREATE OR REPLACE FUNCTION get_race_plans_stats()
RETURNS TABLE (
  total_plans BIGINT,
  total_users_with_plans BIGINT,
  plans_per_race JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Always return a single row, even if no plans exist
  total_plans := (SELECT COUNT(*) FROM race_calculations);
  total_users_with_plans := (SELECT COUNT(DISTINCT user_id) FROM race_calculations);
  plans_per_race := COALESCE(
    (
      SELECT jsonb_agg(race_stats)
      FROM (
        SELECT jsonb_build_object(
          'race_id', r.id,
          'race_name', r.name,
          'plan_count', COUNT(rc.id),
          'unique_users', COUNT(DISTINCT rc.user_id)
        ) as race_stats
        FROM races r
        LEFT JOIN race_calculations rc ON r.id = rc.race_id
        GROUP BY r.id, r.name
      ) subquery
    ),
    '[]'::jsonb
  );

  RETURN NEXT;
END;
$$;

-- 12. Restore get_user_race_plans function
CREATE OR REPLACE FUNCTION get_user_race_plans()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  plan_count BIGINT,
  last_plan_created_at TIMESTAMP WITH TIME ZONE,
  plans JSONB
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
    u.id as user_id,
    u.email::TEXT as user_email,
    COUNT(rc.id)::BIGINT as plan_count,
    MAX(rc.created_at) as last_plan_created_at,
    jsonb_agg(
      jsonb_build_object(
        'plan_id', rc.id,
        'race_name', r.name,
        'race_id', rc.race_id,
        'planned_start_time', rc.planned_start_time,
        'required_speed_kmh', rc.required_speed_kmh,
        'created_at', rc.created_at
      )
      ORDER BY rc.created_at DESC
    ) as plans
  FROM auth.users u
  LEFT JOIN race_calculations rc ON u.id = rc.user_id
  LEFT JOIN races r ON rc.race_id = r.id
  WHERE rc.id IS NOT NULL
  GROUP BY u.id, u.email
  ORDER BY COUNT(rc.id) DESC, MAX(rc.created_at) DESC;
END;
$$;

-- 13. Restore is_feature_enabled function
CREATE OR REPLACE FUNCTION is_feature_enabled(
  check_flag_key TEXT,
  check_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  user_override BOOLEAN;
  global_flag BOOLEAN;
BEGIN
  -- First, check if there's a user-specific override
  SELECT enabled INTO user_override
  FROM user_feature_flags
  WHERE flag_key = check_flag_key AND user_id = check_user_id;

  IF FOUND THEN
    RETURN user_override;
  END IF;

  -- Fall back to global flag setting
  SELECT enabled INTO global_flag
  FROM feature_flags
  WHERE flag_key = check_flag_key;

  RETURN COALESCE(global_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Restore create_email_action_token function
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

-- 15. Restore process_email_action function
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

-- 16. Restore cleanup_expired_email_tokens function
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
