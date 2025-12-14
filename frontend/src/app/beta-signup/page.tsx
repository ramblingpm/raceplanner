'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Turnstile } from '@marsidev/react-turnstile';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { trackFormStart, trackFormSubmit } from '@/lib/analytics';

export default function BetaSignupPage() {
  const t = useTranslations('betaSignup');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const handleFormStart = () => {
    if (!formStarted) {
      trackFormStart('beta_signup_form', { page: 'beta-signup' });
      setFormStarted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t('mustAcceptTerms'));
      return;
    }

    setLoading(true);

    // Track form submission attempt
    trackFormSubmit('beta_signup_form', { page: 'beta-signup' });

    try {
      const { supabase } = await import('@/lib/supabase');

      // Use secure RPC function to handle beta signup
      // This function always returns success to prevent email enumeration
      // It silently handles duplicates without exposing if emails exist
      const { error: rpcError } = await supabase.rpc('request_beta_access', {
        signup_email: email.toLowerCase(),
        signup_notes: 'Beta signup request from landing page'
      });

      if (rpcError) {
        throw rpcError;
      }

      // Send confirmation emails (to user and admin)
      // Don't block success UI on email sending - it's best-effort
      fetch('/api/beta-signup-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          turnstileToken: turnstileToken
        }),
      }).catch((emailError) => {
        // Log but don't show error to user - emails are best-effort
        console.error('Failed to send beta signup emails:', emailError);
      });

      // Always show success to prevent information disclosure
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit beta signup request');
    } finally {
      setLoading(false);
    }
  };

  // Show success message if request was successful
  if (success) {
    return (
      <div className="min-h-screen bg-surface-background">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-subtle mb-4">
                <svg className="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">{t('successTitle')}</h1>
              <p className="text-text-secondary leading-relaxed">
                {t('successMessage')} <strong>{email}</strong> {t('successMessageEnd')}
              </p>
            </div>

            <div className="bg-info-subtle border border-info rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-info-foreground mb-2">{t('whatHappensNext')}</h3>
              <ul className="text-sm text-info-foreground space-y-1">
                <li>• {t('step1')}</li>
                <li>• {t('step2')}</li>
                <li>• {t('step3')}</li>
              </ul>
            </div>

            <Link
              href="/"
              className="block w-full text-center bg-surface-inverse text-text-inverse py-3 px-4 rounded-lg hover:opacity-90 transition-colors font-semibold"
            >
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-background">
      <PageViewTracker pageName="Beta Signup Page" />
      <Header />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-background rounded-lg shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-inverse text-text-inverse rounded-full text-xs font-semibold mb-4">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              {t('badge')}
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">{t('title')}</h1>
            <p className="text-text-secondary leading-relaxed">
              {tCommon('appName')} {t('subtitle1')} {t('subtitle2')}
            </p>
          </div>

          <div className="bg-surface-1 border border-border rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-2">{t('featuresTitle')}</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>✓ {t('feature1')}</li>
              <li>✓ {t('feature2')}</li>
              <li>✓ {t('feature3')}</li>
              <li>✓ {t('feature4')}</li>
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
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFormStart}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent text-text-primary bg-surface-background"
                placeholder={t('emailPlaceholder')}
              />
              <p className="mt-2 text-xs text-text-muted">
                {t('emailHelper')}
              </p>
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
                  {t('acceptTerms')}{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-text-link hover:text-text-link-hover underline font-medium"
                  >
                    {t('termsOfService')}
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
                  {t('acceptPrivacy')}{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="text-text-link hover:text-text-link-hover underline font-medium"
                  >
                    {t('privacyPolicy')}
                  </Link>
                </label>
              </div>
            </div>

            {/* Turnstile Bot Protection */}
            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => {
                  console.log('✅ Turnstile token received');
                  setTurnstileToken(token);
                }}
                onError={() => {
                  console.error('❌ Turnstile error');
                  setTurnstileToken('');
                }}
                onExpire={() => {
                  console.log('⏱️ Turnstile token expired');
                  setTurnstileToken('');
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms || !acceptedPrivacy || !turnstileToken}
              className="w-full bg-surface-inverse text-text-inverse py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? t('submitting') : t('requestAccess')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            {t('alreadyHaveAccess')}{' '}
            <Link
              href="/login"
              className="text-text-link hover:text-text-link-hover font-medium underline"
            >
              {t('signInHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
