/**
 * Route file parser for GPX and FIT files
 * Extracts route coordinates and calculates total distance
 */

export interface ParsedRoute {
  coordinates: number[][]; // [lng, lat] pairs for GeoJSON LineString
  totalDistanceKm: number;
  name?: string;
  elevations?: number[]; // Elevation in meters for each coordinate point
  totalElevationGainM?: number; // Total elevation gain in meters
  totalElevationLossM?: number; // Total elevation loss in meters
  minElevationM?: number; // Minimum elevation in meters
  maxElevationM?: number; // Maximum elevation in meters
}

/**
 * Parse GPX file and extract route information
 */
export async function parseGPX(file: File): Promise<ParsedRoute> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid GPX file format');
  }

  // Extract track points (trkpt) or route points (rtept)
  const trackPoints = Array.from(xmlDoc.querySelectorAll('trkpt'));
  const routePoints = Array.from(xmlDoc.querySelectorAll('rtept'));
  const points = trackPoints.length > 0 ? trackPoints : routePoints;

  if (points.length === 0) {
    throw new Error('No route or track points found in GPX file');
  }

  // Extract coordinates [lng, lat] and elevations
  const coordinates: number[][] = [];
  const elevations: number[] = [];

  points.forEach(point => {
    const lat = parseFloat(point.getAttribute('lat') || '0');
    const lon = parseFloat(point.getAttribute('lon') || '0');
    coordinates.push([lon, lat]);

    // Extract elevation if present
    const eleElement = point.querySelector('ele');
    const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0;
    elevations.push(elevation);
  });

  // Extract route/track name
  const nameElement = xmlDoc.querySelector('trk > name, rte > name');
  const name = nameElement?.textContent || undefined;

  // Calculate total distance
  const totalDistanceKm = calculateTotalDistance(coordinates);

  // Calculate elevation statistics
  const elevationStats = calculateElevationStats(elevations);

  return {
    coordinates,
    totalDistanceKm,
    name,
    elevations: elevations.length > 0 && elevations.some(e => e !== 0) ? elevations : undefined,
    ...elevationStats,
  };
}

/**
 * Parse FIT file and extract route information
 * Note: FIT files are binary and require specialized parsing
 * For now, we'll throw an error and implement this later
 */
export async function parseFIT(file: File): Promise<ParsedRoute> {
  // FIT files require binary parsing with fit-file-parser or similar library
  // For now, we'll throw an error indicating it's not yet supported
  throw new Error('FIT file parsing not yet implemented. Please use GPX files for now.');
}

/**
 * Detect file type and parse accordingly
 */
export async function parseRouteFile(file: File): Promise<ParsedRoute> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'gpx':
      return parseGPX(file);
    case 'fit':
      return parseFIT(file);
    default:
      throw new Error(`Unsupported file type: ${extension}. Please upload a GPX or FIT file.`);
  }
}

/**
 * Calculate total distance of a route using Haversine formula
 * @param coordinates Array of [lng, lat] pairs
 * @returns Distance in kilometers
 */
function calculateTotalDistance(coordinates: number[][]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
  }

  return totalDistance;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance from start of route to a specific point
 * @param coordinates Full route coordinates
 * @param targetIndex Index of the point to calculate distance to
 * @returns Distance in kilometers from start to targetIndex
 */
export function calculateDistanceFromStart(
  coordinates: number[][],
  targetIndex: number
): number {
  if (targetIndex <= 0 || targetIndex >= coordinates.length) {
    return 0;
  }

  let distance = 0;
  for (let i = 0; i < targetIndex; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    distance += haversineDistance(lat1, lon1, lat2, lon2);
  }

  return distance;
}

/**
 * Find the closest point on a route to a given lat/lng
 * @returns Index of the closest point and the distance from start
 */
