'use client';

import { useEffect, useState } from 'react';
import { getBetaInvites, getUsers, getRacePlansStats } from '@/lib/admin';
import type { BetaInvite } from '@/lib/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInvites: 0,
    usedInvites: 0,
    pendingInvites: 0,
    totalUsers: 0,
    totalPlans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [invites, usersData, planStats] = await Promise.all([
          getBetaInvites().catch(err => { console.error('Error loading invites:', err); return []; }),
          getUsers().catch(err => { console.error('Error loading users:', err); return []; }),
          getRacePlansStats().catch(err => { console.error('Error loading plan stats:', err); return { total_plans: 0, total_users_with_plans: 0, plans_per_race: [] }; }),
        ]);

        const used = invites.filter((i: BetaInvite) => i.used).length;
        const pending = invites.filter((i: BetaInvite) => !i.used).length;

        setStats({
          totalInvites: invites.length,
          usedInvites: used,
          pendingInvites: pending,
          totalUsers: usersData.length,
          totalPlans: planStats.total_plans,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
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
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Admin Overview</h2>
        <p className="mt-1 text-sm text-text-muted">
          Manage your application settings and users
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">Total Users</p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-text-primary">
                {stats.totalUsers}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-info"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">Total Invites</p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-text-primary">
                {stats.totalInvites}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-info"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">Used Invites</p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-success">
                {stats.usedInvites}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">
                Pending Invites
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-warning">
                {stats.pendingInvites}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary">
                Total Race Plans
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-text-primary">
                {stats.totalPlans}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-info"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-background rounded-lg shadow-sm p-4 sm:p-6 border border-border">
        <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/admin/beta-invites"
            className="flex items-center p-4 border border-border rounded-lg hover:bg-surface-1 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-text-primary">Manage Beta Invites</p>
              <p className="text-sm text-text-muted">
                Add, view, and manage beta invitations
              </p>
            </div>
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>

          <a
            href="/admin/users"
            className="flex items-center p-4 border border-border rounded-lg hover:bg-surface-1 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-text-primary">View Users</p>
              <p className="text-sm text-text-muted">
                See all registered users and their activity
              </p>
            </div>
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>

          <a
            href="/admin/races"
            className="flex items-center p-4 border border-border rounded-lg hover:bg-surface-1 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-text-primary">View Race Plans</p>
              <p className="text-sm text-text-muted">
                See all race plans and user activity
              </p>
            </div>
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
