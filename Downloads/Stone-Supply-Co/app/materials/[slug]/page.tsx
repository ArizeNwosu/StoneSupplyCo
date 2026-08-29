import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getMaterial, getMaterialSlugs, getRelatedMaterials, getMaterials } from "@/lib/db/materials";
import type { MaterialType } from "@/types/material";
import { ImageGallery } from "@/components/detail/ImageGallery";
import { SpecsGrid } from "@/components/detail/SpecsGrid";
import { AvailabilityBadge } from "@/components/detail/AvailabilityBadge";
import { RelatedMaterials } from "@/components/detail/RelatedMaterials";
import { MaterialCTA } from "@/components/detail/MaterialCTA";
import { MaterialGrid } from "@/components/materials/MaterialGrid";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName, siteUrl } from "@/lib/siteConfig";

// Known material type slugs (these render category pages, not detail pages)
const MATERIAL_TYPES: Record<string, MaterialType> = {
  quartzite: "Quartzite",
  marble: "Marble",
  granite: "Granite",
  quartz: "Quartz",
  onyx: "Onyx",
  other: "Other",
};

const TYPE_DESCRIPTIONS: Record<MaterialType, string> = {
  Quartzite:
    "Formed under intense heat and pressure, quartzite combines the look of marble with the durability of granite. An ideal choice for countertops that see daily use.",
  Marble:
    "Timeless, elegant, and endlessly varied. Our marble collection spans classic whites to rare colored specimens, each slab a one-of-a-kind work of natural art.",
  Granite:
    "One of the hardest natural stones on earth. Granite offers unmatched durability and a rich, complex grain — perfect for kitchens, floors, and outdoor applications.",
  Quartz:
    "Engineered for consistency and performance. Quartz slabs offer the beauty of natural stone with enhanced resistance to staining, scratching, and bacteria.",
  Onyx:
    "Rare, translucent, and dramatic. Onyx is best experienced backlit — a statement stone for bars, feature walls, and luxury vanities.",
  Other:
    "Our curated selection of specialty stones — travertine, limestone, slate, and more — for projects that call for something genuinely distinctive.",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const typeSlugs = Object.keys(MATERIAL_TYPES);
  try {
    const slugs = await getMaterialSlugs();
    return [...typeSlugs, ...slugs].map((slug) => ({ slug }));
  } catch {
    // DB not yet configured — pre-render only the known type routes
    return typeSlugs.map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Category page metadata
  const materialType = MATERIAL_TYPES[slug.toLowerCase()];
  if (materialType) {
    const title = `${materialType} Slabs in Los Angeles | ${siteName}`;
    const description = `Shop ${materialType.toLowerCase()} slabs at Stone Supply Co — Northridge, Los Angeles. ${TYPE_DESCRIPTIONS[materialType]}`;
    return {
      title,
      description,
      alternates: { canonical: `${siteUrl}/materials/${slug}` },
      openGraph: { title, description },
    };
  }

  // Detail page metadata
  let material = null;
  try {
    material = await getMaterial(slug);
  } catch {
    return {};
  }
  if (!material) return {};

  const title =
    material.seo_title ??
    `${material.name} ${material.material_type} | ${siteName}`;
  const description =
    material.seo_description ??
    `${material.name} — ${material.finish} ${material.material_type} slab available at Stone Supply Co in Northridge, Los Angeles.`;
  const image = material.image_urls[0];

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/materials/${slug}` },
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 900 }] } : {}),
    },
  };
}

// ── Category page ─────────────────────────────────────────────────────────────

async function CategoryPage({ slug, materialType }: { slug: string; materialType: MaterialType }) {
  let materials: Awaited<ReturnType<typeof getMaterials>> = [];
  try {
    materials = await getMaterials({ type: materialType, limit: 48 });
  } catch {
    // DB not yet configured — show empty state
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${materialType} Slabs | ${siteName}`,
    description: TYPE_DESCRIPTIONS[materialType],
    url: `${siteUrl}/materials/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Materials", item: `${siteUrl}/materials` },
        { "@type": "ListItem", position: 3, name: materialType, item: `${siteUrl}/materials/${slug}` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header solid />
      <main>
        <div className="category-hero">
          <div className="category-hero-overlay" />
          <div className="category-hero-inner">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="breadcrumb-sep" aria-hidden>›</span>
              <Link href="/materials">Materials</Link>
              <span className="breadcrumb-sep" aria-hidden>›</span>
              <span className="breadcrumb-current">{materialType}</span>
            </nav>
            <h1>{materialType}</h1>
            <p>{TYPE_DESCRIPTIONS[materialType]}</p>
          </div>
        </div>

        <MaterialGrid materials={materials} />
      </main>
      <Footer />
    </>
  );
}

// ── Detail page ───────────────────────────────────────────────────────────────

export default async function MaterialPage({ params }: Props) {
  const { slug } = await params;

  // Render category page if slug matches a known material type
  const materialType = MATERIAL_TYPES[slug.toLowerCase()];
  if (materialType) {
    return <CategoryPage slug={slug} materialType={materialType} />;
  }

  // Otherwise render slab detail page
  let material = null;
  try {
    material = await getMaterial(slug);
  } catch {
    notFound();
  }
  if (!material) notFound();

  const related = await getRelatedMaterials(material, 3);
  const displayPrice = material.clearance_price ?? material.price;
  const formattedPrice = displayPrice
    ? `$${displayPrice.toLocaleString()}/slab`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: material.name,
    description: material.description ?? undefined,
    image: material.image_urls[0] ?? undefined,
    brand: { "@type": "Brand", name: siteName },
    offers: displayPrice
      ? {
          "@type": "Offer",
          price: displayPrice,
          priceCurrency: "USD",
          availability:
            material.availability === "unavailable"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header solid />
      <main className="material-detail-wrap">
        <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <Link href="/materials">Materials</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <Link href={`/materials/${material.material_type.toLowerCase()}`}>
            {material.material_type}
          </Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <span className="breadcrumb-current">{material.name}</span>
        </nav>

        <div className="material-detail">
          <ImageGallery images={material.image_urls} name={material.name} />

          <div className="detail-info">
            <div className="detail-info-badges">
              <AvailabilityBadge
                availability={material.availability}
                quantity={material.quantity}
              />
              {material.featured && (
                <span className="badge badge-featured">Featured</span>
              )}
              {material.new_arrival && (
                <span className="badge badge-new">New arrival</span>
              )}
              {material.clearance && (
                <span className="badge badge-clearance">Clearance</span>
              )}
            </div>

            <h1>{material.name}</h1>

            {formattedPrice ? (
              <div className="detail-price">
                {material.clearance_price && material.price ? (
                  <div className="detail-price-clearance">
                    <span>{formattedPrice}</span>
                    <span className="detail-price-original">
                      ${material.price.toLocaleString()}/slab
                    </span>
                  </div>
                ) : (
                  formattedPrice
                )}
              </div>
            ) : (
              <p
                className="detail-price"
                style={{ fontSize: "1.2rem", color: "var(--color-stone-dark)" }}
              >
                Call for pricing
              </p>
            )}

            {material.description && (
              <p className="detail-description">{material.description}</p>
            )}

            <MaterialCTA materialName={material.name} slug={material.slug} />
            <SpecsGrid material={material} />

            {material.bookmatch_available && (
              <p
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.78rem",
                  color: "var(--color-bronze-ink)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                ✦ Bookmatch available — ask in-store
              </p>
            )}
          </div>
        </div>

        <RelatedMaterials
          materials={related}
          currentType={material.material_type}
        />
      </main>
      <Footer />
    </>
  );
}
