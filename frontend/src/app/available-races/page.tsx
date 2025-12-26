'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PageViewTracker from '@/components/PageViewTracker';
import WizardModal from '@/components/wizard/WizardModal';
import RaceCard from '@/components/RaceCard';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { trackButtonClick } from '@/lib/analytics';

export default function AvailableRacesPage() {
  const t = useTranslations('availableRaces');
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRaces(data || []);
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

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedRace(null);
  };

  const handleWizardComplete = () => {
    setIsWizardOpen(false);
    setSelectedRace(null);
    // Optionally navigate to my-plans or show success message
  };

  return (
    <ProtectedRoute>
      <PageViewTracker pageName="Available Races" />
      <AuthenticatedLayout>
        <Header />
        <div className="min-h-screen bg-surface-1">
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
              /* Race Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {races.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onSelectRace={handleSelectRace}
                  />
                ))}
              </div>
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
