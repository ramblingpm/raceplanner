'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { resetPasswordRequest } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPasswordRequest(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 px-4">
      <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">{t('forgotPasswordTitle')}</h1>
          <p className="text-text-secondary mt-2">{t('forgotPasswordSubtitle')}</p>
        </div>

        {success ? (
          <div className="bg-success-subtle text-success-foreground p-4 rounded-md text-sm mb-6">
            {t('resetPasswordEmailSent')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-subtle text-error-foreground p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('sendingResetLink') : t('sendResetLink')}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link
            href="/login"
            className="text-text-link hover:text-text-link-hover font-medium"
          >
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
