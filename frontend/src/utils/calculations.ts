/**
 * Calculate finish time and required speed for a race
 * All calculations use seconds for time and kilometres for distance
 */

export interface CalculateRaceParams {
  distanceKm: number;
  startTime: Date;
  estimatedDurationSeconds: number;
  plannedStopDurationSeconds?: number;
}

export interface RaceCalculationResult {
  finishTime: Date;
  requiredSpeedKmh: number;
}

/**
 * Calculate when the race will finish and the required average speed
 *
 * @param estimatedDurationSeconds - Total duration from start to finish (including stops)
 * @param plannedStopDurationSeconds - Total time spent at feed zones (stops)
 */
export function calculateRace({
  distanceKm,
  startTime,
  estimatedDurationSeconds,
  plannedStopDurationSeconds = 0,
}: CalculateRaceParams): RaceCalculationResult {
  // Calculate finish time by adding estimated duration to start time
  // estimatedDurationSeconds is the TOTAL time (riding + stops)
  const finishTime = new Date(
    startTime.getTime() + estimatedDurationSeconds * 1000
  );

  // Calculate required speed in km/h
  // Speed = Distance / Moving Time (riding time only, excluding stops)
  // Moving time = Total duration - Stop time
  const movingTimeSeconds = estimatedDurationSeconds - plannedStopDurationSeconds;
  const movingTimeHours = movingTimeSeconds / 3600;
  const requiredSpeedKmh = distanceKm / movingTimeHours;

  return {
    finishTime,
    requiredSpeedKmh: Number(requiredSpeedKmh.toFixed(2)),
  };
}

/**
 * Convert time string (HH:MM) to seconds since midnight
 */
export function timeStringToSeconds(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

/**
 * Convert seconds to HH:MM:SS format
 */
export function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
