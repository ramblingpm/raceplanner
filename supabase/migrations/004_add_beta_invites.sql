-- Create beta invites table
CREATE TABLE beta_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  notes TEXT,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Only allow reading (no public insert/update/delete)
CREATE POLICY "Anyone can check if invited" ON beta_invites
  FOR SELECT
  USING (true);

-- Create function to check if email is invited
CREATE OR REPLACE FUNCTION is_email_invited(check_email TEXT)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_invites
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark invite as used
CREATE OR REPLACE FUNCTION mark_invite_used(user_email TEXT)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  UPDATE beta_invites
  SET used = TRUE, used_at = NOW()
  WHERE LOWER(email) = LOWER(user_email) AND used = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert your own email as the first invite
INSERT INTO beta_invites (email, invited_by, notes)
VALUES ('stephan@hale.se', 'admin', 'Initial admin user');
