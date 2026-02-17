'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import TrackedLink from '@/components/TrackedLink';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-surface-background">
      <PageViewTracker pageName="Home Page" />
      <Header />

      {/* Hero Section - optimized for 390px mobile first */}
      <section className="px-4 pt-6 pb-4 xs:pt-8 xs:pb-6 sm:pt-12 sm:pb-8 md:pt-16 md:pb-12 mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-2 xs:mb-3 md:mb-6 leading-tight">
            {t('title')}
          </h1>
          <p className="text-sm xs:text-base sm:text-base md:text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Features Section - single column on mobile, 3-col on tablet+ */}
      <section className="bg-surface-background py-4 xs:py-6 sm:py-8 md:py-12">
        <div className="px-4 sm:px-6 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group bg-surface-background rounded-xl sm:rounded-2xl p-4 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
              <div className="mb-3 md:mb-4 relative h-36 xs:h-40 sm:h-40 md:h-48 w-full bg-surface-1 rounded-lg sm:rounded-xl overflow-hidden">
                <Image
                  src="/images/feature-plan-race.png"
                  alt="Plan your race"
                  fill
                  sizes="(max-width: 475px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  priority
                  className="object-contain p-3 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 text-text-primary">
                {t('features.planRace.title')}
              </h3>
              <p className="text-sm sm:text-sm md:text-base text-text-secondary leading-relaxed">
                {t('features.planRace.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-surface-background rounded-xl sm:rounded-2xl p-4 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
              <div className="mb-3 md:mb-4 relative h-36 xs:h-40 sm:h-40 md:h-48 w-full bg-surface-1 rounded-lg sm:rounded-xl overflow-hidden">
                <Image
                  src="/images/feature-calculate.png"
                  alt="Calculate results"
                  fill
                  sizes="(max-width: 475px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-contain p-3 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 text-text-primary">
                {t('features.calculateResults.title')}
              </h3>
              <p className="text-sm sm:text-sm md:text-base text-text-secondary leading-relaxed">
                {t('features.calculateResults.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-surface-background rounded-xl sm:rounded-2xl p-4 sm:p-4 md:p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border">
              <div className="mb-3 md:mb-4 relative h-36 xs:h-40 sm:h-40 md:h-48 w-full bg-surface-1 rounded-lg sm:rounded-xl overflow-hidden">
                <Image
                  src="/images/feature-map.png"
                  alt="View map"
                  fill
                  sizes="(max-width: 475px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-contain p-3 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 text-text-primary">
                {t('features.viewMap.title')}
              </h3>
              <p className="text-sm sm:text-sm md:text-base text-text-secondary leading-relaxed">
                {t('features.viewMap.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vätternrundan Feature Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-surface-background to-primary-subtle">
        <div className="px-4 sm:px-6 mx-auto max-w-4xl">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🚴</div>
            <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold text-text-primary mb-3 sm:mb-4">
              {t('vatternrundanCta.title')}
            </h2>
            <p className="text-base sm:text-lg text-text-secondary mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              {t('vatternrundanCta.description')}
            </p>
            <TrackedLink
              href="/vatternrundan"
              eventName="cta_planera_vatternrundan"
              eventLocation="home_vatternrundan_section"
              eventData={{ cta_type: 'feature_highlight', destination: 'vatternrundan_landing' }}
              className="inline-block bg-primary text-primary-foreground px-6 py-3.5 sm:px-8 sm:py-4 rounded-lg hover:bg-primary-hover transition-colors text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              {t('vatternrundanCta.button')}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-8 md:py-16 mx-auto max-w-4xl">
        <div className="text-center">
          <div className="flex flex-col xs:flex-col sm:flex-row gap-3 justify-center items-center">
            <TrackedLink
              href="/try"
              eventName="cta_try_calculator"
              eventLocation="home_cta_section"
              eventData={{ cta_type: 'primary', destination: 'try_calculator' }}
              className="w-full xs:w-full sm:w-auto bg-success text-white px-6 py-3 sm:px-8 md:py-4 rounded-lg hover:bg-success/90 transition-colors text-base font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 text-center"
            >
              {t('tryCalculator')}
            </TrackedLink>
            <TrackedLink
              href="/signup"
              eventName="cta_get_started"
              eventLocation="home_cta_section"
              eventData={{ cta_type: 'primary', destination: 'signup' }}
              className="w-full xs:w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3 sm:px-8 md:py-4 rounded-lg hover:bg-primary-hover transition-colors text-base font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 text-center"
            >
              {t('getStarted')}
            </TrackedLink>
            <Link
              href="/login"
              className="w-full xs:w-full sm:w-auto bg-surface-2 text-text-primary px-6 py-3 sm:px-8 md:py-4 rounded-lg hover:bg-surface-3 transition-colors text-base font-semibold border border-border focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 text-center"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
