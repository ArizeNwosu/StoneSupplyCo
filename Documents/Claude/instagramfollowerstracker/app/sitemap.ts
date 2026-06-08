import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SEO_PAGES } from '@/lib/seo-pages';
import { ALL_POSTS } from '@/lib/blog';
import { SEO_ACCOUNT_PAGES } from '@/lib/seo-account-pages';
import { getPublicSeoIndexStatus } from '@/lib/public-seo-quality';

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
        }),
      },
    ])
  );

  const seoAccountPages: MetadataRoute.Sitemap = SEO_ACCOUNT_PAGES
    .filter((page) => qualityByHandle.get(page.username)?.status.sitemapEligible)
    .map((page) => ({
      url: `${base}/${page.slug}/${page.username}`,
      lastModified: qualityByHandle.get(page.username)?.account.lastChecked ?? new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.82,
    }));

  const accountPages: MetadataRoute.Sitemap = publicAccounts
    .filter((account) => qualityByHandle.get(account.handle)?.status.sitemapEligible)
    .map((account) => ({
      url: `${base}/instagram-follower-count/${account.handle}`,
      lastModified: account.lastChecked ?? new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.65,
    }));

  return [...staticPages, ...blogPages, ...keywordPages, ...seoAccountPages, ...accountPages];
}
