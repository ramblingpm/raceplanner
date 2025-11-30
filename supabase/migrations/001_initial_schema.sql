-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Races table
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  route_geometry JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Race calculations table
CREATE TABLE IF NOT EXISTS race_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration_seconds INTEGER NOT NULL,
  calculated_finish_time TIMESTAMP WITH TIME ZONE NOT NULL,
  required_speed_kmh DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_duration CHECK (estimated_duration_seconds > 0),
  CONSTRAINT positive_speed CHECK (required_speed_kmh > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_race_calculations_user_id ON race_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_race_calculations_race_id ON race_calculations(race_id);
CREATE INDEX IF NOT EXISTS idx_race_calculations_created_at ON race_calculations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for races table
-- Anyone can read races
CREATE POLICY "Races are viewable by everyone"
  ON races FOR SELECT
  USING (true);

-- Only authenticated users can insert races (you might want to restrict this further)
CREATE POLICY "Authenticated users can insert races"
  ON races FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for race_calculations table
-- Users can only see their own calculations
CREATE POLICY "Users can view their own calculations"
  ON race_calculations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own calculations
CREATE POLICY "Users can insert their own calculations"
  ON race_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calculations
CREATE POLICY "Users can update their own calculations"
  ON race_calculations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own calculations
CREATE POLICY "Users can delete their own calculations"
  ON race_calculations FOR DELETE
  USING (auth.uid() = user_id);

-- Insert a sample race for testing
INSERT INTO races (name, distance_km, route_geometry)
VALUES (
  'Tour de Test',
  42.2,
  '{"type": "LineString", "coordinates": [[4.9041, 52.3676], [4.9141, 52.3776], [4.9241, 52.3876]]}'::jsonb
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_races_updated_at
  BEFORE UPDATE ON races
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
