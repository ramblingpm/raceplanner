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

    // Filter to only zones with arrival times (these are waypoints for segment calculation)
    const zonesWithTimes = sortedZones.filter(z => z.planned_arrival_time);

    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    // Calculate estimated finish time
    const totalDurationSeconds = (durationHours * 3600) + (durationMinutes * 60);
    const finishTime = new Date(startDateTime.getTime() + (totalDurationSeconds * 1000));

    // Build waypoints: Start -> Zones with times -> Finish
    interface Waypoint {
      name: string;
      distance: number;
      time: Date;
    }

    const waypoints: Waypoint[] = [
      {
        name: t('start'),
        distance: 0,
        time: startDateTime,
      }
    ];

    // Add zones with times as waypoints
    zonesWithTimes.forEach(zone => {
      const [arrHours, arrMinutes] = zone.planned_arrival_time!.split(':').map(Number);
      const arrivalTime = new Date(startDate);
      arrivalTime.setHours(arrHours, arrMinutes, 0, 0);

      // Handle next day scenario
      const prevTime = waypoints[waypoints.length - 1].time;
      if (arrivalTime < prevTime) {
        arrivalTime.setDate(arrivalTime.getDate() + 1);
      }

      waypoints.push({
        name: zone.name,
        distance: zone.distance_from_start_km,
        time: arrivalTime,
      });

      // If zone has departure time (stopped there), update time for next segment
      if (zone.planned_departure_time && zone.planned_duration_seconds > 0) {
        const [depHours, depMinutes] = zone.planned_departure_time.split(':').map(Number);
        const departureTime = new Date(startDate);
        departureTime.setHours(depHours, depMinutes, 0, 0);

        // Handle next day scenario
        if (departureTime < arrivalTime) {
          departureTime.setDate(departureTime.getDate() + 1);
        }

        // Update the time for this waypoint to departure time
        waypoints[waypoints.length - 1].time = departureTime;
      }
    });

    // Add finish as final waypoint
    waypoints.push({
      name: t('finish'),
      distance: race.distance_km,
      time: finishTime,
    });

    // Create segments between consecutive waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const distanceCovered = to.distance - from.distance;
      const timeSpent = (to.time.getTime() - from.time.getTime()) / 1000; // seconds

      let requiredSpeed: number | null = null;
      if (timeSpent > 0) {
        requiredSpeed = distanceCovered / (timeSpent / 3600);
      }

      segments.push({
        fromName: from.name,
        toName: to.name,
        fromDistance: from.distance,
        toDistance: to.distance,
        distance: distanceCovered,
        requiredSpeed,
      });
    }

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

      
      
    </div>
  );
}
