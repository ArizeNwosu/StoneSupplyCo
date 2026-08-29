import type { MetadataRoute } from "next";
import { authenticPhotos } from "@/data/gallery";
import { getMaterialSlugs } from "@/lib/db/materials";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const lastVerified = new Date("2026-08-28T00:00:00-07:00");

const MATERIAL_TYPES = ["quartzite", "marble", "granite", "quartz", "onyx", "other"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Attempt to fetch material slugs — falls back gracefully if DB not ready
  let materialSlugs: string[] = [];
  try {
    materialSlugs = await getMaterialSlugs();
  } catch {
    // DB not yet configured — sitemap still works for static pages
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: lastVerified,
      changeFrequency: "daily",
      priority: 1,
      images: [authenticPhotos.hero, authenticPhotos.yard],
    },
    {
      url: `${siteUrl}/materials`,
      lastModified: lastVerified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/stone-finder`,
      lastModified: lastVerified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/trade`,
      lastModified: lastVerified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: lastVerified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/accessibility`,
      lastModified: lastVerified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const typeRoutes: MetadataRoute.Sitemap = MATERIAL_TYPES.map((type) => ({
    url: `${siteUrl}/materials/${type}`,
    lastModified: lastVerified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const materialRoutes: MetadataRoute.Sitemap = materialSlugs.map((slug) => ({
    url: `${siteUrl}/materials/${slug}`,
    lastModified: lastVerified,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...typeRoutes, ...materialRoutes];
}
