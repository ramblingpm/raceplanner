'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Race } from '@/types';
import { calculateRace } from '@/utils/calculations';
import { supabase } from '@/lib/supabase';
import { savePlanFeedZones, getPlanFeedZones } from '@/lib/feedZones';
import { trackWizardStepViewed, trackWizardStepCompleted, trackWizardRaceSelected, trackWizardCompleted } from '@/lib/analytics';

// Types
export interface WizardFeedZone {
  feed_zone_id: string;
  name: string;
  distance_from_start_km: number;
  planned_duration_seconds: number;
  planned_arrival_time?: string; // HH:MM format
  planned_departure_time?: string; // HH:MM format
}

export interface PlanData {
  label: string;
  startDate: string; // ISO format
  startTime: string; // HH:MM
  durationHours: number;
  durationMinutes: number;
  selectedFeedZones: WizardFeedZone[];
}

export interface CalculatedResults {
  finishTime: Date;
  requiredSpeedKmh: number;
}

export interface WizardState {
  currentStep: number;
  race: Race | null;
  planData: PlanData;
  calculatedResults: CalculatedResults | null;
  isEditing: boolean;
  editingCalculationId: string | null;
  wizardStartTime: number; // Timestamp in milliseconds
}

interface WizardContextType {
  state: WizardState;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateRace: (race: Race) => void;
  updatePlanData: (data: Partial<PlanData>) => void;
  calculateResults: () => void;
  savePlan: () => Promise<{ success: boolean; error?: string; calculationId?: string }>;
  resetWizard: (initialRace?: Race) => void;
  canGoToStep: (step: number) => boolean;
  isStepComplete: (step: number) => boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Helper function to get default plan data based on race
function getDefaultPlanData(race: Race | null): PlanData {
  const isVatternrundan = race?.name.toLowerCase().includes('vätternrundan');

  // Use race's start_date if available, otherwise leave empty
  const defaultDate = race?.start_date || '';

  return {
    label: '',
    startDate: defaultDate,
    startTime: isVatternrundan ? '06:00' : '09:00',
    durationHours: isVatternrundan ? 10 : 2,
    durationMinutes: isVatternrundan ? 0 : 30,
    selectedFeedZones: [],
  };
}

interface WizardProviderProps {
  children: ReactNode;
  initialRace?: Race;
  editingCalculation?: any;
}

export function WizardProvider({ children, initialRace, editingCalculation }: WizardProviderProps) {
  const [state, setState] = useState<WizardState>(() => {
    const isEditing = !!editingCalculation;
    const race = initialRace || editingCalculation?.races || null;

    // If editing, populate from existing calculation
    let planData: PlanData;
    if (editingCalculation) {
      const startDateTime = new Date(editingCalculation.planned_start_time);
      const durationSeconds = editingCalculation.estimated_duration_seconds;

      planData = {
        label: editingCalculation.label || '',
        startDate: startDateTime.toISOString().split('T')[0],
        startTime: `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`,
        durationHours: Math.floor(durationSeconds / 3600),
        durationMinutes: Math.floor((durationSeconds % 3600) / 60),
        selectedFeedZones: [], // Will be loaded separately
      };
    } else {
      planData = getDefaultPlanData(race);
    }

    return {
      currentStep: initialRace || editingCalculation ? 2 : 1, // Skip step 1 if race is provided or editing
      race,
      planData,
      calculatedResults: null,
      isEditing,
      editingCalculationId: editingCalculation?.id || null,
      wizardStartTime: Date.now(),
    };
  });

  // Load feed zones when editing
  useEffect(() => {
    if (editingCalculation?.id) {
      getPlanFeedZones(editingCalculation.id)
        .then((planFeedZones) => {
          const wizardFeedZones: WizardFeedZone[] = planFeedZones.map((pfz) => {
            // Extract time from ISO datetime string
            const extractTime = (isoDateTime?: string) => {
              if (!isoDateTime) return undefined;
              const date = new Date(isoDateTime);
              return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            };

            return {
              feed_zone_id: pfz.feed_zone_id,
              name: pfz.feed_zone?.name || '',
              distance_from_start_km: pfz.feed_zone?.distance_from_start_km || 0,
              planned_duration_seconds: pfz.planned_duration_seconds,
              planned_arrival_time: extractTime(pfz.planned_arrival_time),
              planned_departure_time: extractTime(pfz.planned_departure_time),
            };
          });

          setState(prev => ({
            ...prev,
            planData: {
              ...prev.planData,
              selectedFeedZones: wizardFeedZones,
            },
          }));
        })
        .catch((error) => {
          console.error('Error loading feed zones for editing:', error);
        });
    }
  }, [editingCalculation?.id]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) {
      setState(prev => ({ ...prev, currentStep: step }));
      trackWizardStepViewed(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, 5);
      trackWizardStepViewed(newStep);
      trackWizardStepCompleted(prev.currentStep);
      return {
        ...prev,
        currentStep: newStep
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.max(prev.currentStep - 1, 1);
      trackWizardStepViewed(newStep);
      return {
        ...prev,
        currentStep: newStep
      };
    });
  }, []);

  const updateRace = useCallback((race: Race) => {
    trackWizardRaceSelected(race.name, race.id);
    setState(prev => {
      const newPlanData = { ...prev.planData, ...getDefaultPlanData(race) };
      // Preserve label if it was already set
      if (prev.planData.label) {
        newPlanData.label = prev.planData.label;
      }
      return { ...prev, race, planData: newPlanData };
    });
  }, []);

  const updatePlanData = useCallback((data: Partial<PlanData>) => {
    setState(prev => ({
      ...prev,
      planData: { ...prev.planData, ...data }
    }));
  }, []);

  const calculateResults = useCallback(() => {
    if (!state.race) return;

    const { planData, race } = state;
    const startDateTime = new Date(planData.startDate);
    const [hours, minutes] = planData.startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const durationSeconds = planData.durationHours * 3600 + planData.durationMinutes * 60;

    // Calculate feed zone total time
    const feedZoneTotalSeconds = planData.selectedFeedZones.reduce(
      (sum, zone) => sum + zone.planned_duration_seconds,
      0
    );

    const totalStopSeconds = feedZoneTotalSeconds;

    try {
      const result = calculateRace({
        distanceKm: race.distance_km,
        startTime: startDateTime,
        estimatedDurationSeconds: durationSeconds,
        plannedStopDurationSeconds: totalStopSeconds
      });

      setState(prev => ({
        ...prev,
        calculatedResults: {
          finishTime: result.finishTime,
          requiredSpeedKmh: result.requiredSpeedKmh,
        },
      }));
    } catch (error) {
      console.error('Error calculating race:', error);
    }
  }, [state]);

  const savePlan = useCallback(async (): Promise<{ success: boolean; error?: string; calculationId?: string }> => {
    if (!state.race || !state.planData.label.trim()) {
      return { success: false, error: 'Race and plan label are required' };
    }

    // Calculate if not already done
    if (!state.calculatedResults) {
      calculateResults();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!state.calculatedResults) {
      return { success: false, error: 'Unable to calculate results' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const startDateTime = new Date(state.planData.startDate);
      const [hours, minutes] = state.planData.startTime.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      const durationSeconds = state.planData.durationHours * 3600 + state.planData.durationMinutes * 60;
      const feedZoneTotalSeconds = state.planData.selectedFeedZones.reduce(
        (sum, zone) => sum + zone.planned_duration_seconds,
        0
      );

      const calculationData = {
        race_id: state.race.id,
        user_id: user.id,
        label: state.planData.label,
        planned_start_time: startDateTime.toISOString(),
        estimated_duration_seconds: durationSeconds,
        planned_stop_duration_seconds: feedZoneTotalSeconds,
        calculated_finish_time: state.calculatedResults.finishTime.toISOString(),
        required_speed_kmh: state.calculatedResults.requiredSpeedKmh,
      };

      let calculationId = state.editingCalculationId;

      if (state.isEditing && state.editingCalculationId) {
        // Update existing calculation
        const { error } = await supabase
          .from('race_calculations')
          .update(calculationData)
          .eq('id', state.editingCalculationId);

        if (error) throw error;
      } else {
        // Insert new calculation
        const { data: newCalc, error } = await supabase
          .from('race_calculations')
          .insert(calculationData)
          .select()
          .single();

        if (error) throw error;
        if (newCalc) {
          calculationId = newCalc.id;
        }
      }

      // Save feed zones if any are selected
      if (calculationId && state.planData.selectedFeedZones.length > 0) {
        try {
          await savePlanFeedZones(
            calculationId,
            state.planData.selectedFeedZones.map(zone => ({
              feed_zone_id: zone.feed_zone_id,
              planned_duration_seconds: zone.planned_duration_seconds,
              planned_arrival_time: zone.planned_arrival_time,
              planned_departure_time: zone.planned_departure_time,
            }))
          );
        } catch (error) {
          console.error('Error saving feed zones:', error);
          // Don't fail the whole save if feed zones fail
        }
      }

      // Track wizard completion
      const totalTimeSeconds = Math.floor((Date.now() - state.wizardStartTime) / 1000);
      trackWizardCompleted(totalTimeSeconds, state.race.name);

      return { success: true, calculationId: calculationId ?? undefined };
    } catch (error) {
      console.error('Error saving plan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save plan'
      };
    }
  }, [state, calculateResults]);

  const resetWizard = useCallback((initialRace?: Race) => {
    setState({
      currentStep: initialRace ? 2 : 1,
      race: initialRace || null,
      planData: getDefaultPlanData(initialRace || null),
      calculatedResults: null,
      isEditing: false,
      editingCalculationId: null,
      wizardStartTime: Date.now(),
    });
  }, []);

  const canGoToStep = useCallback((step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return !!state.race; // Need race selected
    if (step === 3) return !!state.race; // Need race
    if (step === 4) return !!state.race; // Need race
    if (step === 5) return !!state.race && !!state.calculatedResults; // Need race and calculations
    return false;
  }, [state]);

  const isStepComplete = useCallback((step: number): boolean => {
    if (step === 1) return !!state.race;
    if (step === 2) return !!state.calculatedResults;
    if (step === 3) return true; // Optional step, always complete
    if (step === 4) return !!state.calculatedResults; // Review complete when results exist
    if (step === 5) return false; // Save step is never "complete" until saved
    return false;
  }, [state]);

  const value: WizardContextType = {
    state,
    goToStep,
    nextStep,
    prevStep,
    updateRace,
    updatePlanData,
    calculateResults,
    savePlan,
    resetWizard,
    canGoToStep,
    isStepComplete,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
