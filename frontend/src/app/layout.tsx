import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Race Planner - Cycling Race Calculator',
  description:
    'Calculate your cycling race times and required speeds for optimal performance',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-83ZSZHNKMB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-83ZSZHNKMB');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
