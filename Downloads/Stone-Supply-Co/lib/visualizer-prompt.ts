import type { Material } from "@/types/material";
import type { RoomType, SurfaceSelection } from "@/types/visualizer";

const SURFACE_LABELS: Record<string, string> = {
  countertop: "kitchen countertop",
  island: "kitchen island countertop",
  backsplash: "kitchen backsplash",
  vanity_top: "bathroom vanity top",
  shower_walls: "shower walls",
  all_walls: "bathroom walls",
  floors: "bathroom floor",
};

function describeMaterial(material: Material): string {
  const parts = [
    `${material.name}, a ${material.material_type.toLowerCase()}`,
    material.finish ? `with a ${material.finish.toLowerCase()} finish` : null,
    material.color_family ? `in the ${material.color_family.toLowerCase()} color family` : null,
  ];
  const base = parts.filter(Boolean).join(" ");
  if (material.description) {
    return `${base}. ${material.description}`;
  }
  return base;
}

export function buildVisualizerPrompt(
  roomType: RoomType,
  selections: { selection: SurfaceSelection; material: Material }[]
): string {
  const roomLabel = roomType === "kitchen" ? "kitchen" : "bathroom";

  const surfaceInstructions = selections.map(({ selection, material }) => {
    let surfaceLabel = SURFACE_LABELS[selection.surface] ?? selection.surface;
    if (selection.surface === "island" && selection.waterfall) {
      surfaceLabel = "kitchen island countertop with waterfall edges (stone continues down the sides)";
    }
    return `- Replace the ${surfaceLabel} with ${describeMaterial(material)}.`;
  });

  return [
    `Edit this ${roomLabel} photo. Replace the specified surfaces with natural stone, making the result look photorealistic.`,
    "",
    ...surfaceInstructions,
    "",
    "Important:",
    "- Match the lighting, shadows, and reflections of the original photo.",
    "- Preserve the exact perspective and geometry of each surface.",
    "- Show realistic stone veining, texture, and color variation.",
    "- Do NOT modify anything other than the specified surfaces.",
    "- The result should look like a professional interior design rendering.",
  ].join("\n");
}
