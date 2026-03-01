'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('feedback');

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
            <h2 className="text-lg font-semibold text-text-primary">{t('title')}</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary transition-colors"
              aria-label={t('closeModal')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {status === 'success' ? (
              <div className="text-center py-6">
                <CheckCircleIcon className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-text-primary font-medium">{t('successTitle')}</p>
                <p className="text-text-secondary text-sm mt-1">{t('successSubtitle')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {t('messageLabel')} <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('messagePlaceholder')}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {t('emailLabel')}{' '}
                    <span className="text-text-muted font-normal">{t('emailOptional')}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-error">{t('errorMessage')}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading' || !message.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
                  >
                    {status === 'loading' ? t('sending') : t('send')}
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
