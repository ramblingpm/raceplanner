'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { FeedZone } from '@/types';

interface RaceSegmentOverviewProps {
  raceId: string;
  raceDistanceKm: number;
  averageSpeedKmh?: number;
  planLabel?: string;
  planId?: string;
  startTime?: string; // ISO date string of plan start time
}

interface Segment {
  name: string;
  distanceKm: number;
  segmentDistanceKm: number;
  isStop: boolean;
  estimatedArrivalTime: string;
  estimatedDepartureTime?: string;
  stopDurationSeconds?: number;
  requiredSpeedKmh: number;
  feedZoneId?: string;
}

export default function RaceSegmentOverview({
  raceId,
  raceDistanceKm,
  averageSpeedKmh = 25,
  planLabel,
  planId,
  startTime,
}: RaceSegmentOverviewProps) {
  const t = useTranslations('raceSegment');
  const [feedZones, setFeedZones] = useState<FeedZone[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFeedZones, setPlanFeedZones] = useState<any[]>([]);

  useEffect(() => {
    fetchFeedZones();
    if (planId) {
      fetchPlanFeedZones();
    }
  }, [raceId, planId]);

  const fetchFeedZones = async () => {
    try {
      const { data, error } = await supabase
        .from('feed_zones')
        .select('*')
        .eq('race_id', raceId)
        .order('distance_from_start_km', { ascending: true });

      if (error) throw error;

      setFeedZones(data || []);
    } catch (error) {
      console.error('Error fetching feed zones:', error);
    }
  };

  const fetchPlanFeedZones = async () => {
    if (!planId) return;

    try {
      const { data, error } = await supabase
        .from('plan_feed_zones')
        .select('*')
        .eq('calculation_id', planId);

      if (error) throw error;

      setPlanFeedZones(data || []);
    } catch (error) {
      console.error('Error fetching plan feed zones:', error);
    }
  };

  useEffect(() => {
    if (feedZones.length > 0) {
      calculateSegments(feedZones);
    } else if (!loading) {
      setLoading(false);
    }
  }, [feedZones, planFeedZones]);

  const calculateSegments = (zones: FeedZone[]) => {
    const calculatedSegments: Segment[] = [];
    let cumulativeTime = 0; // In hours

    // Add start point
    calculatedSegments.push({
      name: t('start'),
      distanceKm: 0,
      segmentDistanceKm: 0,
      isStop: false,
      estimatedArrivalTime: formatTime(cumulativeTime),
      requiredSpeedKmh: averageSpeedKmh,
    });

    // Process each feed zone
    zones.forEach((zone, index) => {
      const previousDistance = index === 0 ? 0 : zones[index - 1].distance_from_start_km;
      const segmentDistance = zone.distance_from_start_km - previousDistance;

      // Calculate time to reach this feed zone
      const timeToReach = segmentDistance / averageSpeedKmh;
      cumulativeTime += timeToReach;

      // Check if this feed zone is a planned stop
      const planFeedZone = planFeedZones.find(pfz => pfz.feed_zone_id === zone.id);
      const isStop = !!planFeedZone;
      const stopDuration = planFeedZone?.planned_duration_seconds || 0;

      const arrivalTime = formatTime(cumulativeTime);
      const departureTime = isStop ? formatTime(cumulativeTime + (stopDuration / 3600)) : undefined;

      // Add stop time to cumulative if this is a stop
      if (isStop) {
        cumulativeTime += stopDuration / 3600;
      }

      calculatedSegments.push({
        name: zone.name,
        distanceKm: zone.distance_from_start_km,
        segmentDistanceKm: segmentDistance,
        isStop,
        estimatedArrivalTime: arrivalTime,
        estimatedDepartureTime: departureTime,
        stopDurationSeconds: stopDuration,
        requiredSpeedKmh: averageSpeedKmh,
        feedZoneId: zone.id,
      });
    });

    // Add finish point
    const lastZoneDistance = zones.length > 0 ? zones[zones.length - 1].distance_from_start_km : 0;
    const finalSegmentDistance = raceDistanceKm - lastZoneDistance;

    if (finalSegmentDistance > 0) {
      const timeToFinish = finalSegmentDistance / averageSpeedKmh;
      cumulativeTime += timeToFinish;

      calculatedSegments.push({
        name: t('finish'),
        distanceKm: raceDistanceKm,
        segmentDistanceKm: finalSegmentDistance,
        isStop: false,
        estimatedArrivalTime: formatTime(cumulativeTime),
        requiredSpeedKmh: averageSpeedKmh,
      });
    }

    setSegments(calculatedSegments);
    setLoading(false);
  };

  const formatTime = (hours: number): string => {
    if (!startTime) {
      // Fallback to duration format if no start time
      const totalMinutes = Math.round(hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Calculate actual clock time from start time
    const startDate = new Date(startTime);
    const totalMinutes = Math.round(hours * 60);
    const resultDate = new Date(startDate.getTime() + totalMinutes * 60000);

    return resultDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDistance = (km: number): string => {
    return km.toFixed(1);
  };

  const formatSpeed = (kmh: number): string => {
    return kmh.toFixed(1);
  };

  if (loading) {
    return (
      <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border">
        <div className="text-center py-8">
          <p className="text-text-secondary">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('title')}</h2>
        <p className="text-text-secondary">{t('noSegments')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-background rounded-lg shadow-md border border-border overflow-hidden print:shadow-none print:border print:rounded-none">
      {/* Header */}
      <div className="bg-surface-1 px-6 py-4 border-b border-border print:px-2 print:py-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary print:text-sm print:mb-0">{t('title')}</h2>
            {planLabel && (
              <p className="text-sm text-text-secondary mt-1 print:text-[0.55rem] print:mt-0">{planLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm print:gap-3 print:text-[0.55rem]">
            <div className="text-right">
              <p className="text-text-muted print:inline">{t('avgSpeed')}</p>
              <p className="font-bold text-text-primary print:inline print:ml-1">{formatSpeed(averageSpeedKmh)} km/h</p>
            </div>
            <div className="text-right">
              <p className="text-text-muted print:inline">{t('totalTime')}</p>
              <p className="font-bold text-text-primary print:inline print:ml-1">
                {segments.length > 0 ? segments[segments.length - 1].estimatedArrivalTime : '00:00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Table - Desktop */}
      <div className="hidden md:block overflow-x-auto print:block">
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase print:px-1 print:py-1 print:text-[0.5rem]">
                {t('point')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase print:px-1 print:py-1 print:text-[0.5rem]">
                {t('distance')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase print:px-1 print:py-1 print:text-[0.5rem]">
                {t('segmentDistance')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase print:px-1 print:py-1 print:text-[0.5rem]">
                {t('avgSegmentSpeed')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase print:px-1 print:py-1 print:text-[0.5rem]">
                {t('arrivalDeparture')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {segments.map((segment, index) => (
              <tr
                key={index}
                className={`hover:bg-surface-1 transition-colors ${
                  index === 0 || index === segments.length - 1
                    ? 'bg-surface-1'
                    : segment.isStop
                    ? 'bg-warning-subtle'
                    : ''
                }`}
              >
                <td className="px-6 py-3 text-sm text-text-primary print:px-1 print:py-0.5 print:text-[0.55rem]">
                  <div className="flex items-center gap-2 print:gap-1">
                    {index === 0 && <span className="text-base print:text-xs">🏁</span>}
                    {index === segments.length - 1 && <span className="text-base print:text-xs">🎯</span>}
                    {index > 0 && index < segments.length - 1 && (
                      <span className="text-base print:text-xs">{segment.isStop ? '⏸️' : '📍'}</span>
                    )}
                    <span className={index === 0 || index === segments.length - 1 ? 'font-semibold' : ''}>
                      {segment.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-text-secondary text-right print:px-1 print:py-0.5 print:text-[0.55rem]">
                  {formatDistance(segment.distanceKm)} km
                </td>
                <td className="px-6 py-3 text-sm text-text-secondary text-right print:px-1 print:py-0.5 print:text-[0.55rem]">
                  {segment.segmentDistanceKm > 0
                    ? `+${formatDistance(segment.segmentDistanceKm)} km`
                    : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-text-secondary text-right print:px-1 print:py-0.5 print:text-[0.55rem]">
                  {segment.segmentDistanceKm > 0
                    ? `${formatSpeed(segment.requiredSpeedKmh)} km/h`
                    : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-text-primary text-right font-semibold print:px-1 print:py-0.5 print:text-[0.55rem] print:font-normal">
                  {segment.isStop ? (
                    <div className="flex flex-col items-end print:flex-row print:gap-1 print:justify-end">
                      <span className="text-success print:text-[0.55rem]">{segment.estimatedArrivalTime}</span>
                      <span className="text-xs text-text-muted print:text-[0.5rem]">
                        ({Math.floor((segment.stopDurationSeconds || 0) / 60)}m)
                      </span>
                      <span className="text-warning print:text-[0.55rem]">{segment.estimatedDepartureTime}</span>
                    </div>
                  ) : (
                    <span className="text-text-muted italic print:not-italic print:text-[0.55rem]">
                      {segment.estimatedArrivalTime} {index > 0 && index < segments.length - 1 && `(${t('passing')})`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Segments List - Mobile */}
      <div className="md:hidden divide-y divide-border print:hidden">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`p-4 ${
              index === 0 || index === segments.length - 1
                ? 'bg-surface-1'
                : segment.isStop
                ? 'bg-warning-subtle'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-text-primary flex items-center gap-2 ${
                index === 0 || index === segments.length - 1 ? 'font-semibold' : ''
              }`}>
                {index === 0 && <span>🏁</span>}
                {index === segments.length - 1 && <span>🎯</span>}
                {index > 0 && index < segments.length - 1 && (
                  <span>{segment.isStop ? '⏸️' : '📍'}</span>
                )}
                {segment.name}
              </h3>
              {segment.isStop ? (
                <div className="text-right">
                  <div className="text-xs font-semibold text-success">{segment.estimatedArrivalTime}</div>
                  <div className="text-xs text-text-muted">({Math.floor((segment.stopDurationSeconds || 0) / 60)}m)</div>
                  <div className="text-xs font-semibold text-warning">{segment.estimatedDepartureTime}</div>
                </div>
              ) : (
                <span className="text-sm font-semibold text-text-muted italic">
                  {segment.estimatedArrivalTime}
                  {index > 0 && index < segments.length - 1 && (
                    <span className="text-xs block">{t('passing')}</span>
                  )}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-text-secondary">
              <div>
                <span>{formatDistance(segment.distanceKm)} km</span>
              </div>
              {segment.segmentDistanceKm > 0 && (
                <>
                  <div>
                    <span>+{formatDistance(segment.segmentDistanceKm)} km</span>
                  </div>
                  <div className="text-right">
                    <span>{formatSpeed(segment.requiredSpeedKmh)} km/h</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
