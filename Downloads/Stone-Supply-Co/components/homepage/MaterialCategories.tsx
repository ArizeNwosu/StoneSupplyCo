import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@/components/Icons";
import { getCategoryThumbnails } from "@/lib/db/materials";

const categories = [
  {
    type: "Quartzite",
    label: "Quartzite",
    tagline: "Marble look, granite strength",
  },
  {
    type: "Marble",
    label: "Marble",
    tagline: "Timeless elegance",
  },
  {
    type: "Granite",
    label: "Granite",
    tagline: "Built for life",
  },
  {
    type: "Quartz",
    label: "Quartz",
    tagline: "Engineered precision",
  },
  {
    type: "Onyx",
    label: "Onyx",
    tagline: "Rare & translucent",
  },
] as const;

export async function MaterialCategories() {
  let thumbs: Record<string, string> = {};
  try {
    thumbs = await getCategoryThumbnails();
  } catch {
    // DB unavailable — tiles render without images
  }

  return (
    <section className="material-categories-section section-pad">
      <div className="material-categories-heading">
        <div />
        <div className="section-heading">
          <h2>
            Explore by
            <em>material</em>
          </h2>
        </div>
      </div>

      <div className="material-categories-grid">
        {categories.map(({ type, label, tagline }) => (
          <Link
            key={type}
            href={`/materials?type=${type}`}
            className="material-category-tile"
          >
            {thumbs[type] && (
              <Image
                src={thumbs[type]}
                alt={`${label} slab`}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 20vw"
              />
            )}
            <div className="material-category-tile-inner">
              <h3>{label}</h3>
              <span>{tagline}</span>
            </div>
          </Link>
        ))}

        <Link href="/materials" className="material-category-tile">
          <div className="material-category-tile-inner">
            <h3>All materials</h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              Full inventory <ArrowUpRight />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
