import { NextRequest, NextResponse } from "next/server";
import { getMaterials } from "@/lib/db/materials";
import type { MaterialType } from "@/types/material";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const materials = await getMaterials({
      type: (searchParams.get("type") as MaterialType) || undefined,
      colorFamily: searchParams.get("color") || undefined,
      finish: searchParams.get("finish") || undefined,
      availability:
        (searchParams.get("availability") as "available" | "low") || undefined,
      featured: searchParams.get("featured") === "true" || undefined,
      clearance: searchParams.get("clearance") === "true" || undefined,
      newArrival: searchParams.get("new") === "true" || undefined,
      search: searchParams.get("q") || undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      offset: searchParams.get("offset")
        ? Number(searchParams.get("offset"))
        : undefined,
    });

    return NextResponse.json(materials);
  } catch (err) {
    console.error("[GET /api/materials]", err);
    return NextResponse.json(
      { error: "Failed to load materials" },
      { status: 500 }
    );
  }
}
