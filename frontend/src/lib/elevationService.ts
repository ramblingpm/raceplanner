/**
 * Elevation Service
 * Fetches elevation data for coordinates using Open-Elevation API
 * Free API with no authentication required
 */

const OPEN_ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';

// Maximum number of locations per request (Open-Elevation limit is 1024)
const MAX_BATCH_SIZE = 1000;

interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface ElevationResponse {
  results: ElevationPoint[];
}

/**
 * Fetch elevation data for an array of coordinates
 * @param coordinates Array of [lng, lat] pairs
 * @returns Array of elevation values in meters
 */
export async function fetchElevations(coordinates: number[][]): Promise<number[]> {
  if (coordinates.length === 0) {
    return [];
  }

  const elevations: number[] = [];

  // Process in batches to avoid API limits
  for (let i = 0; i < coordinates.length; i += MAX_BATCH_SIZE) {
    const batch = coordinates.slice(i, i + MAX_BATCH_SIZE);
    const batchElevations = await fetchElevationBatch(batch);
    elevations.push(...batchElevations);
  }

  return elevations;
}

/**
 * Fetch elevation for a batch of coordinates
 */
async function fetchElevationBatch(coordinates: number[][]): Promise<number[]> {
  try {
    // Convert [lng, lat] to {latitude, longitude} format
    const locations = coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    console.log(`Fetching elevation for ${locations.length} points from Open-Elevation API...`);

    const response = await fetch(OPEN_ELEVATION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locations }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Elevation API error response:', errorText);
      throw new Error(`Elevation API error: ${response.status} ${response.statusText}`);
    }

    const data: ElevationResponse = await response.json();
    console.log(`Received elevation data for ${data.results.length} points`);

    // Extract elevation values
    return data.results.map(point => point.elevation);
  } catch (error) {
    console.error('Error fetching elevation data:', error);
    console.error('Failed coordinates sample:', coordinates.slice(0, 3));
    // Return zeros as fallback
    return coordinates.map(() => 0);
  }
}

/**
 * Calculate elevation statistics from an array of elevation points
 */
export function calculateElevationStats(elevations: number[]): {
  totalElevationGainM: number;
  totalElevationLossM: number;
  minElevationM: number;
  maxElevationM: number;
} {
  if (elevations.length === 0 || elevations.every(e => e === 0)) {
    return {
      totalElevationGainM: 0,
      totalElevationLossM: 0,
      minElevationM: 0,
      maxElevationM: 0,
    };
  }

  let totalGain = 0;
  let totalLoss = 0;
  let minElevation = elevations[0];
  let maxElevation = elevations[0];

  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];

    if (diff > 0) {
      totalGain += diff;
    } else if (diff < 0) {
      totalLoss += Math.abs(diff);
    }

    if (elevations[i] < minElevation) {
      minElevation = elevations[i];
    }
    if (elevations[i] > maxElevation) {
      maxElevation = elevations[i];
    }
  }

  return {
    totalElevationGainM: Math.round(totalGain),
    totalElevationLossM: Math.round(totalLoss),
    minElevationM: Math.round(minElevation),
    maxElevationM: Math.round(maxElevation),
  };
}

/**
 * Downsample coordinates to reduce API calls while preserving route shape
 * @param coordinates Original coordinates
 * @param targetCount Target number of points (default 500)
 * @returns Downsampled coordinates
 */
export function downsampleCoordinates(
  coordinates: number[][],
  targetCount: number = 500
): number[][] {
  if (coordinates.length <= targetCount) {
    return coordinates;
  }

  const step = Math.floor(coordinates.length / targetCount);
  const downsampled: number[][] = [];

  for (let i = 0; i < coordinates.length; i += step) {
    downsampled.push(coordinates[i]);
  }

  // Always include the last point
  if (downsampled[downsampled.length - 1] !== coordinates[coordinates.length - 1]) {
    downsampled.push(coordinates[coordinates.length - 1]);
  }

  return downsampled;
}

/**
 * Interpolate elevation data back to original coordinate count
 * @param elevations Elevation data for downsampled points
 * @param originalCount Original number of coordinates
 * @returns Interpolated elevation array
 */
export function interpolateElevations(
  elevations: number[],
  originalCount: number
): number[] {
  if (elevations.length === originalCount) {
    return elevations;
  }

  const interpolated: number[] = [];
  const ratio = (elevations.length - 1) / (originalCount - 1);

  for (let i = 0; i < originalCount; i++) {
    const index = i * ratio;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const fraction = index - lowerIndex;

    if (upperIndex >= elevations.length) {
      interpolated.push(elevations[elevations.length - 1]);
    } else {
      // Linear interpolation
      const interpolatedValue =
        elevations[lowerIndex] * (1 - fraction) + elevations[upperIndex] * fraction;
      interpolated.push(Math.round(interpolatedValue));
    }
  }

  return interpolated;
}

/**
 * Fetch elevation data for coordinates with smart downsampling
 * Reduces API calls while maintaining accuracy
 */
export async function fetchElevationsOptimized(
  coordinates: number[][],
  maxPoints: number = 500
): Promise<number[]> {
  const originalCount = coordinates.length;

  // Downsample if needed
  const sampledCoords = downsampleCoordinates(coordinates, maxPoints);

  // Fetch elevation for downsampled points
  const sampledElevations = await fetchElevations(sampledCoords);

  // Interpolate back to original count if needed
  if (sampledCoords.length !== originalCount) {
    return interpolateElevations(sampledElevations, originalCount);
  }

  return sampledElevations;
}
