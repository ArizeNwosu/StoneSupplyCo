import Link from "next/link";
import { FallbackImage } from "@/components/FallbackImage";
import type { MaterialSummary } from "@/types/material";

function formatPrice(price: number | null): string {
  if (price === null) return "Call for pricing";
  return `$${price.toLocaleString()}/sf`;
}

type Props = {
  material: MaterialSummary;
};

export function MaterialCard({ material }: Props) {
  const {
    slug,
    name,
    material_type,
    finish,
    availability,
    price,
    clearance_price,
    image_urls,
    featured,
    new_arrival,
    clearance,
  } = material;

  const primaryImage = image_urls[0]?.replace(/\s+/g, "") ?? null;
  const displayPrice = clearance_price ?? price;

  return (
    <Link href={`/materials/${slug}`} className="material-card">
      <div className="material-card-image">
        {primaryImage ? (
          <FallbackImage
            src={primaryImage}
            alt={name}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : (
          <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
        )}

        <div className="material-card-badges">
          {featured && <span className="badge badge-featured">Featured</span>}
          {new_arrival && <span className="badge badge-new">New</span>}
          {clearance && <span className="badge badge-clearance">Clearance</span>}
          {availability === "low" && (
            <span className="badge badge-low">Low stock</span>
          )}
        </div>
      </div>

      <div className="material-card-body">
        <p className="material-card-type">{material_type}</p>
        <h3 className="material-card-name">{name}</h3>
        <div className="material-card-meta">
          <span className="material-card-price">{formatPrice(displayPrice)}</span>
          {finish && <span className="material-card-finish">{finish}</span>}
        </div>
      </div>
    </Link>
  );
}
