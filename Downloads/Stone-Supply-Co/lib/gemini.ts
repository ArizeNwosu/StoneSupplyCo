import { GoogleGenAI } from "@google/genai";
import type { Material } from "@/types/material";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-2.0-flash";

// ─── Stone Finder ─────────────────────────────────────────────────────────────

export type FinderInput = {
  projectType?: string;
  cabinetColor?: string;
  floorColor?: string;
  wallColor?: string;
  style?: string;
  desiredColor?: string;
  movement?: "quiet" | "subtle" | "moderate" | "bold" | "dramatic";
  materialPreference?: string[];
  budget?: { min?: number; max?: number };
  timeline?: string;
  naturalLanguage?: string;
};

export async function explainRecommendations(
  input: FinderInput,
  materials: Material[]
): Promise<Array<{ slug: string; explanation: string }>> {
  if (materials.length === 0) return [];

  const ai = getAI();

  const materialList = materials
    .slice(0, 6)
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} (${m.material_type}, ${m.finish}, ${m.color_family ?? "mixed color"}, $${m.price ?? "call"})`
    )
    .join("\n");

  const context = [
    input.projectType && `Project: ${input.projectType}`,
    input.style && `Design style: ${input.style}`,
    input.movement && `Stone movement preference: ${input.movement}`,
    input.cabinetColor && `Cabinet color: ${input.cabinetColor}`,
    input.floorColor && `Floor color: ${input.floorColor}`,
    input.wallColor && `Wall color: ${input.wallColor}`,
    input.naturalLanguage && `Customer description: "${input.naturalLanguage}"`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are Ali's design assistant at Stone Supply Co in Northridge, Los Angeles. A customer described their project:

${context}

These stones scored highest for their project:
${materialList}

Write one warm, specific explanation (2-3 sentences) for each stone explaining exactly why it fits this customer's space. Focus on visual harmony, practical fit, and what makes this stone special for their specific project. Be direct and editorial — like advice from a knowledgeable friend, not a sales pitch.

Return ONLY valid JSON, no markdown, no code fences:
[
  { "slug": "stone-slug", "explanation": "..." },
  ...
]

Use the slug format derived from the stone name (lowercase, hyphens). Example: "Carrara Jumbo" → "carrara-jumbo".`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    const parsed = JSON.parse(result.text ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return materials.slice(0, 6).map((m) => ({
      slug: m.slug,
      explanation: `${m.name} is a strong match for your ${input.projectType ?? "project"}.`,
    }));
  }
}

export async function parseNaturalLanguage(
  text: string
): Promise<Partial<FinderInput>> {
  const ai = getAI();

  const prompt = `Extract stone preferences from this customer description. Return ONLY valid JSON with these optional fields:
{
  "materialPreference": string[],
  "desiredColor": string,
  "movement": "quiet"|"subtle"|"moderate"|"bold"|"dramatic",
  "style": "Modern"|"Minimalist"|"Transitional"|"Traditional"|"Organic",
  "cabinetColor": string,
  "floorColor": string,
  "wallColor": string,
  "budget": { "max": number }
}

Only include fields explicitly or clearly implied in the text. Never fabricate.

Customer description: "${text}"`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    return JSON.parse(result.text ?? "{}");
  } catch {
    return {};
  }
}

// ─── Material description ──────────────────────────────────────────────────────

export async function generateMaterialDescription(
  material: Material
): Promise<string> {
  const ai = getAI();

  const prompt = `You are a copywriter for Stone Supply Co, a premium natural stone yard in Northridge, Los Angeles. Write one elegant paragraph (3-5 sentences) describing this stone slab for the product page. Focus on its visual character, how light plays on it, and the spaces it suits best. Do not fabricate technical specs. Tone: editorial, warm, direct.

Stone: ${material.name}
Type: ${material.material_type}
Finish: ${material.finish}
Color family: ${material.color_family ?? "not specified"}
Applications: ${material.applications.join(", ") || "countertops"}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.text ?? "";
}

// ─── Admin content generation ──────────────────────────────────────────────────

export async function generateMaterialContent(material: Material): Promise<{
  websiteDescription: string;
  metaTitle: string;
  metaDescription: string;
  instagramCaption: string;
  googleBusinessCaption: string;
  pinterestCaption: string;
  emailSnippet: string;
}> {
  const ai = getAI();

  const prompt = `You are a content strategist for Stone Supply Co, a premium natural stone yard in Northridge, Los Angeles. Generate content for this slab. Return ONLY valid JSON matching this structure exactly (no markdown, no code fences):
{
  "websiteDescription": "2-3 sentence editorial description",
  "metaTitle": "under 60 chars, includes material name and Stone Supply Co",
  "metaDescription": "under 160 chars, includes Northridge/Los Angeles and material type",
  "instagramCaption": "2-4 sentences, visual, ends with relevant hashtags #stonesupplyco #naturalstone",
  "googleBusinessCaption": "1-2 sentences, factual, professional",
  "pinterestCaption": "descriptive, keyword-rich, no hashtags",
  "emailSnippet": "2-3 sentences for email newsletter context"
}

Stone details:
Name: ${material.name}
Type: ${material.material_type}
Finish: ${material.finish}
Color: ${material.color_family ?? "not specified"}
Dimensions: ${material.dimensions ?? "standard slab"}
Applications: ${material.applications.join(", ") || "countertops, surfaces"}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const text = result.text ?? "{}";
  return JSON.parse(text);
}

// ─── Visualizer (mock — real implementation when Gemini image editing is ready) ─

export async function visualizeRoom(
  roomImageUrl: string,
  _materialImageUrl: string,
  surfaceType: string
): Promise<{ resultUrl: string } | { error: string }> {
  void surfaceType;
  // Mock: returns the original room image. Swap implementation here when ready.
  return { resultUrl: roomImageUrl };
}

// ─── Project AI assistant (Phase 3) ───────────────────────────────────────────

export async function askAboutProject(
  question: string,
  savedMaterials: Material[],
  inventory: Material[]
): Promise<string> {
  const ai = getAI();

  const savedList = savedMaterials
    .map((m) => `${m.name} (${m.material_type}, ${m.finish})`)
    .join(", ");

  const inventoryList = inventory
    .slice(0, 20)
    .map((m) => `${m.name} (${m.material_type})`)
    .join(", ");

  const prompt = `You are a helpful stone design assistant at Stone Supply Co in Northridge, Los Angeles. The customer has saved these stones to their project: ${savedList || "none yet"}.

Available inventory includes: ${inventoryList}.

Customer question: "${question}"

Answer helpfully and concisely (2-4 sentences). Focus on design compatibility, practical advice, and what's available at the yard.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.text ?? "";
}
