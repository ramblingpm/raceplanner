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
import { formatDateTime } from '@/lib/dateFormat';
import { supabase } from '@/lib/supabase';

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

  // Marketing email state
  const [showMarketingForm, setShowMarketingForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [sendingEmail, setSendingEmail] = useState(false);

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

  async function handleSendMarketingEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) {
      setError(t('mustBeLoggedIn'));
      return;
    }

    if (!emailSubject || !emailHtml) {
      setError(t('marketingEmail.errorSend'));
      return;
    }

    // Calculate recipient count for confirmation
    let recipientCount = 0;
    switch (recipientFilter) {
      case 'all':
        recipientCount = invites.length;
        break;
      case 'approved':
        recipientCount = invites.filter((i) => i.approved).length;
        break;
      case 'approved_not_used':
        recipientCount = invites.filter((i) => i.approved && !i.used).length;
        break;
      case 'used':
        recipientCount = invites.filter((i) => i.used).length;
        break;
      case 'pending':
        recipientCount = invites.filter((i) => !i.approved && !i.used).length;
        break;
    }

    if (recipientCount === 0) {
      setError(t('marketingEmail.noRecipientsError'));
      return;
    }

    const confirmMessage = t('marketingEmail.confirmSend', { count: recipientCount });
    if (!confirm(confirmMessage)) {
      return;
    }

    setSendingEmail(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to send marketing emails');
        setSendingEmail(false);
        return;
      }

      const response = await fetch('/api/send-marketing-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: emailSubject,
          html: emailHtml,
          recipientFilter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('marketingEmail.errorSend'));
      }

      setSuccess(t('marketingEmail.successSent', { count: data.recipientCount }));
      setEmailSubject('');
      setEmailHtml('');
      setRecipientFilter('all');
      setShowMarketingForm(false);
    } catch (err: any) {
      setError(err.message || t('marketingEmail.errorSend'));
      console.error('Error sending marketing email:', err);
    } finally {
      setSendingEmail(false);
    }
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
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setShowMarketingForm(!showMarketingForm);
              setShowAddForm(false);
            }}
            className="px-4 py-2 bg-info text-white rounded-md hover:bg-info-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            {showMarketingForm ? t('cancel') : t('marketingEmail.toggleButton')}
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowMarketingForm(false);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            {showAddForm ? t('cancel') : t('addInvite')}
          </button>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">{t('totalInvites')}</div>
          <div className="text-xl sm:text-2xl font-semibold text-text-primary mt-1">
            {invites.length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">{t('pendingApproval')}</div>
          <div className="text-xl sm:text-2xl font-semibold text-warning mt-1">
            {invites.filter((i) => !i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">{t('approved')}</div>
          <div className="text-xl sm:text-2xl font-semibold text-info mt-1">
            {invites.filter((i) => i.approved && !i.used).length}
          </div>
        </div>
        <div className="bg-surface-background rounded-lg shadow-sm p-4 border border-border">
          <div className="text-xs sm:text-sm text-text-muted">{t('used')}</div>
          <div className="text-xl sm:text-2xl font-semibold text-success mt-1">
            {invites.filter((i) => i.used).length}
          </div>
        </div>
      </div>

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

      {/* Marketing Email Form */}
      {showMarketingForm && (
        <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('marketingEmail.title')}
          </h3>
          <form onSubmit={handleSendMarketingEmail} className="space-y-4">
            <div>
              <label
                htmlFor="emailSubject"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('marketingEmail.subjectLabel')} *
              </label>
              <input
                type="text"
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('marketingEmail.subjectPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="recipientFilter"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('marketingEmail.recipientFilterLabel')} *
              </label>
              <select
                id="recipientFilter"
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              >
                <option value="all">{t('marketingEmail.recipientFilterAll')}</option>
                <option value="approved">{t('marketingEmail.recipientFilterApproved')}</option>
                <option value="approved_not_used">{t('marketingEmail.recipientFilterApprovedNotUsed')}</option>
                <option value="used">{t('marketingEmail.recipientFilterUsed')}</option>
                <option value="pending">{t('marketingEmail.recipientFilterPending')}</option>
              </select>
              <p className="mt-1 text-xs text-text-muted">
                {recipientFilter === 'all' && `${invites.length} recipients`}
                {recipientFilter === 'approved' && `${invites.filter((i) => i.approved).length} recipients`}
                {recipientFilter === 'approved_not_used' && `${invites.filter((i) => i.approved && !i.used).length} recipients`}
                {recipientFilter === 'used' && `${invites.filter((i) => i.used).length} recipients`}
                {recipientFilter === 'pending' && `${invites.filter((i) => !i.approved && !i.used).length} recipients`}
              </p>
            </div>

            <div>
              <label
                htmlFor="emailHtml"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('marketingEmail.htmlLabel')} *
              </label>
              <textarea
                id="emailHtml"
                value={emailHtml}
                onChange={(e) => setEmailHtml(e.target.value)}
                required
                rows={12}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background font-mono text-sm"
                placeholder={t('marketingEmail.htmlPlaceholder')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={sendingEmail}
                className="w-full sm:w-auto px-4 py-2 bg-info text-white rounded-md hover:bg-info-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingEmail ? t('marketingEmail.sending') : t('marketingEmail.sendButton')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMarketingForm(false);
                  setEmailSubject('');
                  setEmailHtml('');
                  setRecipientFilter('all');
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
            {/* Desktop Table View - Always scrollable if needed */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-surface-1 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('email')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('invitedBy')}
                    </th>
                    <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('notes')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('created')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-background divide-y divide-border">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-surface-1">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary max-w-[200px] overflow-hidden text-ellipsis" title={invite.email}>
                          {invite.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted">
                        {invite.invited_by || '-'}
                      </td>
                      <td className="hidden xl:table-cell px-4 py-4 text-sm text-text-muted max-w-[150px] truncate">
                        {invite.notes || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted">
                        {formatDateTime(invite.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
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
                        {formatDateTime(invite.created_at)}
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
    </div>
  );
}
