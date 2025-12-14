-- Add functions to get race plans overview for admin dashboard
-- Returns statistics about race plans per user and per race

-- Function to get overall race plan statistics
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
          'plan_count', COUNT(rc.id)
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

-- Function to get race plans per user with details
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

COMMENT ON FUNCTION get_race_plans_stats() IS 'Returns overall statistics about race plans. Admin only.';
COMMENT ON FUNCTION get_user_race_plans() IS 'Returns race plans grouped by user with all details. Admin only.';
