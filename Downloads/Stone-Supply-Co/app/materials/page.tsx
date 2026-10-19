import { Suspense } from "react";
import type { Metadata } from "next";
import { getMaterials } from "@/lib/db/materials";
import type { MaterialType } from "@/types/material";
import { MaterialGrid } from "@/components/materials/MaterialGrid";
import { MaterialFilters } from "@/components/materials/MaterialFilters";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Natural Stone & Quartz Slabs",
  description:
    "Browse our full inventory of natural stone and engineered quartz slabs — quartzite, marble, granite, and more. Northridge, Los Angeles.",
  openGraph: {
    title: `Natural Stone & Quartz Slabs | ${siteName}`,
    description:
      "Browse our full inventory of natural stone and engineered quartz slabs — quartzite, marble, granite, and more. Northridge, Los Angeles.",
  },
};

type SearchParams = {
  type?: string;
  color?: string;
  finish?: string;
  availability?: string;
  featured?: string;
  clearance?: string;
  new?: string;
  q?: string;
  limit?: string;
  offset?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

async function MaterialsContent({ searchParams }: Props) {
  const params = await searchParams;

  let materials: Awaited<ReturnType<typeof getMaterials>> = [];
  try {
    materials = await getMaterials({
      type: params.type as MaterialType | undefined,
      colorFamily: params.color,
      finish: params.finish,
      availability: params.availability as "available" | "low" | undefined,
      featured: params.featured === "true" || undefined,
      clearance: params.clearance === "true" || undefined,
      newArrival: params.new === "true" || undefined,
      search: params.q,
      limit: params.limit ? Number(params.limit) : 48,
      offset: params.offset ? Number(params.offset) : 0,
    });
  } catch {
    // DB not yet configured — show empty state with setup message
  }

  return (
    <>
      <MaterialFilters totalCount={materials.length} />
      <MaterialGrid materials={materials} />
    </>
  );
}

export default function MaterialsPage({ searchParams }: Props) {
  return (
    <>
      <Header solid />
      <main>
        <div className="materials-hero">
          <p className="eyebrow">Our inventory</p>
          <h1>
            Natural stone,{" "}
            <em style={{ fontStyle: "italic" }}>naturally curated</em>
          </h1>
          <p>
            Every slab at Stone Supply Co is hand-selected from the world&apos;s
            finest quarries. Browse our full inventory — from dramatic quartzites
            to timeless marbles — and find your perfect stone.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--color-stone-dark)" }}>
            Prices shown are asking prices and subject to change. Confirm availability and final pricing at the yard.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="material-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    aspectRatio: "4/3",
                    borderRadius: "var(--radius-card)",
                  }}
                />
              ))}
            </div>
          }
        >
          <MaterialsContent searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
