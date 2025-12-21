'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signIn, trackUserLogin } from '@/lib/auth';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { trackFormStart, trackFormSubmit } from '@/lib/analytics';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const handleFormStart = () => {
    if (!formStarted) {
      trackFormStart('login_form', { page: 'login' });
      setFormStarted(true);
    }
  };

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccess(t('passwordResetSuccess'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Track form submission attempt
    trackFormSubmit('login_form', { page: 'login' });

    try {
      const { user } = await signIn(email, password);

      // Track user login in GA4
      if (user) {
        await trackUserLogin(user);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1">
      <PageViewTracker pageName="Login Page" />
      <Header />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">{t('loginTitle')}</h1>
          <p className="text-text-secondary mt-2">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error-subtle text-error-foreground p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success-subtle text-success-foreground p-3 rounded-md text-sm">
              {success}
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
              onFocus={handleFormStart}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary"
              >
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-text-link hover:text-text-link-hover"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('noAccount')}{' '}
          <Link
            href="/signup"
            className="text-text-link hover:text-text-link-hover font-medium"
          >
            {t('signupLink')}
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
