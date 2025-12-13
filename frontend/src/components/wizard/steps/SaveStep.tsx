'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';

interface SaveStepProps {
  onClose: () => void;
  onComplete?: (calculationId: string) => void;
}

export default function SaveStep({ onClose, onComplete }: SaveStepProps) {
  const { state, updatePlanData, savePlan } = useWizard();
  const { planData } = state;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!planData.label.trim()) {
      setError('Please enter a plan name');
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
      setError(result.error || 'Failed to save plan');
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Save Your Plan
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Give your plan a memorable name
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Plan Label */}
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="label"
            value={planData.label}
            onChange={(e) => {
              updatePlanData({ label: e.target.value });
              setError(null);
            }}
            placeholder="e.g., My First Vätternrundan"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-gray-900 bg-white"
            required
            autoFocus
            disabled={saving}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Summary Info */}
        {state.race && state.calculatedResults && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Plan Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Race: <span className="font-medium text-gray-900">{state.race.name}</span></p>
              <p>Start: <span className="font-medium text-gray-900">
                {new Date(planData.startDate).toLocaleDateString()} at {planData.startTime}
              </span></p>
              <p>Duration: <span className="font-medium text-gray-900">
                {planData.durationHours}h {planData.durationMinutes}m
              </span></p>
              {planData.selectedFeedZones.length > 0 && (
                <p>Planned break: <span className="font-medium text-gray-900">
                  {Math.floor(planData.selectedFeedZones.reduce((sum, z) => sum + z.planned_duration_seconds, 0) / 60)} minutes
                </span></p>
              )}
              <p>Planned finish: <span className="font-medium text-gray-900">
                {state.calculatedResults.finishTime.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span></p>
              <p>Required Pace: <span className="font-medium text-gray-900">
                {state.calculatedResults.requiredSpeedKmh.toFixed(1)} km/h
              </span></p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 mt-6 space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || !planData.label.trim()}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            saving || !planData.label.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {saving ? 'Saving...' : state.isEditing ? 'Update Plan' : 'Save Plan'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
