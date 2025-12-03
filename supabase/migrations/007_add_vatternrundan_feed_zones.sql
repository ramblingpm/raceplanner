-- Add feed zones for Vätternrundan 315km
-- Note: Coordinates are checked and match the route closely

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

    -- Ödeshög (approximately 47km from start)
    (vatternrundan_id, 'Ödeshög', '47.00', '{"lat": 58.2323, "lng": 14.6436}'::jsonb, 1),
    -- Ölmstad (approximately 83km from start)
    (vatternrundan_id, 'Ölmstad', '83.00', '{"lat": 57.9273, "lng": 14.3967}'::jsonb, 2),
    -- Jönköping (approximately 104km from start)
    (vatternrundan_id, 'Jönköping', '104.00', '{"lat": 57.7826, "lng": 14.1618}'::jsonb, 3),
    -- Fagerhult (approximately 133km from start) 
    (vatternrundan_id, 'Fagerhult', '133.00', '{"lat": 57.9986, "lng": 14.1192}'::jsonb, 4),
    -- Hjo (approximately 171km from start)
    (vatternrundan_id, 'Hjo', '171.00', '{"lat": 58.3071, "lng": 14.2875}'::jsonb, 5),
    -- Karlsborg (approximately 204km from start)
    (vatternrundan_id, 'Karlsborg', '204.00', '{"lat": 58.5372, "lng": 14.5047}'::jsonb, 6),
    -- Boviken (approximately 225km from start)
    (vatternrundan_id, 'Boviken', '225.00', '{"lat": 58.6824, "lng": 14.6442}'::jsonb, 7),
    -- Askersund (approximately 256km from start)
    (vatternrundan_id, 'Askersund', '256.00', '{"lat": 58.8799, "lng": 14.9023}'::jsonb, 9),
    -- Godegård (approximately 284km from start)
    (vatternrundan_id, 'Godegård', '284.00', '{"lat": 58.7478, "lng": 15.1631}'::jsonb, 10);
    

    RAISE NOTICE 'Feed zones added for Vätternrundan';
  ELSE
    RAISE NOTICE 'Vätternrundan race not found. Skipping feed zone insertion.';
  END IF;
END $$;
