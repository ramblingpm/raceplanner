'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import WizardModal from '@/components/wizard/WizardModal';
import PageViewTracker from '@/components/PageViewTracker';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import {
  trackRaceSelected,
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
  const raceSlug = params.raceSlug as string;
  const t = useTranslations('dashboard');
  const tMap = useTranslations('raceMap');
  const tElevation = useTranslations('elevationProfile');
  const locale = useLocale();

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    fetchRace();
  }, [raceSlug]);

  useEffect(() => {
    if (race) {
      // Track race page view
      trackRaceSelected(race.name, race.id);
    }
  }, [race]);

  const fetchRace = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('slug', raceSlug)
        .single();

      if (error) throw error;
      setRace(data);
    } catch (error) {
      console.error('Error fetching race:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = () => {
    setIsWizardOpen(true);
    trackButtonClick('create_plan', 'race_page', { race_name: race?.name });
  };

  const handleWizardComplete = () => {
    // Navigate to My Plans page after saving
    router.push('/my-plans');
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const formatDateRange = () => {
    if (!race?.start_date) return null;

    const startDate = new Date(race.start_date);
    const endDate = race.end_date ? new Date(race.end_date) : null;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const start = startDate.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US', options);
    const end = endDate ? endDate.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US', options) : null;

    return end && end !== start ? `${start} - ${end}` : start;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <Header />
          <div className="min-h-screen bg-surface-1">
            <main className="container mx-auto px-4 py-8">
              <div className="text-center py-12">
                <div className="text-lg text-text-secondary">Loading...</div>
              </div>
            </main>
          </div>
        </AuthenticatedLayout>
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
        <div className={`min-h-screen bg-surface-1 ${isWizardOpen ? 'hidden md:block md:invisible' : ''}`}>
          <main className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Back Button */}
            <button
              onClick={() => {
                trackButtonClick('back_to_available_races', 'race_page', { race_name: race.name });
                router.push('/available-races');
              }}
              className="mb-6 text-text-link hover:text-text-link-hover font-medium flex items-center gap-2"
            >
              ← {t('backToRaces')}
            </button>

            {/* Hero Section */}
            <div className="bg-surface-background rounded-lg shadow-md p-8 mb-8 border border-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                    {race.name}
                  </h1>
                  {formatDateRange() && (
                    <p className="text-text-secondary text-lg">{formatDateRange()}</p>
                  )}
                </div>
                <button
                  onClick={handleOpenWizard}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold whitespace-nowrap"
                >
                  {t('selectRace')}
                </button>
              </div>

              {/* Race Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-1 rounded-lg p-4 border border-border">
                  <p className="text-text-muted text-sm mb-1">{t('distance')}</p>
                  <p className="text-2xl font-bold text-text-primary">{race.distance_km} km</p>
                </div>
                {race.elevation_gain_m && (
                  <div className="bg-surface-1 rounded-lg p-4 border border-border">
                    <p className="text-text-muted text-sm mb-1">{tElevation('gain')}</p>
                    <p className="text-2xl font-bold text-text-primary">{race.elevation_gain_m} m</p>
                  </div>
                )}
                {race.elevation_loss_m && (
                  <div className="bg-surface-1 rounded-lg p-4 border border-border">
                    <p className="text-text-muted text-sm mb-1">{tElevation('loss')}</p>
                    <p className="text-2xl font-bold text-text-primary">{race.elevation_loss_m} m</p>
                  </div>
                )}
                {race.max_elevation_m && race.min_elevation_m && (
                  <div className="bg-surface-1 rounded-lg p-4 border border-border">
                    <p className="text-text-muted text-sm mb-1">{tElevation('range')}</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {race.max_elevation_m - race.min_elevation_m} m
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Map Section */}
            {race.route_geometry?.coordinates && (
              <div className="bg-surface-background rounded-lg shadow-md p-6 mb-8 border border-border">
                <h2 className="text-2xl font-bold text-text-primary mb-4">{tMap('title')}</h2>
                <div className="h-96 rounded-lg overflow-hidden border border-border">
                  <RaceMap
                    routeCoordinates={race.route_geometry.coordinates as number[][]}
                    selectedFeedZones={[]}
                  />
                </div>
              </div>
            )}

            {/* Elevation Profile */}
            {race.elevation_data && race.elevation_data.length > 0 && (
              <div className="bg-surface-background rounded-lg shadow-md p-6 mb-8 border border-border">
                <h2 className="text-2xl font-bold text-text-primary mb-4">{tElevation('title')}</h2>
                <ElevationProfile
                  elevations={race.elevation_data}
                  totalDistanceKm={race.distance_km}
                  feedZones={[]}
                  height={300}
                />
              </div>
            )}

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary-subtle to-secondary-subtle rounded-lg p-8 border border-primary text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {t('ctaTitle')}
              </h2>
              <p className="text-text-secondary mb-6">
                {t('ctaDescription')}
              </p>
              <button
                onClick={handleOpenWizard}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary-hover transition-colors font-semibold text-lg"
              >
                {t('ctaButton')}
              </button>
            </div>
          </main>
        </div>

        {/* Wizard Modal */}
        <WizardModal
          isOpen={isWizardOpen}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
          initialRace={race}
        />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
