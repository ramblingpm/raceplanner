'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWizard } from '../WizardContext';

interface SaveStepProps {
  onClose: () => void;
  onComplete?: (calculationId: string) => void;
}

export default function SaveStep({ onClose, onComplete }: SaveStepProps) {
  const t = useTranslations('wizard');
  const { state, updatePlanData, savePlan, calculateResults } = useWizard();
  const { planData } = state;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure calculations are up-to-date when entering save step
  useEffect(() => {
    calculateResults();
  }, []);

  const handleSave = async () => {
    if (!planData.label.trim()) {
      setError(t('planNameRequired'));
      return;
    }

    setSaving(true);
    setError(null);

    const result = await savePlan();

    if (result.success && result.calculationId) {
      // Success!
      if (onComplete) {
        onComplete(result.calculationId);
      }
      onClose();
    } else {
      setError(result.error || t('failedToSavePlan'));
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {state.isEditing ? t('updateYourPlan') : t('saveYourPlan')}
        </h2>
        <p className="text-sm sm:text-base text-text-secondary">
          {state.isEditing ? t('updatePlanName') : t('givePlanName')}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Plan Label */}
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-text-secondary mb-2">
            {t('planName')} <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="label"
            value={planData.label}
            onChange={(e) => {
              updatePlanData({ label: e.target.value });
              setError(null);
            }}
            placeholder={t('planNamePlaceholder')}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-base text-text-primary bg-surface-background"
            required
            autoFocus
            disabled={saving}
          />
          {error && (
            <p className="mt-2 text-sm text-error-foreground">{error}</p>
          )}
        </div>

        {/* Summary Info */}
        {state.race && state.calculatedResults && (
          <div className="bg-surface-1 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-medium text-text-secondary mb-2">{t('planSummary')}</h3>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>{t('raceLabel')} <span className="font-medium text-text-primary">{state.race.name}</span></p>
              <p>{t('startLabel')} <span className="font-medium text-text-primary">
                {new Date(planData.startDate).toLocaleDateString()} at {planData.startTime}
              </span></p>
              <p>{t('durationLabel')} <span className="font-medium text-text-primary">
                {planData.durationHours}h {planData.durationMinutes}m
              </span></p>
              {planData.selectedFeedZones.length > 0 && (
                <p>{t('plannedBreak')} <span className="font-medium text-text-primary">
                  {Math.floor(planData.selectedFeedZones.reduce((sum, z) => sum + z.planned_duration_seconds, 0) / 60)} {t('minutes')}
                </span></p>
              )}
              <p>{t('plannedFinish')} <span className="font-medium text-text-primary">
                {state.calculatedResults.finishTime.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span></p>
              <p>{t('requiredPaceValue')} <span className="font-medium text-text-primary">
                {state.calculatedResults.requiredSpeedKmh.toFixed(1)} km/h
              </span></p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-surface-background border-t border-border p-4 mt-6 space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || !planData.label.trim()}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-primary-foreground transition-colors ${
            saving || !planData.label.trim()
              ? 'bg-secondary opacity-50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-hover'
          }`}
        >
          {saving ? t('saving') : state.isEditing ? t('updatePlan') : t('savePlanButton')}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="w-full py-3 px-6 rounded-lg font-semibold bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors disabled:opacity-50"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
