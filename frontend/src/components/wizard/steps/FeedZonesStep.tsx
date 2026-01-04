'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWizard, WizardFeedZone } from '../WizardContext';
import { getFeedZonesByRace } from '@/lib/feedZones';
import { FeedZone } from '@/types';

interface FeedZoneWithTime extends FeedZone {
  calculatedArrivalTime: string;
  manualArrivalTime?: string; // User-specified arrival time
  stopDurationMinutes: number;
  calculatedDepartureTime?: string;
}

export default function FeedZonesStep() {
  const t = useTranslations('wizard');
  const { state, updatePlanData, nextStep, calculateResults } = useWizard();
  const { race, planData } = state;
  const [feedZonesWithTimes, setFeedZonesWithTimes] = useState<FeedZoneWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (race) {
      loadFeedZones();
    }
  }, [race]);

  // Recalculate feed zone times when duration or existing stops change
  useEffect(() => {
    if (race && feedZonesWithTimes.length > 0) {
      calculateFeedZoneTimes();
    }
  }, [planData.durationHours, planData.durationMinutes]);

  const loadFeedZones = async () => {
    if (!race) return;

    try {
      const zones = await getFeedZonesByRace(race.id);

      // Initialize with existing stop data if available
      const zonesWithTimes: FeedZoneWithTime[] = zones.map(zone => {
        const existingZone = planData.selectedFeedZones.find(sz => sz.feed_zone_id === zone.id);
        return {
          ...zone,
          calculatedArrivalTime: '',
          manualArrivalTime: existingZone?.planned_arrival_time,
          stopDurationMinutes: existingZone ? Math.floor(existingZone.planned_duration_seconds / 60) : 0,
          calculatedDepartureTime: undefined,
        };
      });

      setFeedZonesWithTimes(zonesWithTimes);

      // Calculate arrival times after zones are loaded
      setTimeout(() => calculateFeedZoneTimes(zonesWithTimes), 0);
    } catch (error) {
      console.error('Error loading feed zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFeedZoneTimes = (zones?: FeedZoneWithTime[]) => {
    if (!race) return;

    const zonesToCalculate = zones || feedZonesWithTimes;
    if (zonesToCalculate.length === 0) return;

    // Calculate average speed (excluding stops)
    const totalDurationSeconds = (planData.durationHours * 3600) + (planData.durationMinutes * 60);
    const totalStopSeconds = zonesToCalculate.reduce((sum, z) => sum + (z.stopDurationMinutes * 60), 0);
    const ridingTimeSeconds = totalDurationSeconds - totalStopSeconds;
    const averageSpeedKmh = race.distance_km / (ridingTimeSeconds / 3600);

    // Parse start time
    const [hours, minutes] = planData.startTime.split(':').map(Number);
    const startDateTime = new Date(planData.startDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    let cumulativeSeconds = 0;

    const updatedZones = zonesToCalculate.map((zone) => {
      // Calculate time to reach this feed zone based on distance and average speed
      const timeToReachSeconds = (zone.distance_from_start_km / averageSpeedKmh) * 3600;
      cumulativeSeconds = timeToReachSeconds;

      // Add accumulated stop times from previous zones
      const previousStops = zonesToCalculate
        .filter(z => z.distance_from_start_km < zone.distance_from_start_km)
        .reduce((sum, z) => sum + (z.stopDurationMinutes * 60), 0);

      cumulativeSeconds += previousStops;

      // Calculate arrival time (only if not manually set)
      const arrivalDate = new Date(startDateTime.getTime() + (cumulativeSeconds * 1000));
      const arrivalHours = String(arrivalDate.getHours()).padStart(2, '0');
      const arrivalMinutes = String(arrivalDate.getMinutes()).padStart(2, '0');
      const calculatedArrivalTime = `${arrivalHours}:${arrivalMinutes}`;

      // Calculate departure time if there's a stop
      let calculatedDepartureTime: string | undefined;
      const effectiveArrivalTime = zone.manualArrivalTime || calculatedArrivalTime;
      if (zone.stopDurationMinutes > 0 && effectiveArrivalTime) {
        const [hrs, mins] = effectiveArrivalTime.split(':').map(Number);
        const effectiveArrivalDate = new Date();
        effectiveArrivalDate.setHours(hrs, mins, 0, 0);

        const departureDate = new Date(effectiveArrivalDate.getTime() + (zone.stopDurationMinutes * 60 * 1000));
        const depHours = String(departureDate.getHours()).padStart(2, '0');
        const depMinutes = String(departureDate.getMinutes()).padStart(2, '0');
        calculatedDepartureTime = `${depHours}:${depMinutes}`;
      }

      return {
        ...zone,
        calculatedArrivalTime,
        calculatedDepartureTime,
        // Preserve manual values
        manualArrivalTime: zone.manualArrivalTime,
        stopDurationMinutes: zone.stopDurationMinutes,
      };
    });

    setFeedZonesWithTimes(updatedZones);
  };

  const handleUpdateDuration = (feedZoneId: string, minutes: number) => {
    // Update local state and recalculate departure time
    const updatedZones = feedZonesWithTimes.map(zone => {
      if (zone.id !== feedZoneId) return zone;

      let calculatedDepartureTime: string | undefined;

      // Calculate departure time if there's a stop and arrival time is set
      const arrivalTime = zone.manualArrivalTime || zone.calculatedArrivalTime;
      if (arrivalTime && minutes > 0) {
        const [hours, mins] = arrivalTime.split(':').map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, mins, 0, 0);

        const departureDate = new Date(arrivalDate.getTime() + (minutes * 60 * 1000));
        const depHours = String(departureDate.getHours()).padStart(2, '0');
        const depMinutes = String(departureDate.getMinutes()).padStart(2, '0');
        calculatedDepartureTime = `${depHours}:${depMinutes}`;
      }

      return {
        ...zone,
        stopDurationMinutes: minutes,
        calculatedDepartureTime,
      };
    });

    setFeedZonesWithTimes(updatedZones);

    // Recalculate arrival times for subsequent zones with new duration
    setTimeout(() => calculateFeedZoneTimes(updatedZones), 0);
  };

  const handleUpdateArrivalTime = (feedZoneId: string, time: string) => {
    // Update local state with manual arrival time
    setFeedZonesWithTimes(prev => prev.map(zone => {
      if (zone.id !== feedZoneId) return zone;

      let calculatedDepartureTime: string | undefined;

      // Calculate departure time if there's a stop and arrival time is set
      if (time && zone.stopDurationMinutes > 0) {
        const [hours, minutes] = time.split(':').map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes, 0, 0);

        const departureDate = new Date(arrivalDate.getTime() + (zone.stopDurationMinutes * 60 * 1000));
        const depHours = String(departureDate.getHours()).padStart(2, '0');
        const depMinutes = String(departureDate.getMinutes()).padStart(2, '0');
        calculatedDepartureTime = `${depHours}:${depMinutes}`;
      }

      return {
        ...zone,
        manualArrivalTime: time || undefined,
        calculatedDepartureTime,
      };
    }));
  };

  const handleNext = () => {
    // Convert feed zones with stops to WizardFeedZone format
    const selectedFeedZones: WizardFeedZone[] = feedZonesWithTimes
      .filter(zone => zone.stopDurationMinutes > 0)
      .map(zone => ({
        feed_zone_id: zone.id,
        name: zone.name,
        distance_from_start_km: zone.distance_from_start_km,
        planned_duration_seconds: zone.stopDurationMinutes * 60,
        planned_arrival_time: zone.manualArrivalTime || zone.calculatedArrivalTime,
        planned_departure_time: zone.calculatedDepartureTime,
      }));

    updatePlanData({ selectedFeedZones });
    calculateResults();
    nextStep();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">{t('loadingFeedZones')}</p>
        </div>
      </div>
    );
  }

  const stopsCount = feedZonesWithTimes.filter(z => z.stopDurationMinutes > 0).length;
  const totalStopMinutes = feedZonesWithTimes.reduce((sum, z) => sum + z.stopDurationMinutes, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {t('addFeedZones')} <span className="text-text-muted text-xl font-normal">({t('optional')})</span>
        </h2>
        <p className="text-sm sm:text-base text-text-secondary">
          {t('feedZonesPitStopsDescription')}
        </p>
      </div>

      {/* Empty State */}
      {feedZonesWithTimes.length === 0 && (
        <div className="text-center py-12 mb-6">
          <p className="text-text-muted">{t('noFeedZones')}</p>
        </div>
      )}

      {/* All Feed Zones */}
      {feedZonesWithTimes.length > 0 && (
        <div className="space-y-3 mb-6">
          {feedZonesWithTimes.map((zone, index) => {
            const previousDistance = index > 0 ? feedZonesWithTimes[index - 1].distance_from_start_km : 0;
            const distanceFromLast = zone.distance_from_start_km - previousDistance;
            const isStop = zone.stopDurationMinutes > 0;

            return (
              <div
                key={zone.id}
                className={`border rounded-lg p-3 transition-colors ${
                  isStop
                    ? 'bg-warning-subtle border-warning'
                    : 'bg-surface-background border-border'
                }`}
              >
                {/* Header row: Icon, Name, Distance */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{isStop ? '⏸️' : '📍'}</span>
                  <h4 className="font-semibold text-text-primary">{zone.name}</h4>
                  <span className="text-xs text-text-secondary ml-auto">
                    {zone.distance_from_start_km} km
                    {index > 0 && ` (+${distanceFromLast.toFixed(1)} km)`}
                  </span>
                </div>

                {/* Input row: Arrival Time, Stop Duration, Departure Time */}
                <div className="flex items-center gap-2 text-sm">
                  {/* Arrival Time */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-text-secondary whitespace-nowrap">
                      {t('arrivalTime')}:
                    </label>
                    <input
                      type="time"
                      value={zone.manualArrivalTime || zone.calculatedArrivalTime}
                      onChange={(e) => handleUpdateArrivalTime(zone.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-background dark:[color-scheme:dark]"
                    />
                  </div>

                  {/* Stop Duration */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-text-secondary whitespace-nowrap">
                      {t('stopDurationMinutes')}:
                    </label>
                    <input
                      type="number"
                      value={zone.stopDurationMinutes}
                      onChange={(e) => handleUpdateDuration(zone.id, parseInt(e.target.value) || 0)}
                      min="0"
                      max="120"
                      className="w-16 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-background"
                    />
                    <span className="text-xs text-text-secondary">min</span>
                  </div>

                  {/* Departure Time */}
                  {zone.calculatedDepartureTime && (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs text-text-secondary">{t('departure')}:</span>
                      <span className="text-sm font-semibold text-text-primary">{zone.calculatedDepartureTime}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {stopsCount > 0 && (
        <div className="bg-info-subtle border border-info rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏸️</span>
            <h3 className="text-sm font-semibold text-text-primary">
              {stopsCount} {stopsCount !== 1 ? t('feedZoneCountPlural') : t('feedZoneCount')}
            </h3>
          </div>
          <p className="text-sm text-text-secondary">
            {t('totalStopTime')}: <span className="font-semibold text-text-primary">{totalStopMinutes} {t('minutes')}</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-surface-background border-t border-border p-4">
        <button
          onClick={handleNext}
          className="w-full py-3 px-6 rounded-lg font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors"
        >
          {t('nextReviewPlan')}
        </button>
      </div>
    </div>
  );
}
