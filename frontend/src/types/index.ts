export interface Race {
  id: string;
  name: string;
  slug: string;
  distance_km: number;
  route_geometry?: {
    type: string;
    coordinates: number[][];
  };
  is_public: boolean;
  start_date?: string | null;
  end_date?: string | null;
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

export interface FeedZone {
  id: string;
  race_id: string;
  name: string;
  distance_from_start_km: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  order_index: number;
  created_at: string;
}

export interface PlanFeedZone {
  id: string;
  calculation_id: string;
  feed_zone_id: string;
  planned_duration_seconds: number;
  planned_arrival_time?: string;
  planned_departure_time?: string;
  feed_zone?: FeedZone; // Populated when joined
}
