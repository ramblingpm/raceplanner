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
  loading: () => (
    <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function ReviewStep() {
  const t = useTranslations('raceCalculator');
  const locale = useLocale();
  const { state, goToStep, nextStep } = useWizard();
  const { race, planData, calculatedResults } = state;
  const [feedZones, setFeedZones] = useState<FeedZone[]>([]);

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
        <p className="text-gray-600">Missing plan data</p>
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

  const totalFeedZoneMinutes = Math.floor(
    planData.selectedFeedZones.reduce((sum, z) => sum + z.planned_duration_seconds, 0) / 60
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Review Your Plan
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Check everything looks good before saving
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-6">
        {/* Race */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Race</h3>
              <p className="text-lg font-semibold text-gray-900">{race.name}</p>
              <p className="text-sm text-gray-600">{race.distance_km} km</p>
            </div>
            <button
              onClick={() => {
                trackWizardEditClicked('race');
                goToStep(1);
              }}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Edit race"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Plan Details</h3>
            <button
              onClick={() => {
                trackWizardEditClicked('time');
                goToStep(2);
              }}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Edit plan details"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Start</p>
              <p className="font-semibold text-gray-900">
                {formatDate(planData.startDate)} at {planData.startTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Duration</p>
              <p className="font-semibold text-gray-900">
                {planData.durationHours}h {planData.durationMinutes}m
              </p>
            </div>
          </div>
        </div>

        {/* Feed Zones */}
        {planData.selectedFeedZones.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Feed Zones</h3>
              <button
                onClick={() => {
                  trackWizardEditClicked('feed_zones');
                  goToStep(3);
                }}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                aria-label="Edit feed zones"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                {planData.selectedFeedZones.length} stop{planData.selectedFeedZones.length !== 1 ? 's' : ''} • {totalFeedZoneMinutes} minutes total
              </p>
              <div className="space-y-1">
                {planData.selectedFeedZones.map((zone) => (
                  <div key={zone.feed_zone_id} className="text-sm text-gray-600">
                    • {zone.name} ({Math.floor(zone.planned_duration_seconds / 60)} min)
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-primary-900 mb-3">Estimated Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-primary-700">Finish Time</p>
              <p className="text-lg font-bold text-primary-900">
                {formatFinishTime()}
              </p>
            </div>
            <div>
              <p className="text-sm text-primary-700">Required Pace</p>
              <p className="text-lg font-bold text-primary-900">
                {calculatedResults.requiredSpeedKmh.toFixed(1)} km/h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      {race.route_geometry?.coordinates && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <RaceMap
              routeCoordinates={race.route_geometry.coordinates as number[][]}
              selectedFeedZones={feedZones}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={nextStep}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors bg-primary-600 hover:bg-primary-700"
        >
          Continue to Save
        </button>
      </div>
    </div>
  );
}
