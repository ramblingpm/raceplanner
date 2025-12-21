import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raceplanner.com';

  // Static pages with priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/vatternrundan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vatternrundan-guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vattern-checklist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch public races dynamically
  try {
    const { data: races } = await supabase
      .from('races')
      .select('slug, updated_at')
      .eq('is_public', true);

    const racePages: MetadataRoute.Sitemap = (races || []).map((race) => ({
      url: `${baseUrl}/${race.slug}`,
      lastModified: race.updated_at ? new Date(race.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...racePages];
  } catch (error) {
    console.error('Error fetching races for sitemap:', error);
    // Return static pages even if race fetch fails
    return staticPages;
  }
}
