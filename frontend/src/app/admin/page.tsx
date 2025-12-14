'use client';

import { useEffect, useState } from 'react';
import { getBetaInvites, getUsers } from '@/lib/admin';
import type { BetaInvite, User } from '@/lib/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInvites: 0,
    usedInvites: 0,
    pendingInvites: 0,
    totalUsers: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [invites, usersData] = await Promise.all([
          getBetaInvites(),
          getUsers(),
        ]);

        const used = invites.filter((i: BetaInvite) => i.used).length;
        const pending = invites.filter((i: BetaInvite) => !i.used).length;

        setStats({
          totalInvites: invites.length,
          usedInvites: used,
          pendingInvites: pending,
          totalUsers: usersData.length,
        });
        setUsers(usersData);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

        </div>
      </div>

      {/* Users Overview */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary">
            Users Overview
          </h3>
          <p className="text-sm text-text-muted mt-1">
            All registered users and their activity
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-1">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-background divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-4 text-center text-text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-1">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {user.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {user.email_confirmed_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-1 text-text-secondary">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
