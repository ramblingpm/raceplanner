import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import CookieConsent from '@/components/CookieConsent';
import ConsentManager from '@/components/ConsentManager';
import { ThemeProvider, themeScript } from '@/design-system';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Race Planner';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Calculate your race times and required speeds for optimal performance';

export const metadata: Metadata = {
  title: `${appName} - Race Calculator`,
  description: appDescription,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              {children}
              <ConsentManager />
              <CookieConsent />
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
