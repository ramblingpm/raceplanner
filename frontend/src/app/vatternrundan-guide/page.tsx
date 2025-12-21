import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import StructuredData from '@/components/StructuredData';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Guide: Planera för Vätternrundan 2025 | Race Planner',
  description: 'Komplett planeringsguide för Vätternrundan. Lär dig hur du planerar tempo, depåstopp och strategi för 315km. Tips från erfarna cyklister.',
  keywords: ['vätternrundan planering', 'planera för vättern', 'vätternrundan tips', 'vätternrundan strategi', 'vätternrundan träning', 'hur planera vätternrundan'],
  url: '/vatternrundan-guide',
  type: 'article',
});

export default async function VatternrundanGuidePage() {
  const t = await getTranslations('vatternrundanGuide');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Hem', url: '/' },
    { name: 'Vätternrundan', url: '/vatternrundan' },
    { name: 'Planeringsguide', url: '/vatternrundan-guide' },
  ]);

  return (
    <>
      <StructuredData data={[breadcrumbSchema]} />
      <PageViewTracker pageName="Vätternrundan Guide Page" />
      <div className="min-h-screen bg-surface-background">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-subtle to-surface-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-4 leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center text-sm text-text-secondary">
              <Link href="/" className="hover:text-text-primary transition-colors">
                Hem
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <Link href="/vatternrundan" className="hover:text-text-primary transition-colors">
                Vätternrundan
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="text-text-primary">Planeringsguide</span>
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Preparation Section */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('sections.preparation.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-4 leading-relaxed">
                {t('sections.preparation.intro')}
              </p>
              <p className="text-text-secondary leading-relaxed">
                {t('sections.preparation.content')}
              </p>
            </section>

            {/* Pacing Section */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('sections.pacing.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-4 leading-relaxed">
                {t('sections.pacing.intro')}
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                {t('sections.pacing.content')}
              </p>
              <div className="bg-primary-subtle border-l-4 border-primary p-4 rounded">
                <p className="text-text-primary font-semibold mb-2">💡 Pro-tips för tempo:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Börja 10% långsammare än ditt måltempo första 50km</li>
                  <li>Håll jämnt tempo - stora variationer sliter på kroppen</li>
                  <li>Använd Race Planner för att beräkna exakt tempo för varje segment</li>
                </ul>
              </div>
            </section>

            {/* Nutrition Section */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('sections.nutrition.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-4 leading-relaxed">
                {t('sections.nutrition.intro')}
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                {t('sections.nutrition.content')}
              </p>
              <div className="bg-success-subtle border-l-4 border-success p-4 rounded">
                <p className="text-text-primary font-semibold mb-2">🥤 Näringsschema (exempel):</p>
                <ul className="space-y-2 text-text-secondary">
                  <li><strong>Varje timme:</strong> 1 gel eller bar + vatten</li>
                  <li><strong>Depåstopp 1 (75km):</strong> Bananer, smörgås, sportdryck (5-10 min)</li>
                  <li><strong>Depåstopp 2 (150km):</strong> Varm mat, frukt, fyll flaskor (10-15 min)</li>
                  <li><strong>Depåstopp 3 (225km):</strong> Lätt mat, energi, koffeingel (5-10 min)</li>
                </ul>
              </div>
            </section>

            {/* Equipment Section */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('sections.equipment.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-4 leading-relaxed">
                {t('sections.equipment.intro')}
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                {t('sections.equipment.content')}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-surface-background p-4 rounded border border-border">
                  <h4 className="font-semibold text-text-primary mb-2">Absolut nödvändigt:</h4>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li>Hjälm (obligatoriskt)</li>
                    <li>Fram- och baklampa (obligatoriskt)</li>
                    <li>Reservslang x2</li>
                    <li>Pumpe/CO2</li>
                    <li>Varma kläder för natten</li>
                  </ul>
                </div>
                <div className="bg-surface-background p-4 rounded border border-border">
                  <h4 className="font-semibold text-text-primary mb-2">Rekommenderat:</h4>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li>GPS/cykelcomputer</li>
                    <li>Extra handskar</li>
                    <li>Multitool</li>
                    <li>Reflexprodukter</li>
                    <li>Powerbank</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Recovery Section */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('sections.recovery.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-4 leading-relaxed">
                {t('sections.recovery.intro')}
              </p>
              <p className="text-text-secondary leading-relaxed">
                {t('sections.recovery.content')}
              </p>
            </section>

          </div>
        </div>

        {/* Links Section */}
        <section className="bg-surface-1 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">
                Nästa steg
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/vatternrundan"
                  className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="font-semibold text-text-primary">{t('links.mainPage')}</div>
                </Link>
                <Link
                  href="/vattern-checklist"
                  className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">✅</div>
                  <div className="font-semibold text-text-primary">{t('links.checklist')}</div>
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-primary text-primary-foreground p-6 rounded-lg hover:bg-primary-hover transition-colors text-center"
                >
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-semibold">{t('links.dashboard')}</div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
