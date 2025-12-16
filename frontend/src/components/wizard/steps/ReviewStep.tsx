'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PencilIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useWizard } from '../WizardContext';
import { trackWizardEditClicked } from '@/lib/analytics';
import { getFeedZonesByRace } from '@/lib/feedZones';
import { FeedZone } from '@/types';

// Dynamically import RaceMap with no SSR
const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => {
    // Note: Translation context not available in loading component
    return (
      <div className="h-80 bg-surface-1 rounded-lg flex items-center justify-center">
        <p className="text-text-muted">Loading map...</p>
      </div>
    );
  },
});

export default function ReviewStep() {
  const t = useTranslations('wizard');
  const locale = useLocale();
  const { state, goToStep, nextStep, calculateResults } = useWizard();
  const { race, planData, calculatedResults } = state;
  const [feedZones, setFeedZones] = useState<FeedZone[]>([]);

  // Ensure calculations are up-to-date when entering review step
  useEffect(() => {
    calculateResults();
  }, []);

  useEffect(() => {
    if (race && planData.selectedFeedZones.length > 0) {
      loadFeedZones();
    }
  }, [race, planData.selectedFeedZones]);

  const loadFeedZones = async () => {
    if (!race) return;

    try {
      const allFeedZones = await getFeedZonesByRace(race.id);
      // Filter to only include selected feed zones
      const selectedIds = planData.selectedFeedZones.map(z => z.feed_zone_id);
      const filteredZones = allFeedZones.filter(z => selectedIds.includes(z.id));
      setFeedZones(filteredZones);
    } catch (error) {
      console.error('Error loading feed zones:', error);
    }
  };

  if (!race || !calculatedResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary">{t('missingPlanData')}</p>
      </div>
    );
  }


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFinishTime = () => {
    return calculatedResults.finishTime.toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter to only include feed zones with actual stops (duration > 0)
  const feedZonesWithStops = planData.selectedFeedZones.filter(z => z.planned_duration_seconds > 0);
  const totalFeedZoneMinutes = Math.floor(
    feedZonesWithStops.reduce((sum, z) => sum + z.planned_duration_seconds, 0) / 60
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {t('reviewYourPlan')}
        </h2>
        <p className="text-sm sm:text-base text-text-secondary">
          {t('checkEverything')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-6">
        {/* Race */}
        <div className="bg-surface-background border border-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">{t('race')}</h3>
              <p className="text-lg font-semibold text-text-primary">{race.name}</p>
              <p className="text-sm text-text-secondary">{race.distance_km} km</p>
            </div>
            <button
              onClick={() => {
                trackWizardEditClicked('race');
                goToStep(1);
              }}
              className="p-2 text-primary hover:bg-primary-subtle rounded-lg transition-colors"
              aria-label={t('editRace')}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-surface-background border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-text-muted">{t('planDetails')}</h3>
            <button
              onClick={() => {
                trackWizardEditClicked('time');
                goToStep(2);
              }}
              className="p-2 text-primary hover:bg-primary-subtle rounded-lg transition-colors"
              aria-label={t('editPlanDetails')}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-text-secondary">{t('start')}</p>
              <p className="font-semibold text-text-primary">
                {formatDate(planData.startDate)} at {planData.startTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">{t('estimatedDuration')}</p>
              <p className="font-semibold text-text-primary">
                {planData.durationHours}h {planData.durationMinutes}m
              </p>
            </div>
          </div>
        </div>

        {/* Feed Zones - Only show if there are actual stops (duration > 0) */}
        {feedZonesWithStops.length > 0 && (
          <div className="bg-surface-background border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">{t('feedZones')}</h3>
              <button
                onClick={() => {
                  trackWizardEditClicked('feed_zones');
                  goToStep(3);
                }}
                className="p-2 text-primary hover:bg-primary-subtle rounded-lg transition-colors"
                aria-label={t('editFeedZones')}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-2">
                {feedZonesWithStops.length} {feedZonesWithStops.length !== 1 ? t('stops') : t('stop')} • {totalFeedZoneMinutes} {t('minutesTotal')}
              </p>
              <div className="space-y-1">
                {feedZonesWithStops.map((zone) => (
                  <div key={zone.feed_zone_id} className="text-sm text-text-secondary">
                    • {zone.name} ({Math.floor(zone.planned_duration_seconds / 60)} {t('min')})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-primary-subtle border border-primary rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">{t('estimatedResults')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">{t('finishTime')}</p>
              <p className="text-lg font-bold text-text-primary">
                {formatFinishTime()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">{t('requiredPaceLabel')}</p>
              <p className="text-lg font-bold text-text-primary">
                {calculatedResults.requiredSpeedKmh.toFixed(1)} km/h
              </p>
            </div>
          </div>
        </div>

        {/* Segment Speeds - only show if there are feed zones with arrival/departure times */}
        {(() => {
          // Check if any feed zones have both arrival and departure times
          const hasTimedFeedZones = planData.selectedFeedZones.some(
            z => z.planned_arrival_time && z.planned_departure_time
          );

          if (!hasTimedFeedZones || !race) return null;

          // Sort feed zones by distance
          const sortedZones = [...planData.selectedFeedZones].sort(
            (a, b) => a.distance_from_start_km - b.distance_from_start_km
          );

          // Parse start time
          const [startHours, startMinutes] = planData.startTime.split(':').map(Number);
          const startDate = new Date(planData.startDate);
          startDate.setHours(startHours, startMinutes, 0, 0);

          // Calculate segments
          const segments = [];
          let previousDistance = 0;
          let previousTime = startDate;

          sortedZones.forEach((zone, index) => {
            if (zone.planned_arrival_time) {
              const [arrHours, arrMinutes] = zone.planned_arrival_time.split(':').map(Number);
              const arrivalTime = new Date(planData.startDate);
              arrivalTime.setHours(arrHours, arrMinutes, 0, 0);

              // If arrival time is before previous time, it means next day
              if (arrivalTime < previousTime) {
                arrivalTime.setDate(arrivalTime.getDate() + 1);
              }

              const distanceCovered = zone.distance_from_start_km - previousDistance;
              const timeSpent = (arrivalTime.getTime() - previousTime.getTime()) / 1000; // seconds
              const averageSpeed = (distanceCovered / (timeSpent / 3600)).toFixed(1);

              segments.push({
                from: index === 0 ? t('start') : sortedZones[index - 1].name,
                to: zone.name,
                distance: distanceCovered,
                speed: averageSpeed,
              });

              // Update for next segment (departure time)
              if (zone.planned_departure_time) {
                const [depHours, depMinutes] = zone.planned_departure_time.split(':').map(Number);
                previousTime = new Date(planData.startDate);
                previousTime.setHours(depHours, depMinutes, 0, 0);

                // Check if departure is next day
                if (previousTime < arrivalTime) {
                  previousTime.setDate(previousTime.getDate() + 1);
                }
              }
              previousDistance = zone.distance_from_start_km;
            }
          });

          // Add final segment to finish
          const lastZone = sortedZones[sortedZones.length - 1];
          const remainingDistance = race.distance_km - previousDistance;
          const finishTime = calculatedResults.finishTime;
          const finalTimeSpent = (finishTime.getTime() - previousTime.getTime()) / 1000;
          const finalSpeed = (remainingDistance / (finalTimeSpent / 3600)).toFixed(1);

          segments.push({
            from: lastZone.name,
            to: t('finish'),
            distance: remainingDistance,
            speed: finalSpeed,
          });

          return (
            <div className="bg-surface-background border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text-muted mb-3">{t('segmentSpeeds')}</h3>
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <span className="text-text-secondary">{segment.from}</span>
                      <span className="text-text-muted mx-2">→</span>
                      <span className="text-text-secondary">{segment.to}</span>
                      <span className="text-text-muted ml-2">({segment.distance.toFixed(1)} km)</span>
                    </div>
                    <div className="font-semibold text-text-primary">
                      {segment.speed} km/h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Map */}
      {race.route_geometry?.coordinates && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">{t('routeMap')}</h3>
          <div className="rounded-lg overflow-hidden border border-border">
            <RaceMap
              routeCoordinates={race.route_geometry.coordinates as number[][]}
              selectedFeedZones={feedZones}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-surface-background border-t border-border p-4">
        <button
          onClick={nextStep}
          className="w-full py-3 px-6 rounded-lg font-semibold text-primary-foreground transition-colors bg-primary hover:bg-primary-hover"
        >
          {t('continueToSave')}
        </button>
      </div>
    </div>
  );
}
