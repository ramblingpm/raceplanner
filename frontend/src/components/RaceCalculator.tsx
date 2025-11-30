'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { calculateRace } from '@/utils/calculations';
import { Race } from '@/types';

interface RaceCalculatorProps {
  race: Race;
  editingCalculation?: any; // For editing existing plans
  onCalculate?: (result: {
    finishTime: Date;
    requiredSpeedKmh: number;
  }) => void;
  onSaved?: () => void;
}

export default function RaceCalculator({
  race,
  editingCalculation,
  onCalculate,
  onSaved,
}: RaceCalculatorProps) {
  const t = useTranslations('raceCalculator');
  const locale = useLocale();

  // Set defaults based on race name or editing calculation
  const isVatternrundan = race.name.toLowerCase().includes('vätternrundan');
  const defaultDate = editingCalculation
    ? new Date(editingCalculation.planned_start_time).toISOString().split('T')[0]
    : isVatternrundan
    ? '2026-06-12'
    : new Date().toISOString().split('T')[0];
  const defaultTime = editingCalculation
    ? new Date(editingCalculation.planned_start_time).toTimeString().slice(0, 5)
    : isVatternrundan
    ? '06:00'
    : '09:00';
  const defaultHours = editingCalculation
    ? String(Math.floor(editingCalculation.estimated_duration_seconds / 3600))
    : isVatternrundan
    ? '10'
    : '2';
  const defaultMinutes = editingCalculation
    ? String(Math.floor((editingCalculation.estimated_duration_seconds % 3600) / 60))
    : isVatternrundan
    ? '0'
    : '30';
  const defaultStopHours = editingCalculation?.planned_stop_duration_seconds
    ? String(Math.floor(editingCalculation.planned_stop_duration_seconds / 3600))
    : '0';
  const defaultStopMinutes = editingCalculation?.planned_stop_duration_seconds
    ? String(Math.floor((editingCalculation.planned_stop_duration_seconds % 3600) / 60))
    : '0';
  const defaultLabel = editingCalculation?.label || '';

  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [estimatedHours, setEstimatedHours] = useState(defaultHours);
  const [estimatedMinutes, setEstimatedMinutes] = useState(defaultMinutes);
  const [stopHours, setStopHours] = useState(defaultStopHours);
  const [stopMinutes, setStopMinutes] = useState(defaultStopMinutes);
  const [result, setResult] = useState<{
    finishTime: Date;
    requiredSpeedKmh: number;
  } | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const durationSeconds =
      parseInt(estimatedHours) * 3600 + parseInt(estimatedMinutes) * 60;

    const stopDurationSeconds =
      parseInt(stopHours) * 3600 + parseInt(stopMinutes) * 60;

    const calculationResult = calculateRace({
      distanceKm: race.distance_km,
      startTime: startDateTime,
      estimatedDurationSeconds: durationSeconds,
      plannedStopDurationSeconds: stopDurationSeconds,
    });

    setResult(calculationResult);
    onCalculate?.(calculationResult);

    // Save or update calculation in database
    const { supabase } = await import('@/lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const calculationData = {
        race_id: race.id,
        user_id: user.id,
        label: label || `Plan ${new Date().toLocaleDateString()}`,
        planned_start_time: startDateTime.toISOString(),
        estimated_duration_seconds: durationSeconds,
        planned_stop_duration_seconds: stopDurationSeconds,
        calculated_finish_time: calculationResult.finishTime.toISOString(),
        required_speed_kmh: calculationResult.requiredSpeedKmh,
      };

      if (editingCalculation) {
        // Update existing calculation
        await supabase
          .from('race_calculations')
          .update(calculationData)
          .eq('id', editingCalculation.id);
      } else {
        // Insert new calculation
        await supabase.from('race_calculations').insert(calculationData);
      }

      onSaved?.();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">{race.name}</h2>
      <p className="text-gray-600 mb-6">
        {t('distance')}: <span className="font-semibold">{race.distance_km} km</span>
      </p>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label
            htmlFor="label"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t('planLabel')}
          </label>
          <input
            id="label"
            type="text"
            placeholder={t('planLabelPlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t('startDate')}
          </label>
          <input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t('startTime')}
          </label>
          <input
            id="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('duration')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hours" className="block text-xs text-gray-500">
                {t('hours')}
              </label>
              <input
                id="hours"
                type="number"
                min="0"
                max="24"
                required
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="minutes" className="block text-xs text-gray-500">
                {t('minutes')}
              </label>
              <input
                id="minutes"
                type="number"
                min="0"
                max="59"
                required
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('plannedStopTime')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stopHours" className="block text-xs text-gray-500">
                {t('hours')}
              </label>
              <input
                id="stopHours"
                type="number"
                min="0"
                max="24"
                value={stopHours}
                onChange={(e) => setStopHours(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="stopMinutes" className="block text-xs text-gray-500">
                {t('minutes')}
              </label>
              <input
                id="stopMinutes"
                type="number"
                min="0"
                max="59"
                value={stopMinutes}
                onChange={(e) => setStopMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          {editingCalculation ? t('updatePlan') : t('calculate')}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h3 className="font-semibold text-lg mb-3 text-gray-900">
            {t('results')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">{t('finishTime')}</span>
              <span className="font-semibold text-gray-900">
                {result.finishTime.toLocaleTimeString(locale === 'sv' ? 'sv-SE' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: locale !== 'sv',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">{t('requiredSpeed')}</span>
              <span className="font-semibold text-gray-900">
                {result.requiredSpeedKmh} km/h
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
