-- Add label column to race_calculations table
ALTER TABLE race_calculations
ADD COLUMN label TEXT;

-- Add a default label for existing records
UPDATE race_calculations
SET label = 'My Plan ' || id::text
WHERE label IS NULL;
