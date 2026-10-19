import { NextRequest, NextResponse } from "next/server";
import { getMaterials, getMaterial } from "@/lib/db/materials";
import { rankMaterials } from "@/lib/stoneRecommendationEngine";
import {
  explainRecommendations,
  parseNaturalLanguage,
  type FinderInput,
} from "@/lib/gemini";
import type { Material } from "@/types/material";
import { isRateLimited, getIp } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

// 10 AI searches per hour per IP
const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000, key: "stone-finder" };

export async function POST(request: NextRequest) {
  if (await isRateLimited(getIp(request), RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: FinderInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // 1. Optionally parse natural language into structured fields
    let input: FinderInput = body;
    if (body.naturalLanguage) {
      const parsed = await parseNaturalLanguage(body.naturalLanguage);
      // Explicit fields override NLP-parsed ones
      input = { ...parsed, ...body };
    }

    // 2. Load inventory and rank deterministically
    const candidates = await getMaterials({ limit: 200 });
    const topSummaries = rankMaterials(candidates, input, 6);

    if (topSummaries.length === 0) {
      return NextResponse.json({ results: [], explanations: {} });
    }

    // 3. Fetch full material data for Gemini (needs description, origin, etc.)
    const fullMaterials: Material[] = (
      await Promise.all(topSummaries.map((m) => getMaterial(m.slug)))
    ).filter((m): m is Material => m !== null);

    // 4. Generate editorial explanations via Gemini
    const explanations = await explainRecommendations(input, fullMaterials);
    const explanationMap: Record<string, string> = {};
    for (const { slug, explanation } of explanations) {
      explanationMap[slug] = explanation;
    }

    return NextResponse.json({
      results: topSummaries,
      explanations: explanationMap,
    });
  } catch (err) {
    console.error("[POST /api/stone-finder]", err);
    return NextResponse.json(
      { error: "Stone finder temporarily unavailable" },
      { status: 500 }
    );
  }
}
