import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Integritetspolicy - Race Planner',
  description: 'Läs vår integritetspolicy för att förstå hur vi samlar in, använder och skyddar din personliga information.',
  url: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  const t = useTranslations('common');
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacy@raceplanner.com';
  const appName = t('appName');

  return (
    <div className="min-h-screen bg-surface-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-surface-background rounded-lg shadow-sm p-6 sm:p-8 border border-border">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-sm text-text-muted mb-8">Last updated: {new Date().toLocaleDateString()} . English version only.</p>

          <div className="prose prose-sm sm:prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">1. Introduction</h2>
              <p className="text-text-secondary">
                Welcome to {appName}. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and protect your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">2.1 Personal Information</h3>
              <p className="text-text-secondary mb-2">We collect the following personal information:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1 ml-4">
                <li>Email address (for account creation and authentication)</li>
                <li>Race calculations and planning data you create</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <p className="text-text-secondary mb-2">We automatically collect:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1 ml-4">
                <li>Usage data via Google Analytics (with your consent)</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Pages visited and time spent on pages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
              <p className="text-text-secondary mb-2">We use your information to:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1 ml-4">
                <li>Provide and maintain our service</li>
                <li>Authenticate your account</li>
                <li>Save and display your race calculations</li>
                <li>Improve our service and user experience</li>
                <li>Analyze usage patterns (with your consent via Google Analytics)</li>
                <li>Communicate important updates about the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">4. Cookies and Tracking</h2>
              <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">4.1 Essential Cookies</h3>
              <p className="text-text-secondary mb-2">We use essential cookies that are necessary for the service to function:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1 ml-4">
                <li>Authentication cookies (Supabase session)</li>
                <li>Language preference cookie (NEXT_LOCALE)</li>
                <li>Cookie consent preference</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">4.2 Analytics Cookies (Requires Consent)</h3>
              <p className="text-text-secondary">
                With your consent, we use Google Analytics to understand how users interact with our service.
                These cookies include _ga, _gid, and _gat cookies. You can withdraw consent at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">5. Third-Party Services</h2>
              <p className="text-text-secondary mb-2">We use the following third-party services:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  <strong>Supabase:</strong> Database and authentication hosting (
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-text-link hover:text-text-link-hover underline">
                    Privacy Policy
                  </a>
                  )
                </li>
                <li>
                  <strong>Google Analytics:</strong> Usage analytics (with consent) (
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-text-link hover:text-text-link-hover underline">
                    Privacy Policy
                  </a>
                  )
                </li>
                                <li>
                  <strong>Cloudflare Turnstile:</strong> Bot-protection service used to distinguish humans from automated traffic. Cloudflare processes limited technical data (such as IP address and browser information) solely for security purposes. (
                  <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-text-link hover:text-text-link-hover underline">
                    Privacy Policy
                  </a>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">6. Data Retention</h2>
              <p className="text-text-secondary">
                We retain your personal data for as long as your account is active. If you delete your account,
                we will delete your personal data within 30 days, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">7. Your Rights (GDPR/CCPA)</h2>
              <p className="text-text-secondary mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data (data portability)</li>
                <li>Withdraw consent for analytics cookies</li>
                <li>Object to processing of your data</li>
              </ul>
              <p className="text-text-secondary mt-3">
                To exercise these rights, please contact us at{' '}
                <a href={`mailto:${privacyEmail}`} className="text-text-link hover:text-text-link-hover underline">
                  {privacyEmail}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">8. Data Security</h2>
              <p className="text-text-secondary">
                We implement appropriate technical and organizational measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction. All data is transmitted over encrypted
                HTTPS connections, and passwords are securely hashed.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">9. International Data Transfers</h2>
              <p className="text-text-secondary">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate
                safeguards are in place for such transfers in compliance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">10. Children's Privacy</h2>
              <p className="text-text-secondary">
                Our service is not directed to children under 16. We do not knowingly collect personal data from
                children under 16. If you believe we have collected such data, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">11. Changes to This Policy</h2>
              <p className="text-text-secondary">
                We may update this privacy policy from time to time. We will notify you of any changes by posting
                the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3">12. Contact Us</h2>
              <p className="text-text-secondary">
                If you have questions about this privacy policy, please contact us at:
              </p>
              <p className="text-text-secondary mt-2">
                Email:{' '}
                <a href={`mailto:${privacyEmail}`} className="text-text-link hover:text-text-link-hover underline">
                  {privacyEmail}
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Link
              href="/"
              className="text-text-link hover:text-text-link-hover font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
