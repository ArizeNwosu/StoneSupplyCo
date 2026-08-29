import type { Material } from "@/types/material";

type Props = {
  material: Material;
};

export function SpecsGrid({ material }: Props) {
  const specs: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Type", value: material.material_type },
    { label: "Finish", value: material.finish },
    { label: "Color family", value: material.color_family },
    { label: "Origin", value: material.origin },
    { label: "Dimensions", value: material.dimensions },
    { label: "Thickness", value: material.thickness },
    {
      label: "Applications",
      value:
        material.applications.length > 0
          ? material.applications.join(", ")
          : null,
    },
    {
      label: "Style",
      value:
        material.recommended_styles.length > 0
          ? material.recommended_styles.join(", ")
          : null,
    },
  ].filter((s) => s.value);

  return (
    <div className="specs-grid">
      {specs.map(({ label, value }) => (
        <div key={label} className="spec-item">
          <span className="spec-label">{label}</span>
          <span className="spec-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
