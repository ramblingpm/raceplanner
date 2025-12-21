import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface Race {
  name: string;
  slug: string;
  distance_km: number;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Generate comprehensive SEO metadata for a page
 * Includes Open Graph, Twitter Cards, and canonical URLs
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';
  const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'Race Planner';

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,

    // Open Graph
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.url ? `${baseUrl}${config.url}` : baseUrl,
      siteName: siteName,
      images: config.image ? [{
        url: config.image.startsWith('http') ? config.image : `${baseUrl}${config.image}`,
        width: 1200,
        height: 630,
        alt: config.title,
      }] : [],
      locale: config.locale || 'sv_SE',
      type: config.type || 'website',
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
    },

    // Twitter Cards
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.image ? [config.image.startsWith('http') ? config.image : `${baseUrl}${config.image}`] : [],
    },

    // Canonical URL
    alternates: {
      canonical: config.url ? `${baseUrl}${config.url}` : baseUrl,
      languages: {
        'sv-SE': config.url ? `${baseUrl}${config.url}` : baseUrl,
      },
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate Organization schema for structured data
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Race Planner';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@raceplanner.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description: 'Planera ditt lopp med precision - beräkna tider, hastigheter och strategier för Vätternrundan och andra lopp.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: supportEmail,
      contactType: 'Customer Support',
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Race Planner';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: baseUrl,
    description: 'Planera ditt lopp med precision',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/dashboard?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate SportsEvent schema for race pages
 */
export function generateSportsEventSchema(race: Race) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.name,
    description: `Planera din strategi för ${race.name} - ${race.distance_km}km`,
    url: `${baseUrl}/${race.slug}`,
    sport: 'Cycling',
    startDate: race.start_date,
    endDate: race.end_date,
    location: {
      '@type': 'Place',
      name: 'Vättern, Sverige',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'SE',
      },
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'SEK',
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}
