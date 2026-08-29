"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { business } from "@/data/business";
import { ArrowUpRight } from "@/components/Icons";

type Props = {
  materialName: string;
  slug: string;
};

export function MaterialCTA({ materialName, slug }: Props) {
  return (
    <div className="detail-actions">
      <a
        href={business.phone.href}
        className="button button-ink"
        onClick={() =>
          trackEvent("availability_request", { label: slug })
        }
      >
        Check availability
      </a>
      <Link
        href={`/stone-finder?q=${encodeURIComponent(materialName)}`}
        className="button button-outline"
        onClick={() => trackEvent("stone_finder_start", { label: slug })}
      >
        Find similar stones
      </Link>
      <a
        href={business.directionsUrl}
        className="text-link"
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent("directions_click", { label: "detail_cta" })}
      >
        Visit the yard <ArrowUpRight />
      </a>
    </div>
  );
}
