import type { MaterialSummary } from "@/types/material";
import { MaterialCard } from "@/components/materials/MaterialCard";

type Props = {
  materials: MaterialSummary[];
  currentType: string;
};

export function RelatedMaterials({ materials, currentType }: Props) {
  if (materials.length === 0) return null;

  return (
    <section className="related-materials">
      <h2>More {currentType}</h2>
      <div className="related-grid">
        {materials.map((m) => (
          <MaterialCard key={m.id} material={m} />
        ))}
      </div>
    </section>
  );
}
