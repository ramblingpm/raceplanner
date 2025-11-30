-- Create feed_zones table for admin-defined feed zones per race
CREATE TABLE IF NOT EXISTS feed_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  distance_from_start_km DECIMAL(10, 2) NOT NULL,
  coordinates JSONB NOT NULL, -- {lat: number, lng: number}
  order_index INTEGER NOT NULL, -- Order along the race route
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_distance CHECK (distance_from_start_km >= 0)
);

-- Create plan_feed_zones table for user-selected feed zones in their plans
CREATE TABLE IF NOT EXISTS plan_feed_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES race_calculations(id) ON DELETE CASCADE,
  feed_zone_id UUID NOT NULL REFERENCES feed_zones(id) ON DELETE CASCADE,
  planned_duration_seconds INTEGER NOT NULL DEFAULT 0,
  planned_arrival_time TIMESTAMP WITH TIME ZONE, -- Optional: user can set expected arrival
  planned_departure_time TIMESTAMP WITH TIME ZONE, -- Optional: user can set expected departure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_duration CHECK (planned_duration_seconds >= 0),
  CONSTRAINT unique_feed_zone_per_plan UNIQUE(calculation_id, feed_zone_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_zones_race_id ON feed_zones(race_id);
CREATE INDEX IF NOT EXISTS idx_feed_zones_order ON feed_zones(race_id, order_index);
CREATE INDEX IF NOT EXISTS idx_plan_feed_zones_calculation_id ON plan_feed_zones(calculation_id);
CREATE INDEX IF NOT EXISTS idx_plan_feed_zones_feed_zone_id ON plan_feed_zones(feed_zone_id);

-- Enable Row Level Security
ALTER TABLE feed_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_feed_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_zones table
-- Everyone can read feed zones
CREATE POLICY "Feed zones are viewable by everyone"
  ON feed_zones FOR SELECT
  USING (true);

-- Only admins can insert/update/delete feed zones (managed via admin panel or direct DB access)
CREATE POLICY "Only service role can manage feed zones"
  ON feed_zones FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for plan_feed_zones table
-- Users can only see their own plan feed zones
CREATE POLICY "Users can view their own plan feed zones"
  ON plan_feed_zones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_calculations
      WHERE race_calculations.id = plan_feed_zones.calculation_id
      AND race_calculations.user_id = auth.uid()
    )
  );

-- Users can insert their own plan feed zones
CREATE POLICY "Users can insert their own plan feed zones"
  ON plan_feed_zones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM race_calculations
      WHERE race_calculations.id = plan_feed_zones.calculation_id
      AND race_calculations.user_id = auth.uid()
    )
  );

-- Users can update their own plan feed zones
CREATE POLICY "Users can update their own plan feed zones"
  ON plan_feed_zones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM race_calculations
      WHERE race_calculations.id = plan_feed_zones.calculation_id
      AND race_calculations.user_id = auth.uid()
    )
  );

-- Users can delete their own plan feed zones
CREATE POLICY "Users can delete their own plan feed zones"
  ON plan_feed_zones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM race_calculations
      WHERE race_calculations.id = plan_feed_zones.calculation_id
      AND race_calculations.user_id = auth.uid()
    )
  );

-- Trigger to automatically update updated_at for feed_zones
CREATE TRIGGER update_feed_zones_updated_at
  BEFORE UPDATE ON feed_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
