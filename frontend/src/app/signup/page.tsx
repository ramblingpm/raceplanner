'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signUp, trackUserSignup } from '@/lib/auth';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { trackFormStart, trackFormSubmit } from '@/lib/analytics';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const handleFormStart = () => {
    if (!formStarted) {
      trackFormStart('signup_form', { page: 'signup' });
      setFormStarted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);

    // Track form submission attempt
    trackFormSubmit('signup_form', { page: 'signup' });

    try {
      // Proceed with signup
      const { user } = await signUp(email, password);

      // Set cookie consent (user agreed during signup)
      const { setConsentStatus } = await import('@/lib/consent');
      setConsentStatus('accepted');

      // Track user signup in GA4
      if (user) {
        await trackUserSignup(user);
      }

      // Show success message
      setSignupEmail(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  // Show success message if signup was successful
  if (success) {
    return (
      <div className="min-h-screen bg-surface-1">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-subtle mb-4">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{t('checkEmailTitle')}</h1>
              <p className="text-text-secondary">{t('checkEmailMessage')}</p>
            </div>

            <div className="bg-info-subtle border border-info rounded-md p-4 mb-6">
              <p className="text-sm text-info-foreground font-medium mb-1">{t('checkEmailSentTo')}: {signupEmail}</p>

            </div>

              <div className="text-center mb-6"><p className="text-text-secondary">{t('checkSpamFolder')}</p></div>
            <Link
              href="/login"
              className="block w-full text-center bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1">
      <PageViewTracker pageName="Signup Page" />
      <Header />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold mb-4">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            {t('betaBadge')}
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">{t('signupTitle')}</h1>
          <p className="text-text-secondary leading-relaxed">
            {t('betaSubtitle')}
          </p>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-2">{t('betaFeaturesTitle')}</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>✓ {t('betaFeature1')}</li>
            <li>✓ {t('betaFeature2')}</li>
            <li>✓ {t('betaFeature3')}</li>
            <li>✓ {t('betaFeature4')}</li>
          </ul>
        </div>

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
              onFocus={handleFormStart}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              {t('password')}
            </label>
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
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          {/* Terms and Privacy Checkboxes */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 border-border rounded text-primary focus:ring-border-focus"
                  required
                />
              </div>
              <label htmlFor="accept-terms" className="ml-2 text-sm text-text-secondary">
                I accept the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-text-link hover:text-text-link-hover underline"
                >
                  Terms of Service
                </Link>
              </label>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-privacy"
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="w-4 h-4 border-border rounded text-primary focus:ring-border-focus"
                  required
                />
              </div>
              <label htmlFor="accept-privacy" className="ml-2 text-sm text-text-secondary">
                I accept the{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-text-link hover:text-text-link-hover underline"
                >
                  Privacy Policy
                </Link>
                {' '}and consent to cookies for analytics
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms || !acceptedPrivacy}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('signingUp') : t('signupButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="text-text-link hover:text-text-link-hover font-medium"
          >
            {t('loginLink')}
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
