-- Add feed zones for Vätternrundan 315km
-- Note: Coordinates are approximate and should be verified/updated with actual GPS coordinates

-- First, get the Vätternrundan race ID (assuming it exists in the races table)
DO $$
DECLARE
  vatternrundan_id UUID;
BEGIN
  -- Find Vätternrundan race (adjust the name matching as needed)
  SELECT id INTO vatternrundan_id
  FROM races
  WHERE name ILIKE '%vätternrundan%' OR name ILIKE '%vatternrundan%'
  LIMIT 1;

  -- Only insert feed zones if Vätternrundan race exists
  IF vatternrundan_id IS NOT NULL THEN
    -- Insert feed zones for Vätternrundan 315km
    -- These are the official feed zones along the route

    INSERT INTO feed_zones (race_id, name, distance_from_start_km, coordinates, order_index) VALUES
    -- Start in Motala
    (vatternrundan_id, 'Motala Start', 0, '{"lat": 58.5369, "lng": 15.0389}'::jsonb, 1),

    -- Vadstena (approximately 45km from start)
    (vatternrundan_id, 'Vadstena', 45, '{"lat": 58.4489, "lng": 14.8903}'::jsonb, 2),

    -- Hästholmen (approximately 100km from start)
    (vatternrundan_id, 'Hästholmen', 100, '{"lat": 58.2722, "lng": 14.5503}'::jsonb, 3),

    -- Ödeshög (approximately 150km from start)
    (vatternrundan_id, 'Ödeshög', 150, '{"lat": 58.2394, "lng": 14.6542}'::jsonb, 4),

    -- Omberg (approximately 185km from start)
    (vatternrundan_id, 'Omberg', 185, '{"lat": 58.2831, "lng": 14.7589}'::jsonb, 5),

    -- Gränna (approximately 230km from start)
    (vatternrundan_id, 'Gränna', 230, '{"lat": 58.0256, "lng": 14.4639}'::jsonb, 6),

    -- Jönköping (approximately 265km from start)
    (vatternrundan_id, 'Jönköping', 265, '{"lat": 57.7828, "lng": 14.1603}'::jsonb, 7),

    -- Hjo (approximately 300km from start)
    (vatternrundan_id, 'Hjo', 300, '{"lat": 58.3011, "lng": 14.2811}'::jsonb, 8);

    RAISE NOTICE 'Feed zones added for Vätternrundan';
  ELSE
    RAISE NOTICE 'Vätternrundan race not found. Skipping feed zone insertion.';
  END IF;
END $$;
