-- Update feed zones RLS policy to allow admins to manage feed zones
-- Currently only service_role can manage, but admins need access too

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Only service role can manage feed zones" ON feed_zones;

-- Create new policy: admins can manage feed zones
CREATE POLICY "Admins can manage feed zones"
  ON feed_zones FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Comment to explain the change
COMMENT ON TABLE feed_zones IS 'Feed zones can be managed by admin users through the admin panel';
