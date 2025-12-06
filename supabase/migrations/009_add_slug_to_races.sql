-- Add slug column to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_races_slug ON races(slug);

-- Update existing races with slugs
-- Convert race names to URL-friendly slugs
-- Example: "Vätternrundan 315" -> "vatternrundan-315"
UPDATE races
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[åä]', 'a', 'g'),
      '[ö]', 'o', 'g'
    ),
    '[^a-z0-9]+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing rows
ALTER TABLE races ALTER COLUMN slug SET NOT NULL;

-- Add a comment explaining the slug column
COMMENT ON COLUMN races.slug IS 'URL-friendly identifier for the race, used in routing (e.g., /vatternrundan-315)';
