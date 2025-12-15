'use client';

import { useTranslations } from 'next-intl';
import { WizardFeedZone } from './WizardContext';
import { Race } from '@/types';

interface SegmentOverviewProps {
  race: Race;
  startDate: string;
  startTime: string;
  durationHours: number;
  durationMinutes: number;
  selectedFeedZones: WizardFeedZone[];
}

interface Segment {
  fromName: string;
  toName: string;
  fromDistance: number;
  toDistance: number;
  distance: number;
  requiredSpeed: number | null;
}

export default function SegmentOverview({
  race,
  startDate,
  startTime,
  durationHours,
  durationMinutes,
  selectedFeedZones,
}: SegmentOverviewProps) {
  const t = useTranslations('wizard');

  // Calculate segments
  const calculateSegments = (): Segment[] => {
    const segments: Segment[] = [];

    // Sort zones by distance
    const sortedZones = [...selectedFeedZones].sort(
      (a, b) => a.distance_from_start_km - b.distance_from_start_km
    );

    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    let previousTime = startDateTime;
    let previousDistance = 0;
    let previousName = t('startPoint');

    // Create segments for each feed zone
    sortedZones.forEach((zone, index) => {
      let requiredSpeed: number | null = null;

      // Calculate required speed if arrival time is set
      if (zone.planned_arrival_time) {
        const [arrHours, arrMinutes] = zone.planned_arrival_time.split(':').map(Number);
        const arrivalTime = new Date(startDate);
        arrivalTime.setHours(arrHours, arrMinutes, 0, 0);

        // Handle next day scenario
        if (arrivalTime < previousTime) {
          arrivalTime.setDate(arrivalTime.getDate() + 1);
        }

        const distanceCovered = zone.distance_from_start_km - previousDistance;
        const timeSpent = (arrivalTime.getTime() - previousTime.getTime()) / 1000; // seconds

        if (timeSpent > 0) {
          requiredSpeed = distanceCovered / (timeSpent / 3600);
        }
      }

      segments.push({
        fromName: previousName,
        toName: zone.name,
        fromDistance: previousDistance,
        toDistance: zone.distance_from_start_km,
        distance: zone.distance_from_start_km - previousDistance,
        requiredSpeed,
      });

      // Update previous values for next iteration
      if (zone.planned_departure_time) {
        const [depHours, depMinutes] = zone.planned_departure_time.split(':').map(Number);
        previousTime = new Date(startDate);
        previousTime.setHours(depHours, depMinutes, 0, 0);
      } else {
        // If no departure time, use arrival time
        if (zone.planned_arrival_time) {
          const [arrHours, arrMinutes] = zone.planned_arrival_time.split(':').map(Number);
          previousTime = new Date(startDate);
          previousTime.setHours(arrHours, arrMinutes, 0, 0);
        }
      }
      previousDistance = zone.distance_from_start_km;
      previousName = zone.name;
    });

    // Add final segment to goal
    const lastFeedZone = sortedZones[sortedZones.length - 1];

    // Calculate required speed for final segment using estimated finish time
    let finalSegmentSpeed: number | null = null;

    if (lastFeedZone && lastFeedZone.planned_departure_time) {
      // Calculate estimated finish time based on duration
      // totalDurationSeconds is the TOTAL time (including all stops)
      const totalDurationSeconds = (durationHours * 3600) + (durationMinutes * 60);
      const finishTime = new Date(startDateTime.getTime() + (totalDurationSeconds * 1000));

      // Get last departure time
      const [depHours, depMinutes] = lastFeedZone.planned_departure_time.split(':').map(Number);
      const departureTime = new Date(startDate);
      departureTime.setHours(depHours, depMinutes, 0, 0);

      // Handle next day scenario
      if (departureTime < previousTime) {
        departureTime.setDate(departureTime.getDate() + 1);
      }

      const distanceCovered = race.distance_km - previousDistance;
      const timeSpent = (finishTime.getTime() - departureTime.getTime()) / 1000; // seconds

      if (timeSpent > 0) {
        finalSegmentSpeed = distanceCovered / (timeSpent / 3600);
      }
    }

    segments.push({
      fromName: previousName,
      toName: t('goalPoint'),
      fromDistance: previousDistance,
      toDistance: race.distance_km,
      distance: race.distance_km - previousDistance,
      requiredSpeed: finalSegmentSpeed,
    });

    return segments;
  };

  const segments = calculateSegments();

  // Don't show if no feed zones
  if (selectedFeedZones.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-4 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {t('segmentOverview')}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {t('segmentOverviewDescription')}
        </p>
      </div>

      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div key={index} className="relative">
            {/* Segment Card */}
            <div className="bg-surface-background border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                {/* From/To Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-text-primary">
                      {segment.fromName}
                    </span>
                    <span className="text-text-muted">→</span>
                    <span className="font-medium text-text-primary">
                      {segment.toName}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {segment.distance.toFixed(1)} km ({segment.fromDistance} - {segment.toDistance} km)
                  </div>
                </div>

                {/* Required Speed */}
                <div className="flex items-center gap-2">
                  {segment.requiredSpeed !== null ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-subtle border border-primary rounded-lg">
                      <span className="text-base">⚡</span>
                      <span className="text-sm font-bold text-primary">
                        {segment.requiredSpeed.toFixed(1)} km/h
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-3 border border-border rounded-lg">
                      <span className="text-xs text-text-muted">
                        {t('setTimesToCalculate')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connector Arrow (except for last segment) */}
            {index < segments.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="text-text-muted text-sm">↓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Stats */}
      {(() => {
        const segmentsWithSpeed = segments.filter(s => s.requiredSpeed !== null);

        // Calculate overall required pace (same calculation as in FeedZonesStep)
        // Speed = distance / riding time (excluding feed zone stops)
        const totalDurationSeconds = (durationHours * 3600) + (durationMinutes * 60);
        const totalFeedZoneSeconds = selectedFeedZones.reduce((sum, z) => sum + z.planned_duration_seconds, 0);
        const ridingTimeSeconds = totalDurationSeconds - totalFeedZoneSeconds;
        const requiredPace = race.distance_km / (ridingTimeSeconds / 3600);

        if (segmentsWithSpeed.length > 0) {
          const maxSpeed = Math.max(...segmentsWithSpeed.map(s => s.requiredSpeed || 0));
          const minSpeed = Math.min(...segmentsWithSpeed.map(s => s.requiredSpeed || 0));

          return (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-text-secondary mb-1">{t('minSpeed')}</div>
                  <div className="text-sm font-semibold text-text-primary">{minSpeed.toFixed(1)} km/h</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary mb-1">{t('requiredPaceLabel')}</div>
                  <div className="text-sm font-semibold text-text-primary">{requiredPace.toFixed(1)} km/h</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary mb-1">{t('maxSpeed')}</div>
                  <div className="text-sm font-semibold text-text-primary">{maxSpeed.toFixed(1)} km/h</div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
