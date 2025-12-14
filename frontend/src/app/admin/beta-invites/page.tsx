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
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{t('title')}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 transition-colors whitespace-nowrap"
        >
          {showAddForm ? t('cancel') : t('addInvite')}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success-subtle text-success-foreground p-3 rounded-md text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-error-subtle text-error-foreground p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('addNewTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('emailLabel')} *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="invitedBy"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('invitedByLabel')}
              </label>
              <input
                type="text"
                id="invitedBy"
                value={invitedBy}
                onChange={(e) => setInvitedBy(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('invitedByPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('notesLabel')}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('notesPlaceholder')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="w-full sm:w-auto px-4 py-2 bg-surface-2 text-text-secondary rounded-md hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invites Table */}
      <div className="bg-surface-background rounded-lg shadow-sm overflow-hidden border border-border">
        {loading ? (
          <div className="p-8 text-center text-text-muted">{t('loading')}</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {t('noInvites')}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-1 border-b border-border">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('invitedBy')}
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('notes')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('created')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-background divide-y divide-border">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-surface-1">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium text-text-primary break-all">
                          {invite.email}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        {invite.used ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success-foreground">
                            {t('statusUsed')}
                          </span>
                        ) : invite.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-subtle text-info-foreground">
                            {t('statusApproved')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-subtle text-warning-foreground">
                            {t('statusPendingApproval')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {invite.invited_by || '-'}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                        {invite.notes || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        <span className="hidden lg:inline">{formatDate(invite.created_at)}</span>
                        <span className="lg:hidden">{new Date(invite.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          {!invite.approved && !invite.used && (
                            <button
                              onClick={() => handleApprove(invite.id)}
                              className="text-info hover:text-info-hover font-medium"
                            >
                              {t('approve')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invite.id)}
                            className="text-error hover:text-error-hover"
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
            <div className="md:hidden divide-y divide-border">
              {invites.map((invite) => (
                <div key={invite.id} className="p-4 hover:bg-surface-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary break-all">
                        {invite.email}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {formatDate(invite.created_at)}
                      </div>
                    </div>
                    <div className="ml-2">
                      {invite.used ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success-foreground">
                          {t('statusUsed')}
                        </span>
                      ) : invite.approved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info-subtle text-info-foreground">
                          {t('statusApproved')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-subtle text-warning-foreground">
                          {t('statusPendingApproval')}
                        </span>
                      )}
                    </div>
                  </div>
                  {invite.invited_by && (
                    <div className="text-xs text-text-muted mb-1">
                      <span className="font-medium">{t('invitedBy')}:</span> {invite.invited_by}
                    </div>
                  )}
                  {invite.notes && (
                    <div className="text-xs text-text-muted mb-2">
                      <span className="font-medium">{t('notes')}:</span> {invite.notes}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {!invite.approved && !invite.used && (
                      <button
                        onClick={() => handleApprove(invite.id)}
                        className="text-sm text-info hover:text-info-hover font-medium"
                      >
                        {t('approve')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(invite.id)}
                      className="text-sm text-error hover:text-error-hover font-medium"
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
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-text-muted">{t('totalInvites')}</div>
          <div className="text-2xl font-semibold text-text-primary mt-1">
            {invites.length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-text-muted">{t('pendingApproval')}</div>
          <div className="text-2xl font-semibold text-warning mt-1">
            {invites.filter((i) => !i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-text-muted">{t('approved')}</div>
          <div className="text-2xl font-semibold text-info mt-1">
            {invites.filter((i) => i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-text-muted">{t('used')}</div>
          <div className="text-2xl font-semibold text-success mt-1">
            {invites.filter((i) => i.used).length}
          </div>
        </div>
      </div>
    </div>
  );
}
