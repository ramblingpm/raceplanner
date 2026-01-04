'use client';

import { useTranslations } from 'next-intl';
import { DocumentDuplicateIcon, TrashIcon, PrinterIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
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
  onCopy: (plan: any) => void;
  onDelete: (plan: any) => void;
  onPrint: (plan: any) => void;
}

export default function RacePlanCard({
  plan,
  race,
  onEdit,
  onCopy,
  onDelete,
  onPrint,
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
    <div className="group relative bg-surface-1 rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl">
      {/* Map Background - Netflix-style with overlay */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
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
        <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
          {/* Top row - Race info */}
          <div>
            <div className="inline-block bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg mb-2">
              <p className="text-white text-xs font-medium">
                {race?.name || 'Unknown Race'}
              </p>
            </div>
            {race?.distance_km && (
              <div className="inline-block bg-primary/90 px-3 py-1 rounded-lg ml-2">
                <p className="text-white text-xs font-bold">
                  {race.distance_km} km
                </p>
              </div>
            )}
          </div>

          {/* Bottom row - Plan name */}
          <div>
            <h3 className="text-white text-2xl font-bold drop-shadow-lg mb-1">
              {plan.label || tDashboard('untitledPlan')}
            </h3>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-white/90" />
              <p className="text-white/90 text-sm drop-shadow">
                {formatDate(plan.planned_start_time)} • {formatTime(plan.planned_start_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Hover edit overlay */}
        <div className="absolute inset-0 z-30 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
          onClick={() => onEdit(plan)}>
          <div className="bg-primary px-6 py-3 rounded-lg flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">{tCommon('edit')}</span>
          </div>
        </div>
      </div>

      {/* Card content - Stats */}
      <div className="p-5 bg-surface-1">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Duration */}
          <div className="flex flex-col items-center p-3 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-5 h-5 text-primary mb-1" />
            <p className="text-xs text-text-muted mb-0.5">{tDashboard('duration')}</p>
            <p className="text-sm font-bold text-text-primary">
              {durationHours}h {durationMinutes}m
            </p>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-center p-3 bg-surface-2 rounded-lg border border-border">
            <BoltIcon className="w-5 h-5 text-warning mb-1" />
            <p className="text-xs text-text-muted mb-0.5">{tDashboard('avgSpeed')}</p>
            <p className="text-sm font-bold text-text-primary">
              {plan.required_speed_kmh.toFixed(1)} km/h
            </p>
          </div>

          {/* Finish Time */}
          <div className="flex flex-col items-center p-3 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-5 h-5 text-success mb-1" />
            <p className="text-xs text-text-muted mb-0.5">{tDashboard('finishTime')}</p>
            <p className="text-sm font-bold text-text-primary">
              {formatTime(plan.calculated_finish_time)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrint(plan);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-info-subtle text-info rounded-lg hover:bg-info hover:text-white transition-colors text-xs font-medium border border-info"
            title={t('printPlan')}
          >
            <PrinterIcon className="w-4 h-4" />
            <span>{t('print')}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(plan);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-success-subtle text-success rounded-lg hover:bg-success hover:text-white transition-colors text-xs font-medium border border-success"
            title={tCommon('copy')}
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            <span>{tCommon('copy')}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(plan);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-error-subtle text-error rounded-lg hover:bg-error hover:text-white transition-colors text-xs font-medium border border-error"
            title={tCommon('delete')}
          >
            <TrashIcon className="w-4 h-4" />
            <span>{tCommon('delete')}</span>
          </button>
        </div>

        {/* Created date */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            {t('createdOn')}: {formatDate(plan.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
