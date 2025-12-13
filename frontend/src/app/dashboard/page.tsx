'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import WizardModal from '@/components/wizard/WizardModal';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { DocumentDuplicateIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  trackPlanCopied,
  trackPlanDeleted,
  trackAddPlanModalOpened,
  trackButtonClick,
} from '@/lib/analytics';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    fetchRaces();
    fetchSavedCalculations();
  }, []);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRaces(data || []);
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
            slug,
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
    trackAddPlanModalOpened('edit_existing_plan');
    // Navigate to the race page with the calculation
    const raceSlug = calculation.races?.slug;
    if (raceSlug) {
      router.push(`/${raceSlug}`);
    }
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

  const handleSelectRace = (race: Race) => {
    trackButtonClick('select_race', 'dashboard', { race_name: race.name });
    router.push(`/${race.slug}`);
  };

  const handleOpenWizard = () => {
    setIsWizardOpen(true);
  };

  const handleWizardComplete = () => {
    // Refresh saved calculations
    fetchSavedCalculations();
  };

  return (
    <ProtectedRoute>
      <PageViewTracker pageName="Dashboard" />
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
          ) : (
            <>
              {/* Welcome Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {t('welcome')} {tCommon('appName')}
                </h1>
                <p className="text-xl text-gray-600 mb-6">{t('welcomeSubtitle')}</p>

                {/* Create Plan Button */}
                <button
                  onClick={handleOpenWizard}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create New Plan
                </button>
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('actions')}
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
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(calc);
                                  }}
                                  className="group relative p-2 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                  title={tCommon('copy')}
                                >
                                  <DocumentDuplicateIcon className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(calc.id);
                                  }}
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
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Wizard Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </ProtectedRoute>
  );
}
