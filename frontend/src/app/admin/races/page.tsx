'use client';

import { useEffect, useState } from 'react';
import { getRacePlansStats, getUserRacePlans } from '@/lib/admin';
import type { RacePlanStats, UserRacePlans } from '@/lib/admin';
import { formatDate, formatDateTime } from '@/lib/dateFormat';

export default function RacesPage() {
  const [racePlanStats, setRacePlanStats] = useState<RacePlanStats | null>(null);
  const [userRacePlans, setUserRacePlans] = useState<UserRacePlans[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [planStats, userPlans] = await Promise.all([
          getRacePlansStats().catch(err => {
            console.error('Error loading plan stats:', err);
            return { total_plans: 0, total_users_with_plans: 0, plans_per_race: [] };
          }),
          getUserRacePlans().catch(err => {
            console.error('Error loading user plans:', err);
            return [];
          }),
        ]);

        setRacePlanStats(planStats);
        setUserRacePlans(userPlans);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <div className="text-center text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Race Plans</h2>
          <p className="mt-1 text-sm text-text-muted">
            Overview of all race plans and user activity
          </p>
        </div>
        <a
          href="/admin/races/create"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          + Create Race
        </a>
      </div>

      {/* Race Plans Per Race */}
      {racePlanStats && racePlanStats.plans_per_race && (
        <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <h3 className="text-base sm:text-lg font-semibold text-text-primary">
              Race Plans by Race
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Total plans created for each race
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-1">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Race Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Total Plans
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Unique Users
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-background divide-y divide-border">
                {racePlanStats.plans_per_race.map((race) => (
                  <tr key={race.race_id} className="hover:bg-surface-1">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {race.race_name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {race.plan_count}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {race.unique_users}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Race Plans with Accordion */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary">
            User Race Plans
          </h3>
          <p className="text-sm text-text-muted mt-1">
            View all race plans created by each user
          </p>
        </div>
        <div className="divide-y divide-border">
          {userRacePlans.length === 0 ? (
            <div className="px-4 sm:px-6 py-4 text-center text-text-muted">
              No race plans found
            </div>
          ) : (
            userRacePlans.map((userPlan) => (
              <div key={userPlan.user_id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() =>
                    setExpandedUser(
                      expandedUser === userPlan.user_id ? null : userPlan.user_id
                    )
                  }
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-surface-1 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <p className="text-sm font-medium text-text-primary">
                        {userPlan.user_email}
                      </p>
                      <p className="text-xs text-text-muted">
                        {userPlan.plan_count} plan{userPlan.plan_count !== 1 ? 's' : ''} • Last
                        updated:{' '}
                        {mounted ? formatDate(userPlan.last_plan_created_at) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                      {userPlan.plan_count}
                    </span>
                    <svg
                      className={`w-5 h-5 text-text-muted transition-transform ${
                        expandedUser === userPlan.user_id ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedUser === userPlan.user_id && (
                  <div className="px-4 sm:px-6 py-4 bg-surface-1 border-t border-border">
                    <div className="space-y-3">
                      {userPlan.plans.map((plan) => (
                        <div
                          key={plan.plan_id}
                          className="p-3 bg-surface-background rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">
                                {plan.race_name}
                              </p>
                              <p className="text-xs text-text-muted mt-1">
                                Planned start:{' '}
                                {mounted ? formatDateTime(plan.planned_start_time) : '-'}
                              </p>
                              <p className="text-xs text-text-muted">
                                Average speed: {plan.required_speed_kmh.toFixed(1)} km/h
                              </p>
                              <p className="text-xs text-text-muted">
                                Created: {mounted ? formatDateTime(plan.created_at) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
