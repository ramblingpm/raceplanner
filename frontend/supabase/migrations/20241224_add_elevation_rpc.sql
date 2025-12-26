-- Create RPC function for admin to update race elevation data
-- This function has SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION update_race_elevation(
  p_race_id uuid,
  p_elevation_data numeric[],
  p_elevation_gain_m integer,
  p_elevation_loss_m integer,
  p_min_elevation_m integer,
  p_max_elevation_m integer
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_race json;
  v_user_id uuid;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Check if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Only admins can update race elevation data';
  END IF;

  -- Update the race with elevation data
  UPDATE races
  SET
    elevation_data = p_elevation_data,
    elevation_gain_m = p_elevation_gain_m,
    elevation_loss_m = p_elevation_loss_m,
    min_elevation_m = p_min_elevation_m,
    max_elevation_m = p_max_elevation_m,
    updated_at = now()
  WHERE id = p_race_id
  RETURNING to_json(races.*) INTO v_updated_race;

  -- Check if race was found and updated
  IF v_updated_race IS NULL THEN
    RAISE EXCEPTION 'Race not found with id: %', p_race_id;
  END IF;

  RETURN v_updated_race;
END;
$$;

-- Add comment
COMMENT ON FUNCTION update_race_elevation IS 'Admin function to update elevation data for a race. Bypasses RLS.';

-- Grant execute permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION update_race_elevation TO authenticated;
