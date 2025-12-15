/**
 * Route file parser for GPX and FIT files
 * Extracts route coordinates and calculates total distance
 */

export interface ParsedRoute {
  coordinates: number[][]; // [lng, lat] pairs for GeoJSON LineString
  totalDistanceKm: number;
  name?: string;
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

  // Extract coordinates [lng, lat]
  const coordinates: number[][] = points.map(point => {
    const lat = parseFloat(point.getAttribute('lat') || '0');
    const lon = parseFloat(point.getAttribute('lon') || '0');
    return [lon, lat];
  });

  // Extract route/track name
  const nameElement = xmlDoc.querySelector('trk > name, rte > name');
  const name = nameElement?.textContent || undefined;

  // Calculate total distance
  const totalDistanceKm = calculateTotalDistance(coordinates);

  return {
    coordinates,
    totalDistanceKm,
    name,
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
