'use client';

import { Race } from '@/types';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-surface-1 flex items-center justify-center">
      <p className="text-text-muted">Loading map...</p>
    </div>
  ),
});

interface RaceCardProps {
  race: Race;
  onSelectRace: (race: Race) => void;
  onViewDetails: (race: Race) => void;
}

export default function RaceCard({ race, onSelectRace, onViewDetails }: RaceCardProps) {
  const t = useTranslations('availableRaces');

  // Format dates for display
  const formatDateRange = () => {
    if (!race.start_date) return null;

    const startDate = new Date(race.start_date);
    const endDate = race.end_date ? new Date(race.end_date) : null;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    const start = startDate.toLocaleDateString('sv-SE', options);
    const end = endDate ? endDate.toLocaleDateString('sv-SE', options) : null;

    return end && end !== start ? `${start} - ${end}` : start;
  };

  return (
    <div
      className="bg-surface-background rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-border"
    >
      {/* Map Preview - Fixed height for consistency */}
      <div className="relative h-40 overflow-hidden bg-surface-1">
        {race.route_geometry?.coordinates ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4/5 h-full">
                <RaceMap
                  routeCoordinates={race.route_geometry.coordinates as number[][]}
                  interactive={false}
                />
              </div>
            </div>
            {/* Overlay with distance */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <div className="text-lg font-semibold drop-shadow-lg">
                  {race.distance_km} km
                </div>
              </div>
            </div>
          </>
        ) : (
          // Fallback if no route geometry
          <div className="h-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-lg font-semibold">
                {race.distance_km} km
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 bg-surface-background">
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {race.name}
        </h3>

        {/* Distance */}
        <div className="flex items-center gap-2 text-text-secondary mb-2">
          <span className="text-sm font-medium">{t('distance')}:</span>
          <span className="text-sm">{race.distance_km} km</span>
        </div>

        {/* Elevation gain if available */}
        {race.elevation_gain_m && (
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <span className="text-sm font-medium">{t('elevationGain')}:</span>
            <span className="text-sm">{race.elevation_gain_m} m</span>
          </div>
        )}

        {/* Race dates if available */}
        {formatDateRange() && (
          <div className="flex items-center gap-2 text-text-secondary mb-4">
            <span className="text-sm font-medium">{t('raceDates')}:</span>
            <span className="text-sm">{formatDateRange()}</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onViewDetails(race)}
            className="w-full bg-surface-2 text-text-primary px-4 py-2.5 rounded-lg hover:bg-surface-3 transition-colors font-semibold text-sm border border-border"
          >
            {t('moreInfo')}
          </button>
          <button
            onClick={() => onSelectRace(race)}
            className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-semibold text-sm"
          >
            {t('startPlanning')}
          </button>
        </div>
      </div>
    </div>
  );
}
