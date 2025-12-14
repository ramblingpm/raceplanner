'use client';

import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/admin';
import type { User } from '@/lib/admin';
import { formatDate, formatDateTime } from '@/lib/dateFormat';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
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

  // Calculate stats
  const confirmedUsers = users.filter(u => u.email_confirmed_at).length;
  const pendingUsers = users.filter(u => !u.email_confirmed_at).length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyActiveUsers = users.filter(u =>
    u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Users</h2>
        <p className="mt-1 text-sm text-text-muted">
          All registered users and their activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">Total Users</div>
          <div className="text-xl sm:text-2xl font-semibold text-text-primary mt-1">
            {users.length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">Confirmed</div>
          <div className="text-xl sm:text-2xl font-semibold text-success mt-1">
            {confirmedUsers}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">Pending</div>
          <div className="text-xl sm:text-2xl font-semibold text-warning mt-1">
            {pendingUsers}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">Active (7 days)</div>
          <div className="text-xl sm:text-2xl font-semibold text-info mt-1">
            {recentlyActiveUsers}
          </div>
        </div>
      </div>

      {/* Users Overview */}
      <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                Users Overview
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {users.length} registered user{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
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
                      {mounted ? formatDate(user.created_at) : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {mounted ? formatDateTime(user.last_sign_in_at) : '-'}
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
