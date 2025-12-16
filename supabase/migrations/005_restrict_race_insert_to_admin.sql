-- Create admin_users table to track who can manage races
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see who is an admin
CREATE POLICY "Only admins can view admin list"
  ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Drop the old policy that allowed all authenticated users to insert races
DROP POLICY IF EXISTS "Authenticated users can insert races" ON races;

-- Create new policy: only admin users can insert races
CREATE POLICY "Only admins can insert races"
  ON races FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Also add policies for updating and deleting races (admin only)
CREATE POLICY "Only admins can update races"
  ON races FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Only admins can delete races"
  ON races FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: After running this migration, you'll need to add your user_id to admin_users
-- Run this query after you've signed up (replace YOUR_USER_ID with your actual user ID):
-- INSERT INTO admin_users (user_id) VALUES ('YOUR_USER_ID');
--

