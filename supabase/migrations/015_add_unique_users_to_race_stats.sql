-- Update get_race_plans_stats to include unique user count per race

CREATE OR REPLACE FUNCTION get_race_plans_stats()
RETURNS TABLE (
  total_plans BIGINT,
  total_users_with_plans BIGINT,
  plans_per_race JSONB
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

COMMENT ON FUNCTION get_race_plans_stats() IS 'Returns overall statistics about race plans including unique user count per race. Admin only.';
