"use client";

import Image from "next/image";
import Link from "next/link";
import type { MaterialSummary } from "@/types/material";
import { trackEvent } from "@/lib/analytics";

type Props = {
  results: MaterialSummary[];
  explanations: Record<string, string>;
};

function formatPrice(price: number | null): string {
  if (price === null) return "Call for pricing";
  return `$${price.toLocaleString()}/sf`;
}

export function FinderResults({ results, explanations }: Props) {
  if (results.length === 0) {
    return (
      <div className="finder-results">
        <p style={{ color: "var(--color-stone-dark)" }}>
          No slabs matched your criteria. Try broadening your preferences.
        </p>
      </div>
    );
  }

  return (
    <section className="finder-results">
      <h2>Your top matches</h2>
      {results.map((material, index) => {
        const price = material.clearance_price ?? material.price;
        const image = material.image_urls[0] ?? null;
        const explanation = explanations[material.slug];

        return (
          <article key={material.slug} className="finder-result-card">
            {/* Thumbnail */}
            <div className="finder-result-thumb">
              {image ? (
                <Image
                  src={image}
                  alt={material.name}
                  fill
                  sizes="7rem"
                />
              ) : (
                <div
                  className="skeleton"
                  style={{ position: "absolute", inset: 0 }}
                />
              )}
            </div>

            {/* Info */}
            <div>
              <p
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "0.57rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-stone-dark)",
                }}
              >
                Match #{index + 1} · {material.material_type}
              </p>
              <h3 className="finder-result-name">{material.name}</h3>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.82rem",
                  color: "var(--color-stone-dark)",
                }}
              >
                {material.finish} · {formatPrice(price)}
              </p>
              {explanation && (
                <p className="finder-result-explanation">{explanation}</p>
              )}
            </div>

            {/* CTA */}
            <Link
              href={`/materials/${material.slug}`}
              className="button button-outline"
              onClick={() =>
                trackEvent("material_view", { label: material.slug, destination: "finder" })
              }
            >
              View slab
            </Link>
          </article>
        );
      })}
    </section>
  );
}
