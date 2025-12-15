-- Add is_public field to races table for visibility control
-- By default, new races are only visible to admins (is_public = false)
-- Admins can enable them for all users by setting is_public = true
ALTER TABLE races ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update existing races to be public (maintain current behavior)
UPDATE races SET is_public = true WHERE is_public IS NULL;

-- Make sure it's not null
ALTER TABLE races ALTER COLUMN is_public SET NOT NULL;

-- Update the RLS policy for races to consider is_public
-- Drop the old policy
DROP POLICY IF EXISTS "Races are viewable by everyone" ON races;

-- Create new policy: everyone can see public races, admins can see all races
CREATE POLICY "Public races are viewable by everyone, admins see all"
  ON races FOR SELECT
  USING (
    is_public = true
    OR
    is_admin(auth.uid())
  );

-- Add comment to explain the column
COMMENT ON COLUMN races.is_public IS 'Whether the race is visible to all users (true) or only admins (false). New races default to false for testing.';
