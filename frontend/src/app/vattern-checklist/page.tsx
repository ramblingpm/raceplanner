import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import StructuredData from '@/components/StructuredData';
import { ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Checklista inför Vätternrundan | Race Planner',
  description: 'Komplett checklista för dig som ska cykla Vätternrundan. Allt du behöver packa, planera och förbereda inför loppet.',
  keywords: ['jag ska cykla vättern', 'vätternrundan checklista', 'vätternrundan packlista', 'vätternrundan förberedelser', 'vätternrundan utrustning'],
  url: '/vattern-checklist',
  type: 'article',
});

export default async function VatternChecklistPage() {
  const t = await getTranslations('vatternChecklist');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Hem', url: '/' },
    { name: 'Vätternrundan', url: '/vatternrundan' },
    { name: 'Checklista', url: '/vattern-checklist' },
  ]);

  const ChecklistItem = ({ item }: { item: string }) => (
    <li className="flex items-start gap-3 p-3 bg-surface-background rounded hover:bg-surface-1 transition-colors">
      <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
      <span className="text-text-secondary">{item}</span>
    </li>
  );

  return (
    <>
      <StructuredData data={[breadcrumbSchema]} />
      <PageViewTracker pageName="Vätternrundan Checklist Page" />
      <div className="min-h-screen bg-surface-background">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-success-subtle to-surface-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-6xl mb-4">✅</div>
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
              <span className="text-text-primary">Checklista</span>
            </nav>
          </div>
        </div>

        {/* Checklists */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* 4 Weeks Before */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                {t('categories.weeks.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.weeks.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

            {/* 1 Week Before */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                {t('categories.week.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.week.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

            {/* Race Day */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-warning">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                {t('categories.day.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.day.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

            {/* Gear Checklist */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                🚴 {t('categories.gear.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.gear.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

            {/* Nutrition Checklist */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                🥤 {t('categories.nutrition.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.nutrition.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

            {/* Tools Checklist */}
            <section className="bg-surface-1 rounded-lg p-6 md:p-8 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
                🔧 {t('categories.tools.title')}
              </h2>
              <ul className="space-y-2 mt-4">
                {t.raw('categories.tools.items').map((item: string, index: number) => (
                  <ChecklistItem key={index} item={item} />
                ))}
              </ul>
            </section>

          </div>
        </div>

        {/* CTA Section */}
        <section className="bg-gradient-to-b from-primary-subtle to-surface-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                {t('cta.description')}
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary-hover transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {t('cta.button')}
              </Link>
            </div>
          </div>
        </section>

        {/* Links Section */}
        <section className="bg-surface-1 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">
                Läs mer
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/vatternrundan"
                  className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="font-semibold text-text-primary">{t('links.mainPage')}</div>
                </Link>
                <Link
                  href="/vatternrundan-guide"
                  className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-semibold text-text-primary">{t('links.guide')}</div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
