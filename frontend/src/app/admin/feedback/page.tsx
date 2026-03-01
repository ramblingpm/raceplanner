'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Feedback {
  id: string;
  created_at: string;
  message: string;
  email: string | null;
  page_url: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  status: 'submitted' | 'synced' | 'failed';
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to load feedback');

      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusColor: Record<Feedback['status'], string> = {
    submitted: 'bg-warning-subtle text-warning border-warning',
    synced: 'bg-success-subtle text-success border-success',
    failed: 'bg-error-subtle text-error border-error',
  };

  if (loading) {
    return (
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <div className="text-center text-text-muted">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Feedback</h2>
          <p className="text-sm text-text-muted mt-1">
            {feedback.length} submission{feedback.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-subtle border border-error rounded-lg p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="bg-surface-background rounded-lg shadow-sm border border-border p-12 text-center">
          <p className="text-text-muted">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="bg-surface-background rounded-lg shadow-sm border border-border p-5"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-text-muted">{formatDate(item.created_at)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusColor[item.status]}`}>
                    {item.status}
                  </span>
                  {item.github_issue_url && (
                    <a
                      href={item.github_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      #{item.github_issue_number}
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {item.email && (
                  <a
                    href={`mailto:${item.email}`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    {item.email}
                  </a>
                )}
              </div>

              {/* Message */}
              <p className="text-sm text-text-primary whitespace-pre-wrap">{item.message}</p>

              {/* Page URL */}
              {item.page_url && (
                <p className="text-xs text-text-muted mt-3 truncate">
                  {item.page_url}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
