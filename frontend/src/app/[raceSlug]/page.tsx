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
import StaticRouteMap from '@/components/StaticRouteMap';
import { supabase } from '@/lib/supabase';
import { Race } from '@/types';
import {
  trackRaceSelected,
  trackButtonClick,
} from '@/lib/analytics';
import { PencilSquareIcon, PrinterIcon } from '@heroicons/react/24/outline';

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

// Dynamically import RaceSegmentOverview
const RaceSegmentOverview = dynamic(() => import('@/components/RaceSegmentOverview'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-1 rounded-lg flex items-center justify-center p-8">
      <p className="text-text-muted">Loading segment overview...</p>
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
  const [plan, setPlan] = useState<any>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [feedZones, setFeedZones] = useState<any[]>([]);
  const [planFeedZones, setPlanFeedZones] = useState<any[]>([]);

  useEffect(() => {
    // Check if there's a plan ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get('plan');
    setPlanId(planIdFromUrl);

    fetchRace();
    if (planIdFromUrl) {
      fetchPlan(planIdFromUrl);
    }
  }, [raceSlug]);

  useEffect(() => {
    if (race) {
      fetchFeedZones();
    }
  }, [race]);

  useEffect(() => {
    if (planId) {
      fetchPlanFeedZones();
    }
  }, [planId]);

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

  const fetchPlan = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('race_calculations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  const fetchFeedZones = async () => {
    if (!race) return;

    try {
      const { data, error } = await supabase
        .from('feed_zones')
        .select('*')
        .eq('race_id', race.id)
        .order('distance_from_start_km', { ascending: true });

      if (error) throw error;
      setFeedZones(data || []);
    } catch (error) {
      console.error('Error fetching feed zones:', error);
    }
  };

  const fetchPlanFeedZones = async () => {
    if (!planId) return;

    try {
      const { data, error } = await supabase
        .from('plan_feed_zones')
        .select('*')
        .eq('calculation_id', planId);

      if (error) throw error;
      setPlanFeedZones(data || []);
    } catch (error) {
      console.error('Error fetching plan feed zones:', error);
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

  const handlePrint = () => {
    window.print();
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
        <Header className="print:hidden" />
        <div className={`min-h-screen bg-surface-1 ${isWizardOpen ? 'hidden md:block md:invisible' : ''}`}>
          <main className="container mx-auto px-4 py-8 max-w-6xl print:px-0 print:py-0 print:max-w-none">
            {/* Back Button */}
            <button
              onClick={() => {
                trackButtonClick(plan ? 'back_to_my_plans' : 'back_to_available_races', 'race_page', { race_name: race.name });
                router.push(plan ? '/my-plans' : '/available-races');
              }}
              className="mb-6 text-text-link hover:text-text-link-hover font-medium flex items-center gap-2 print:hidden"
            >
              ← {plan ? t('myPlans') : t('backToRaces')}
            </button>

            {/* Hero Section */}
            <div className="bg-surface-background rounded-lg shadow-md p-8 mb-8 border border-border print:shadow-none print:border-0 print:mb-4 print:p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                    {race.name}
                  </h1>
                  {formatDateRange() && (
                    <p className="text-text-secondary text-lg">{formatDateRange()}</p>
                  )}
                </div>
                {plan ? (
                  <div className="flex items-center gap-3 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-info text-white px-4 py-2 rounded-lg hover:bg-info-hover transition-colors font-medium"
                      title={t('printPlan')}
                    >
                      <PrinterIcon className="w-5 h-5" />
                      <span>{t('printPlan')}</span>
                    </button>
                    <button
                      onClick={handleOpenWizard}
                      className="flex items-center gap-2 bg-surface-2 text-text-primary px-4 py-2 rounded-lg hover:bg-surface-3 transition-colors font-medium border border-border"
                      title={t('editPlan')}
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                      <span>{t('editPlan')}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenWizard}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold whitespace-nowrap"
                  >
                    {t('selectRace')}
                  </button>
                )}
              </div>
            </div>

            {/* Plan Details - Horizontal Section (only when plan exists) */}
            {plan && (
              <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border mb-6 print:p-2 print:shadow-none print:mb-2">
                <h2 className="text-xl font-bold text-text-primary mb-4 print:text-sm print:mb-1">{plan.label || t('untitledPlan')}</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:grid-cols-6 print:gap-2">
                  {/* Distance */}
                  <div>
                    <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{t('distance')}</p>
                    <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">{race.distance_km} km</p>
                  </div>

                  {/* Start Time */}
                  <div>
                    <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{t('startTime')}</p>
                    <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">
                      {new Date(plan.planned_start_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(plan.planned_start_time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Finish Time */}
                  <div>
                    <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{t('finishTime')}</p>
                    <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">
                      {new Date(plan.calculated_finish_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(plan.calculated_finish_time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{t('duration')}</p>
                    <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">
                      {Math.floor(plan.estimated_duration_seconds / 3600)}h{' '}
                      {Math.floor((plan.estimated_duration_seconds % 3600) / 60)}m
                    </p>
                  </div>

                  {/* Elevation Gain */}
                  {race.elevation_gain_m && (
                    <div>
                      <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{tElevation('gain')}</p>
                      <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">{race.elevation_gain_m} m</p>
                    </div>
                  )}

                  {/* Average Speed */}
                  <div>
                    <p className="text-text-muted text-xs uppercase mb-1 print:text-[0.55rem] print:mb-0">{t('avgSpeed')}</p>
                    <p className="text-lg font-semibold text-text-primary print:text-xs print:font-normal">
                      {plan.required_speed_kmh.toFixed(1)} km/h
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Map and Elevation - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-2">
              {/* Map Section */}
              {race.route_geometry?.coordinates && (
                <div className="lg:col-span-2 print:col-span-2 bg-surface-background rounded-lg shadow-md p-6 border border-border print:p-2 print:shadow-none">
                  <h2 className="text-xl font-bold text-text-primary mb-4 print:text-sm print:mb-1">{tMap('title')}</h2>

                  {/* Interactive Leaflet map for screen */}
                  <div className="h-96 rounded-lg overflow-hidden border border-border print:hidden">
                    <RaceMap
                      routeCoordinates={race.route_geometry.coordinates as number[][]}
                      selectedFeedZones={feedZones.map(fz => ({
                        id: fz.id,
                        name: fz.name,
                        coordinates: fz.coordinates,
                        distance_from_start_km: fz.distance_from_start_km,
                        isStop: planFeedZones.some(pfz => pfz.feed_zone_id === fz.id),
                      }))}
                    />
                  </div>

                  {/* Static SVG map for print */}
                  <div className="hidden print:block h-[120px] rounded-lg overflow-hidden border border-border">
                    <StaticRouteMap
                      routeCoordinates={race.route_geometry.coordinates as number[][]}
                      feedZones={feedZones.map(fz => ({
                        id: fz.id,
                        name: fz.name,
                        coordinates: fz.coordinates,
                        distance_from_start_km: fz.distance_from_start_km,
                        isStop: planFeedZones.some(pfz => pfz.feed_zone_id === fz.id),
                      }))}
                    />
                  </div>
                </div>
              )}

              {/* Elevation Profile */}
              {race.elevation_data && race.elevation_data.length > 0 && (
                <div className="bg-surface-background rounded-lg shadow-md p-6 border border-border print:p-2 print:shadow-none print:col-span-1">
                  <h2 className="text-xl font-bold text-text-primary mb-4 print:text-sm print:mb-1">{tElevation('title')}</h2>
                  <div className="h-96 print:h-[120px]">
                    <ElevationProfile
                      elevations={race.elevation_data}
                      totalDistanceKm={race.distance_km}
                      feedZones={[]}
                      height={384}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Segment Overview - Only show if there's a plan */}
            {plan && (
              <div className="mb-8">
                <RaceSegmentOverview
                  raceId={race.id}
                  raceDistanceKm={race.distance_km}
                  averageSpeedKmh={plan.required_speed_kmh}
                  planLabel={plan.label}
                  planId={plan.id}
                  startTime={plan.planned_start_time}
                />
              </div>
            )}
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

      {/* Print Styles */}
      <style jsx global>{`
        /* Force color preservation globally */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          /* Force A4 dimensions */
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide elements that shouldn't be printed */
          .print\\:hidden {
            display: none !important;
          }

          /* Clean background for print */
          .bg-surface-1,
          .bg-surface-2,
          .bg-surface-background,
          .min-h-screen {
            background: white !important;
            min-height: auto !important;
          }

          /* Remove shadows and borders for cleaner print */
          .shadow-md,
          .shadow-lg {
            box-shadow: none !important;
          }

          .rounded-lg {
            border-radius: 0 !important;
          }

          /* Optimize table for printing */
          table {
            page-break-inside: auto;
            width: 100% !important;
            font-size: 0.7rem !important;
          }

          table thead {
            font-size: 0.65rem !important;
          }

          table th,
          table td {
            padding: 0.25rem 0.5rem !important;
          }

          /* Avoid breaking inside segments when possible */
          tr {
            page-break-inside: avoid;
          }

          /* Better contrast for print */
          .text-text-primary,
          .text-text-secondary,
          .text-text-muted {
            color: #000 !important;
          }

          /* Keep borders visible */
          .border-border {
            border-color: #ccc !important;
          }

          /* Ensure proper sizing for grid on print - force desktop layout */
          .grid {
            display: grid !important;
          }

          /* Force desktop grid columns on print (override mobile breakpoints) */
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .print\\:grid-cols-6 {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }

          .print\\:col-span-1 {
            grid-column: span 1 / span 1 !important;
          }

          .print\\:col-span-2 {
            grid-column: span 2 / span 2 !important;
          }

          .print\\:col-span-3 {
            grid-column: span 3 / span 3 !important;
          }

          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }

          /* Adjust heights for print to fit A4 */
          .h-96 {
            height: 120px !important;
          }

          .print\\:h-\\[120px\\] {
            height: 120px !important;
          }

          /* Ensure SVG elements print correctly */
          svg {
            max-width: 100% !important;
          }

          svg path,
          svg circle,
          svg rect {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Scale down font sizes for A4 */
          h1 {
            font-size: 1.25rem !important;
            margin-bottom: 0.25rem !important;
          }

          h2 {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }

          h3 {
            font-size: 0.875rem !important;
          }

          p, div, span {
            font-size: 0.75rem !important;
          }

          /* Ensure content fits width */
          .container {
            max-width: 100% !important;
            width: 100% !important;
          }

          /* Compact spacing for print */
          .p-8 {
            padding: 0.25rem !important;
          }

          .p-6 {
            padding: 0.25rem !important;
          }

          .p-5 {
            padding: 0.25rem !important;
          }

          .p-4 {
            padding: 0.25rem !important;
          }

          .px-6 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }

          .py-4 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .py-3 {
            padding-top: 0.2rem !important;
            padding-bottom: 0.2rem !important;
          }

          .mb-8 {
            margin-bottom: 0.25rem !important;
          }

          .mb-6 {
            margin-bottom: 0.25rem !important;
          }

          .mb-4 {
            margin-bottom: 0.25rem !important;
          }

          .mb-2 {
            margin-bottom: 0.15rem !important;
          }

          .gap-6 {
            gap: 0.25rem !important;
          }

          .gap-4 {
            gap: 0.25rem !important;
          }

          .space-y-4 > * + * {
            margin-top: 0.25rem !important;
          }

          /* Text sizes */
          .text-3xl,
          .text-4xl {
            font-size: 1.25rem !important;
          }

          .text-2xl {
            font-size: 1.125rem !important;
          }

          .text-xl {
            font-size: 1rem !important;
          }

          .text-lg {
            font-size: 0.875rem !important;
          }

          .text-base {
            font-size: 0.75rem !important;
          }

          .text-sm {
            font-size: 0.7rem !important;
          }

          .text-xs {
            font-size: 0.65rem !important;
          }

          /* Extra small text for compact labels */
          .print\\:text-\\[0\\.55rem\\] {
            font-size: 0.55rem !important;
          }

          /* Print spacing overrides */
          .print\\:space-y-1 > * + * {
            margin-top: 0.25rem !important;
          }

          .print\\:gap-2 {
            gap: 0.5rem !important;
          }

          .print\\:p-2 {
            padding: 0.5rem !important;
          }

          .print\\:mb-0 {
            margin-bottom: 0 !important;
          }

          .print\\:mb-1 {
            margin-bottom: 0.25rem !important;
          }

          .print\\:pt-1 {
            padding-top: 0.25rem !important;
          }

          .print\\:border-t-0 {
            border-top-width: 0 !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          /* Print utility classes */
          .print\\:block {
            display: block !important;
          }

          .print\\:inline {
            display: inline !important;
          }

          .print\\:flex-row {
            flex-direction: row !important;
          }

          .print\\:gap-1 {
            gap: 0.25rem !important;
          }

          .print\\:gap-3 {
            gap: 0.75rem !important;
          }

          .print\\:justify-end {
            justify-content: flex-end !important;
          }

          .print\\:ml-1 {
            margin-left: 0.25rem !important;
          }

          .print\\:mt-0 {
            margin-top: 0 !important;
          }

          .print\\:py-0\\.5 {
            padding-top: 0.125rem !important;
            padding-bottom: 0.125rem !important;
          }

          .print\\:py-1 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .print\\:px-1 {
            padding-left: 0.25rem !important;
            padding-right: 0.25rem !important;
          }

          .print\\:px-2 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }

          .print\\:text-\\[0\\.5rem\\] {
            font-size: 0.5rem !important;
          }

          .print\\:font-normal {
            font-weight: 400 !important;
          }

          .print\\:not-italic {
            font-style: normal !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          /* Page breaks */
          .page-break-before {
            page-break-before: always;
          }

          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
