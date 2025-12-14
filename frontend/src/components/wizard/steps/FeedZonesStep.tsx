'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useWizard, WizardFeedZone } from '../WizardContext';
import { getFeedZonesByRace } from '@/lib/feedZones';
import { FeedZone } from '@/types';

export default function FeedZonesStep() {
  const t = useTranslations('wizard');
  const { state, updatePlanData, nextStep } = useWizard();
  const { race, planData } = state;
  const [availableFeedZones, setAvailableFeedZones] = useState<FeedZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (race) {
      loadFeedZones();
    }
  }, [race]);

  const loadFeedZones = async () => {
    if (!race) return;

    try {
      const zones = await getFeedZonesByRace(race.id);
      setAvailableFeedZones(zones);
    } catch (error) {
      console.error('Error loading feed zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedZone = (feedZone: FeedZone) => {
    const newZone: WizardFeedZone = {
      feed_zone_id: feedZone.id,
      name: feedZone.name,
      distance_from_start_km: feedZone.distance_from_start_km,
      planned_duration_seconds: 600, // Default 10 minutes
    };

    updatePlanData({
      selectedFeedZones: [...planData.selectedFeedZones, newZone],
    });
  };

  const handleRemoveFeedZone = (feedZoneId: string) => {
    updatePlanData({
      selectedFeedZones: planData.selectedFeedZones.filter(z => z.feed_zone_id !== feedZoneId),
    });
  };

  const handleUpdateDuration = (feedZoneId: string, minutes: number) => {
    updatePlanData({
      selectedFeedZones: planData.selectedFeedZones.map(z =>
        z.feed_zone_id === feedZoneId
          ? { ...z, planned_duration_seconds: minutes * 60 }
          : z
      ),
    });
  };

  const handleSkip = () => {
    updatePlanData({ selectedFeedZones: [] });
    nextStep();
  };

  const handleNext = () => {
    nextStep();
  };

  const unselectedZones = availableFeedZones.filter(
    zone => !planData.selectedFeedZones.some(sz => sz.feed_zone_id === zone.id)
  );

  const totalMinutes = Math.floor(
    planData.selectedFeedZones.reduce((sum, z) => sum + z.planned_duration_seconds, 0) / 60
  );

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

      {/* Summary */}
      {planData.selectedFeedZones.length > 0 && (
        <div className="bg-warning-subtle border border-warning rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🍔</span>
            <h3 className="text-sm font-semibold text-warning-foreground">
              {planData.selectedFeedZones.length} {planData.selectedFeedZones.length !== 1 ? t('feedZoneCountPlural') : t('feedZoneCount')}
            </h3>
          </div>
          <p className="text-sm text-warning-foreground">
            {t('totalStopTime')} <span className="font-semibold">{totalMinutes} {t('minutes')}</span>
          </p>
        </div>
      )}

      {/* Selected Feed Zones */}
      {planData.selectedFeedZones.length > 0 && (
        <div className="space-y-3 mb-6">
          {planData.selectedFeedZones.map((zone) => (
            <div key={zone.feed_zone_id} className="bg-surface-background border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary">{zone.name}</h4>
                  <p className="text-sm text-text-secondary">
                    {zone.distance_from_start_km} {t('kmFromStart')}
                  </p>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      {t('stopDurationMinutes')}
                    </label>
                    <input
                      type="number"
                      value={Math.floor(zone.planned_duration_seconds / 60)}
                      onChange={(e) => handleUpdateDuration(zone.feed_zone_id, parseInt(e.target.value) || 10)}
                      min="1"
                      max="60"
                      className="w-full sm:w-32 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-text-primary bg-surface-background"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFeedZone(zone.feed_zone_id)}
                  className="p-2 text-error hover:bg-error-subtle rounded-lg transition-colors"
                  aria-label={t('removeFeedZone')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Feed Zone */}
      {unselectedZones.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {planData.selectedFeedZones.length > 0 ? t('addMoreFeedZones') : t('addFeedZone')}
          </label>
          <select
            onChange={(e) => {
              const zone = availableFeedZones.find(z => z.id === e.target.value);
              if (zone) {
                handleAddFeedZone(zone);
                e.target.value = '';
              }
            }}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-base text-text-primary bg-surface-background dark:[color-scheme:dark]"
            defaultValue=""
          >
            <option value="" disabled className="bg-surface-background text-text-primary">
              {t('selectFeedZone')}
            </option>
            {unselectedZones.map((zone) => (
              <option key={zone.id} value={zone.id} className="bg-surface-background text-text-primary">
                {zone.name} - {zone.distance_from_start_km} km
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Empty State */}
      {availableFeedZones.length === 0 && (
        <div className="text-center py-12 mb-6">
          <p className="text-text-muted">{t('noFeedZones')}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-surface-background border-t border-border p-4 space-y-3">
        {planData.selectedFeedZones.length === 0 ? (
          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 rounded-lg font-semibold bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
          >
            {t('skipNoFeedZones')}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 px-6 rounded-lg font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors"
          >
            {t('nextReviewPlan')}
          </button>
        )}
      </div>
    </div>
  );
}
