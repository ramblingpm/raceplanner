'use client';

import { useTranslations } from 'next-intl';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { ClockIcon, BoltIcon, CalendarIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';

const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-surface-1 flex items-center justify-center">
      <p className="text-text-muted text-xs">Loading map...</p>
    </div>
  ),
});

interface RacePlanCardProps {
  plan: any;
  race: any;
  onEdit: (plan: any) => void;
}

export default function RacePlanCard({
  plan,
  race,
  onEdit,
}: RacePlanCardProps) {
  const t = useTranslations('myPlans');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const durationHours = Math.floor(plan.estimated_duration_seconds / 3600);
  const durationMinutes = Math.floor((plan.estimated_duration_seconds % 3600) / 60);

  return (
    <div className="group relative bg-surface-1 rounded-xl sm:rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl tap-transparent"
      onClick={() => onEdit(plan)}>
      {/* Map Background - Netflix-style with overlay */}
      <div className="relative h-40 xs:h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        {race?.route_geometry?.coordinates ? (
          <>
            <div className="absolute inset-0 z-0">
              <RaceMap
                routeCoordinates={race.route_geometry.coordinates as number[][]}
                interactive={false}
              />
            </div>
            {/* Dark gradient overlay for better text readability */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary to-primary-hover" />
        )}

        {/* Content over map */}
        <div className="absolute inset-0 z-20 p-3 sm:p-4 flex flex-col justify-between">
          {/* Top row - Race info */}
          <div className="flex flex-wrap gap-1.5">
            <div className="inline-block bg-black/40 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
              <p className="text-white text-xs font-medium">
                {race?.name || 'Unknown Race'}
              </p>
            </div>
            {race?.distance_km && (
              <div className="inline-block bg-primary/90 px-2.5 py-1 sm:px-3 rounded-lg">
                <p className="text-white text-xs font-bold">
                  {race.distance_km} km
                </p>
              </div>
            )}
          </div>

          {/* Bottom row - Plan name */}
          <div>
            <h3 className="text-white text-xl sm:text-2xl font-bold drop-shadow-lg mb-0.5 sm:mb-1 line-clamp-1">
              {plan.label || tDashboard('untitledPlan')}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" />
              <p className="text-white/90 text-xs sm:text-sm drop-shadow">
                {formatDate(plan.planned_start_time)} • {formatTime(plan.planned_start_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Hover edit overlay - only on desktop */}
        <div className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center cursor-pointer">
          <div className="bg-primary px-6 py-3 rounded-lg flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">{tCommon('edit')}</span>
          </div>
        </div>
      </div>

      {/* Card content - Stats */}
      <div className="p-3 sm:p-5 bg-surface-1">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
          {/* Duration */}
          <div className="flex flex-col items-center p-2 sm:p-3 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mb-0.5 sm:mb-1" />
            <p className="text-[10px] sm:text-xs text-text-muted mb-0.5">{tDashboard('duration')}</p>
            <p className="text-xs sm:text-sm font-bold text-text-primary">
              {durationHours}h {durationMinutes}m
            </p>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-center p-2 sm:p-3 bg-surface-2 rounded-lg border border-border">
            <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning mb-0.5 sm:mb-1" />
            <p className="text-[10px] sm:text-xs text-text-muted mb-0.5">{tDashboard('avgSpeed')}</p>
            <p className="text-xs sm:text-sm font-bold text-text-primary">
              {plan.required_speed_kmh.toFixed(1)} km/h
            </p>
          </div>

          {/* Finish Time */}
          <div className="flex flex-col items-center p-2 sm:p-3 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-success mb-0.5 sm:mb-1" />
            <p className="text-[10px] sm:text-xs text-text-muted mb-0.5">{tDashboard('finishTime')}</p>
            <p className="text-xs sm:text-sm font-bold text-text-primary">
              {formatTime(plan.calculated_finish_time)}
            </p>
          </div>
        </div>

        {/* Created date */}
        <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            {t('createdOn')}: {formatDate(plan.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
