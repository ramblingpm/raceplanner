'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <PageViewTracker pageName="Home Page" />
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors text-lg font-medium w-48"
            >
              {t('getStarted')}
            </Link>
            <Link
              href="/login"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium border-2 border-primary-600 w-48"
            >
              {t('signIn')}
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🚴</div>
              <h3 className="text-xl font-semibold mb-2">{t('features.planRace.title')}</h3>
              <p className="text-gray-600">
                {t('features.planRace.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">
                {t('features.calculateResults.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.calculateResults.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">{t('features.viewMap.title')}</h3>
              <p className="text-gray-600">
                {t('features.viewMap.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
