-- Add approved field to beta_invites table for admin approval workflow
ALTER TABLE beta_invites
ADD COLUMN approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Update existing invites to be approved (backward compatibility)
UPDATE beta_invites SET approved = TRUE, approved_at = created_at WHERE used = TRUE;

-- Create function to approve beta invite
CREATE OR REPLACE FUNCTION approve_beta_invite(invite_id UUID, admin_user_id UUID)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  UPDATE beta_invites
  SET approved = TRUE,
      approved_at = NOW(),
      approved_by = admin_user_id
  WHERE id = invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the is_email_invited function to also check if approved
CREATE OR REPLACE FUNCTION is_email_invited(check_email TEXT)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_invites
    WHERE LOWER(email) = LOWER(check_email) AND approved = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to insert their own beta signup requests
CREATE POLICY "Users can request beta access" ON beta_invites
  FOR INSERT
  WITH CHECK (true);

-- Comment explaining the workflow
COMMENT ON COLUMN beta_invites.approved IS 'Whether the beta signup has been approved by an admin';
COMMENT ON COLUMN beta_invites.approved_at IS 'When the beta signup was approved';
COMMENT ON COLUMN beta_invites.approved_by IS 'Which admin approved the beta signup';
