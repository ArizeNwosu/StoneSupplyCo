import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SEO_PAGES } from '@/lib/seo-pages';
import { ALL_POSTS } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://instagramfollowerstracker.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = ALL_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const keywordPages: MetadataRoute.Sitemap = SEO_PAGES.map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const publicAccounts = await prisma.publicAccount
    .findMany({
      select: { handle: true, lastChecked: true },
    })
    .catch(() => [] as { handle: string; lastChecked: Date | null }[]);

  const accountPages: MetadataRoute.Sitemap = publicAccounts.map((a) => ({
    url: `${base}/${a.handle}`,
    lastModified: a.lastChecked ?? new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...keywordPages, ...accountPages];
}
