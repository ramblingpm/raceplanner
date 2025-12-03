'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import RaceCalculator from '@/components/RaceCalculator';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [editingCalculation, setEditingCalculation] = useState<any>(null);
  const [showPlanning, setShowPlanning] = useState(false);
  const [selectedFeedZones, setSelectedFeedZones] = useState<any[]>([]);
  const [availableFeedZones, setAvailableFeedZones] = useState<any[]>([]);

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
    // Find and select the race
    const race = races.find((r) => r.id === calculation.race_id);
    if (race) {
      setSelectedRace(race);
      setShowPlanning(true);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    } catch (error) {
      console.error('Error copying calculation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await supabase.from('race_calculations').delete().eq('id', id);
      fetchSavedCalculations();
    } catch (error) {
      console.error('Error deleting calculation:', error);
    }
  };

  const handleSaved = async (isUpdate: boolean, calculationId?: string) => {
    await fetchSavedCalculations();

    // Only clear editing state if this was a new plan
    // Keep the plan open if it was an update
    if (!isUpdate) {
      setEditingCalculation(null);
    } else if (calculationId) {
      // Refresh the editing calculation data with the updated values
      const { data } = await supabase
        .from('race_calculations')
        .select(`
          *,
          races (
            id,
            name,
            distance_km
          )
        `)
        .eq('id', calculationId)
        .single();

      if (data) {
        setEditingCalculation(data);
      }
    }
  };

  const handleSelectRace = (race: Race) => {
    setSelectedRace(race);
    setShowPlanning(true);
    setEditingCalculation(null);
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

            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('title')}</h2>

            {/* Planning Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                {selectedRace && (
                  <>
                    {editingCalculation && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-blue-800">
                            <strong>{t('editing')}</strong> {editingCalculation.label}
                          </p>
                          <button
                            onClick={() => setEditingCalculation(null)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {tCommon('cancel')}
                          </button>
                        </div>
                      </div>
                    )}

                    <RaceCalculator
                      race={selectedRace}
                      editingCalculation={editingCalculation}
                      onSaved={handleSaved}
                      onFeedZonesChange={setSelectedFeedZones}
                    />
                  </>
                )}

                {races.length > 1 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">{t('otherRaces')}</h3>
                    <div className="space-y-2">
                      {races
                        .filter((r) => r.id !== selectedRace?.id)
                        .map((race) => (
                          <button
                            key={race.id}
                            onClick={() => setSelectedRace(race)}
                            className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium">{race.name}</div>
                            <div className="text-sm text-gray-600">
                              {race.distance_km} km
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Map) */}
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
            </div>
          </>
        )}

        {/* Saved Calculations Section (Below Planner) */}
        {showPlanning && savedCalculations.length > 0 && (
          <>
            {/* Show "My Recent Plans" only if there are more than 3 plans */}
            {savedCalculations.length > 3 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  {t('myRecentPlans')}
                </h3>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {savedCalculations.slice(0, 3).map((calc) => (
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

            {/* Desktop Table - Recent Plans */}
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
                  {savedCalculations.slice(0, 3).map((calc) => (
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
                        {calc.required_speed_kmh} km/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            )}

            {/* "My Plans" Section - Always show all plans when in planning mode */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('myPlans')}
              </h3>

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
            </div>
          </>
        )}
      </main>
    </div>
  </ProtectedRoute>
);

}
