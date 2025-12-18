'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FeedZone, PlanFeedZone } from '@/types';
import { TrashIcon } from '@heroicons/react/24/outline';
import { trackFeedZoneAdded, trackFeedZoneRemoved } from '@/lib/analytics';

interface SelectedFeedZone {
  feed_zone_id: string;
  planned_duration_seconds: number;
  planned_arrival_time?: string;
  planned_departure_time?: string;
}

interface FeedZoneSelectorProps {
  raceId: string;
  raceName?: string;
  availableFeedZones: FeedZone[];
  selectedFeedZones?: SelectedFeedZone[];
  onChange: (feedZones: SelectedFeedZone[]) => void;
}

export default function FeedZoneSelector({
  raceId,
  raceName = 'Unknown Race',
  availableFeedZones,
  selectedFeedZones = [],
  onChange,
}: FeedZoneSelectorProps) {
  const t = useTranslations('raceCalculator');
  const tCommon = useTranslations('common');
  const [localFeedZones, setLocalFeedZones] = useState<SelectedFeedZone[]>(selectedFeedZones);

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalFeedZones(selectedFeedZones);
  }, [selectedFeedZones]);

  const handleAddFeedZone = (feedZoneId: string) => {
    const feedZone = getFeedZoneById(feedZoneId);
    const newFeedZone: SelectedFeedZone = {
      feed_zone_id: feedZoneId,
      planned_duration_seconds: 600, // Default 10 minutes
    };
    const updated = [...localFeedZones, newFeedZone];
    setLocalFeedZones(updated);
    onChange(updated);
    setShowAddDropdown(false);

    // Track feed zone added
    if (feedZone) {
      trackFeedZoneAdded(feedZone.name, raceName);
    }
  };

  const handleRemoveFeedZone = (index: number) => {
    const removedFeedZone = localFeedZones[index];
    const feedZone = getFeedZoneById(removedFeedZone.feed_zone_id);

    const updated = localFeedZones.filter((_, i) => i !== index);
    setLocalFeedZones(updated);
    onChange(updated);

    // Track feed zone removed
    if (feedZone) {
      trackFeedZoneRemoved(feedZone.name, raceName);
    }
  };

  const handleFeedZoneChange = (index: number, field: keyof SelectedFeedZone, value: any) => {
    const updated = [...localFeedZones];
    updated[index] = { ...updated[index], [field]: value };
    setLocalFeedZones(updated);
    onChange(updated);
  };

  const handleDurationChange = (index: number, hours: number, minutes: number) => {
    const totalSeconds = hours * 3600 + minutes * 60;
    handleFeedZoneChange(index, 'planned_duration_seconds', totalSeconds);
  };

  const getTotalFeedZoneTime = () => {
    const totalSeconds = localFeedZones.reduce((sum, fz) => sum + fz.planned_duration_seconds, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { hours, minutes, totalSeconds };
  };

  const getFeedZoneById = (id: string) => {
    return availableFeedZones.find((fz) => fz.id === id);
  };

  const getAvailableFeedZones = () => {
    const selectedIds = localFeedZones.map((fz) => fz.feed_zone_id);
    return availableFeedZones.filter((fz) => !selectedIds.includes(fz.id));
  };

  if (availableFeedZones.length === 0) {
    return (
      <div className="bg-surface-1 rounded-lg p-4 text-center">
        <p className="text-sm text-text-secondary">{t('noFeedZones')}</p>
      </div>
    );
  }

  const totalTime = getTotalFeedZoneTime();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{t('feedZones')}</h3>
          <p className="text-sm text-text-secondary">{t('feedZonesDescription')}</p>
        </div>
      </div>

      {/* Collapsed Summary Card */}
      {localFeedZones.length > 0 && !isExpanded && (
        <div
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍔</span>
              <div>
                <h4 className="font-semibold text-text-primary">
                  {localFeedZones.length} {localFeedZones.length === 1 ? t('feedZone') : t('feedZones')}
                </h4>
                <p className="text-sm text-text-secondary">{t('totalFeedZoneTime')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-700">
                {totalTime.hours}h {totalTime.minutes}m
              </div>
              <button
                type="button"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('viewDetails')} →
              </button>
            </div>
          </div>

          {/* Stacked preview of feed zones */}
          <div className="flex flex-wrap gap-1 mt-3">
            {localFeedZones.map((selectedZone, index) => {
              const feedZone = getFeedZoneById(selectedZone.feed_zone_id);
              if (!feedZone || index >= 3) return null;

              return (
                <span
                  key={feedZone.id}
                  className="inline-block px-2 py-1 bg-surface-background border border-amber-300 rounded text-xs text-text-secondary"
                >
                  {feedZone.name}
                </span>
              );
            })}
            {localFeedZones.length > 3 && (
              <span className="inline-block px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800 font-medium">
                +{localFeedZones.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded view - Selected feed zones */}
      {localFeedZones.length > 0 && isExpanded && (
        <>
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍔</span>
              <span className="font-semibold text-text-primary">
                {localFeedZones.length} {localFeedZones.length === 1 ? t('feedZone') : t('feedZones')} - {totalTime.hours}h {totalTime.minutes}m
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('collapse')} ↑
            </button>
          </div>

          <div className="space-y-3">
            {localFeedZones.map((selectedZone, index) => {
              const feedZone = getFeedZoneById(selectedZone.feed_zone_id);
              if (!feedZone) return null;

              const hours = Math.floor(selectedZone.planned_duration_seconds / 3600);
              const minutes = Math.floor((selectedZone.planned_duration_seconds % 3600) / 60);

              return (
                <div
                  key={`${feedZone.id}-${index}`}
                  className="bg-surface-background border border-border rounded-lg p-4 space-y-3"
                >
                  {/* Feed zone header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary">{feedZone.name}</h4>
                      <p className="text-sm text-text-secondary">
                        {feedZone.distance_from_start_km} {t('km')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeedZone(index)}
                      className="text-error hover:text-error-hover p-1"
                      title={t('removeFeedZone')}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Duration inputs */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('stopDuration')}
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={hours}
                          onChange={(e) =>
                            handleDurationChange(index, parseInt(e.target.value) || 0, minutes)
                          }
                          className="w-16 px-2 py-1 border border-border rounded-md text-text-primary"
                        />
                        <span className="text-sm text-text-secondary">{t('hours')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={minutes}
                          onChange={(e) =>
                            handleDurationChange(index, hours, parseInt(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 border border-border rounded-md text-text-primary"
                        />
                        <span className="text-sm text-text-secondary">{t('minutes')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional arrival/departure times */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        {t('arrivalTime')} ({t('optional')})
                      </label>
                      <input
                        type="time"
                        value={selectedZone.planned_arrival_time?.slice(11, 16) || ''}
                        onChange={(e) => {
                          const value = e.target.value
                            ? `2000-01-01T${e.target.value}:00`
                            : undefined;
                          handleFeedZoneChange(index, 'planned_arrival_time', value);
                        }}
                        className="w-full px-2 py-1 border border-border rounded-md text-sm text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        {t('departureTime')} ({t('optional')})
                      </label>
                      <input
                        type="time"
                        value={selectedZone.planned_departure_time?.slice(11, 16) || ''}
                        onChange={(e) => {
                          const value = e.target.value
                            ? `2000-01-01T${e.target.value}:00`
                            : undefined;
                          handleFeedZoneChange(index, 'planned_departure_time', value);
                        }}
                        className="w-full px-2 py-1 border border-border rounded-md text-sm text-text-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add feed zone dropdown */}
      {getAvailableFeedZones().length > 0 && (
        <div className="space-y-2">
          {!showAddDropdown ? (
            <button
              type="button"
              onClick={() => setShowAddDropdown(true)}
              className="w-full py-2 px-4 border-2 border-dashed border-border rounded-lg text-text-secondary hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              + {t('addFeedZone')}
            </button>
          ) : (
            <div className="border-2 border-primary-300 rounded-lg p-3 bg-primary-50">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('selectFeedZones')}
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddFeedZone(e.target.value);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t('selectFeedZones')}
                  </option>
                  {getAvailableFeedZones().map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - {zone.distance_from_start_km} {t('km')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddDropdown(false)}
                  className="px-3 py-2 text-text-secondary hover:text-gray-800 border border-border rounded-md"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
