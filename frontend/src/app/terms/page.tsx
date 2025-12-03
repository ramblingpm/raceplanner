import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';

export default function TermsOfServicePage() {
  const t = useTranslations('common');
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@raceplanner.com';
  const appName = t('appName');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-sm sm:prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using {appName} (&quot;the Service&quot;), you accept and agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700">
                {appName} is a web-based tool that helps users calculate and plan race times, speeds,
                and strategies. The Service is currently in beta testing and is invite-only.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">3. Beta Testing</h2>
              <p className="text-gray-700 mb-2">
                The Service is currently in beta. This means:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>The Service may contain bugs, errors, or incomplete features</li>
                <li>Features may change or be removed without notice</li>
                <li>Service availability is not guaranteed</li>
                <li>Data loss may occur; we recommend keeping backups of important calculations</li>
                <li>We reserve the right to terminate beta access at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.1 Account Creation</h3>
              <p className="text-gray-700">
                To use the Service, you must create an account with a valid email address. You are responsible
                for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.2 Beta Invite Requirement</h3>
              <p className="text-gray-700">
                Access to the Service requires a beta invitation. Sharing your invitation or account access
                with others is prohibited.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.3 Account Responsibilities</h3>
              <p className="text-gray-700 mb-2">You agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
              <p className="text-gray-700 mb-2">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated tools to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Upload malicious code or viruses</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">6. User Content</h2>
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">6.1 Your Data</h3>
              <p className="text-gray-700">
                You retain all rights to the race calculations and data you create using the Service.
                By using the Service, you grant us a license to store, process, and display your data
                as necessary to provide the Service.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">6.2 Feedback</h3>
              <p className="text-gray-700">
                Any feedback, suggestions, or ideas you provide about the Service may be used by us
                without any obligation to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">7. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-2">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Accuracy of race calculations or recommendations</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Uninterrupted or error-free operation</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>Important:</strong> Race calculations are estimates only. We are not responsible for
                race performance outcomes. Always use professional judgment and consult with coaches or medical
                professionals before making race decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless the Service and its affiliates from any claims,
                damages, liabilities, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your account at any time, with or without notice,
                for any reason, including violation of these Terms. You may delete your account at any time
                through the account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">11. Pricing and Payment</h2>
              <p className="text-gray-700">
                The Service is currently free during the beta period. We reserve the right to introduce
                pricing or subscription plans in the future with advance notice to users.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms at any time. We will notify users of material changes via email
                or through the Service. Continued use of the Service after changes constitutes acceptance
                of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by the laws of Sweden, with the District Court of Stockholm (Stockholms tingsrätt) as the court of first instance
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-700 mt-2">
                Email:{' '}
                <a href={`mailto:${supportEmail}`} className="text-primary-600 hover:text-primary-700 underline">
                  {supportEmail}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">15. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                will continue in full force and effect.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
