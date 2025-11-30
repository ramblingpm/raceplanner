import { supabase } from './supabase';
import { FeedZone, PlanFeedZone } from '@/types';

/**
 * Fetch all feed zones for a specific race
 */
export async function getFeedZonesByRace(raceId: string): Promise<FeedZone[]> {
  const { data, error } = await supabase
    .from('feed_zones')
    .select('*')
    .eq('race_id', raceId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching feed zones:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch feed zones for a specific plan/calculation
 */
export async function getPlanFeedZones(calculationId: string): Promise<PlanFeedZone[]> {
  const { data, error } = await supabase
    .from('plan_feed_zones')
    .select(`
      *,
      feed_zone:feed_zones(*)
    `)
    .eq('calculation_id', calculationId);

  if (error) {
    console.error('Error fetching plan feed zones:', error);
    throw error;
  }

  return data || [];
}

/**
 * Save or update feed zones for a plan
 */
export async function savePlanFeedZones(
  calculationId: string,
  feedZones: Array<{
    feed_zone_id: string;
    planned_duration_seconds: number;
    planned_arrival_time?: string;
    planned_departure_time?: string;
  }>
): Promise<void> {
  // First, delete existing plan feed zones for this calculation
  const { error: deleteError } = await supabase
    .from('plan_feed_zones')
    .delete()
    .eq('calculation_id', calculationId);

  if (deleteError) {
    console.error('Error deleting old plan feed zones:', error);
    throw deleteError;
  }

  // Then insert new ones if there are any
  if (feedZones.length > 0) {
    const insertData = feedZones.map((fz) => ({
      calculation_id: calculationId,
      feed_zone_id: fz.feed_zone_id,
      planned_duration_seconds: fz.planned_duration_seconds,
      planned_arrival_time: fz.planned_arrival_time || null,
      planned_departure_time: fz.planned_departure_time || null,
    }));

    const { error: insertError } = await supabase
      .from('plan_feed_zones')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting plan feed zones:', insertError);
      throw insertError;
    }
  }
}

/**
 * Delete a specific plan feed zone
 */
export async function deletePlanFeedZone(planFeedZoneId: string): Promise<void> {
  const { error } = await supabase
    .from('plan_feed_zones')
    .delete()
    .eq('id', planFeedZoneId);

  if (error) {
    console.error('Error deleting plan feed zone:', error);
    throw error;
  }
}

/**
 * Calculate total feed zone time in seconds
 */
export function calculateTotalFeedZoneTime(
  feedZones: Array<{ planned_duration_seconds: number }>
): number {
  return feedZones.reduce((sum, fz) => sum + fz.planned_duration_seconds, 0);
}
