import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SEO_PAGES } from '@/lib/seo-pages';
import { ALL_POSTS } from '@/lib/blog';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';
import { SITE_URL, publicAccountUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

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
    {
      url: `${base}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/data-deletion`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/instagram-video-downloader`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${base}/instagram-reels-downloader`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${base}/instagram-story-downloader`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${base}/instagram-follower-count`,
      lastModified: new Date(),
      changeFrequency: 'daily',
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
      include: { _count: { select: { snapshots: true } } },
    })
    .catch(() => []);

  const qualityByHandle = new Map(
    publicAccounts.map((account) => [
      account.handle,
      {
        account,
        status: getPublicSeoIndexStatus({
          handle: account.handle,
          followerCount: account.followerCount,
          displayName: account.displayName,
          avatarUrl: account.avatarUrl,
          bio: account.bio,
          snapshotCount: account._count.snapshots,
          lastUpdatedAt: account.lastChecked,
        }),
      },
    ])
  );

  const accountPages: MetadataRoute.Sitemap = publicAccounts
    .filter((account) => qualityByHandle.get(account.handle)?.status.sitemapEligible)
    .map((account) => ({
      url: publicAccountUrl(account.handle),
      lastModified: account.lastChecked ?? new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }));

  return [...staticPages, ...blogPages, ...keywordPages, ...accountPages];
}
