'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getBetaInvites,
  createBetaInvite,
  deleteBetaInvite,
  approveBetaInvite,
  type BetaInvite,
} from '@/lib/admin';
import { useAuth } from '@/components/AuthProvider';

export default function BetaInvitesPage() {
  const { user } = useAuth();
  const t = useTranslations('admin.betaInvites');
  const [invites, setInvites] = useState<BetaInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    try {
      setLoading(true);
      const data = await getBetaInvites();
      setInvites(data);
      setError(null);
    } catch (err) {
      setError(t('errorLoad'));
      console.error('Error loading invites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createBetaInvite(email.trim(), invitedBy.trim() || undefined, notes.trim() || undefined);
      setSuccess(t('successCreated'));
      setEmail('');
      setInvitedBy('');
      setNotes('');
      setShowAddForm(false);
      await loadInvites();
    } catch (err: any) {
      setError(err.message || t('errorCreate'));
      console.error('Error creating invite:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(inviteId: string) {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      await deleteBetaInvite(inviteId);
      setSuccess(t('successDeleted'));
      await loadInvites();
    } catch (err: any) {
      setError(err.message || t('errorDelete'));
      console.error('Error deleting invite:', err);
    }
  }

  async function handleApprove(inviteId: string) {
    if (!user?.id) {
      setError(t('mustBeLoggedIn'));
      return;
    }

    if (!confirm(t('confirmApprove'))) {
      return;
    }

    try {
      await approveBetaInvite(inviteId, user.id);
      setSuccess(t('successApproved'));
      await loadInvites();
    } catch (err: any) {
      setError(err.message || t('errorApprove'));
      console.error('Error approving invite:', err);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
        >
          {showAddForm ? t('cancel') : t('addInvite')}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('addNewTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('emailLabel')} *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="invitedBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('invitedByLabel')}
              </label>
              <input
                type="text"
                id="invitedBy"
                value={invitedBy}
                onChange={(e) => setInvitedBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={t('invitedByPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('notesLabel')}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder={t('notesPlaceholder')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('creating') : t('createInvite')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEmail('');
                  setInvitedBy('');
                  setNotes('');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invites Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('loading')}</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('noInvites')}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('invitedBy')}
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('notes')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('created')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 break-all">
                          {invite.email}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        {invite.used ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('statusUsed')}
                          </span>
                        ) : invite.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t('statusApproved')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('statusPendingApproval')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invite.invited_by || '-'}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {invite.notes || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="hidden lg:inline">{formatDate(invite.created_at)}</span>
                        <span className="lg:hidden">{new Date(invite.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          {!invite.approved && !invite.used && (
                            <button
                              onClick={() => handleApprove(invite.id)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              {t('approve')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invite.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {invites.map((invite) => (
                <div key={invite.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 break-all">
                        {invite.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(invite.created_at)}
                      </div>
                    </div>
                    <div className="ml-2">
                      {invite.used ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('statusUsed')}
                        </span>
                      ) : invite.approved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('statusApproved')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {t('statusPendingApproval')}
                        </span>
                      )}
                    </div>
                  </div>
                  {invite.invited_by && (
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">{t('invitedBy')}:</span> {invite.invited_by}
                    </div>
                  )}
                  {invite.notes && (
                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium">{t('notes')}:</span> {invite.notes}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {!invite.approved && !invite.used && (
                      <button
                        onClick={() => handleApprove(invite.id)}
                        className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {t('approve')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(invite.id)}
                      className="text-sm text-red-600 hover:text-red-900 font-medium"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">{t('totalInvites')}</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {invites.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">{t('pendingApproval')}</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">
            {invites.filter((i) => !i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">{t('approved')}</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">
            {invites.filter((i) => i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500">{t('used')}</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">
            {invites.filter((i) => i.used).length}
          </div>
        </div>
      </div>
    </div>
  );
}
