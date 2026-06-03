import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

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
  ];

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

  return [...staticPages, ...accountPages];
}