export function findClosestPointOnRoute(
  coordinates: number[][],
  targetLat: number,
  targetLng: number
): { index: number; distanceFromStartKm: number } {
  let minDistance = Infinity;
  let closestIndex = 0;

  coordinates.forEach((coord, index) => {
    const [lng, lat] = coord;
    const distance = haversineDistance(targetLat, targetLng, lat, lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  const distanceFromStartKm = calculateDistanceFromStart(coordinates, closestIndex);

  return {
    index: closestIndex,
    distanceFromStartKm,
  };
}

// Minimum elevation change for a segment to count (meters) - similar to Strava's threshold
const ELEVATION_THRESHOLD = 3;

// Window size for moving average smoothing
const SMOOTHING_WINDOW = 5;

/**
 * Apply moving average smoothing to elevation data
 * Helps filter out GPS noise and small fluctuations
 * @param elevations Raw elevation data
 * @returns Smoothed elevation data
 */
function smoothElevations(elevations: number[]): number[] {
  if (elevations.length < SMOOTHING_WINDOW) {
    return elevations;
  }

  const smoothed: number[] = [];
  const halfWindow = Math.floor(SMOOTHING_WINDOW / 2);

  for (let i = 0; i < elevations.length; i++) {
    // Determine the window boundaries
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(elevations.length, i + halfWindow + 1);

    // Calculate average of values in window
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += elevations[j];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

/**
 * Calculate elevation statistics from an array of elevation points
 * Uses smoothing and segment-based threshold similar to Strava's algorithm
 * @param elevations Array of elevation values in meters
 * @returns Object with elevation gain, loss, min, and max
 */
function calculateElevationStats(elevations: number[]): {
  totalElevationGainM?: number;
  totalElevationLossM?: number;
  minElevationM?: number;
  maxElevationM?: number;
} {
  if (elevations.length === 0 || elevations.every(e => e === 0)) {
    return {};
  }

  // Apply smoothing to filter GPS noise
  const smoothed = smoothElevations(elevations);

  let totalGain = 0;
  let totalLoss = 0;
  let minElevation = smoothed[0];
  let maxElevation = smoothed[0];

  // Find continuous climbing/descending segments
  let segmentStart = 0;
  let isClimbing = false;
  let isDescending = false;

  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];

    // Track min/max
    if (smoothed[i] < minElevation) minElevation = smoothed[i];
    if (smoothed[i] > maxElevation) maxElevation = smoothed[i];

    // Detect start of climbing segment
    if (diff > 0 && !isClimbing) {
      // End any descending segment
      if (isDescending) {
        const segmentLoss = smoothed[segmentStart] - smoothed[i - 1];
        if (segmentLoss >= ELEVATION_THRESHOLD) {
          totalLoss += segmentLoss;
        }
      }
      segmentStart = i - 1;
      isClimbing = true;
      isDescending = false;
    }
    // Detect start of descending segment
    else if (diff < 0 && !isDescending) {
      // End any climbing segment
      if (isClimbing) {
        const segmentGain = smoothed[i - 1] - smoothed[segmentStart];
        if (segmentGain >= ELEVATION_THRESHOLD) {
          totalGain += segmentGain;
        }
      }
      segmentStart = i - 1;
      isDescending = true;
      isClimbing = false;
    }
  }

  // Handle the final segment
  if (isClimbing) {
    const segmentGain = smoothed[smoothed.length - 1] - smoothed[segmentStart];
    if (segmentGain >= ELEVATION_THRESHOLD) {
      totalGain += segmentGain;
    }
  } else if (isDescending) {
    const segmentLoss = smoothed[segmentStart] - smoothed[smoothed.length - 1];
    if (segmentLoss >= ELEVATION_THRESHOLD) {
      totalLoss += segmentLoss;
    }
  }

  return {
    totalElevationGainM: Math.round(totalGain),
    totalElevationLossM: Math.round(totalLoss),
    minElevationM: Math.round(minElevation),
    maxElevationM: Math.round(maxElevation),
  };
}
