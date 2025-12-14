'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-surface-background">
      <PageViewTracker pageName="Home Page" />
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-8 pb-6 sm:pt-12 sm:pb-8 md:pt-16 md:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-text-primary mb-3 md:mb-6 leading-tight">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-background py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
              {/* Feature 1 */}
              <div className="group bg-surface-background rounded-2xl p-3 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
                <div className="mb-3 md:mb-4 relative h-32 sm:h-40 md:h-48 lg:h-52 w-full bg-surface-1 rounded-xl overflow-hidden">
                  <Image
                    src="/images/feature-plan-race.png"
                    alt="Plan your race"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                    priority
                    className="object-contain p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3 text-text-primary">
                  {t('features.planRace.title')}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-text-secondary leading-relaxed">
                  {t('features.planRace.description')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-surface-background rounded-2xl p-3 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
                <div className="mb-3 md:mb-4 relative h-32 sm:h-40 md:h-48 lg:h-52 w-full bg-surface-1 rounded-xl overflow-hidden">
                  <Image
                    src="/images/feature-calculate.png"
                    alt="Calculate results"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                    className="object-contain p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3 text-text-primary">
                  {t('features.calculateResults.title')}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-text-secondary leading-relaxed">
                  {t('features.calculateResults.description')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-surface-background rounded-2xl p-3 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
                <div className="mb-3 md:mb-4 relative h-32 sm:h-40 md:h-48 lg:h-52 w-full bg-surface-1 rounded-xl overflow-hidden">
                  <Image
                    src="/images/feature-map.png"
                    alt="View map"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                    className="object-contain p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3 text-text-primary">
                  {t('features.viewMap.title')}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-text-secondary leading-relaxed">
                  {t('features.viewMap.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/beta-signup"
              className="w-full sm:w-auto bg-surface-inverse text-text-inverse px-8 py-3 md:py-4 rounded-lg hover:opacity-90 transition-colors text-base font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
            >
              {t('getStarted')}
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-surface-background text-text-primary px-8 py-3 md:py-4 rounded-lg hover:bg-surface-1 transition-colors text-base font-semibold border-2 border-border focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
