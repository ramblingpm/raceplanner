-- Add elevation data fields to races table
-- Migration created: 2024-12-24

-- Add elevation_data column (array of elevations in meters)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS elevation_data numeric[] DEFAULT NULL;

-- Add elevation_gain_m column (total elevation gain in meters)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS elevation_gain_m integer DEFAULT NULL;

-- Add elevation_loss_m column (total elevation loss in meters)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS elevation_loss_m integer DEFAULT NULL;

-- Add min_elevation_m column (minimum elevation in meters)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS min_elevation_m integer DEFAULT NULL;

-- Add max_elevation_m column (maximum elevation in meters)
ALTER TABLE races
ADD COLUMN IF NOT EXISTS max_elevation_m integer DEFAULT NULL;

-- Add comment to elevation_data column
COMMENT ON COLUMN races.elevation_data IS 'Array of elevation values in meters, one for each coordinate point in route_geometry';

-- Add comment to elevation_gain_m column
COMMENT ON COLUMN races.elevation_gain_m IS 'Total elevation gain in meters (cumulative climbing)';

-- Add comment to elevation_loss_m column
COMMENT ON COLUMN races.elevation_loss_m IS 'Total elevation loss in meters (cumulative descending)';

-- Add comment to min_elevation_m column
COMMENT ON COLUMN races.min_elevation_m IS 'Minimum elevation point on the route in meters';

-- Add comment to max_elevation_m column
COMMENT ON COLUMN races.max_elevation_m IS 'Maximum elevation point on the route in meters';

-- Create index on races that have elevation data for faster queries
CREATE INDEX IF NOT EXISTS idx_races_has_elevation
ON races (id)
WHERE elevation_data IS NOT NULL;
