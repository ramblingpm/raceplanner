'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const { error } = await supabase.functions.invoke('submit-feedback', {
      body: {
        message,
        email: email || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      },
    });

    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setTimeout(() => {
        setMessage('');
        setEmail('');
        setStatus('idle');
        onClose();
      }, 2000);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div className="relative bg-surface-background rounded-lg shadow-xl w-full max-w-md border border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Send Feedback</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {status === 'success' ? (
              <div className="text-center py-6">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-text-primary font-medium">Thanks for your feedback!</p>
                <p className="text-text-secondary text-sm mt-1">We appreciate you taking the time.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Your feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind? Bug reports, ideas, anything..."
                    required
                    rows={4}
                    className="w-full border border-border rounded-md p-2 text-sm bg-surface-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Email{' '}
                    <span className="text-text-muted font-normal">(optional, if you want a reply)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-border rounded-md p-2 text-sm bg-surface-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-500 text-sm">Something went wrong. Please try again.</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading' || !message.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
