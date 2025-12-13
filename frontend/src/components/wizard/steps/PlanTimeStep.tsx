'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useWizard } from '../WizardContext';

export default function PlanTimeStep() {
  const t = useTranslations('raceCalculator');
  const locale = useLocale();
  const { state, updatePlanData, nextStep, calculateResults } = useWizard();
  const { race, planData } = state;

  // Calculate finish time whenever plan data changes
  useEffect(() => {
    if (planData.startDate && planData.startTime) {
      calculateResults();
    }
  }, [planData.startDate, planData.startTime, planData.durationHours, planData.durationMinutes]);

  const handleNext = () => {
    calculateResults();
    nextStep();
  };

  // Get allowed dates for the race, this should probably be put in the race databse in the future
  const getAllowedDates = () => {
    if (race?.name.toLowerCase().includes('vätternrundan')) {
      return {
        min: '2026-06-11',
        max: '2026-06-12'
      };
    }
    return null;
  };

  const allowedDates = getAllowedDates();

  // Format finish time for preview
  const formatFinishTime = () => {
    if (!state.calculatedResults) return null;

    const finishTime = state.calculatedResults.finishTime;
    return finishTime.toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!race) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Please select a race first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Plan Your Time
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-1">
          For: <span className="font-semibold text-gray-900">{race.name}</span>
        </p>
        <p className="text-sm text-gray-500">
          {race.distance_km} km
        </p>
                  {allowedDates && (
            <p className="mt-2 text-xs text-gray-500">
              Race dates: {new Date(allowedDates.min).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(allowedDates.max).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
      </div>

      {/* Form */}
      <div className="space-y-6 mb-6">
        {/* Start Date and Time - Side by Side */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('startDate')}
              </label>
              <input
                type="date"
                id="startDate"
                value={planData.startDate}
                onChange={(e) => updatePlanData({ startDate: e.target.value })}
                min={allowedDates?.min}
                max={allowedDates?.max}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                {t('startTime')}
              </label>
              <input
                type="time"
                id="startTime"
                value={planData.startTime}
                onChange={(e) => updatePlanData({ startTime: e.target.value })}
                className="w-full px-3 py-2.7 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 bg-white"
              />
            </div>
          </div>

        </div>

        {/* Estimated Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('duration')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Hours */}
            <div>
              <label htmlFor="durationHours" className="block text-xs text-gray-600 mb-1">
                {t('hours')}
              </label>
              <input
                type="number"
                id="durationHours"
                value={planData.durationHours}
                onChange={(e) => updatePlanData({ durationHours: parseInt(e.target.value) || 0 })}
                min="0"
                max="24"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-gray-900 bg-white"
              />
            </div>

            {/* Minutes */}
            <div>
              <label htmlFor="durationMinutes" className="block text-xs text-gray-600 mb-1">
                {t('minutes')}
              </label>
              <input
                type="number"
                id="durationMinutes"
                value={planData.durationMinutes}
                onChange={(e) => updatePlanData({ durationMinutes: parseInt(e.target.value) || 0 })}
                min="0"
                max="59"
                step="5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Finish Time Preview */}
        {state.calculatedResults && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-primary-900 mb-1">
              Estimated Finish Time
            </h3>
            <p className="text-lg font-semibold text-primary-700">
              {formatFinishTime()}
            </p>
            <p className="text-sm text-primary-600 mt-1">
              Required pace: {state.calculatedResults.requiredSpeedKmh.toFixed(1)} km/h
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleNext}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors bg-primary-600 hover:bg-primary-700"
        >
          Next: Feed Zones (Optional)
        </button>
      </div>
    </div>
  );
}
