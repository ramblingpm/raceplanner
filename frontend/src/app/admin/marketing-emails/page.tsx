'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import PageViewTracker from '@/components/PageViewTracker';

export default function MarketingEmailsPage() {
  const { user } = useAuth();
  const t = useTranslations('admin.marketingEmails');
  const tCommon = useTranslations('common');

  // Form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [recipientType, setRecipientType] = useState<'beta' | 'users'>('beta');
  const [recipientFilter, setRecipientFilter] = useState('pending');
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load recipients when filters change
  useEffect(() => {
    loadRecipients();
  }, [recipientType, recipientFilter]);

  async function loadRecipients() {
    try {
      let emails: string[] = [];

      if (recipientType === 'beta') {
        let query = supabase.from('beta_invites').select('email');

        switch (recipientFilter) {
          case 'pending':
            query = query.eq('approved', false).eq('used', false);
            break;
          case 'approved':
            query = query.eq('approved', true).eq('used', false);
            break;
          case 'used':
            query = query.eq('used', true);
            break;
        }

        const { data } = await query;
        emails = data?.map((item) => item.email) || [];
      } else {
        let query = supabase.from('users').select('email');

        switch (recipientFilter) {
          case 'last_7_days':
            query = query.gte('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            break;
          case 'last_4_weeks':
            query = query
              .gte('last_sign_in_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
              .lt('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            break;
          case 'not_4_weeks':
            query = query.or(`last_sign_in_at.lt.${new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()},last_sign_in_at.is.null`);
            break;
        }

        const { data } = await query;
        emails = data?.map((item) => item.email).filter((email): email is string => !!email) || [];
      }

      setRecipientEmails(emails);
      // Auto-select all emails by default
      setSelectedEmails(new Set(emails));
    } catch (err) {
      console.error('Error loading recipients:', err);
    }
  }

  // Email selection functions
  const toggleEmail = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  };

  const selectAll = () => {
    setSelectedEmails(new Set(recipientEmails));
  };

  const deselectAll = () => {
    setSelectedEmails(new Set());
  };

  // HTML formatting functions
  const insertHtml = (tag: string, content?: string) => {
    const textarea = document.getElementById('email-html') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailHtml.substring(start, end);

    let insertion = '';
    switch (tag) {
      case 'bold':
        insertion = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'italic':
        insertion = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'underline':
        insertion = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'h1':
        insertion = `<h1>${selectedText || 'Heading 1'}</h1>`;
        break;
      case 'h2':
        insertion = `<h2>${selectedText || 'Heading 2'}</h2>`;
        break;
      case 'h3':
        insertion = `<h3>${selectedText || 'Heading 3'}</h3>`;
        break;
      case 'p':
        insertion = `<p>${selectedText || 'Paragraph text'}</p>`;
        break;
      case 'link':
        insertion = `<a href="https://example.com">${selectedText || 'Link text'}</a>`;
        break;
      case 'ul':
        insertion = `<ul>\n  <li>${selectedText || 'List item 1'}</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ul>`;
        break;
      case 'ol':
        insertion = `<ol>\n  <li>${selectedText || 'List item 1'}</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ol>`;
        break;
      case 'br':
        insertion = '<br>';
        break;
      case 'hr':
        insertion = '<hr>';
        break;
      default:
        if (content) insertion = content;
    }

    const newHtml = emailHtml.substring(0, start) + insertion + emailHtml.substring(end);
    setEmailHtml(newHtml);

    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertion.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailHtml.trim()) {
      setError(t('errorEmptyFields'));
      return;
    }

    if (selectedEmails.size === 0) {
      setError(t('errorNoRecipientsSelected'));
      return;
    }

    // Check Resend BCC limit
    if (selectedEmails.size > 50) {
      setError(t('errorTooManyRecipients'));
      return;
    }

    const confirmMessage = t('confirmSend', { count: selectedEmails.size });
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
        setError(t('errorNotLoggedIn'));
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
          recipients: Array.from(selectedEmails),
        }),
      });

      // Try to parse JSON response with better error handling
      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server. Please check server logs.');
      }

      if (!response.ok) {
        throw new Error(data.error || t('errorSend'));
      }

      setSuccess(t('successSent', { count: data.recipientCount }));
      setEmailSubject('');
      setEmailHtml('');
    } catch (err: any) {
      console.error('Error sending marketing email:', err);
      setError(err.message || t('errorSend'));
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageViewTracker pageName="Admin: Marketing Emails" />

      <div>
        <h2 className="text-2xl font-bold text-text-primary">{t('title')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
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

      {/* Email Form */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <div className="space-y-4">
          {/* Email Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">
              {t('subjectLabel')}
            </label>
            <input
              type="text"
              id="subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder={t('subjectPlaceholder')}
            />
          </div>

          {/* HTML Formatting Toolbar */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('htmlLabel')}
            </label>
            <div className="bg-surface-2 border border-border rounded-t-md p-2 flex flex-wrap gap-1">
              {/* Text formatting */}
              <button
                type="button"
                onClick={() => insertHtml('bold')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm font-bold"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertHtml('italic')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm italic"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertHtml('underline')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm underline"
                title="Underline"
              >
                U
              </button>

              <div className="w-px bg-border mx-1"></div>

              {/* Headings */}
              <button
                type="button"
                onClick={() => insertHtml('h1')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertHtml('h2')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertHtml('h3')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Heading 3"
              >
                H3
              </button>

              <div className="w-px bg-border mx-1"></div>

              {/* Paragraph and lists */}
              <button
                type="button"
                onClick={() => insertHtml('p')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Paragraph"
              >
                ¶
              </button>
              <button
                type="button"
                onClick={() => insertHtml('ul')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertHtml('ol')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Numbered List"
              >
                1. List
              </button>

              <div className="w-px bg-border mx-1"></div>

              {/* Link and breaks */}
              <button
                type="button"
                onClick={() => insertHtml('link')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Link"
              >
                🔗 Link
              </button>
              <button
                type="button"
                onClick={() => insertHtml('br')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Line Break"
              >
                ↵ Break
              </button>
              <button
                type="button"
                onClick={() => insertHtml('hr')}
                className="px-2 py-1 bg-surface-background border border-border rounded hover:bg-surface-3 text-sm"
                title="Horizontal Rule"
              >
                ― Rule
              </button>

              <div className="flex-1"></div>

              {/* Preview toggle */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 bg-info text-white rounded hover:bg-info-hover text-sm"
              >
                {showPreview ? '📝 Edit' : '👁 Preview'}
              </button>
            </div>

            {/* HTML Editor or Preview */}
            {showPreview ? (
              <div className="w-full min-h-[300px] p-4 border border-border border-t-0 rounded-b-md bg-white text-text-primary overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
              </div>
            ) : (
              <textarea
                id="email-html"
                value={emailHtml}
                onChange={(e) => setEmailHtml(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-border border-t-0 rounded-b-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background font-mono text-sm"
                placeholder={t('htmlPlaceholder')}
              />
            )}
          </div>

          {/* Recipient Type */}
          <div>
            <label htmlFor="recipient-type" className="block text-sm font-medium text-text-secondary mb-2">
              {t('recipientTypeLabel')}
            </label>
            <select
              id="recipient-type"
              value={recipientType}
              onChange={(e) => {
                const newType = e.target.value as 'beta' | 'users';
                setRecipientType(newType);
                setRecipientFilter(newType === 'beta' ? 'pending' : 'last_7_days');
              }}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
            >
              <option value="beta">{t('recipientTypeBeta')}</option>
              <option value="users">{t('recipientTypeUsers')}</option>
            </select>
          </div>

          {/* Recipient Filter */}
          <div>
            <label htmlFor="recipient-filter" className="block text-sm font-medium text-text-secondary mb-2">
              {t('recipientFilterLabel')}
            </label>
            <select
              id="recipient-filter"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
            >
              {recipientType === 'beta' ? (
                <>
                  <option value="pending">{t('recipientFilterPending')}</option>
                  <option value="approved">{t('recipientFilterApproved')}</option>
                  <option value="used">{t('recipientFilterUsed')}</option>
                </>
              ) : (
                <>
                  <option value="last_7_days">{t('recipientFilterLast7Days')}</option>
                  <option value="last_4_weeks">{t('recipientFilterLast4Weeks')}</option>
                  <option value="not_4_weeks">{t('recipientFilterNot4Weeks')}</option>
                </>
              )}
            </select>
          </div>

          {/* Recipients List */}
          {recipientEmails.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-secondary">
                  {t('recipientsListLabel')} ({selectedEmails.size} {t('of')} {recipientEmails.length} {t('selected')})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-info hover:text-info-hover font-medium"
                  >
                    {t('selectAll')}
                  </button>
                  <span className="text-text-muted">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-info hover:text-info-hover font-medium"
                  >
                    {t('deselectAll')}
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-md p-3 max-h-60 overflow-y-auto bg-surface-1">
                <div className="space-y-2">
                  {recipientEmails.map((email) => (
                    <label
                      key={email}
                      className="flex items-center gap-2 cursor-pointer hover:bg-surface-2 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(email)}
                        onChange={() => toggleEmail(email)}
                        className="rounded border-border text-primary focus:ring-border-focus"
                      />
                      <span className="text-sm text-text-primary">{email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || selectedEmails.size === 0}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {sendingEmail ? t('sending') : t('sendButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
