'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PageViewTracker from '@/components/PageViewTracker';
import WizardModal from '@/components/wizard/WizardModal';
import RaceCard from '@/components/RaceCard';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { trackButtonClick } from '@/lib/analytics';
import { isAdmin as checkIsAdmin } from '@/lib/admin';

export default function AvailableRacesPage() {
  const t = useTranslations('availableRaces');
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      if (!user) {
        setIsAdmin(false);
        fetchRaces(false);
        return;
      }

      // Check if user is admin using the checkIsAdmin function from lib/admin
      const adminStatus = await checkIsAdmin(user.id);
      console.log('Admin status:', adminStatus);
      setIsAdmin(adminStatus);
      fetchRaces(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      fetchRaces(false);
    }
  };

  const fetchRaces = async (userIsAdmin: boolean = false) => {
    try {
      setError(null);
      console.log('Fetching all races (including coming soon)');

      // Fetch all races using public API endpoint (to show coming soon races)
      const response = await fetch('/api/races/all');

      console.log('API response status:', response.status);

      if (!response.ok) {
        console.error('API failed');
        throw new Error('Failed to fetch races');
      }

      const { races: allRaces } = await response.json();
      console.log('All races fetched:', allRaces?.length, 'races');
      console.log('Races:', allRaces);

      // Sort races: public races first, then private races (coming soon)
      const sortedRaces = (allRaces || []).sort((a: Race, b: Race) => {
        // If one is public and the other isn't, public comes first
        if (a.is_public && !b.is_public) return -1;
        if (!a.is_public && b.is_public) return 1;
        // Otherwise maintain created_at order (already sorted by API)
        return 0;
      });

      setRaces(sortedRaces);
    } catch (error) {
      console.error('Error fetching races:', error);
      setError(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRace = (race: Race) => {
    trackButtonClick('select_race', 'available_races', {
      race_name: race.name,
      race_id: race.id
    });
    setSelectedRace(race);
    setIsWizardOpen(true);
  };

  const handleViewDetails = (race: Race) => {
    trackButtonClick('view_race_details', 'available_races', {
      race_name: race.name,
      race_id: race.id
    });
    router.push(`/${race.slug}`);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedRace(null);
  };

  const handleWizardComplete = () => {
    setIsWizardOpen(false);
    setSelectedRace(null);
    // Navigate to My Plans page after saving
    router.push('/my-plans');
  };

  return (
    <ProtectedRoute>
      <PageViewTracker pageName="Available Races" />
      <AuthenticatedLayout>
        <Header />
        <div className={`min-h-screen bg-surface-1 ${isWizardOpen ? 'hidden md:block md:invisible' : ''}`}>
          <main className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                {t('title')}
              </h1>
              <p className="text-lg text-text-secondary">{t('subtitle')}</p>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-error-subtle border border-error rounded-lg">
                <p className="text-sm text-text-primary">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-lg text-text-secondary">{t('loading')}</div>
              </div>
            ) : races.length === 0 ? (
              /* Empty State */
              <div className="bg-surface-background rounded-lg shadow-md p-12 text-center border border-border">
                <div className="max-w-md mx-auto">
                  <div className="text-5xl mb-4">🚴</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {t('noRaces')}
                  </h3>
                  <p className="text-text-secondary">
                    {t('noRacesDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Admin Info */}
                {isAdmin && (
                  <div className="mb-6 p-4 bg-info-subtle border border-info rounded-lg">
                    <p className="text-sm text-text-primary">
                      👤 <strong>Admin view:</strong> You can see and plan all races. Private races show as "Coming Soon" for regular users.
                    </p>
                  </div>
                )}

                {/* Available Races */}
                {races.filter(r => r.is_public).length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">
                      {t('availableRacesSection')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {races.filter(r => r.is_public).map((race) => (
                        <RaceCard
                          key={race.id}
                          race={race}
                          onSelectRace={handleSelectRace}
                          onViewDetails={handleViewDetails}
                          comingSoon={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Coming Soon Races */}
                {races.filter(r => !r.is_public).length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">
                      {t('comingSoonSection')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {races.filter(r => !r.is_public).map((race) => (
                        <RaceCard
                          key={race.id}
                          race={race}
                          onSelectRace={handleSelectRace}
                          onViewDetails={handleViewDetails}
                          comingSoon={!isAdmin}
                        />
                      ))}
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
          initialRace={selectedRace || undefined}
        />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
