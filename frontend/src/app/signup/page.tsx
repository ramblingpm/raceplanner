'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signUp } from '@/lib/auth';
import Header from '@/components/Header';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

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

    try {
      // Check if email is invited (beta access)
      const { supabase } = await import('@/lib/supabase');
      const { data: inviteCheck, error: inviteError } = await supabase
        .rpc('is_email_invited', { check_email: email });

      if (inviteError || !inviteCheck) {
        setError(t('betaInviteRequired'));
        setLoading(false);
        return;
      }

      // Proceed with signup
      await signUp(email, password);

      // Mark invite as used
      await supabase.rpc('mark_invite_used', { user_email: email });

      // Set cookie consent (user agreed during signup)
      const { setConsentStatus } = await import('@/lib/consent');
      setConsentStatus('accepted');

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('checkEmailTitle')}</h1>
              <p className="text-gray-600">{t('checkEmailMessage')}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-1">{t('checkEmailSentTo')}: {signupEmail}</p>

            </div>
              
              <div className="text-center mb-6"><p className="text-gray-600">{t('checkSpamFolder')}</p></div>
            <Link
              href="/login"
              className="block w-full text-center bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('signupTitle')}</h1>
          <p className="text-gray-600 mt-2">{t('signupSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('confirmNewPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          {/* Terms and Privacy Checkboxes */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                  required
                />
              </div>
              <label htmlFor="accept-terms" className="ml-2 text-sm text-gray-700">
                I accept the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary-600 hover:text-primary-700 underline"
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
                  className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                  required
                />
              </div>
              <label htmlFor="accept-privacy" className="ml-2 text-sm text-gray-700">
                I accept the{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-primary-600 hover:text-primary-700 underline"
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
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('signingUp') : t('signupButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('loginLink')}
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
