export interface Race {
  id: string;
  name: string;
  distance_km: number;
  route_geometry?: {
    type: string;
    coordinates: number[][];
  };
  created_at: string;
}

export interface RaceCalculation {
  race_id: string;
  user_id: string;
  planned_start_time: string;
  estimated_duration_seconds: number;
  calculated_finish_time: string;
  required_speed_kmh: number;
  created_at: string;
}

export interface CalculationInput {
  raceId: string;
  plannedStartTime: string;
  estimatedDurationSeconds: number;
}

export interface CalculationResult {
  finishTime: string;
  requiredSpeedKmh: number;
  distanceKm: number;
  durationSeconds: number;
}
