'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { calculateRace } from '@/utils/calculations';
import { Race, FeedZone } from '@/types';
import { getFeedZonesByRace, savePlanFeedZones, getPlanFeedZones, calculateTotalFeedZoneTime } from '@/lib/feedZones';
import FeedZoneSelector from './FeedZoneSelector';
import { trackPlanCreated, trackPlanUpdated } from '@/lib/analytics';

interface RaceCalculatorProps {
  race: Race;
  editingCalculation?: any; // For editing existing plans
  onCalculate?: (
    result: {
      finishTime: Date;
      requiredSpeedKmh: number;
    },
    planDetails: {
      label: string;
      startTime: Date;
      durationSeconds: number;
      stopDurationSeconds: number;
    }
  ) => void;
  onSaved?: (isUpdate: boolean, calculationId?: string) => void;
  onCancel?: () => void;
  onFeedZonesChange?: (feedZones: Array<{
    feed_zone_id: string;
    planned_duration_seconds: number;
    planned_arrival_time?: string;
    planned_departure_time?: string;
  }>) => void;
}

export default function RaceCalculator({
  race,
  editingCalculation,
  onCalculate,
  onSaved,
  onCancel,
  onFeedZonesChange,
}: RaceCalculatorProps) {
  const t = useTranslations('raceCalculator');
  const tCommon = useTranslations('common');
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

  // Feed zones state
  const [availableFeedZones, setAvailableFeedZones] = useState<FeedZone[]>([]);
  const [selectedFeedZones, setSelectedFeedZones] = useState<Array<{
    feed_zone_id: string;
    planned_duration_seconds: number;
    planned_arrival_time?: string;
    planned_departure_time?: string;
  }>>([]);

  // Update form fields when editingCalculation changes
  useEffect(() => {
    if (editingCalculation) {
      setLabel(editingCalculation.label || '');
      setStartDate(new Date(editingCalculation.planned_start_time).toISOString().split('T')[0]);
      setStartTime(new Date(editingCalculation.planned_start_time).toTimeString().slice(0, 5));
      setEstimatedHours(String(Math.floor(editingCalculation.estimated_duration_seconds / 3600)));
      setEstimatedMinutes(String(Math.floor((editingCalculation.estimated_duration_seconds % 3600) / 60)));
      setStopHours(editingCalculation.planned_stop_duration_seconds
        ? String(Math.floor(editingCalculation.planned_stop_duration_seconds / 3600))
        : '0');
      setStopMinutes(editingCalculation.planned_stop_duration_seconds
        ? String(Math.floor((editingCalculation.planned_stop_duration_seconds % 3600) / 60))
        : '0');
    }
  }, [editingCalculation]);

  // Load available feed zones for this race
  useEffect(() => {
    async function loadFeedZones() {
      try {
        const zones = await getFeedZonesByRace(race.id);
        setAvailableFeedZones(zones);

        // If editing, load existing feed zone selections
        if (editingCalculation?.id) {
          const planZones = await getPlanFeedZones(editingCalculation.id);
          const selected = planZones.map((pz) => ({
            feed_zone_id: pz.feed_zone_id,
            planned_duration_seconds: pz.planned_duration_seconds,
            planned_arrival_time: pz.planned_arrival_time,
            planned_departure_time: pz.planned_departure_time,
          }));
          setSelectedFeedZones(selected);
          onFeedZonesChange?.(selected);
        } else {
          setSelectedFeedZones([]);
          onFeedZonesChange?.([]);
        }
      } catch (error) {
        console.error('Error loading feed zones:', error);
      }
    }

    loadFeedZones();
  }, [race.id, editingCalculation?.id, onFeedZonesChange]);

  const handleCalculate = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate that a plan label is provided
    if (!label || label.trim() === '') {
      alert(t('planLabelRequired') || 'Please provide a plan label');
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const durationSeconds =
      parseInt(estimatedHours) * 3600 + parseInt(estimatedMinutes) * 60;

    const stopDurationSeconds =
      parseInt(stopHours) * 3600 + parseInt(stopMinutes) * 60;

    // Calculate total feed zone time and add to stop duration
    const feedZoneTimeSeconds = calculateTotalFeedZoneTime(selectedFeedZones);
    const totalStopDurationSeconds = stopDurationSeconds + feedZoneTimeSeconds;

    const calculationResult = calculateRace({
      distanceKm: race.distance_km,
      startTime: startDateTime,
      estimatedDurationSeconds: durationSeconds,
      plannedStopDurationSeconds: totalStopDurationSeconds,
    });

    setResult(calculationResult);

    const planDetails = {
      label,
      startTime: startDateTime,
      durationSeconds,
      stopDurationSeconds: totalStopDurationSeconds,
    };

    onCalculate?.(calculationResult, planDetails);
  };

  const handleSave = async () => {
    // Calculate first if no result
    if (!result) {
      handleCalculate();
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!result) return;

    // Validate that a plan label is provided
    if (!label || label.trim() === '') {
      alert(t('planLabelRequired') || 'Please provide a plan label');
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const durationSeconds =
      parseInt(estimatedHours) * 3600 + parseInt(estimatedMinutes) * 60;

    const stopDurationSeconds =
      parseInt(stopHours) * 3600 + parseInt(stopMinutes) * 60;

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
        calculated_finish_time: result.finishTime.toISOString(),
        required_speed_kmh: result.requiredSpeedKmh,
      };

      let calculationId = editingCalculation?.id;

      if (editingCalculation) {
        // Update existing calculation
        await supabase
          .from('race_calculations')
          .update(calculationData)
          .eq('id', editingCalculation.id);

        // Track plan update
        trackPlanUpdated(editingCalculation.id, calculationData.label);
      } else {
        // Insert new calculation and get the ID
        const { data: newCalc } = await supabase
          .from('race_calculations')
          .insert(calculationData)
          .select()
          .single();

        if (newCalc) {
          calculationId = newCalc.id;
        }

        // Track plan creation
        trackPlanCreated(
          race.name,
          calculationData.label,
          Math.round(durationSeconds / 60)
        );
      }

      // Save feed zones if calculation was created/updated
      if (calculationId && selectedFeedZones.length > 0) {
        try {
          await savePlanFeedZones(calculationId, selectedFeedZones);
        } catch (error) {
          console.error('Error saving feed zones:', error);
        }
      }

      const isUpdate = !!editingCalculation;
      onSaved?.(isUpdate, calculationId);
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
            {t('planLabel')} <span className="text-red-600">*</span>
          </label>
          <input
            id="label"
            type="text"
            required
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

        {/* Feed Zones Section */}
        {availableFeedZones.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <FeedZoneSelector
              raceId={race.id}
              raceName={race.name}
              availableFeedZones={availableFeedZones}
              selectedFeedZones={selectedFeedZones}
              onChange={(zones) => {
                setSelectedFeedZones(zones);
                onFeedZonesChange?.(zones);
              }}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {t('calculate')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!result}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {editingCalculation ? t('updatePlan') : tCommon('save')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              {tCommon('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
