'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PrintablePlanViewProps {
  plan: any;
  race: any;
  onClose: () => void;
}

interface FeedZoneStop {
  name: string;
  distance_from_start_km: number;
  planned_arrival_time?: string;
  planned_departure_time?: string;
  planned_duration_seconds: number;
}

export default function PrintablePlanView({ plan, race, onClose }: PrintablePlanViewProps) {
  const t = useTranslations('myPlans');
  const tDashboard = useTranslations('dashboard');
  const [feedZones, setFeedZones] = useState<FeedZoneStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedZones();
  }, [plan.id]);

  const fetchFeedZones = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_feed_zones')
        .select(`
          *,
          feed_zones (
            name,
            distance_from_start_km
          )
        `)
        .eq('calculation_id', plan.id)
        .order('feed_zones(distance_from_start_km)', { ascending: true });

      if (error) throw error;

      const zones = (data || []).map((item: any) => ({
        name: item.feed_zones?.name || 'Unknown',
        distance_from_start_km: item.feed_zones?.distance_from_start_km || 0,
        planned_arrival_time: item.planned_arrival_time,
        planned_departure_time: item.planned_departure_time,
        planned_duration_seconds: item.planned_duration_seconds,
      }));

      setFeedZones(zones);
    } catch (error) {
      console.error('Error fetching feed zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const durationHours = Math.floor(plan.estimated_duration_seconds / 3600);
  const durationMinutes = Math.floor((plan.estimated_duration_seconds % 3600) / 60);

  // Create simple elevation profile SVG
  const renderElevationProfile = () => {
    if (!race?.elevation_data || race.elevation_data.length === 0) {
      return null;
    }

    const elevations = race.elevation_data;
    const width = 600;
    const height = 150;
    const padding = 30;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevRange = maxElev - minElev || 1;

    // Create path for elevation profile
    const points = elevations.map((elev: number, index: number) => {
      const x = padding + (index / (elevations.length - 1)) * graphWidth;
      const y = height - padding - ((elev - minElev) / elevRange) * graphHeight;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const fillPathData = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    return (
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="2" />

        {/* Elevation fill */}
        <path d={fillPathData} fill="#e5e7eb" stroke="none" />

        {/* Elevation line */}
        <path d={pathData} fill="none" stroke="#000" strokeWidth="2" />

        {/* Labels */}
        <text x={padding} y={padding - 5} fontSize="12" fill="#000" fontWeight="bold">
          {maxElev}m
        </text>
        <text x={padding} y={height - padding + 15} fontSize="12" fill="#000" fontWeight="bold">
          0 km
        </text>
        <text x={width - padding} y={height - padding + 15} fontSize="12" fill="#000" fontWeight="bold" textAnchor="end">
          {race.distance_km} km
        </text>
        <text x={padding} y={height - 5} fontSize="12" fill="#000" fontWeight="bold">
          {minElev}m
        </text>
      </svg>
    );
  };

  return (
    <>
      {/* Modal Overlay - Hidden when printing */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 print:hidden">
        <div className="bg-surface-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-border">
          {/* Header */}
          <div className="sticky top-0 bg-surface-2 px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">{t('printPreview')}</h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                {t('print')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-surface-3 text-text-primary rounded-lg hover:bg-surface-2 transition-colors font-medium border border-border"
              >
                {t('close')}
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-6">
            <div id="printable-content" className="bg-white text-black">
              <PrintContent
                plan={plan}
                race={race}
                feedZones={feedZones}
                loading={loading}
                formatDate={formatDate}
                formatTime={formatTime}
                formatDuration={formatDuration}
                durationHours={durationHours}
                durationMinutes={durationMinutes}
                renderElevationProfile={renderElevationProfile}
                t={t}
                tDashboard={tDashboard}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block">
        <PrintContent
          plan={plan}
          race={race}
          feedZones={feedZones}
          loading={loading}
          formatDate={formatDate}
          formatTime={formatTime}
          formatDuration={formatDuration}
          durationHours={durationHours}
          durationMinutes={durationMinutes}
          renderElevationProfile={renderElevationProfile}
          t={t}
          tDashboard={tDashboard}
        />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

// Separate component for the actual printable content
function PrintContent({
  plan,
  race,
  feedZones,
  loading,
  formatDate,
  formatTime,
  formatDuration,
  durationHours,
  durationMinutes,
  renderElevationProfile,
  t,
  tDashboard,
}: any) {
  return (
    <div className="p-6 bg-white text-black space-y-6">
      {/* Header Section */}
      <div className="border-b-4 border-black pb-4">
        <h1 className="text-3xl font-black mb-2 uppercase">
          {plan.label || tDashboard('untitledPlan')}
        </h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold">{t('raceName')}:</p>
            <p className="text-lg">{race?.name || 'Unknown Race'}</p>
          </div>
          <div>
            <p className="font-bold">{t('raceDistance')}:</p>
            <p className="text-lg">{race?.distance_km || 0} km</p>
          </div>
        </div>
      </div>

      {/* Key Stats - Large and Bold for Handlebar Visibility */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border-4 border-black p-4 text-center bg-gray-100">
          <p className="text-xs font-bold uppercase mb-1">{tDashboard('startTime')}</p>
          <p className="text-xl font-black">{formatTime(plan.planned_start_time)}</p>
          <p className="text-sm font-bold">{formatDate(plan.planned_start_time)}</p>
        </div>
        <div className="border-4 border-black p-4 text-center bg-gray-100">
          <p className="text-xs font-bold uppercase mb-1">{tDashboard('duration')}</p>
          <p className="text-2xl font-black">{durationHours}h {durationMinutes}m</p>
        </div>
        <div className="border-4 border-black p-4 text-center bg-gray-100">
          <p className="text-xs font-bold uppercase mb-1">{tDashboard('avgSpeed')}</p>
          <p className="text-2xl font-black">{plan.required_speed_kmh.toFixed(1)} km/h</p>
        </div>
      </div>

      {/* Finish Time - Prominent */}
      <div className="border-4 border-black p-4 bg-yellow-100">
        <p className="text-sm font-bold uppercase mb-1">{tDashboard('finishTime')}</p>
        <p className="text-3xl font-black">{formatTime(plan.calculated_finish_time)}</p>
      </div>

      {/* Elevation Profile */}
      {race?.elevation_data && race.elevation_data.length > 0 && (
        <div className="border-4 border-black p-4">
          <h2 className="text-lg font-black mb-3 uppercase">{t('elevationProfile')}</h2>
          {renderElevationProfile()}
          {race.elevation_gain_m && (
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="font-bold">{t('totalClimb')}:</span> {race.elevation_gain_m}m
              </div>
              <div>
                <span className="font-bold">{t('totalDescent')}:</span> {race.elevation_loss_m || 0}m
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feed Zones / Stops */}
      {!loading && feedZones.length > 0 && (
        <div className="border-4 border-black p-4">
          <h2 className="text-lg font-black mb-3 uppercase">{t('feedZones')}</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-2 border-black">
                <th className="border-2 border-black p-2 text-left font-black text-sm">{t('location')}</th>
                <th className="border-2 border-black p-2 text-left font-black text-sm">{t('distance')}</th>
                <th className="border-2 border-black p-2 text-left font-black text-sm">{t('arrival')}</th>
                <th className="border-2 border-black p-2 text-left font-black text-sm">{t('departure')}</th>
                <th className="border-2 border-black p-2 text-left font-black text-sm">{t('stopDuration')}</th>
              </tr>
            </thead>
            <tbody>
              {feedZones.map((zone: FeedZoneStop, index: number) => (
                <tr key={index} className="border-2 border-black">
                  <td className="border-2 border-black p-2 font-bold">{zone.name}</td>
                  <td className="border-2 border-black p-2">{zone.distance_from_start_km.toFixed(1)} km</td>
                  <td className="border-2 border-black p-2 font-bold">
                    {zone.planned_arrival_time || '-'}
                  </td>
                  <td className="border-2 border-black p-2 font-bold">
                    {zone.planned_departure_time || '-'}
                  </td>
                  <td className="border-2 border-black p-2">
                    {formatDuration(zone.planned_duration_seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs border-t-2 border-black pt-3">
        <p className="font-bold">Race Planner • {new Date().toLocaleDateString()}</p>
        <p>{t('printDisclaimer')}</p>
      </div>
    </div>
  );
}
