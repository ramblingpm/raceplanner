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
 */
export function calculateRace({
  distanceKm,
  startTime,
  estimatedDurationSeconds,
  plannedStopDurationSeconds = 0,
}: CalculateRaceParams): RaceCalculationResult {
  // Calculate finish time by adding duration to start time
  const finishTime = new Date(
    startTime.getTime() + estimatedDurationSeconds * 1000
  );

  // Calculate required speed in km/h
  // Speed = Distance / Moving Time (total duration - stop time)
  // Time needs to be converted from seconds to hours
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
