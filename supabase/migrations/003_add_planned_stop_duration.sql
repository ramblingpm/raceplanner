-- Add planned stop duration to race calculations
ALTER TABLE race_calculations
ADD COLUMN planned_stop_duration_seconds INTEGER DEFAULT 0 NOT NULL;

-- Update existing records to have 0 stop time
UPDATE race_calculations
SET planned_stop_duration_seconds = 0
WHERE planned_stop_duration_seconds IS NULL;
