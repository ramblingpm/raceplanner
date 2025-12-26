-- Rollback elevation data fields from races table
-- This reverses the 20241224_add_elevation_fields.sql migration

-- Drop index first
DROP INDEX IF EXISTS idx_races_has_elevation;

-- Remove elevation columns
ALTER TABLE races
DROP COLUMN IF EXISTS elevation_data;

ALTER TABLE races
DROP COLUMN IF EXISTS elevation_gain_m;

ALTER TABLE races
DROP COLUMN IF EXISTS elevation_loss_m;

ALTER TABLE races
DROP COLUMN IF EXISTS min_elevation_m;

ALTER TABLE races
DROP COLUMN IF EXISTS max_elevation_m;
