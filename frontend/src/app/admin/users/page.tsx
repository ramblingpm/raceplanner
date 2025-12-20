'use client';

import { useEffect, useState, useMemo } from 'react';
import { getUsers } from '@/lib/admin';
import type { User } from '@/lib/admin';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SortColumn = 'email' | 'status' | 'role' | 'created' | 'last_sign_in_at';
type SortDirection = 'asc' | 'desc';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default ascending direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'status':
          aValue = a.email_confirmed_at ? 1 : 0;
          bValue = b.email_confirmed_at ? 1 : 0;
          break;
        case 'role':
          aValue = a.is_admin ? 1 : 0;
          bValue = b.is_admin ? 1 : 0;
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [users, sortColumn, sortDirection]);

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
                <SortableHeader
                  column="email"
                  label="Email"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="role"
                  label="Role"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="created"
                  label="Created"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="last_sign_in_at"
                  label="Last Login"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="bg-surface-background divide-y divide-border">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-4 text-center text-text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
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

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

function SortableHeader({ column, label, sortColumn, sortDirection, onSort }: SortableHeaderProps) {
  const isActive = sortColumn === column;

  return (
    <th
      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-2 transition-colors select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="w-4 h-4 flex items-center justify-center">
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUpIcon className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-primary" />
            )
          ) : (
            <div className="flex flex-col gap-0">
              <ChevronUpIcon className="w-4 h-4 text-text-muted opacity-20" />
              <ChevronDownIcon className="w-4 h-4 -mt-2 text-text-muted opacity-20" />
            </div>
          )}
        </div>
      </div>
    </th>
  );
}
