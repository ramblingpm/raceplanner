'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import RaceCalculator from '@/components/RaceCalculator';
import Modal from '@/components/Modal';
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

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tMap = useTranslations('raceMap');
  const tCommon = useTranslations('common');
  const tCalculator = useTranslations('raceCalculator');
  const locale = useLocale();
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [editingCalculation, setEditingCalculation] = useState<any>(null);
  const [showPlanning, setShowPlanning] = useState(false);
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
    fetchRaces();
    fetchSavedCalculations();
  }, []);

  // Load feed zones when race is selected
  useEffect(() => {
    async function loadFeedZones() {
      if (!selectedRace) {
        setAvailableFeedZones([]);
        return;
      }

      try {
        const { getFeedZonesByRace } = await import('@/lib/feedZones');
        const zones = await getFeedZonesByRace(selectedRace.id);
        setAvailableFeedZones(zones);
      } catch (error) {
        console.error('Error loading feed zones:', error);
      }
    }

    loadFeedZones();
  }, [selectedRace]);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRaces(data || []);
      if (data && data.length > 0) {
        setSelectedRace(data[0]);
      }
    } catch (error) {
      console.error('Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from('race_calculations')
        .select(`
          *,
          races (
            id,
            name,
            distance_km
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

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
    // Find and select the race
    const race = races.find((r) => r.id === calculation.race_id);
    if (race) {
      setSelectedRace(race);
      setShowPlanning(true);
    }
    // Open modal
    setIsModalOpen(true);

    // Track edit action
    trackAddPlanModalOpened('edit_existing_plan');
  };

  const handleAddPlan = () => {
    setEditingCalculation(null);
    setCalculationResult(null);
    setPlanDetails(null);
    setIsModalOpen(true);

    // Track modal opened
    trackAddPlanModalOpened(savedCalculations.length === 0 ? 'empty_state' : 'dashboard_header');
  };

  const handleCloseModal = () => {
    // Track modal cancellation if there's an unsaved edit
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

      // Track copy action
      trackPlanCopied(id, calculation.label);
    } catch (error) {
      console.error('Error copying calculation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    // Find the calculation to get its label for tracking
    const calculation = savedCalculations.find((calc) => calc.id === id);

    if (!confirm(t('confirmDelete'))) return;

    try {
      await supabase.from('race_calculations').delete().eq('id', id);
      fetchSavedCalculations();

      // Track delete action
      if (calculation) {
        trackPlanDeleted(id, calculation.label || 'Untitled Plan');
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
    }
  };

  const handleSaved = async (isUpdate: boolean, calculationId?: string) => {
    await fetchSavedCalculations();

    // Close modal after saving
    setIsModalOpen(false);
    setEditingCalculation(null);
  };

  const handleSelectRace = (race: Race) => {
    setSelectedRace(race);
    setShowPlanning(true);
    setEditingCalculation(null);

    // Track race selection
    trackRaceSelected(race.name, race.id);
  };

  const handleBackToRaces = () => {
    setShowPlanning(false);
    setSelectedRace(null);
    setEditingCalculation(null);
  };

  // Map selected feed zone IDs to full feed zone data for the map
  const feedZonesForMap = selectedFeedZones
    .map((selected) => {
      const feedZone = availableFeedZones.find((fz) => fz.id === selected.feed_zone_id);
      return feedZone;
    })
    .filter(Boolean);

  return (
  <ProtectedRoute>
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">{t('loadingRaces')}</div>
          </div>
        ) : races.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">{t('noRaces')}</p>
          </div>
        ) : !showPlanning ? (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('welcome')}{tCommon('appName')}
              </h1>
              <p className="text-xl text-gray-600">{t('welcomeSubtitle')}</p>
            </div>

            {/* Race Cards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {t('availableRaces')}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {races.map((race) => (
                  <div
                    key={race.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => handleSelectRace(race)}
                  >
                    <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-2">🚴</div>
                        <div className="text-xl font-semibold">
                          {race.distance_km} km
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {race.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Distance: {race.distance_km} km
                      </p>
                      <button
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRace(race);
                        }}
                      >
                        {t('selectRace')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-500 italic">{t('moreComingSoon')}</p>
              </div>
            </div>

            {/* Saved Plans Section */}
            {savedCalculations.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  {t('myRecentPlans')}
                </h2>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {savedCalculations.slice(0, 3).map((calc) => (
                    <div
                      key={calc.id}
                      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleEdit(calc)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {calc.label || t('untitledPlan')}
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('race')}:</span>
                          <span className="font-medium text-gray-900">
                            {calc.races?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('startTime')}:</span>
                          <span className="text-gray-900">
                            {new Date(calc.planned_start_time)
                              .toISOString()
                              .slice(0, 10)}{' '}
                            {new Date(calc.planned_start_time)
                              .toTimeString()
                              .slice(0, 5)}
                          </span>
                        </div>
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
                          {t('avgSpeed')}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {savedCalculations.slice(0, 5).map((calc) => (
                        <tr
                          key={calc.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEdit(calc)}
                        >
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
                            {calc.required_speed_kmh} km/h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={handleBackToRaces}
              className="mb-6 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
            >
              {t('backToRaces')}
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
            {selectedRace && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedRace.name}
                </h3>
                <p className="text-gray-600">
                  {t('distance')}: {selectedRace.distance_km} km
                </p>
              </div>
            )}
          </>
        )}

        {/* "My Plans" Section */}
        {showPlanning && (
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
                {/* Mobile Cards - All Plans */}
              <div className="md:hidden space-y-3">
                {savedCalculations.map((calc) => (
                  <div key={calc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-bold text-gray-900 text-base">
                        {calc.label || t('untitledPlan')}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">{calc.races?.name}</p>
                    </div>

                    {/* Content */}
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

                    {/* Actions */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex gap-1.5 justify-end">
                      <button
                        onClick={() => handleEdit(calc)}
                        className="group relative p-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title={tCommon('edit')}
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {tCommon('edit')}
                        </span>
                      </button>

                      <button
                        onClick={() => handleCopy(calc)}
                        className="group relative p-2 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        title={tCommon('copy')}
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {tCommon('copy')}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDelete(calc.id)}
                        className="group relative p-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        title={tCommon('delete')}
                      >
                        <TrashIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {tCommon('delete')}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table - All Plans */}
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
                              <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {tCommon('edit')}
                              </span>
                            </button>

                            <button
                              onClick={() => handleCopy(calc)}
                              className="group relative p-2 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                              title={tCommon('copy')}
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                              <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {tCommon('copy')}
                              </span>
                            </button>

                            <button
                              onClick={() => handleDelete(calc.id)}
                              className="group relative p-2 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                              title={tCommon('delete')}
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {tCommon('delete')}
                              </span>
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
        )}

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
              {selectedRace && (
                <RaceCalculator
                  race={selectedRace}
                  editingCalculation={editingCalculation}
                  onCalculate={(result, details) => {
                    setCalculationResult(result);
                    setPlanDetails(details);
                  }}
                  onSaved={handleSaved}
                  onCancel={handleCloseModal}
                  onFeedZonesChange={setSelectedFeedZones}
                />
              )}
            </div>

            {/* Right Column - Map and Results */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {tMap('title')}
                </h3>

                {selectedRace?.route_geometry?.coordinates ? (
                  <RaceMap
                    routeCoordinates={
                      selectedRace.route_geometry.coordinates as number[][]
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
              {calculationResult && planDetails && selectedRace && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  {/* Header */}
                  <div className="text-center mb-4 pb-3 border-b border-gray-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {planDetails.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedRace.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedRace.distance_km} km
                    </p>
                  </div>

                  {/* Main Results - Receipt Style */}
                  <div className="space-y-0">
                    {/* Start Time */}
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

                    {/* Finish Time */}
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

                    {/* Duration */}
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{t('duration')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(planDetails.durationSeconds / 3600)}h{' '}
                        {Math.floor((planDetails.durationSeconds % 3600) / 60)}m
                      </span>
                    </div>

                    {/* Stop Time */}
                    {planDetails.stopDurationSeconds > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{t('stopTime')}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.floor(planDetails.stopDurationSeconds / 3600)}h{' '}
                          {Math.floor((planDetails.stopDurationSeconds % 3600) / 60)}m
                        </span>
                      </div>
                    )}

                    {/* Required Speed */}
                    <div className="flex justify-between items-center py-1.5 mt-1 border-b border-green-200 bg-green-50/30">
                      <span className="text-sm text-gray-700">{tCalculator('requiredSpeed')}</span>
                      <span className="text-sm font-bold text-green-600">
                        {calculationResult.requiredSpeedKmh} km/h
                      </span>
                    </div>
                  </div>

                  {/* Footer - Branding */}
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
