'use client';

import { useTranslations } from 'next-intl';
import { useWizard } from './WizardContext';
import { CheckIcon } from '@heroicons/react/24/solid';

export default function WizardStepIndicator() {
  const t = useTranslations('wizard');
  const { state, goToStep, canGoToStep, isStepComplete } = useWizard();
  const { currentStep } = state;

  const steps = [
    { number: 1, label: t('selectRace'), shortLabel: t('selectRaceShort') },
    { number: 2, label: t('planTime'), shortLabel: t('planTimeShort') },
    { number: 3, label: t('feedZones'), shortLabel: t('feedZonesShort') },
    { number: 4, label: t('review'), shortLabel: t('reviewShort') },
    {
      number: 5,
      label: state.isEditing ? t('updatePlan') : t('savePlan'),
      shortLabel: state.isEditing ? t('updatePlan') : t('savePlanShort')
    },
  ];

  return (
    <>
      {/* Desktop Step Indicator */}
      <div className="hidden md:flex items-center justify-center space-x-2 lg:space-x-4">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isComplete = isStepComplete(step.number);
          const canNavigate = canGoToStep(step.number);

          return (
            <div key={step.number} className="flex items-center">
              {/* Step */}
              <button
                onClick={() => canNavigate && goToStep(step.number)}
                disabled={!canNavigate}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isComplete
                    ? 'bg-success-subtle text-success hover:opacity-80 cursor-pointer'
                    : canNavigate
                    ? 'bg-surface-2 text-text-secondary hover:bg-surface-3 cursor-pointer'
                    : 'bg-surface-1 text-text-muted cursor-not-allowed'
                }`}
              >
                {/* Step Number/Check */}
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                    isActive
                      ? 'bg-surface-background text-primary'
                      : isComplete
                      ? 'bg-success text-success-foreground'
                      : 'bg-surface-background text-text-muted'
                  }`}
                >
                  {isComplete && !isActive ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                {/* Step Label */}
                <span className="text-sm font-medium hidden lg:inline">
                  {step.label}
                </span>
                <span className="text-sm font-medium lg:hidden">
                  {step.shortLabel}
                </span>
              </button>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="mx-1 lg:mx-2 text-text-muted">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        {/* Text indicator */}
        <div className="text-center mb-3">
          <p className="text-sm text-text-secondary">
            {t('stepXOfY', { current: currentStep, total: steps.length })}: <span className="font-semibold text-text-primary">{steps[currentStep - 1].label}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-2 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Mini step dots */}
        <div className="flex justify-center gap-2 mt-3">
          {steps.map((step) => {
            const isActive = step.number === currentStep;
            const isComplete = isStepComplete(step.number);

            return (
              <button
                key={step.number}
                onClick={() => canGoToStep(step.number) && goToStep(step.number)}
                disabled={!canGoToStep(step.number)}
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive
                    ? 'bg-primary w-6'
                    : isComplete
                    ? 'bg-success'
                    : 'bg-surface-3'
                }`}
                aria-label={`Go to step ${step.number}: ${step.label}`}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
