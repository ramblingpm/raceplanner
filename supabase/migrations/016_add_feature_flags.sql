-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific feature flags (for gradual rollout)
CREATE TABLE IF NOT EXISTS user_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL REFERENCES feature_flags(flag_key) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flag_key)
);

-- RLS Policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  USING (is_admin(auth.uid()));

-- Users can read their own flag overrides
CREATE POLICY "Users can read their own feature flags"
  ON user_feature_flags FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage user flags
CREATE POLICY "Admins can manage user feature flags"
  ON user_feature_flags FOR ALL
  USING (is_admin(auth.uid()));

-- Helper function to check if a feature is enabled for a user
CREATE OR REPLACE FUNCTION is_feature_enabled(
  check_flag_key TEXT,
  check_user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN
SET search_path = ''
AS $$
DECLARE
  user_override BOOLEAN;
  global_flag BOOLEAN;
BEGIN
  -- First, check if there's a user-specific override
  SELECT enabled INTO user_override
  FROM user_feature_flags
  WHERE flag_key = check_flag_key AND user_id = check_user_id;

  IF FOUND THEN
    RETURN user_override;
  END IF;

  -- Fall back to global flag setting
  SELECT enabled INTO global_flag
  FROM feature_flags
  WHERE flag_key = check_flag_key;

  RETURN COALESCE(global_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial feature flags
INSERT INTO feature_flags (flag_key, name, description, enabled) VALUES
  ('beta_features', 'Beta Features', 'Access to experimental features', false)
ON CONFLICT (flag_key) DO NOTHING;
