'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PageViewTracker from '@/components/PageViewTracker';
import WizardModal from '@/components/wizard/WizardModal';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  trackButtonClick,
} from '@/lib/analytics';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState<any>(null);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);

  useEffect(() => {
    fetchRaces();
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


  const handleSelectRace = (race: Race) => {
    trackButtonClick('select_race', 'dashboard', { race_name: race.name });
    router.push(`/${race.slug}`);
  };

  const handleOpenWizard = () => {
    setIsWizardOpen(true);
  };

  const handleWizardComplete = () => {
    // Navigate to My Plans page after saving
    router.push('/my-plans');
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
      <AuthenticatedLayout>
        <Header />
        <div className="min-h-screen bg-surface-1">
          <main className="px-4 sm:px-6 py-4 sm:py-6 md:py-8 mx-auto max-w-4xl">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-base sm:text-lg text-text-secondary">{t('loadingRaces')}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="bg-surface-background rounded-lg shadow-md p-6 sm:p-8 text-center border border-border">
              <p className="text-text-secondary">{t('noRaces')}</p>
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-2 sm:mb-4">
                  {t('welcome')} {tCommon('appName')}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-4 sm:mb-6">{t('welcomeSubtitle')}</p>

                {/* Create Plan Button */}
                <button
                  onClick={handleOpenWizard}
                  className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <PlusIcon className="w-5 h-5" />
                  {t('addPlan')}
                </button>
              </div>

              {/* Race Carousel */}
              <div className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-text-primary">
                  {t('availableRaces')}
                </h2>

                <div className="relative max-w-2xl mx-auto">
                  {/* Left Arrow - positioned inside card on mobile */}
                  {races.length > 1 && (
                    <button
                      onClick={handlePreviousRace}
                      className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-12 z-20 p-2 sm:p-3 bg-surface-background/90 sm:bg-surface-background border border-border rounded-full shadow-lg hover:bg-surface-1 transition-colors"
                      aria-label="Previous race"
                    >
                      <ChevronLeftIcon className="w-5 h-5 sm:w-8 sm:h-8 text-text-primary" />
                    </button>
                  )}

                  {/* Race Card */}
                  <div className="overflow-hidden rounded-lg">
                    <div
                      className="transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${currentRaceIndex * 100}%)` }}
                    >
                      <div className="flex">
                        {races.map((race) => (
                          <div
                            key={race.id}
                            className="w-full flex-shrink-0 px-0 sm:px-2"
                          >
                            <div
                              className="bg-surface-background rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-border tap-transparent"
                              onClick={() => handleSelectRace(race)}
                            >
                              {/* Map Header */}
                              <div className="relative h-48 xs:h-56 sm:h-64 overflow-hidden">
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
                                        <div className="text-4xl sm:text-5xl mb-1 sm:mb-2">🚴</div>
                                        <div className="text-base sm:text-lg font-semibold drop-shadow-lg">
                                          {race.distance_km} km
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                    <div className="text-center text-white">
                                      <div className="text-4xl sm:text-5xl mb-1 sm:mb-2">🚴</div>
                                      <div className="text-base sm:text-lg font-semibold">
                                        {race.distance_km} km
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4 sm:p-6 bg-surface-background">
                                <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-1 sm:mb-2">
                                  {race.name}
                                </h3>
                                <p className="text-sm sm:text-base text-text-secondary">
                                  {t('distance')}: {race.distance_km} km
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow - positioned inside card on mobile */}
                  {races.length > 1 && (
                    <button
                      onClick={handleNextRace}
                      className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-12 z-20 p-2 sm:p-3 bg-surface-background/90 sm:bg-surface-background border border-border rounded-full shadow-lg hover:bg-surface-1 transition-colors"
                      aria-label="Next race"
                    >
                      <ChevronRightIcon className="w-5 h-5 sm:w-8 sm:h-8 text-text-primary" />
                    </button>
                  )}

                  {/* Dots Indicator */}
                  {races.length > 1 && (
                    <div className="relative z-10 flex justify-center gap-2.5 mt-4 sm:mt-6">
                      {races.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentRaceIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === currentRaceIndex
                              ? 'bg-primary w-8'
                              : 'bg-border hover:bg-border-focus w-2.5'
                          }`}
                          aria-label={`Go to race ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center mt-6 sm:mt-8">
                  <p className="text-sm sm:text-base text-text-muted italic">{t('moreComingSoon')}</p>
                </div>
              </div>

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
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
