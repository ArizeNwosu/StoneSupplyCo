import type { MaterialSummary } from "@/types/material";
import { MaterialCard } from "./MaterialCard";
import Link from "next/link";

type Props = {
  materials: MaterialSummary[];
};

export function MaterialGrid({ materials }: Props) {
  if (materials.length === 0) {
    return (
      <div className="material-grid-empty">
        <p className="eyebrow" style={{ color: "var(--color-stone-dark)" }}>
          No results
        </p>
        <p>
          No slabs matched your filters. Try adjusting or clearing the filters
          to see our full selection.
        </p>
        <Link
          href="/materials"
          className="button button-outline"
          style={{ marginTop: "1.5rem" }}
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="material-grid">
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}
