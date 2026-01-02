'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Race, FeedZone } from '@/types';

export default function EditRacePage() {
  const router = useRouter();
  const params = useParams();
  const raceId = params.id as string;

  const [race, setRace] = useState<Race | null>(null);
  const [feedZones, setFeedZones] = useState<FeedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [raceName, setRaceName] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editingFeedZone, setEditingFeedZone] = useState<FeedZone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Copy feed zones states
  const [availableRaces, setAvailableRaces] = useState<Array<{ id: string; name: string; distance_km: number }>>([]);
  const [selectedRaceToCopy, setSelectedRaceToCopy] = useState<string>('');
  const [copyingFeedZones, setCopyingFeedZones] = useState(false);

  // New feed zone form
  const [newFeedZone, setNewFeedZone] = useState({
    name: '',
    distance_from_start_km: 0,
    lat: 0,
    lng: 0,
  });

  useEffect(() => {
    loadRaceData();
    loadAvailableRaces();
  }, [raceId]);

  const loadAvailableRaces = async () => {
    try {
      const { data: races, error } = await supabase
        .from('races')
        .select('id, name, distance_km')
        .neq('id', raceId) // Exclude current race
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableRaces(races || []);
    } catch (err) {
      console.error('Error loading races:', err);
    }
  };

  const loadRaceData = async () => {
    try {
      // Load race
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);
      setRaceName(raceData.name || '');
      setIsPublic(raceData.is_public);
      setStartDate(raceData.start_date || '');
      setEndDate(raceData.end_date || '');

      // Load feed zones
      const { data: feedZonesData, error: feedZonesError } = await supabase
        .from('feed_zones')
        .select('*')
        .eq('race_id', raceId)
        .order('order_index');

      if (feedZonesError) throw feedZonesError;
      setFeedZones(feedZonesData || []);
    } catch (err) {
      console.error('Error loading race:', err);
      setError(err instanceof Error ? err.message : 'Failed to load race');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!raceName.trim()) {
      alert('Race name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('races')
        .update({ name: raceName.trim() })
        .eq('id', raceId);

      if (error) throw error;

      // Update the local race state
      if (race) {
        setRace({ ...race, name: raceName.trim() });
      }

      alert('Race name updated successfully');
    } catch (err) {
      console.error('Error updating race name:', err);
      alert('Failed to update race name');
    }
  };

  const handleTogglePublic = async () => {
    try {
      const newValue = !isPublic;
      const { error } = await supabase
        .from('races')
        .update({ is_public: newValue })
        .eq('id', raceId);

      if (error) throw error;
      setIsPublic(newValue);
    } catch (err) {
      console.error('Error updating race:', err);
      alert('Failed to update race visibility');
    }
  };

  const handleUpdateDates = async () => {
    try {
      const { error } = await supabase
        .from('races')
        .update({
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .eq('id', raceId);

      if (error) throw error;
      alert('Race dates updated successfully');
    } catch (err) {
      console.error('Error updating dates:', err);
      alert('Failed to update race dates');
    }
  };

  const handleAddFeedZone = async () => {
    if (!newFeedZone.name.trim()) {
      alert('Please enter a name for the feed zone');
      return;
    }

    try {
      const { error } = await supabase
        .from('feed_zones')
        .insert({
          race_id: raceId,
          name: newFeedZone.name,
          distance_from_start_km: newFeedZone.distance_from_start_km,
          coordinates: {
            lat: newFeedZone.lat,
            lng: newFeedZone.lng,
          },
          order_index: feedZones.length,
        });

      if (error) throw error;

      // Reset form and reload
      setNewFeedZone({ name: '', distance_from_start_km: 0, lat: 0, lng: 0 });
      setShowAddForm(false);
      await loadRaceData();
    } catch (err) {
      console.error('Error adding feed zone:', err);
      alert('Failed to add feed zone');
    }
  };

  const handleUpdateFeedZone = async (feedZone: FeedZone) => {
    try {
      const { error } = await supabase
        .from('feed_zones')
        .update({
          name: feedZone.name,
          distance_from_start_km: feedZone.distance_from_start_km,
          coordinates: feedZone.coordinates,
        })
        .eq('id', feedZone.id);

      if (error) throw error;

      setEditingFeedZone(null);
      await loadRaceData();
    } catch (err) {
      console.error('Error updating feed zone:', err);
      alert('Failed to update feed zone');
    }
  };

  const handleDeleteFeedZone = async (feedZoneId: string) => {
    if (!confirm('Are you sure you want to delete this feed zone?')) return;

    try {
      const { error } = await supabase
        .from('feed_zones')
        .delete()
        .eq('id', feedZoneId);

      if (error) throw error;
      await loadRaceData();
    } catch (err) {
      console.error('Error deleting feed zone:', err);
      alert('Failed to delete feed zone');
    }
  };

  const handleCopyFeedZones = async () => {
    if (!selectedRaceToCopy) {
      alert('Please select a race to copy from');
      return;
    }

    if (!race || race.distance_km <= 0) {
      alert('Invalid race distance');
      return;
    }

    setCopyingFeedZones(true);
    setError(null);

    try {
      // Fetch feed zones from selected race
      const { data: sourceFeedZones, error: fetchError } = await supabase
        .from('feed_zones')
        .select('*')
        .eq('race_id', selectedRaceToCopy)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      if (!sourceFeedZones || sourceFeedZones.length === 0) {
        alert('The selected race has no feed zones to copy');
        return;
      }

      // Get source race distance for scaling
      const sourceRace = availableRaces.find(r => r.id === selectedRaceToCopy);
      if (!sourceRace) throw new Error('Source race not found');

      // Scale distances if the races have different distances
      const distanceRatio = race.distance_km / sourceRace.distance_km;
      const shouldScale = Math.abs(distanceRatio - 1) > 0.01; // Only scale if > 1% difference

      // Insert feed zones
      const feedZonesToInsert = sourceFeedZones.map((fz, index) => {
        let scaledDistance = fz.distance_from_start_km;

        if (shouldScale) {
          scaledDistance = fz.distance_from_start_km * distanceRatio;
        }

        return {
          race_id: raceId,
          name: fz.name,
          distance_from_start_km: parseFloat(scaledDistance.toFixed(2)),
          coordinates: fz.coordinates,
          order_index: feedZones.length + index,
        };
      });

      const { error: insertError } = await supabase
        .from('feed_zones')
        .insert(feedZonesToInsert);

      if (insertError) throw insertError;

      const scaleMessage = shouldScale
        ? ` (distances scaled by ${distanceRatio.toFixed(2)}x)`
        : '';
      alert(`Successfully copied ${feedZonesToInsert.length} feed zone(s) from ${sourceRace.name}${scaleMessage}`);

      // Reset selection and reload
      setSelectedRaceToCopy('');
      await loadRaceData();
    } catch (err) {
      console.error('Error copying feed zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to copy feed zones');
    } finally {
      setCopyingFeedZones(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading race...</p>
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Race not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{race.name}</h2>
          <p className="text-sm text-text-muted">
            {race.distance_km} km • {race.is_public ? 'Public' : 'Admin Only'}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-text-secondary hover:bg-surface-1 rounded-lg transition-colors"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="bg-error-subtle border border-error rounded-lg p-4">
          <p className="text-sm text-error-foreground">{error}</p>
        </div>
      )}

      {/* Race Settings */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">Race Settings</h3>

        {/* Race Name */}
        <div>
          <label htmlFor="edit-raceName" className="block text-sm font-medium text-text-secondary mb-2">
            Race Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="edit-raceName"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
              placeholder="Enter race name"
            />
            <button
              onClick={handleUpdateName}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors text-sm font-semibold"
            >
              Update Name
            </button>
          </div>
        </div>

        {/* Public Visibility */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Public Visibility
            </label>
            <p className="text-xs text-text-muted mt-1">
              {isPublic ? 'Visible to all users' : 'Only visible to admins'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleTogglePublic}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isPublic ? 'bg-primary' : 'bg-surface-3'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Race Dates */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3">Race Dates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-startDate" className="block text-xs font-medium text-text-secondary mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="edit-startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
              />
            </div>
            <div>
              <label htmlFor="edit-endDate" className="block text-xs font-medium text-text-secondary mb-1">
                End Date
              </label>
              <input
                type="date"
                id="edit-endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
              />
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={handleUpdateDates}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
            >
              Update Dates
            </button>
          </div>
        </div>
      </div>

      {/* Feed Zones Section */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Feed Zones</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Feed Zone
          </button>
        </div>

        {/* Copy from another race */}
        {availableRaces.length > 0 && !showAddForm && (
          <div className="mb-4 bg-info-subtle border border-info rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DocumentDuplicateIcon className="w-5 h-5 text-info-foreground" />
              <h4 className="text-sm font-semibold text-text-primary">Copy from Another Race</h4>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Copy feed zones from an existing race. Distances will be automatically scaled based on race lengths.
            </p>
            <div className="flex gap-2">
              <select
                value={selectedRaceToCopy}
                onChange={(e) => setSelectedRaceToCopy(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                disabled={copyingFeedZones}
              >
                <option value="">Select a race...</option>
                {availableRaces.map((race) => (
                  <option key={race.id} value={race.id}>
                    {race.name} ({race.distance_km} km)
                  </option>
                ))}
              </select>
              <button
                onClick={handleCopyFeedZones}
                disabled={!selectedRaceToCopy || copyingFeedZones}
                className="flex items-center gap-2 px-4 py-2 bg-info text-info-foreground rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {copyingFeedZones ? (
                  <>Copying...</>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-surface-1 rounded-lg border border-border">
            <h4 className="text-sm font-semibold text-text-primary mb-3">New Feed Zone</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={newFeedZone.name}
                  onChange={(e) => setNewFeedZone({ ...newFeedZone, name: e.target.value })}
                  placeholder="e.g., Hjo"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Distance from Start (km)
                </label>
                <input
                  type="number"
                  value={newFeedZone.distance_from_start_km}
                  onChange={(e) => setNewFeedZone({ ...newFeedZone, distance_from_start_km: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  value={newFeedZone.lat}
                  onChange={(e) => setNewFeedZone({ ...newFeedZone, lat: parseFloat(e.target.value) || 0 })}
                  step="0.000001"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  value={newFeedZone.lng}
                  onChange={(e) => setNewFeedZone({ ...newFeedZone, lng: parseFloat(e.target.value) || 0 })}
                  step="0.000001"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddFeedZone}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewFeedZone({ name: '', distance_from_start_km: 0, lat: 0, lng: 0 });
                }}
                className="px-4 py-2 bg-surface-2 text-text-secondary rounded-lg hover:bg-surface-3 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feed Zones List */}
        {feedZones.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No feed zones added yet
          </div>
        ) : (
          <div className="space-y-3">
            {feedZones.map((fz) => (
              <div key={fz.id} className="border border-border rounded-lg p-4">
                {editingFeedZone?.id === fz.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                        <input
                          type="text"
                          value={editingFeedZone.name}
                          onChange={(e) => setEditingFeedZone({ ...editingFeedZone, name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary text-text-primary bg-surface-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Distance (km)</label>
                        <input
                          type="number"
                          value={editingFeedZone.distance_from_start_km}
                          onChange={(e) => setEditingFeedZone({ ...editingFeedZone, distance_from_start_km: parseFloat(e.target.value) })}
                          step="0.1"
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary text-text-primary bg-surface-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Latitude</label>
                        <input
                          type="number"
                          value={editingFeedZone.coordinates.lat}
                          onChange={(e) => setEditingFeedZone({ ...editingFeedZone, coordinates: { ...editingFeedZone.coordinates, lat: parseFloat(e.target.value) } })}
                          step="0.000001"
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary text-text-primary bg-surface-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Longitude</label>
                        <input
                          type="number"
                          value={editingFeedZone.coordinates.lng}
                          onChange={(e) => setEditingFeedZone({ ...editingFeedZone, coordinates: { ...editingFeedZone.coordinates, lng: parseFloat(e.target.value) } })}
                          step="0.000001"
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary text-text-primary bg-surface-background"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateFeedZone(editingFeedZone)}
                        className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFeedZone(null)}
                        className="px-4 py-1.5 bg-surface-2 text-text-secondary rounded-lg hover:bg-surface-3 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">{fz.name}</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        {fz.distance_from_start_km} km from start •
                        Lat: {fz.coordinates.lat.toFixed(6)}, Lng: {fz.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingFeedZone(fz)}
                        className="p-2 text-primary hover:bg-primary-subtle rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeedZone(fz.id)}
                        className="p-2 text-error hover:bg-error-subtle rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
