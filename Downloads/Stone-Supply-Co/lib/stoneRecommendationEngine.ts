/**
 * Deterministic stone scoring engine.
 *
 * Takes a FinderInput and an array of MaterialSummary candidates,
 * returns them sorted by relevance score (highest first).
 *
 * Gemini is NOT called here — only plain scoring math. Gemini writes
 * explanations for the top results after this engine ranks them.
 */

import type { FinderInput } from "@/lib/gemini";
import type { MaterialSummary } from "@/types/material";

// ── Weights ────────────────────────────────────────────────────────────────────
// Each dimension contributes 0–100 to the total before normalization.

const W = {
  materialMatch: 35,   // exact material type requested
  colorMatch: 25,      // color family alignment
  availabilityBonus: 15, // available > low > unavailable
  featuredBonus: 10,   // editorial boost for featured slabs
  movementMatch: 10,   // veining movement preference
  budgetFit: 5,        // within stated budget
};

// ── Color family alignment ────────────────────────────────────────────────────

const COLOR_KEYWORDS: Record<string, string[]> = {
  White: ["white", "bright", "light", "clean", "crisp", "snow", "ivory"],
  Cream: ["cream", "warm", "beige", "off-white", "butter", "linen"],
  Grey: ["grey", "gray", "silver", "cool", "neutral", "slate"],
  Black: ["black", "dark", "dramatic", "bold", "charcoal"],
  Brown: ["brown", "tan", "earthy", "wood", "walnut", "warm"],
  Green: ["green", "sage", "forest", "jade", "emerald", "olive"],
  Blue: ["blue", "ocean", "navy", "indigo", "aqua"],
  Multi: ["colorful", "vibrant", "mixed", "multi"],
};

function colorScore(
  material: MaterialSummary,
  input: FinderInput
): number {
  if (!material.color_family) return 0;

  // Direct color family match from desiredColor field
  if (input.desiredColor) {
    const desired = input.desiredColor.toLowerCase();
    const keywords = COLOR_KEYWORDS[material.color_family] ?? [];
    if (keywords.some((k) => desired.includes(k))) return 100;
    // Partial match — desiredColor contains the family name
    if (desired.includes(material.color_family.toLowerCase())) return 80;
  }

  // Cabinet/floor/wall color inferral
  const contextColors = [
    input.cabinetColor,
    input.floorColor,
    input.wallColor,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (contextColors) {
    const keywords = COLOR_KEYWORDS[material.color_family] ?? [];
    if (keywords.some((k) => contextColors.includes(k))) return 60;
  }

  return 0;
}

// ── Movement / veining preference ────────────────────────────────────────────

// Stone tags that indicate movement level (low → high)
const MOVEMENT_TAGS: Record<string, string[]> = {
  quiet: ["solid", "honed", "concrete", "minimal"],
  subtle: ["light-veining", "subtle", "soft"],
  moderate: ["veined", "movement", "cloud"],
  bold: ["bold-veining", "dramatic", "statement"],
  dramatic: ["bookmatched", "waterfall", "exotic", "onyx"],
};

function movementScore(
  material: MaterialSummary,
  input: FinderInput
): number {
  if (!input.movement) return 50; // neutral if not specified
  const targetTags = MOVEMENT_TAGS[input.movement] ?? [];
  const materialTags = material.tags.map((t) => t.toLowerCase());
  const hits = targetTags.filter((t) =>
    materialTags.some((mt) => mt.includes(t))
  );
  return hits.length > 0 ? 100 : 20;
}

// ── Budget fit ────────────────────────────────────────────────────────────────

function budgetScore(material: MaterialSummary, input: FinderInput): number {
  if (!input.budget) return 50;
  const price = material.clearance_price ?? material.price;
  if (!price) return 50; // "call for pricing" — don't penalize

  const { min, max } = input.budget;
  if (max !== undefined && price > max) return 0;
  if (min !== undefined && price < min) return 10;
  return 100;
}

// ── Availability ──────────────────────────────────────────────────────────────

function availabilityScore(material: MaterialSummary): number {
  switch (material.availability) {
    case "available":
      return 100;
    case "low":
      return 50;
    case "unavailable":
      return 0;
  }
}

// ── Material type match ───────────────────────────────────────────────────────

function materialTypeScore(
  material: MaterialSummary,
  input: FinderInput
): number {
  if (!input.materialPreference || input.materialPreference.length === 0)
    return 50;
  const prefs = input.materialPreference.map((p) => p.toLowerCase());
  return prefs.includes(material.material_type.toLowerCase()) ? 100 : 0;
}

// ── Featured bonus ────────────────────────────────────────────────────────────

function featuredScore(material: MaterialSummary): number {
  return material.featured ? 100 : 0;
}

// ── Composite score ───────────────────────────────────────────────────────────

export function scoreMaterial(
  material: MaterialSummary,
  input: FinderInput
): number {
  const scores = {
    materialMatch: materialTypeScore(material, input),
    colorMatch: colorScore(material, input),
    availabilityBonus: availabilityScore(material),
    featuredBonus: featuredScore(material),
    movementMatch: movementScore(material, input),
    budgetFit: budgetScore(material, input),
  };

  const total =
    (scores.materialMatch * W.materialMatch +
      scores.colorMatch * W.colorMatch +
      scores.availabilityBonus * W.availabilityBonus +
      scores.featuredBonus * W.featuredBonus +
      scores.movementMatch * W.movementMatch +
      scores.budgetFit * W.budgetFit) /
    100;

  return total;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export type ScoredMaterial = MaterialSummary & { score: number };

export function rankMaterials(
  materials: MaterialSummary[],
  input: FinderInput,
  topN = 6
): ScoredMaterial[] {
  return materials
    .map((m) => ({ ...m, score: scoreMaterial(m, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
