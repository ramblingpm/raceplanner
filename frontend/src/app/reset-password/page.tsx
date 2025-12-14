'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updatePassword } from '@/lib/auth';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');

      if (type === 'recovery') {
        setIsValidSession(true);
      } else {
        setError(t('invalidResetLink'));
      }
    };

    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      router.push('/login?reset=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updatePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1 px-4">
        <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-4">{t('resetPasswordTitle')}</h1>
            <div className="bg-error-subtle text-error-foreground p-4 rounded-md text-sm">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 px-4">
      <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">{t('resetPasswordTitle')}</h1>
          <p className="text-text-secondary mt-2">{t('resetPasswordSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error-subtle text-error-foreground p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              {t('newPassword')}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              {t('confirmNewPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('updatingPassword') : t('updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
