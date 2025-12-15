-- Add start_date and end_date to races table
-- These define the allowed date range for when the race can occur
ALTER TABLE races ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE races ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing Vätternrundan race with its dates
UPDATE races
SET start_date = '2026-06-11',
    end_date = '2026-06-12'
WHERE name LIKE '%Vätternrundan%' OR name LIKE '%Vatternrundan%';

-- Add comments to explain the columns
COMMENT ON COLUMN races.start_date IS 'First date the race can start (inclusive). NULL means no restriction.';
COMMENT ON COLUMN races.end_date IS 'Last date the race can start (inclusive). NULL means no restriction.';
