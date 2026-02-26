'use client';

import { useTranslations } from 'next-intl';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { ClockIcon, BoltIcon, CalendarIcon } from '@heroicons/react/24/solid';

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
    <div className="bg-surface-background rounded-lg overflow-hidden border border-border hover:border-border-strong transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-text-muted font-medium truncate">
              {race?.name || 'Unknown Race'}
            </span>
            {race?.distance_km && (
              <span className="text-xs font-bold bg-surface-inverse text-text-inverse px-2 py-0.5 rounded shrink-0">
                {race.distance_km} km
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-text-primary leading-tight truncate">
            {plan.label || tDashboard('untitledPlan')}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-xs text-text-muted">
              {formatDate(plan.planned_start_time)} • {formatTime(plan.planned_start_time)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(plan)}
          aria-label={tCommon('edit')}
          className="shrink-0 p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Card content - Stats */}
      <div className="p-3 bg-surface-1">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Duration */}
          <div className="flex flex-col items-center p-2 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-4 h-4 text-primary mb-0.5" />
            <p className="text-xs text-text-muted">{tDashboard('duration')}</p>
            <p className="text-sm font-bold text-text-primary">
              {durationHours}h {durationMinutes}m
            </p>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-center p-2 bg-surface-2 rounded-lg border border-border">
            <BoltIcon className="w-4 h-4 text-warning mb-0.5" />
            <p className="text-xs text-text-muted">{tDashboard('avgSpeed')}</p>
            <p className="text-sm font-bold text-text-primary">
              {plan.required_speed_kmh.toFixed(1)} km/h
            </p>
          </div>

          {/* Finish Time */}
          <div className="flex flex-col items-center p-2 bg-surface-2 rounded-lg border border-border">
            <ClockIcon className="w-4 h-4 text-success mb-0.5" />
            <p className="text-xs text-text-muted">{tDashboard('finishTime')}</p>
            <p className="text-sm font-bold text-text-primary">
              {formatTime(plan.calculated_finish_time)}
            </p>
          </div>
        </div>

        {/* Created date */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            {t('createdOn')}: {formatDate(plan.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
