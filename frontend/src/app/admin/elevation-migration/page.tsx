'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  getRacesElevationStatus,
  backfillRaceElevation,
  backfillAllRaces,
  type BackfillProgress,
  type BackfillResult,
} from '@/lib/migrations/backfillElevation';
import { supabase } from '@/lib/supabase';
import type { Race } from '@/types';

interface RaceStatus {
  id: string;
  name: string;
  slug: string;
  distance_km: number;
  hasRouteGeometry: boolean;
  hasElevationData: boolean;
  elevationGain?: number;
  elevationLoss?: number;
}

export default function ElevationMigrationPage() {
  const [races, setRaces] = useState<RaceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<BackfillProgress[]>([]);
  const [result, setResult] = useState<BackfillResult | null>(null);

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const status = await getRacesElevationStatus();
      setRaces(status);
    } catch (error) {
      console.error('Error loading races:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillSingle = async (raceId: string) => {
    try {
      setProcessing(true);

      // Fetch full race data
      const { data: race, error } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (error || !race) {
        throw new Error('Failed to fetch race');
      }

      // Backfill elevation
      await backfillRaceElevation(race as Race, (p) => {
        setProgress([p]);
      });

      // Reload races
      await loadRaces();
      setProgress([]);
    } catch (error) {
      console.error('Error backfilling race:', error);
      alert('Error backfilling elevation data. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackfillAll = async () => {
    if (!confirm('This will fetch elevation data for all races without it. This may take several minutes. Continue?')) {
      return;
    }

    try {
      setProcessing(true);
      setProgress([]);
      setResult(null);

      const backfillResult = await backfillAllRaces((progressList) => {
        setProgress([...progressList]);
      });

      setResult(backfillResult);
      await loadRaces();
    } catch (error) {
      console.error('Error backfilling all races:', error);
      alert('Error backfilling elevation data. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  const racesNeedingElevation = races.filter(r => r.hasRouteGeometry && !r.hasElevationData);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Elevation Migration</h2>
        <div className="text-center py-12">
          <div className="text-lg text-text-secondary">Loading races...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Elevation Migration</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Backfill elevation data for races that have route geometry but no elevation data.
          Uses the Open-Elevation API (free, no API key required).
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-background rounded-lg p-4 border border-border">
          <div className="text-sm text-text-secondary">Total Races</div>
          <div className="text-2xl font-bold text-text-primary">{races.length}</div>
        </div>
        <div className="bg-surface-background rounded-lg p-4 border border-border">
          <div className="text-sm text-text-secondary">With Route</div>
          <div className="text-2xl font-bold text-text-primary">
            {races.filter(r => r.hasRouteGeometry).length}
          </div>
        </div>
        <div className="bg-success-subtle rounded-lg p-4 border border-success">
          <div className="text-sm text-text-secondary">With Elevation</div>
          <div className="text-2xl font-bold text-text-primary">
            {races.filter(r => r.hasElevationData).length}
          </div>
        </div>
        <div className="bg-warning-subtle rounded-lg p-4 border border-warning">
          <div className="text-sm text-text-secondary">Needs Elevation</div>
          <div className="text-2xl font-bold text-text-primary">
            {racesNeedingElevation.length}
          </div>
        </div>
      </div>

      {/* Backfill All Button */}
      {racesNeedingElevation.length > 0 && (
        <div className="bg-surface-background rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Backfill All Missing Elevation Data
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            This will fetch elevation data for {racesNeedingElevation.length} race(s).
            The process may take a few minutes depending on route complexity.
          </p>
          <button
            onClick={handleBackfillAll}
            disabled={processing}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-5 h-5" />
                Backfill All
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Display */}
      {progress.length > 0 && (
        <div className="bg-surface-background rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Progress</h3>
          <div className="space-y-3">
            {progress.map((p) => (
              <div key={p.raceId} className="flex items-start gap-3 p-3 bg-surface-1 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {p.status === 'success' && <CheckCircleIcon className="w-5 h-5 text-success" />}
                  {p.status === 'error' && <XCircleIcon className="w-5 h-5 text-error" />}
                  {p.status === 'processing' && <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />}
                  {p.status === 'pending' && <ClockIcon className="w-5 h-5 text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{p.raceName}</div>
                  {p.message && (
                    <div className={`text-xs mt-1 ${
                      p.status === 'error' ? 'text-error-foreground' : 'text-text-secondary'
                    }`}>
                      {p.message}
                    </div>
                  )}
                  {p.progress !== undefined && p.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-surface-2 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Summary */}
      {result && (
        <div className="bg-surface-background rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Backfill Complete</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{result.total}</div>
              <div className="text-xs text-text-secondary">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{result.successful}</div>
              <div className="text-xs text-text-secondary">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-muted">{result.skipped}</div>
              <div className="text-xs text-text-secondary">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error">{result.failed}</div>
              <div className="text-xs text-text-secondary">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Races List */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">All Races</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-1">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Elevation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-background divide-y divide-border">
              {races.map((race) => (
                <tr key={race.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {race.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {race.distance_km} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {race.hasRouteGeometry ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success-foreground">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-subtle text-error-foreground">
                        ✗ No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {race.hasElevationData ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success-foreground">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-subtle text-warning-foreground">
                        ✗ No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {race.hasElevationData && race.elevationGain !== undefined ? (
                      <div className="text-xs">
                        <div>↗ {race.elevationGain}m</div>
                        <div>↘ {race.elevationLoss}m</div>
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {race.hasRouteGeometry && !race.hasElevationData && (
                      <button
                        onClick={() => handleBackfillSingle(race.id)}
                        disabled={processing}
                        className="text-primary hover:text-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Fetch Elevation
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
