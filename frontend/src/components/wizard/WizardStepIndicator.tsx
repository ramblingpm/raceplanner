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
    { number: 5, label: t('savePlan'), shortLabel: t('savePlanShort') },
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
                    ? 'bg-primary-600 text-white shadow-md'
                    : isComplete
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                    : canNavigate
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {/* Step Number/Check */}
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                    isActive
                      ? 'bg-white text-primary-600'
                      : isComplete
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-500'
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
                <div className="mx-1 lg:mx-2 text-gray-400">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        {/* Text indicator */}
        <div className="text-center mb-3">
          <p className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}: <span className="font-semibold text-gray-900">{steps[currentStep - 1].label}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
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
                    ? 'bg-primary-600 w-6'
                    : isComplete
                    ? 'bg-green-600'
                    : 'bg-gray-300'
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
