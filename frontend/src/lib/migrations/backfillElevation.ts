/**
 * Migration script to backfill elevation data for existing races
 * Fetches elevation data from Open-Elevation API and updates race records
 */

import { supabase } from '@/lib/supabase';
import { fetchElevationsOptimized, calculateElevationStats } from '@/lib/elevationService';
import type { Race } from '@/types';

export interface BackfillProgress {
  raceId: string;
  raceName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export interface BackfillResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  details: BackfillProgress[];
}

/**
 * Backfill elevation data for a single race
 * @param race - The race to backfill
 * @param onProgress - Optional progress callback
 * @param forceRecalculate - If true, recalculate even if elevation data already exists
 */
export async function backfillRaceElevation(
  race: Race,
  onProgress?: (progress: BackfillProgress) => void,
  forceRecalculate: boolean = false
): Promise<BackfillProgress> {
  const progress: BackfillProgress = {
    raceId: race.id,
    raceName: race.name,
    status: 'processing',
    progress: 0,
  };

  if (onProgress) onProgress(progress);

  try {
    // Check if race has route geometry
    if (!race.route_geometry || !race.route_geometry.coordinates) {
      progress.status = 'error';
      progress.message = 'No route geometry found';
      if (onProgress) onProgress(progress);
      return progress;
    }

    // Check if elevation data already exists (skip if not forcing recalculation)
    if (!forceRecalculate && race.elevation_data && race.elevation_data.length > 0) {
      progress.status = 'success';
      progress.message = 'Elevation data already exists';
      progress.progress = 100;
      if (onProgress) onProgress(progress);
      return progress;
    }

    const coordinates = race.route_geometry.coordinates;

    progress.progress = 20;
    progress.message = forceRecalculate
      ? `Recalculating elevation for ${coordinates.length} points...`
      : `Fetching elevation for ${coordinates.length} points...`;
    if (onProgress) onProgress(progress);

    // Fetch elevation data (with smart downsampling)
    const elevations = await fetchElevationsOptimized(coordinates, 500);

    progress.progress = 60;
    progress.message = 'Calculating statistics...';
    if (onProgress) onProgress(progress);

    // Calculate elevation statistics
    const stats = calculateElevationStats(elevations);

    progress.progress = 80;
    progress.message = 'Saving to database...';
    if (onProgress) onProgress(progress);

    // Update race with elevation data using RPC (admin function that bypasses RLS)
    console.log('Updating race with elevation data via RPC:', {
      raceId: race.id,
      raceName: race.name,
      elevationPoints: elevations.length,
      stats,
    });

    const { data: updatedRace, error } = await supabase.rpc('update_race_elevation', {
      p_race_id: race.id,
      p_elevation_data: elevations,
      p_elevation_gain_m: stats.totalElevationGainM,
      p_elevation_loss_m: stats.totalElevationLossM,
      p_min_elevation_m: stats.minElevationM,
      p_max_elevation_m: stats.maxElevationM,
    });

    console.log('Supabase RPC result:', { data: updatedRace, error });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    if (!updatedRace) {
      throw new Error('No race was updated - RPC returned null');
    }

    progress.status = 'success';
    progress.message = `Elevation data saved! Gain: ${stats.totalElevationGainM}m, Loss: ${stats.totalElevationLossM}m`;
    progress.progress = 100;
    if (onProgress) onProgress(progress);

    return progress;
  } catch (error) {
    progress.status = 'error';
    progress.message = error instanceof Error ? error.message : 'Unknown error';
    if (onProgress) onProgress(progress);
    return progress;
  }
}

/**
 * Backfill elevation data for all races that don't have it
 * @param onProgress - Optional progress callback
 * @param forceRecalculate - If true, recalculate even for races that already have elevation data
 */
export async function backfillAllRaces(
  onProgress?: (overall: BackfillProgress[]) => void,
  forceRecalculate: boolean = false
): Promise<BackfillResult> {
  const result: BackfillResult = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    // Fetch all races
    const { data: races, error } = await supabase
      .from('races')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!races || races.length === 0) {
      return result;
    }

    result.total = races.length;

    // Process each race
    for (const race of races) {
      const progress = await backfillRaceElevation(
        race,
        (p) => {
          // Update in details array
          const index = result.details.findIndex((d) => d.raceId === p.raceId);
          if (index >= 0) {
            result.details[index] = p;
          } else {
            result.details.push(p);
          }
          if (onProgress) onProgress(result.details);
        },
        forceRecalculate
      );

      if (progress.status === 'success') {
        if (progress.message?.includes('already exists')) {
          result.skipped++;
        } else {
          result.successful++;
        }
      } else if (progress.status === 'error') {
        result.failed++;
      }

      // Add small delay between races to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return result;
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  }
}

/**
 * Get list of races and their elevation data status
 */
export async function getRacesElevationStatus(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    distance_km: number;
    hasRouteGeometry: boolean;
    hasElevationData: boolean;
    elevationGain?: number;
    elevationLoss?: number;
  }>
> {
  const { data: races, error } = await supabase
    .from('races')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  if (!races) return [];

  return races.map((race) => ({
    id: race.id,
    name: race.name,
    slug: race.slug,
    distance_km: race.distance_km,
    hasRouteGeometry: !!(race.route_geometry && race.route_geometry.coordinates),
    hasElevationData: !!(race.elevation_data && race.elevation_data.length > 0),
    elevationGain: race.elevation_gain_m,
    elevationLoss: race.elevation_loss_m,
  }));
}
