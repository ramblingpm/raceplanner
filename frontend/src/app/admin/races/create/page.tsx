'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpTrayIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { parseRouteFile, findClosestPointOnRoute, type ParsedRoute } from '@/lib/routeParser';
import { supabase } from '@/lib/supabase';

interface FeedZoneInput {
  id: string; // Temporary ID for UI
  name: string;
  distance_from_start_km: number;
  coordinates: { lat: number; lng: number };
  order_index: number;
}

export default function CreateRacePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Race details
  const [raceName, setRaceName] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [isPublic, setIsPublic] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRoute, setParsedRoute] = useState<ParsedRoute | null>(null);

  // Feed zones
  const [feedZones, setFeedZones] = useState<FeedZoneInput[]>([]);

  // UI state
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError(null);
    setError(null);

    try {
      const route = await parseRouteFile(file);
      setParsedRoute(route);
      setUploadedFile(file);
      setDistanceKm(parseFloat(route.totalDistanceKm.toFixed(2)));
      if (route.name && !raceName) {
        setRaceName(route.name);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setParseError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedRoute(null);
      setUploadedFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleAddFeedZone = () => {
    const newFeedZone: FeedZoneInput = {
      id: `temp-${Date.now()}`,
      name: '',
      distance_from_start_km: 0,
      coordinates: { lat: 0, lng: 0 },
      order_index: feedZones.length,
    };
    setFeedZones([...feedZones, newFeedZone]);
  };

  const handleRemoveFeedZone = (id: string) => {
    setFeedZones(feedZones.filter(fz => fz.id !== id));
  };

  const handleFeedZoneChange = (id: string, field: string, value: any) => {
    setFeedZones(feedZones.map(fz => {
      if (fz.id !== id) return fz;

      const updated = { ...fz, [field]: value };

      // If distance changed and we have a route, auto-calculate closest coordinates
      if (field === 'distance_from_start_km' && parsedRoute) {
        const distanceKm = parseFloat(value) || 0;
        // Find the approximate point on the route for this distance
        // This is a simplified approach - we'll iterate through and find closest distance
        let closestIndex = 0;
        let minDiff = Infinity;
        let cumulativeDistance = 0;

        for (let i = 1; i < parsedRoute.coordinates.length; i++) {
          const [lng1, lat1] = parsedRoute.coordinates[i - 1];
          const [lng2, lat2] = parsedRoute.coordinates[i];
          const segmentDist = haversineDistance(lat1, lng1, lat2, lng2);
          cumulativeDistance += segmentDist;

          const diff = Math.abs(cumulativeDistance - distanceKm);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }

        const [lng, lat] = parsedRoute.coordinates[closestIndex];
        updated.coordinates = { lat, lng };
      }

      return updated;
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!raceName.trim()) {
      setError('Please enter a race name');
      return;
    }

    if (!parsedRoute) {
      setError('Please upload a route file (GPX)');
      return;
    }

    if (distanceKm <= 0) {
      setError('Distance must be greater than 0');
      return;
    }

    // Validate feed zones
    for (const fz of feedZones) {
      if (!fz.name.trim()) {
        setError('All feed zones must have a name');
        return;
      }
      if (fz.distance_from_start_km < 0 || fz.distance_from_start_km > distanceKm) {
        setError(`Feed zone "${fz.name}" distance must be between 0 and ${distanceKm} km`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Create slug from race name
      const slug = raceName
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/[ö]/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if slug already exists
      const { data: existingRace } = await supabase
        .from('races')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (existingRace) {
        setError(`A race with a similar name already exists: "${existingRace.name}". Please choose a different name.`);
        setSaving(false);
        return;
      }

      // Insert race
      const { data: race, error: raceError } = await supabase
        .from('races')
        .insert({
          name: raceName,
          slug,
          distance_km: distanceKm,
          is_public: isPublic,
          route_geometry: {
            type: 'LineString',
            coordinates: parsedRoute.coordinates,
          },
        })
        .select()
        .single();

      if (raceError) throw raceError;
      if (!race) throw new Error('Failed to create race');

      // Insert feed zones
      if (feedZones.length > 0) {
        const feedZonesData = feedZones.map((fz, index) => ({
          race_id: race.id,
          name: fz.name,
          distance_from_start_km: fz.distance_from_start_km,
          coordinates: fz.coordinates,
          order_index: index,
        }));

        const { error: feedZonesError } = await supabase
          .from('feed_zones')
          .insert(feedZonesData);

        if (feedZonesError) throw feedZonesError;
      }

      // Success!
      router.push('/admin/races');
    } catch (err) {
      console.error('Error saving race:', err);
      setError(err instanceof Error ? err.message : 'Failed to save race');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Create New Race</h2>
          <p className="mt-1 text-sm text-text-muted">
            Upload a GPX file and configure race details
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-subtle border border-error rounded-lg p-4">
          <p className="text-sm text-error-foreground">{error}</p>
        </div>
      )}

      {/* Race Details Section */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">Race Details</h3>

        {/* Race Name */}
        <div>
          <label htmlFor="raceName" className="block text-sm font-medium text-text-secondary mb-2">
            Race Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="raceName"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            placeholder="e.g., Vätternrundan 315"
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Route File <span className="text-error">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,.fit"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary-subtle transition-colors disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="w-5 h-5 text-text-secondary" />
            <span className="text-sm text-text-secondary">
              {parsing ? 'Parsing...' : uploadedFile ? `Uploaded: ${uploadedFile.name}` : 'Upload GPX or FIT file'}
            </span>
          </button>
          {parseError && (
            <p className="mt-2 text-sm text-error-foreground">{parseError}</p>
          )}
          {parsedRoute && (
            <p className="mt-2 text-sm text-success-foreground">
              ✓ Route parsed successfully: {parsedRoute.coordinates.length} points
            </p>
          )}
        </div>

        {/* Distance */}
        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-text-secondary mb-2">
            Distance (km) <span className="text-error">*</span>
          </label>
          <input
            type="number"
            id="distance"
            value={distanceKm}
            onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0"
            placeholder="0.0"
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
          />
          <p className="mt-1 text-xs text-text-muted">
            Auto-calculated from GPX file, but you can adjust it
          </p>
        </div>

        {/* Is Public Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="isPublic" className="text-sm font-medium text-text-secondary">
              Make race public
            </label>
            <p className="text-xs text-text-muted mt-1">
              If unchecked, only admins can see this race (for testing)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
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
      </div>

      {/* Feed Zones Section */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Feed Zones</h3>
            <p className="text-sm text-text-muted">Optional pit stops along the race route</p>
          </div>
          <button
            onClick={handleAddFeedZone}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="text-sm">Add Feed Zone</span>
          </button>
        </div>

        {feedZones.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            No feed zones added yet. Click "Add Feed Zone" to create one.
          </div>
        )}

        {feedZones.map((fz, index) => (
          <div key={fz.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text-primary">
                Feed Zone {index + 1}
              </h4>
              <button
                onClick={() => handleRemoveFeedZone(fz.id)}
                className="p-1 text-error hover:bg-error-subtle rounded transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={fz.name}
                  onChange={(e) => handleFeedZoneChange(fz.id, 'name', e.target.value)}
                  placeholder="e.g., Hjo"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>

              {/* Distance from Start */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Distance from Start (km) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={fz.distance_from_start_km}
                  onChange={(e) => handleFeedZoneChange(fz.id, 'distance_from_start_km', e.target.value)}
                  step="0.1"
                  min="0"
                  max={distanceKm}
                  placeholder="0.0"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  value={fz.coordinates.lat}
                  onChange={(e) => handleFeedZoneChange(fz.id, 'coordinates', { ...fz.coordinates, lat: parseFloat(e.target.value) || 0 })}
                  step="0.000001"
                  placeholder="58.0000"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  value={fz.coordinates.lng}
                  onChange={(e) => handleFeedZoneChange(fz.id, 'coordinates', { ...fz.coordinates, lng: parseFloat(e.target.value) || 0 })}
                  step="0.000001"
                  placeholder="14.0000"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-surface-background"
                />
              </div>
            </div>

            {parsedRoute && (
              <p className="text-xs text-info-foreground">
                💡 Coordinates are auto-calculated from distance when you have a route uploaded
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.back()}
          disabled={saving}
          className="px-6 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-1 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !raceName || !parsedRoute}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Race'}
        </button>
      </div>
    </div>
  );
}

// Helper function for calculating distance between coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
