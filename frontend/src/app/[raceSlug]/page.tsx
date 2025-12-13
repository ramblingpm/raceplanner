'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import RaceCalculator from '@/components/RaceCalculator';
import Modal from '@/components/Modal';
import PageViewTracker from '@/components/PageViewTracker';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  trackRaceSelected,
  trackPlanCreated,
  trackPlanUpdated,
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
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function RacePage() {
  const params = useParams();
  const router = useRouter();
  const raceSlug = params.raceSlug as string;
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
            distance_km
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
    setCalculationResult(null);
    setPlanDetails(null);
    setIsModalOpen(true);
    trackAddPlanModalOpened(savedCalculations.length === 0 ? 'empty_state' : 'race_page_header');
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
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">{t('loadingRaces')}</div>
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
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              trackButtonClick('back_to_dashboard', 'race_page', { race_name: race?.name });
              router.push('/dashboard');
            }}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
          >
            ← {t('backToRaces')}
          </button>

          {/* Header with Add Plan Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('title')}</h2>
            <button
              onClick={handleAddPlan}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              {t('addPlan')}
            </button>
          </div>

          {/* Race Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {race.name}
            </h3>
            <p className="text-gray-600">
              {t('distance')}: {race.distance_km} km
            </p>
          </div>

          {/* "My Plans" Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              {t('myPlans')}
            </h3>

            {savedCalculations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">{t('noPlans')}</p>
                <button
                  onClick={handleAddPlan}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
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
                    <div key={calc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-bold text-gray-900 text-base">
                          {calc.label || t('untitledPlan')}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">{calc.races?.name}</p>
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('startTime')}</p>
                            <p className="text-xl font-bold text-gray-900">
                              {new Date(calc.planned_start_time).toTimeString().slice(0, 5)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.floor(calc.estimated_duration_seconds / 3600)}h {Math.floor((calc.estimated_duration_seconds % 3600) / 60)}m duration
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">{t('avgSpeed')}</p>
                            <p className="text-2xl font-bold text-primary-600">{calc.required_speed_kmh}</p>
                            <p className="text-xs text-gray-500">km/h</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleEdit(calc)}
                          className="group relative p-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title={tCommon('edit')}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleCopy(calc)}
                          className="group relative p-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          title={tCommon('copy')}
                        >
                          <DocumentDuplicateIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(calc.id)}
                          className="group relative p-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          title={tCommon('delete')}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('planName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('race')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('startTime')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('duration')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('finishTime')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('avgSpeed')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {savedCalculations.map((calc) => (
                        <tr key={calc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {calc.label || t('untitledPlan')}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {calc.races?.name}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(calc.planned_start_time)
                              .toISOString()
                              .slice(0, 10)}{' '}
                            {new Date(calc.planned_start_time)
                              .toTimeString()
                              .slice(0, 5)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(calc.estimated_duration_seconds / 3600)}h{' '}
                            {Math.floor(
                              (calc.estimated_duration_seconds % 3600) / 60
                            )}
                            m
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(calc.calculated_finish_time)
                              .toTimeString()
                              .slice(0, 5)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {calc.required_speed_kmh} km/h
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(calc)}
                                className="group relative p-2 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                title={tCommon('edit')}
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleCopy(calc)}
                                className="group relative p-2 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                title={tCommon('copy')}
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(calc.id)}
                                className="group relative p-2 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
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
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    {tMap('title')}
                  </h3>

                  {race.route_geometry?.coordinates ? (
                    <RaceMap
                      routeCoordinates={
                        race.route_geometry.coordinates as number[][]
                      }
                      selectedFeedZones={feedZonesForMap as any}
                    />
                  ) : (
                    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">{tMap('noRouteData')}</p>
                    </div>
                  )}
                </div>

                {/* Results Section */}
                {calculationResult && planDetails && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-center mb-4 pb-3 border-b border-gray-300">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {planDetails.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {race.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {race.distance_km} km
                      </p>
                    </div>

                    <div className="space-y-0">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{t('startTime')}</span>
                        <span className="text-sm font-medium text-gray-900">
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

                      <div className="flex justify-between items-center py-1.5 border-b border-primary-200 bg-primary-50/30">
                        <span className="text-sm text-gray-700">{tCalculator('finishTime')}</span>
                        <span className="text-sm font-bold text-primary-600">
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

                      <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{t('duration')}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.floor(planDetails.durationSeconds / 3600)}h{' '}
                          {Math.floor((planDetails.durationSeconds % 3600) / 60)}m
                        </span>
                      </div>

                      {planDetails.stopDurationSeconds > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="text-sm text-gray-600">{t('stopTime')}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.floor(planDetails.stopDurationSeconds / 3600)}h{' '}
                            {Math.floor((planDetails.stopDurationSeconds % 3600) / 60)}m
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1.5 mt-1 border-b border-green-200 bg-green-50/30">
                        <span className="text-sm text-gray-700">{tCalculator('requiredSpeed')}</span>
                        <span className="text-sm font-bold text-green-600">
                          {calculationResult.requiredSpeedKmh} km/h
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                      <p className="text-xs text-gray-400">
                        Planned with {tCommon('appName')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </ProtectedRoute>
  );
}
