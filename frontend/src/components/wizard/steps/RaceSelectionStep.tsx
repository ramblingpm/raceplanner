'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import { useWizard } from '../WizardContext';

export default function RaceSelectionStep() {
  const t = useTranslations('wizard');
  const { state, updateRace, nextStep } = useWizard();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race | null>(state.race);

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

  const filteredRaces = races.filter(race =>
    race.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRace = (race: Race) => {
    setSelectedRace(race);
    updateRace(race);
  };

  const handleNext = () => {
    if (selectedRace) {
      nextStep();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading races...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Select a Race
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Choose the race you want to create a plan for
        </p>
      </div>

      {/* Search */}
      {races.length > 5 && (
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search races..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Race Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {filteredRaces.map((race) => (
          <button
            key={race.id}
            onClick={() => handleSelectRace(race)}
            className={`text-left bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
              selectedRace?.id === race.id
                ? 'ring-4 ring-primary-500 ring-offset-2'
                : 'hover:-translate-y-1'
            }`}
          >
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">🚴</div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{race.distance_km}</div>
                  <div className="text-sm opacity-90">km</div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {race.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {race.distance_km} km
                </span>
                {selectedRace?.id === race.id && (
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    Selected
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredRaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? 'No races found matching your search' : 'No races available'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 mt-6">
        <button
          onClick={handleNext}
          disabled={!selectedRace}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            selectedRace
              ? 'bg-primary-600 hover:bg-primary-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next: Plan Time
        </button>
      </div>
    </div>
  );
}
