'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PageViewTracker from '@/components/PageViewTracker';
import { supabase } from '@/lib/supabase';
import { DocumentDuplicateIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
  trackPlanCopied,
  trackPlanDeleted,
} from '@/lib/analytics';
import RacePlanCard from '@/components/RacePlanCard';
import PrintablePlanView from '@/components/PrintablePlanView';

interface GroupedPlans {
  [raceId: string]: {
    race: any;
    plans: any[];
  };
}

export default function MyPlansPage() {
  const t = useTranslations('myPlans');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groupedPlans, setGroupedPlans] = useState<GroupedPlans>({});
  const [printPlan, setPrintPlan] = useState<any>(null);
  const [printRace, setPrintRace] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('race_calculations')
        .select(`
          *,
          races (
            id,
            name,
            slug,
            distance_km,
            start_date,
            end_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched plans:', data);
      console.log('Number of plans:', data?.length || 0);

      // Group plans by race
      const grouped: GroupedPlans = {};
      (data || []).forEach((plan) => {
        const raceId = plan.race_id;
        if (!grouped[raceId]) {
          grouped[raceId] = {
            race: plan.races,
            plans: [],
          };
        }
        grouped[raceId].plans.push(plan);
      });

      console.log('Grouped plans:', grouped);
      console.log('Number of race groups:', Object.keys(grouped).length);

      setGroupedPlans(grouped);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: any) => {
    if (plan.races?.slug) {
      router.push(`/${plan.races.slug}?plan=${plan.id}`);
    }
  };

  const handleCopy = async (plan: any) => {
    const { id, created_at, updated_at, ...planData } = plan;
    const newPlan = {
      ...planData,
      label: `${plan.label} (Copy)`,
    };

    try {
      const { error } = await supabase.from('race_calculations').insert([newPlan]);

      if (error) throw error;

      trackPlanCopied(plan.races?.name || 'Unknown', 'my_plans_page');
      await fetchPlans();
    } catch (error) {
      console.error('Error copying plan:', error);
      alert('Failed to copy plan');
    }
  };

  const handleDelete = async (plan: any) => {
    setPlanToDelete(plan);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from('race_calculations')
        .delete()
        .eq('id', planToDelete.id);

      if (error) throw error;

      trackPlanDeleted(planToDelete.id, planToDelete.label || 'Untitled Plan');
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    } finally {
      setShowDeleteConfirm(false);
      setPlanToDelete(null);
    }
  };

  const handlePrint = (plan: any) => {
    // Navigate to the race page with the plan parameter
    const raceSlug = plan.races?.slug;
    if (raceSlug) {
      router.push(`/${raceSlug}?plan=${plan.id}`);
    }
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

  return (
    <ProtectedRoute>
      <PageViewTracker pageName="My Plans" />
      <AuthenticatedLayout>
        <Header />
        <div className="min-h-screen bg-surface-background">
          <main className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                {t('title')}
              </h1>
              <p className="text-lg text-text-secondary">{t('subtitle')}</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-lg text-text-secondary">{t('loading')}</div>
              </div>
            ) : Object.keys(groupedPlans).length === 0 ? (
              <div className="bg-surface-1 rounded-lg shadow-md p-12 text-center border border-border">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {t('noPlans')}
                  </h3>
                  <p className="text-text-secondary mb-6">{t('noPlansDescription')}</p>
                  <Link
                    href="/available-races"
                    className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-semibold"
                  >
                    {t('goToAvailableRaces')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* View Toggle */}
                <div className="flex justify-end mb-6">
                  <div className="inline-flex rounded-lg border border-border bg-surface-1 p-1">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t('cardView')}
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'table'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t('tableView')}
                    </button>
                  </div>
                </div>

                {viewMode === 'cards' ? (
                  /* Netflix-Style Card View */
                  <div className="space-y-8">
                    {Object.entries(groupedPlans).map(([raceId, { race, plans }]) => (
                      <div key={raceId}>
                        {/* Race Header */}
                        <div className="mb-4">
                          <h2 className="text-2xl font-bold text-text-primary mb-1">
                            {race?.name || 'Unknown Race'}
                          </h2>
                          <p className="text-sm text-text-muted">
                            {plans.length} {plans.length === 1 ? 'plan' : 'planer'}
                          </p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {plans.map((plan) => (
                            <RacePlanCard
                              key={plan.id}
                              plan={plan}
                              race={race}
                              onEdit={handleEdit}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table View (existing layout) */
                  <div className="space-y-8">
                    {Object.entries(groupedPlans).map(([raceId, { race, plans }]) => (
                      <div key={raceId} className="bg-surface-1 rounded-lg shadow-md border border-border overflow-hidden">
                    {/* Race Header */}
                    <div className="bg-surface-2 px-6 py-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-text-primary">
                            {race?.name || 'Unknown Race'}
                          </h2>
                          {race?.distance_km && (
                            <p className="text-sm text-text-secondary">
                              {race.distance_km} km
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-text-muted">
                          {plans.length} {plans.length === 1 ? 'plan' : 'planer'}
                        </div>
                      </div>
                    </div>

                    {/* Plans List - Mobile Cards */}
                    <div className="md:hidden divide-y divide-border">
                      {plans.map((plan) => {
                        const durationHours = Math.floor(plan.estimated_duration_seconds / 3600);
                        const durationMinutes = Math.floor((plan.estimated_duration_seconds % 3600) / 60);

                        return (
                          <div
                            key={plan.id}
                            className="p-4 hover:bg-surface-2 cursor-pointer transition-colors"
                            onClick={() => handleEdit(plan)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-semibold text-text-primary">
                                {plan.label || tDashboard('untitledPlan')}
                              </h3>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(plan);
                                  }}
                                  className="p-2 rounded-md text-success bg-success-subtle hover:bg-success-subtle-hover transition-colors"
                                  title={tCommon('copy')}
                                >
                                  <DocumentDuplicateIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(plan);
                                  }}
                                  className="p-2 rounded-md text-error bg-error-subtle hover:bg-error-subtle-hover transition-colors"
                                  title={tCommon('delete')}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-text-secondary">{tDashboard('startTime')}:</span>
                                <span className="text-text-primary">
                                  {formatDate(plan.planned_start_time)} {formatTime(plan.planned_start_time)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">{tDashboard('duration')}:</span>
                                <span className="text-text-primary">
                                  {durationHours}h {durationMinutes}m
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">{tDashboard('avgSpeed')}:</span>
                                <span className="text-text-primary">
                                  {plan.required_speed_kmh.toFixed(2)} km/h
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">{t('createdOn')}:</span>
                                <span className="text-text-muted text-xs">
                                  {formatDate(plan.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Plans List - Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-surface-2">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('planName')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('startTime')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('duration')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('finishTime')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('avgSpeed')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              {t('createdOn')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                              {tDashboard('actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-surface-1 divide-y divide-border">
                          {plans.map((plan) => {
                            const durationHours = Math.floor(plan.estimated_duration_seconds / 3600);
                            const durationMinutes = Math.floor((plan.estimated_duration_seconds % 3600) / 60);

                            return (
                              <tr
                                key={plan.id}
                                className="hover:bg-surface-2 cursor-pointer transition-colors"
                                onClick={() => handleEdit(plan)}
                              >
                                <td className="px-4 py-4 text-sm font-medium text-text-primary">
                                  <div className="flex items-center gap-2">
                                    <PencilSquareIcon className="w-4 h-4 text-text-muted" />
                                    {plan.label || tDashboard('untitledPlan')}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {formatDate(plan.planned_start_time)} {formatTime(plan.planned_start_time)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {durationHours}h {durationMinutes}m
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {formatTime(plan.calculated_finish_time)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                  {plan.required_speed_kmh.toFixed(2)} km/h
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted">
                                  {formatDate(plan.created_at)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(plan);
                                      }}
                                      className="p-2 rounded-md text-success bg-success-subtle hover:bg-success-subtle-hover transition-colors"
                                      title={tCommon('copy')}
                                    >
                                      <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(plan);
                                      }}
                                      className="p-2 rounded-md text-error bg-error-subtle hover:bg-error-subtle-hover transition-colors"
                                      title={tCommon('delete')}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
                )}
              </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-surface-background rounded-lg shadow-xl max-w-sm w-full p-6 border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {t('deleteConfirmTitle')}
                  </h3>
                  <p className="text-sm text-text-secondary mb-6">
                    {t('deleteConfirmMessage')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setPlanToDelete(null);
                      }}
                      className="flex-1 px-4 py-2 bg-surface-2 text-text-primary rounded-lg hover:bg-surface-3 transition-colors font-medium border border-border"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Print Modal */}
            {printPlan && printRace && (
              <PrintablePlanView
                plan={printPlan}
                race={printRace}
                onClose={() => {
                  setPrintPlan(null);
                  setPrintRace(null);
                }}
              />
            )}
          </main>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}
