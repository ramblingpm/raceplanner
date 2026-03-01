-- Security fixes

-- 1. Add admin SELECT policy on feedback table
-- (INSERT-only RLS was correct for users, but admins need to read feedback)
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- 2. Restrict beta_invites public SELECT
-- The old policy exposed all invite data (emails, notes, approval status) to anonymous users.
-- Drop the overly permissive policy and replace with a secure RPC function.
DROP POLICY IF EXISTS "Anyone can check invite status" ON beta_invites;

-- Allow only authenticated users and the check function to read invites
CREATE POLICY "Admins can view all beta invites"
  ON beta_invites FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Secure function for the signup page to check invite status without exposing data
CREATE OR REPLACE FUNCTION public.check_email_invited(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.beta_invites
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_invited(TEXT) TO anon, authenticated;
