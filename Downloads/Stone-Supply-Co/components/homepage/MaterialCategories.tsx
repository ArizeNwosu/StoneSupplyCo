import Link from "next/link";
import { ArrowUpRight } from "@/components/Icons";

const categories = [
  {
    type: "quartzite",
    label: "Quartzite",
    tagline: "Marble look, granite strength",
    image: null as string | null,
  },
  {
    type: "marble",
    label: "Marble",
    tagline: "Timeless elegance",
    image: null as string | null,
  },
  {
    type: "granite",
    label: "Granite",
    tagline: "Built for life",
    image: null as string | null,
  },
  {
    type: "quartz",
    label: "Quartz",
    tagline: "Engineered precision",
    image: null as string | null,
  },
  {
    type: "onyx",
    label: "Onyx",
    tagline: "Rare & translucent",
    image: null as string | null,
  },
] as const;

export function MaterialCategories() {
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
            href={`/materials/${type}`}
            className="material-category-tile"
          >
            {/* Image would go here when available */}
            <div className="material-category-tile-inner">
              <h3>{label}</h3>
              <span>{tagline}</span>
            </div>
          </Link>
        ))}

        {/* View all tile */}
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
