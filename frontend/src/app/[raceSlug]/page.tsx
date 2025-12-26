'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import RaceCalculator from '@/components/RaceCalculator';
import Modal from '@/components/Modal';
import WizardModal from '@/components/wizard/WizardModal';
import PageViewTracker from '@/components/PageViewTracker';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  trackRaceSelected,
  trackPlanDeleted,
  trackPlanCopied,
  trackAddPlanModalOpened,
  trackModalCancelled,
  trackMapViewed,
  trackButtonClick,
} from '@/lib/analytics';

// Dynamically import RaceMap with no SSR to avoid Leaflet window errors
const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-surface-1 rounded-lg flex items-center justify-center">
      <p className="text-text-muted">Loading map...</p>
    </div>
  ),
});

// Dynamically import ElevationProfile
const ElevationProfile = dynamic(() => import('@/components/ElevationProfile'), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-surface-1 rounded-lg flex items-center justify-center">
      <p className="text-text-muted">Loading elevation profile...</p>
    </div>
  ),
});

export default function RacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raceSlug = params.raceSlug as string;
  const planId = searchParams.get('plan');
  const t = useTranslations('dashboard');
  const tMap = useTranslations('raceMap');
  const tCommon = useTranslations('common');
  const tCalculator = useTranslations('raceCalculator');
  const locale = useLocale();

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [editingCalculation, setEditingCalculation] = useState<any>(null);
  const [selectedFeedZones, setSelectedFeedZones] = useState<any[]>([]);
  const [availableFeedZones, setAvailableFeedZones] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    finishTime: Date;
    requiredSpeedKmh: number;
  } | null>(null);
  const [planDetails, setPlanDetails] = useState<{
    label: string;
    startTime: Date;
    durationSeconds: number;
    stopDurationSeconds: number;
  } | null>(null);

  useEffect(() => {
    fetchRace();
  }, [raceSlug]);

  useEffect(() => {
    if (race) {
      fetchSavedCalculations();
      loadFeedZones();

      // Track race page view
      trackRaceSelected(race.name, race.id);
    }
  }, [race]);

  // Auto-load plan from URL parameter
  useEffect(() => {
    if (planId && savedCalculations.length > 0) {
      const calculation = savedCalculations.find(calc => calc.id === planId);
      if (calculation) {
        handleEdit(calculation);
        // Clean up the URL
        router.replace(`/${raceSlug}`, { scroll: false });
      }
    }
  }, [planId, savedCalculations, raceSlug]);

  // Track when modal opens with map
  useEffect(() => {
    if (isModalOpen && race) {
      trackMapViewed(race.name);
    }
  }, [isModalOpen, race?.name]);

  const fetchRace = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('slug', raceSlug)
        .single();

      if (error) throw error;

      if (!data) {
        router.push('/dashboard');
        return;
      }

      setRace(data);
    } catch (error) {
      console.error('Error fetching race:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadFeedZones = async () => {
    if (!race) return;

    try {
      const { getFeedZonesByRace } = await import('@/lib/feedZones');
      const zones = await getFeedZonesByRace(race.id);
      setAvailableFeedZones(zones);
    } catch (error) {
      console.error('Error loading feed zones:', error);
    }
  };

  const fetchSavedCalculations = async () => {
    if (!race) return;

    try {
      const { data, error } = await supabase
        .from('race_calculations')
        .select(`
          *,
          races (
            id,
            name,
            slug,
            distance_km,
            start_date,
            end_date
          )
        `)
        .eq('race_id', race.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCalculations(data || []);
    } catch (error) {
      console.error('Error fetching calculations:', error);
    }
  };

  const handleEdit = (calculation: any) => {
    setEditingCalculation(calculation);
    setCalculationResult(null);
    setPlanDetails(null);
    setIsModalOpen(true);
    trackAddPlanModalOpened('edit_existing_plan');
  };

  const handleAddPlan = () => {
    setEditingCalculation(null);
    setIsWizardOpen(true);
    trackAddPlanModalOpened(savedCalculations.length === 0 ? 'empty_state' : 'race_page_header');
  };

  const handleWizardComplete = () => {
    // Refresh saved calculations
    fetchSavedCalculations();
  };

  const handleCloseModal = () => {
    if (editingCalculation) {
      trackModalCancelled('edit_plan');
    } else {
      trackModalCancelled('add_plan');
    }

    setIsModalOpen(false);
    setEditingCalculation(null);
    setCalculationResult(null);
    setPlanDetails(null);
  };

  const handleCopy = async (calculation: any) => {
    const { id, created_at, updated_at, ...calcData } = calculation;
    const newCalc = {
      ...calcData,
      label: `${calculation.label} (Copy)`,
    };

    try {
      await supabase.from('race_calculations').insert(newCalc);
      fetchSavedCalculations();
      trackPlanCopied(id, calculation.label);
    } catch (error) {
      console.error('Error copying calculation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const calculation = savedCalculations.find((calc) => calc.id === id);

    if (!confirm(t('confirmDelete'))) return;

    try {
      await supabase.from('race_calculations').delete().eq('id', id);
      fetchSavedCalculations();

      if (calculation) {
        trackPlanDeleted(id, calculation.label || 'Untitled Plan');
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
    }
  };

  const handleSaved = async () => {
    await fetchSavedCalculations();
    setIsModalOpen(false);
    setEditingCalculation(null);
  };

  const feedZonesForMap = selectedFeedZones
    .map((selected) => {
      const feedZone = availableFeedZones.find((fz) => fz.id === selected.feed_zone_id);
      return feedZone;
    })
    .filter(Boolean);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-surface-1">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="text-lg text-text-secondary">{t('loadingRaces')}</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!race) {
    return null;
  }

  return (
    <ProtectedRoute>
      <PageViewTracker pageName={`Race: ${race.name}`} />
      <AuthenticatedLayout>
        <Header />
        <div className="min-h-screen bg-surface-1">
          <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              trackButtonClick('back_to_dashboard', 'race_page', { race_name: race?.name });
              router.push('/dashboard');
            }}
            className="mb-6 text-text-link hover:text-text-link-hover font-medium flex items-center gap-2"
          >
            ← {t('backToRaces')}
          </button>

          {/* Header with Add Plan Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-text-primary">{t('title')}</h2>
            <button
              onClick={handleAddPlan}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              {t('addPlan')}
            </button>
          </div>

          {/* Race Info */}
          <div className="bg-surface-background rounded-lg shadow-md p-6 mb-6 border border-border">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {race.name}
            </h3>
            <p className="text-text-secondary">
              {t('distance')}: {race.distance_km} km
            </p>
          </div>

          {/* "My Plans" Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 text-text-primary">
              {t('myPlans')}
            </h3>

            {savedCalculations.length === 0 ? (
              <div className="bg-surface-background rounded-lg shadow-md p-8 text-center border border-border">
                <p className="text-text-secondary mb-4">{t('noPlans')}</p>
                <button
                  onClick={handleAddPlan}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  <PlusIcon className="w-5 h-5" />
                  {t('createFirstPlan')}
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {savedCalculations.map((calc) => (
                    <div key={calc.id} className="bg-surface-background rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-primary-subtle to-info-subtle px-4 py-3 border-b border-border">
                        <h4 className="font-bold text-text-primary text-base">
                          {calc.label || t('untitledPlan')}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">{calc.races?.name}</p>
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted mb-1">{t('startTime')}</p>
                            <p className="text-xl font-bold text-text-primary">
                              {new Date(calc.planned_start_time).toTimeString().slice(0, 5)}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              {Math.floor(calc.estimated_duration_seconds / 3600)}h {Math.floor((calc.estimated_duration_seconds % 3600) / 60)}m duration
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-text-muted mb-1">{t('avgSpeed')}</p>
                            <p className="text-2xl font-bold text-primary">{calc.required_speed_kmh}</p>
                            <p className="text-xs text-text-muted">km/h</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 bg-surface-1 border-t border-border flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleEdit(calc)}
                          className="group relative p-2 rounded-lg text-info bg-info-subtle hover:bg-info-subtle-hover transition-colors"
                          title={tCommon('edit')}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleCopy(calc)}
                          className="group relative p-2 rounded-lg text-success bg-success-subtle hover:bg-success-subtle-hover transition-colors"
                          title={tCommon('copy')}
                        >
                          <DocumentDuplicateIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(calc.id)}
                          className="group relative p-2 rounded-lg text-error bg-error-subtle hover:bg-error-subtle-hover transition-colors"
                          title={tCommon('delete')}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-surface-background rounded-lg shadow-md overflow-hidden border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface-1">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('planName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('race')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('startTime')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('duration')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('finishTime')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('avgSpeed')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-surface-background divide-y divide-border">
                      {savedCalculations.map((calc) => (
                        <tr key={calc.id} className="hover:bg-surface-1">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                            {calc.label || t('untitledPlan')}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {calc.races?.name}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {new Date(calc.planned_start_time)
                              .toISOString()
                              .slice(0, 10)}{' '}
                            {new Date(calc.planned_start_time)
                              .toTimeString()
                              .slice(0, 5)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {Math.floor(calc.estimated_duration_seconds / 3600)}h{' '}
                            {Math.floor(
                              (calc.estimated_duration_seconds % 3600) / 60
                            )}
                            m
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {new Date(calc.calculated_finish_time)
                              .toTimeString()
                              .slice(0, 5)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {calc.required_speed_kmh} km/h
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(calc)}
                                className="group relative p-2 rounded-md text-info bg-info-subtle hover:bg-info-subtle-hover transition-colors"
                                title={tCommon('edit')}
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleCopy(calc)}
                                className="group relative p-2 rounded-md text-success bg-success-subtle hover:bg-success-subtle-hover transition-colors"
                                title={tCommon('copy')}
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(calc.id)}
                                className="group relative p-2 rounded-md text-error bg-error-subtle hover:bg-error-subtle-hover transition-colors"
                                title={tCommon('delete')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Modal for Adding/Editing Plans */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingCalculation ? t('editPlan') : t('addPlan')}
            size="full"
          >
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div>
                <RaceCalculator
                  race={race}
                  editingCalculation={editingCalculation}
                  onCalculate={(result, details) => {
                    setCalculationResult(result);
                    setPlanDetails(details);
                  }}
                  onSaved={handleSaved}
                  onCancel={handleCloseModal}
                  onFeedZonesChange={setSelectedFeedZones}
                />
              </div>

              {/* Right Column - Map and Results */}
              <div className="space-y-6">
                <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border">
                  <h3 className="text-xl font-semibold mb-4 text-text-primary">
                    {tMap('title')}
                  </h3>

                  {race.route_geometry?.coordinates ? (
                    <div className="h-96">
                      <RaceMap
                        routeCoordinates={
                          race.route_geometry.coordinates as number[][]
                        }
                        selectedFeedZones={feedZonesForMap as any}
                      />
                    </div>
                  ) : (
                    <div className="h-96 bg-surface-1 rounded-lg flex items-center justify-center">
                      <p className="text-text-muted">{tMap('noRouteData')}</p>
                    </div>
                  )}
                </div>

                {/* Elevation Profile */}
                {race.elevation_data && race.elevation_data.length > 0 && (
                  <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border">
                    <ElevationProfile
                      elevations={race.elevation_data}
                      totalDistanceKm={race.distance_km}
                      feedZones={availableFeedZones
                        .filter((fz) => selectedFeedZones.some((sfz) => sfz.feed_zone_id === fz.id))
                        .map((fz) => ({
                          name: fz.name,
                          distance_from_start_km: fz.distance_from_start_km,
                        }))}
                      height={200}
                    />
                  </div>
                )}

                {/* Results Section */}
                {calculationResult && planDetails && (
                  <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
                    <div className="text-center mb-4 pb-3 border-b border-border">
                      <h3 className="text-xl font-bold text-text-primary mb-1">
                        {planDetails.label}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {race.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {race.distance_km} km
                      </p>
                    </div>

                    <div className="space-y-0">
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-sm text-text-secondary">{t('startTime')}</span>
                        <span className="text-sm font-medium text-text-primary">
                          {planDetails.startTime.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {planDetails.startTime.toLocaleTimeString(locale === 'sv' ? 'sv-SE' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: locale !== 'sv',
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-primary bg-primary-subtle/30">
                        <span className="text-sm text-text-secondary">{tCalculator('finishTime')}</span>
                        <span className="text-sm font-bold text-primary">
                          {calculationResult.finishTime.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {calculationResult.finishTime.toLocaleTimeString(locale === 'sv' ? 'sv-SE' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: locale !== 'sv',
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-sm text-text-secondary">{t('duration')}</span>
                        <span className="text-sm font-medium text-text-primary">
                          {Math.floor(planDetails.durationSeconds / 3600)}h{' '}
                          {Math.floor((planDetails.durationSeconds % 3600) / 60)}m
                        </span>
                      </div>

                      {planDetails.stopDurationSeconds > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-border">
                          <span className="text-sm text-text-secondary">{t('stopTime')}</span>
                          <span className="text-sm font-medium text-text-primary">
                            {Math.floor(planDetails.stopDurationSeconds / 3600)}h{' '}
                            {Math.floor((planDetails.stopDurationSeconds % 3600) / 60)}m
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1.5 mt-1 border-b border-success bg-success-subtle/30">
                        <span className="text-sm text-text-secondary">{tCalculator('requiredSpeed')}</span>
                        <span className="text-sm font-bold text-success">
                          {calculationResult.requiredSpeedKmh} km/h
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border text-center">
                      <p className="text-xs text-text-muted">
                        Planned with {tCommon('appName')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal>

          {/* Wizard Modal for New Plans */}
          <WizardModal
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onComplete={handleWizardComplete}
            initialRace={race || undefined}
          />
          </main>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
