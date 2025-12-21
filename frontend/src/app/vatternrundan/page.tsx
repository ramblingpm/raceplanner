import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import TrackedLink from '@/components/TrackedLink';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import StructuredData from '@/components/StructuredData';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Vätternrundan - Planera ditt lopp | Race Planner',
  description: 'Komplett guide för Vätternrundan. Planera din strategi, beräkna tider och tempo för 315km runt Vättern. Gratis verktyg och tips.',
  keywords: ['vätternrundan', 'vättern', 'planera vätternrundan', '315 km cykel', 'vätternrundan planering', 'vätternrundan tips'],
  url: '/vatternrundan',
  type: 'article',
});

export default async function VatternrundanPage() {
  const t = await getTranslations('vatternrundan');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Hem', url: '/' },
    { name: 'Vätternrundan', url: '/vatternrundan' },
  ]);

  const sportsEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: 'Vätternrundan',
    description: '300 km cykellopp runt Vättern - världens största motionslopp på cykel',
    url: 'https://raceplanner.com/vatternrundan',
    sport: 'Cycling',
    location: {
      '@type': 'Place',
      name: 'Vättern, Sverige',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'SE',
      },
    },
  };

  return (
    <>
      <StructuredData data={[breadcrumbSchema, sportsEventSchema]} />
      <PageViewTracker pageName="Vätternrundan Landing Page" />
      <div className="min-h-screen bg-surface-background">
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary-subtle to-surface-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-4 md:mb-6 leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <TrackedLink
                  href="/dashboard"
                  eventName="cta_borja_planera"
                  eventLocation="vatternrundan_hero"
                  eventData={{ cta_type: 'primary', destination: 'dashboard' }}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary-hover transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
                >
                  {t('hero.cta')}
                </TrackedLink>
                <TrackedLink
                  href="/vatternrundan-guide"
                  eventName="cta_las_guiden"
                  eventLocation="vatternrundan_hero"
                  eventData={{ cta_type: 'secondary', destination: 'guide' }}
                  className="bg-surface-2 text-text-primary px-8 py-4 rounded-lg hover:bg-surface-3 transition-colors text-lg font-semibold border border-border focus:outline-none focus:ring-2 focus:ring-border-focus"
                >
                  {t('hero.ctaSecondary')}
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12 md:py-16 bg-surface-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    {t('about.title')}
                  </h2>
                  <p className="text-lg text-text-secondary mb-6 leading-relaxed">
                    {t('about.description')}
                  </p>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start">
                      <span className="mr-3 text-2xl">📏</span>
                      <span className="text-lg"><strong>{t('about.distance')}</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-2xl">⛰️</span>
                      <span className="text-lg"><strong>{t('about.elevation')}</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-2xl">📍</span>
                      <span className="text-lg"><strong>{t('about.startPlace')}</strong></span>
                    </li>
                  </ul>
                </div>
                <div className="bg-surface-1 rounded-lg p-8 border border-border">
                  <div className="text-6xl mb-4 text-center">🚴</div>
                  <p className="text-center text-text-secondary italic">
                    {t('tagline')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-surface-1">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
                {t('features.title')}
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-surface-background rounded-lg p-6 shadow-md border border-border hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {t('features.feature1.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('features.feature1.description')}
                  </p>
                </div>
                <div className="bg-surface-background rounded-lg p-6 shadow-md border border-border hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">⛽</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {t('features.feature2.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('features.feature2.description')}
                  </p>
                </div>
                <div className="bg-surface-background rounded-lg p-6 shadow-md border border-border hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">🗺️</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {t('features.feature3.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('features.feature3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-12 md:py-16 bg-surface-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
                {t('tips.title')}
              </h2>
              <div className="space-y-6">
                <div className="bg-surface-1 rounded-lg p-6 border-l-4 border-primary">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t('tips.tip1.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('tips.tip1.description')}
                  </p>
                </div>
                <div className="bg-surface-1 rounded-lg p-6 border-l-4 border-success">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t('tips.tip2.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('tips.tip2.description')}
                  </p>
                </div>
                <div className="bg-surface-1 rounded-lg p-6 border-l-4 border-info">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t('tips.tip3.title')}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t('tips.tip3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary-subtle to-surface-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                {t('cta.description')}
              </p>
              <TrackedLink
                href="/dashboard"
                eventName="cta_kom_igang_nu"
                eventLocation="vatternrundan_bottom_cta"
                eventData={{ cta_type: 'final', destination: 'dashboard' }}
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary-hover transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {t('cta.button')}
              </TrackedLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
