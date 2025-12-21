import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import CookieConsent from '@/components/CookieConsent';
import ConsentManager from '@/components/ConsentManager';
import { ThemeProvider, themeScript } from '@/design-system';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { generateSEOMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';
import StructuredData from '@/components/StructuredData';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Race Planner';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Calculate your race times and required speeds for optimal performance';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Race Planner - Planera ditt lopp med precision',
  description: 'Beräkna sluttider, planera tempo och visualisera din rutt för Vätternrundan och andra lopp. Gratis verktyg för cyklister.',
  keywords: ['vätternrundan', 'loppplanering', 'cykelplanering', 'race planner', 'vättern'],
  url: '/',
  locale: 'sv_SE',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <StructuredData data={[
          generateOrganizationSchema(),
          generateWebSiteSchema(),
        ]} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <FeatureFlagProvider>
                {children}
                <ConsentManager />
                <CookieConsent />
              </FeatureFlagProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
