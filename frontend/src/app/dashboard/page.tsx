'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import WizardModal from '@/components/wizard/WizardModal';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { DocumentDuplicateIcon, TrashIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Dynamically import RaceMap with no SSR
const RaceMap = dynamic(() => import('@/components/RaceMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-surface-1 flex items-center justify-center">
      <p className="text-text-muted">Loading map...</p>
    </div>
  ),
});
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
  const [editingCalculation, setEditingCalculation] = useState<any>(null);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);

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
            distance_km,
            start_date,
            end_date
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
    setEditingCalculation(calculation);
    setIsWizardOpen(true);
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
    setEditingCalculation(null);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setEditingCalculation(null);
  };

  const handlePreviousRace = () => {
    setCurrentRaceIndex((prev) => (prev === 0 ? races.length - 1 : prev - 1));
  };

  const handleNextRace = () => {
    setCurrentRaceIndex((prev) => (prev === races.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentRaceIndex((prev) => (prev === 0 ? races.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentRaceIndex((prev) => (prev === races.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [races.length]);

  return (
    <ProtectedRoute>
      <PageViewTracker pageName="Dashboard" />
      <div className="min-h-screen bg-surface-1">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-text-secondary">{t('loadingRaces')}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="bg-surface-background rounded-lg shadow-md p-8 text-center border border-border">
              <p className="text-text-secondary">{t('noRaces')}</p>
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                  {t('welcome')} {tCommon('appName')}
                </h1>
                <p className="text-xl text-text-secondary mb-6">{t('welcomeSubtitle')}</p>

                {/* Create Plan Button */}
                <button
                  onClick={handleOpenWizard}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  {t('addPlan')}
                </button>
              </div>

              {/* Race Carousel */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-text-primary">
                  {t('availableRaces')}
                </h2>

                <div className="relative max-w-2xl mx-auto">
                  {/* Left Arrow */}
                  {races.length > 1 && (
                    <button
                      onClick={handlePreviousRace}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 z-20 p-2 sm:p-3 bg-surface-background border border-border rounded-full shadow-lg hover:bg-surface-1 transition-colors"
                      aria-label="Previous race"
                    >
                      <ChevronLeftIcon className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" />
                    </button>
                  )}

                  {/* Race Card */}
                  <div className="overflow-hidden">
                    <div
                      className="transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${currentRaceIndex * 100}%)` }}
                    >
                      <div className="flex">
                        {races.map((race) => (
                          <div
                            key={race.id}
                            className="w-full flex-shrink-0 px-2"
                          >
                            <div
                              className="bg-surface-background rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-border"
                              onClick={() => handleSelectRace(race)}
                            >
                              {/* Map Header */}
                              <div className="relative h-64 overflow-hidden">
                                {race.route_geometry?.coordinates ? (
                                  <>
                                    <div className="absolute inset-0">
                                      <RaceMap
                                        routeCoordinates={race.route_geometry.coordinates as number[][]}
                                        interactive={false}
                                      />
                                    </div>
                                    {/* Overlay with bike icon and distance */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center pointer-events-none">
                                      <div className="text-center text-white">
                                        <div className="text-5xl mb-2">🚴</div>
                                        <div className="text-lg font-semibold drop-shadow-lg">
                                          {race.distance_km} km
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                    <div className="text-center text-white">
                                      <div className="text-5xl mb-2">🚴</div>
                                      <div className="text-lg font-semibold">
                                        {race.distance_km} km
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-6 bg-surface-background">
                                <h3 className="text-xl font-bold text-text-primary mb-2">
                                  {race.name}
                                </h3>
                                <p className="text-text-secondary mb-4">
                                  {t('distance')}: {race.distance_km} km
                                </p>

                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  {races.length > 1 && (
                    <button
                      onClick={handleNextRace}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 z-20 p-2 sm:p-3 bg-surface-background border border-border rounded-full shadow-lg hover:bg-surface-1 transition-colors"
                      aria-label="Next race"
                    >
                      <ChevronRightIcon className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" />
                    </button>
                  )}

                  {/* Dots Indicator */}
                  {races.length > 1 && (
                    <div className="relative z-10 flex justify-center gap-2 mt-6">
                      {races.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentRaceIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentRaceIndex
                              ? 'bg-primary w-8'
                              : 'bg-border hover:bg-border-focus'
                          }`}
                          aria-label={`Go to race ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center mt-8">
                  <p className="text-text-muted italic">{t('moreComingSoon')}</p>
                </div>
              </div>

              {/* Saved Plans Section */}
              {savedCalculations.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-6 text-text-primary">
                    {t('myRecentPlans')}
                  </h2>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {savedCalculations.slice(0, 3).map((calc) => (
                      <div
                        key={calc.id}
                        className="bg-surface-background rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-border"
                        onClick={() => handleEdit(calc)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-text-primary">
                            {calc.label || t('untitledPlan')}
                          </h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('race')}:</span>
                            <span className="font-medium text-text-primary">
                              {calc.races?.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('startTime')}:</span>
                            <span className="text-text-primary">
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
                  <div className="hidden md:block bg-surface-background rounded-lg shadow-md overflow-hidden border border-border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-surface-1">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('planName')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('race')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('startTime')}
                            </th>
                            <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('duration')}
                            </th>
                            <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('finishTime')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('avgSpeed')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                              {t('actions')}
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-surface-background divide-y divide-border">
                          {savedCalculations.slice(0, 5).map((calc) => {
                            const startTime = new Date(calc.planned_start_time);
                            const finishTime = new Date(calc.calculated_finish_time);
                            const durationHours = Math.floor(calc.estimated_duration_seconds / 3600);
                            const durationMinutes = Math.floor((calc.estimated_duration_seconds % 3600) / 60);

                            return (
                              <tr
                                key={calc.id}
                                className="hover:bg-surface-1 cursor-pointer"
                                onClick={() => handleEdit(calc)}
                              >
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                  <div className="max-w-[150px] overflow-hidden text-ellipsis" title={calc.label || t('untitledPlan')}>
                                    {calc.label || t('untitledPlan')}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  <div className="max-w-[120px] overflow-hidden text-ellipsis" title={calc.races?.name}>
                                    {calc.races?.name}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {startTime.toISOString().slice(0, 10)}{' '}
                                  {startTime.toTimeString().slice(0, 5)}
                                </td>
                                <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {durationHours}h {durationMinutes}m
                                </td>
                                <td className="hidden xl:table-cell px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {finishTime.toTimeString().slice(0, 5)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {calc.required_speed_kmh.toFixed(2)} km/h
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(calc);
                                      }}
                                      className="group relative p-2 rounded-md text-success bg-success-subtle hover:bg-success-subtle-hover transition-colors"
                                      title={tCommon('copy')}
                                    >
                                      <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(calc.id);
                                      }}
                                      className="group relative p-2 rounded-md text-error bg-error-subtle hover:bg-error-subtle-hover transition-colors"
                                      title={tCommon('delete')}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
        editingCalculation={editingCalculation}
      />
    </ProtectedRoute>
  );
}
