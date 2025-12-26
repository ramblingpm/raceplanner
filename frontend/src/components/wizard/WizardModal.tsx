'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { WizardProvider, useWizard } from './WizardContext';
import WizardStepIndicator from './WizardStepIndicator';
import RaceSelectionStep from './steps/RaceSelectionStep';
import PlanTimeStep from './steps/PlanTimeStep';
import FeedZonesStep from './steps/FeedZonesStep';
import ReviewStep from './steps/ReviewStep';
import SaveStep from './steps/SaveStep';
import { Race } from '@/types';
import { trackWizardOpened, trackWizardAbandoned } from '@/lib/analytics';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (calculationId: string) => void;
  initialRace?: Race;
  editingCalculation?: any;
}

function WizardContent({ onClose, onComplete }: { onClose: () => void; onComplete?: (calculationId: string) => void }) {
  const t = useTranslations('wizard');
  const { state, prevStep, resetWizard } = useWizard();
  const { currentStep } = state;
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Handle close with confirmation if data exists
  const handleClose = () => {
    const hasData = state.race !== null || state.planData.label.trim().length > 0;

    if (hasData && !showConfirmClose) {
      setShowConfirmClose(true);
    } else {
      resetWizard();
      setShowConfirmClose(false);
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    // Track abandonment
    trackWizardAbandoned(currentStep, 'cancelled');
    resetWizard();
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowConfirmClose(false);
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RaceSelectionStep />;
      case 2:
        return <PlanTimeStep />;
      case 3:
        return <FeedZonesStep />;
      case 4:
        return <ReviewStep />;
      case 5:
        return <SaveStep onClose={onClose} onComplete={onComplete} />;
      default:
        return <RaceSelectionStep />;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-surface-background">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              {/* Back/Close button */}
              <button
                onClick={currentStep > 1 ? prevStep : handleClose}
                className="p-2 hover:bg-surface-1 rounded-lg transition-colors"
                aria-label={currentStep > 1 ? 'Go back' : 'Close wizard'}
              >
                {currentStep > 1 ? (
                  <ArrowLeftIcon className="w-6 h-6 text-text-secondary" />
                ) : (
                  <XMarkIcon className="w-6 h-6 text-text-secondary" />
                )}
              </button>

              {/* Title - Desktop */}
              <h2 className="hidden md:block text-xl font-semibold text-text-primary">
                {state.isEditing ? t('editPlan') : t('createPlan')}
              </h2>

              {/* Close button - Desktop only */}
              <button
                onClick={handleClose}
                className="hidden md:block p-2 hover:bg-surface-1 rounded-lg transition-colors"
                aria-label="Close wizard"
              >
                <XMarkIcon className="w-6 h-6 text-text-secondary" />
              </button>

              {/* Spacer for mobile */}
              <div className="md:hidden w-6" />
            </div>

            {/* Step Indicator */}
            <div className="mt-4">
              <WizardStepIndicator />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto bg-surface-1">
          {renderStep()}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-surface-background rounded-lg shadow-xl max-w-sm w-full p-6 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {t('discardChangesTitle')}
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {t('discardChangesMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDiscard}
                className="flex-1 px-4 py-2 bg-surface-2 text-text-secondary rounded-lg hover:bg-surface-3 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 px-4 py-2 bg-error text-error-foreground rounded-lg hover:opacity-90 transition-colors font-medium"
              >
                {t('discard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function WizardModal({ isOpen, onClose, onComplete, initialRace, editingCalculation }: WizardModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Track wizard opened
      trackWizardOpened(initialRace ? 'race_page' : 'dashboard');

      // Prevent scroll on body when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialRace]);

  if (!isOpen) return null;

  return (
    <WizardProvider initialRace={initialRace} editingCalculation={editingCalculation}>
      {/* Mobile: Full-screen */}
      <div className="md:hidden fixed inset-0 z-[60] bg-surface-background">
        <WizardContent onClose={onClose} onComplete={onComplete} />
      </div>

      {/* Desktop: Centered modal with backdrop */}
      <div className="hidden md:block">
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[55] bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-surface-background rounded-lg shadow-2xl h-[80vh] flex flex-col border border-border">
              <WizardContent onClose={onClose} onComplete={onComplete} />
            </div>
          </div>
        </div>
      </div>
    </WizardProvider>
  );
}
