import { createClient } from '@supabase/supabase-js';
import { parseString } from 'xml2js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TrackPoint {
  lat: number;
  lon: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simplify the track points (take every Nth point to reduce size)
function simplifyPoints(points: TrackPoint[], factor: number = 10): TrackPoint[] {
  return points.filter((_, index) => index % factor === 0);
}

async function importGpx(filePath: string, raceName: string) {
  console.log(`Reading GPX file: ${filePath}`);
  const gpxData = readFileSync(filePath, 'utf-8');

  console.log('Parsing GPX...');
  parseString(gpxData, async (err, result) => {
    if (err) {
      console.error('Error parsing GPX:', err);
      return;
    }

    const trackPoints = result.gpx.trk[0].trkseg[0].trkpt;
    console.log(`Found ${trackPoints.length} track points`);

    // Extract coordinates
    const allPoints: TrackPoint[] = trackPoints.map((pt: any) => ({
      lat: parseFloat(pt.$.lat),
      lon: parseFloat(pt.$.lon),
    }));

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < allPoints.length; i++) {
      totalDistance += calculateDistance(
        allPoints[i - 1].lat,
        allPoints[i - 1].lon,
        allPoints[i].lat,
        allPoints[i].lon
      );
    }

    console.log(`Total distance: ${totalDistance.toFixed(2)} km`);

    // Simplify points for storage (take every 50th point to keep file size manageable)
    const simplifiedPoints = simplifyPoints(allPoints, 50);
    console.log(`Simplified to ${simplifiedPoints.length} points`);

    // Convert to GeoJSON LineString format [lon, lat] (note: GeoJSON uses lon, lat order)
    const coordinates = simplifiedPoints.map(p => [p.lon, p.lat]);

    const routeGeometry = {
      type: 'LineString',
      coordinates: coordinates,
    };

    // Insert into database
    console.log('Inserting into database...');
    const { data, error } = await supabase
      .from('races')
      .insert([
        {
          name: raceName,
          distance_km: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
          route_geometry: routeGeometry,
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting race:', error);
    } else {
      console.log('✅ Successfully inserted race:', data);
    }

    process.exit(0);
  });
}

// Run the import
const gpxFilePath = process.argv[2];
const raceName = process.argv[3] || 'Vätternrundan 315';

if (!gpxFilePath) {
  console.error('Usage: tsx import-gpx.ts <path-to-gpx-file> [race-name]');
  process.exit(1);
}

importGpx(gpxFilePath, raceName);
