# Feed Zones Implementation

## Overview
This document describes the feed zone feature implementation for Race Planner, allowing users to plan stops at predefined feed zones along race routes.

## Completed Steps

### 1. Database Schema ✅
Created two new tables:

**`feed_zones`** - Admin-defined feed zones for each race
- `id` (UUID): Primary key
- `race_id` (UUID): Reference to races table
- `name` (TEXT): Feed zone name (e.g., "Motala Start", "Vadstena")
- `distance_from_start_km` (DECIMAL): Distance from race start
- `coordinates` (JSONB): GPS coordinates {lat, lng}
- `order_index` (INTEGER): Order along the route
- Includes RLS policies (read-only for users, admin-only management)

**`plan_feed_zones`** - User-selected feed zones in their plans
- `id` (UUID): Primary key
- `calculation_id` (UUID): Reference to race_calculations
- `feed_zone_id` (UUID): Reference to feed_zones
- `planned_duration_seconds` (INTEGER): How long they plan to stop
- `planned_arrival_time` (TIMESTAMP): Optional arrival time
- `planned_departure_time` (TIMESTAMP): Optional departure time
- Includes RLS policies (users can only manage their own)

### 2. Vätternrundan Feed Zones ✅
Added 8 official feed zones for Vätternrundan 315km:
1. Motala Start (0 km)
2. Vadstena (45 km)
3. Hästholmen (100 km)
4. Ödeshög (150 km)
5. Omberg (185 km)
6. Gränna (230 km)
7. Jönköping (265 km)
8. Hjo (300 km)

**Note**: Coordinates are approximate and should be verified with actual GPS data.

### 3. TypeScript Types ✅
Added to `frontend/src/types/index.ts`:
- `FeedZone` interface
- `PlanFeedZone` interface

### 4. Translations ✅
Added both English and Swedish translations for:
- Feed zone labels
- UI descriptions
- Form fields (arrival time, departure time, stop duration)
- Action buttons

## Next Steps (To Be Implemented)

### 5. Feed Zone Selection UI Component
Create a component that allows users to:
- View available feed zones for a race
- Select which zones they'll stop at
- Set stop duration for each zone (required)
- Optionally set arrival/departure times
- See total feed zone time

**Suggested location**: `frontend/src/components/FeedZoneSelector.tsx`

**Features**:
- Dropdown or checkbox list of available feed zones
- Duration input (hours/minutes)
- Optional time pickers for arrival/departure
- Display distance from start for each zone
- Show running total of feed zone time

### 6. Integration with Race Calculator
Update `RaceCalculator.tsx` to:
- Fetch available feed zones for the selected race
- Include FeedZoneSelector component
- Save selected feed zones when saving plan
- Load existing feed zone selections when editing
- Include feed zone time in total time calculations

### 7. Database Functions Needed
You may want to create helper functions:

```sql
-- Function to get feed zones for a race
CREATE OR REPLACE FUNCTION get_race_feed_zones(race_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  distance_from_start_km DECIMAL,
  coordinates JSONB,
  order_index INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT fz.id, fz.name, fz.distance_from_start_km, fz.coordinates, fz.order_index
  FROM feed_zones fz
  WHERE fz.race_id = race_uuid
  ORDER BY fz.order_index;
END;
$$ LANGUAGE plpgsql;
```

### 8. API/Data Fetching
Add functions to fetch feed zones:
- `getFeedZones(raceId)` - Get all feed zones for a race
- `savePlanFeedZones(calculationId, feedZones)` - Save selected feed zones
- `getPlanFeedZones(calculationId)` - Get feed zones for a plan

## Migration Files Created

1. `006_add_feed_zones.sql` - Creates tables and policies
2. `007_add_vatternrundan_feed_zones.sql` - Adds Vätternrundan data

## How to Apply Migrations

Run these commands in your Supabase project:

```bash
# Apply the feed zones schema
supabase migration up

# Or manually run each migration file in order
psql $DATABASE_URL < supabase/migrations/006_add_feed_zones.sql
psql $DATABASE_URL < supabase/migrations/007_add_vatternrundan_feed_zones.sql
```

## Future Enhancements

1. **Auto-calculate arrival times** based on pace and distance
2. **Feed zone markers on map** showing locations
3. **Nutrition/refueling tracking** per feed zone
4. **Historical data** from past races at feed zones
5. **Admin UI** for managing feed zones (instead of direct DB access)
6. **Bulk import** feed zones from GPX/CSV files

## Notes for Adding New Races

When adding feed zones for a new race:

1. Get GPS coordinates for each feed zone
2. Measure distance from start
3. Insert into `feed_zones` table:

```sql
INSERT INTO feed_zones (race_id, name, distance_from_start_km, coordinates, order_index)
VALUES (
  '<race-uuid>',
  'Feed Zone Name',
  50.0,
  '{"lat": 58.1234, "lng": 15.5678}'::jsonb,
  1
);
```

## Data Validation

The schema includes constraints:
- Distance must be >= 0
- Duration must be >= 0
- Unique feed zone per plan (can't add same zone twice)
- Foreign key constraints ensure data integrity
