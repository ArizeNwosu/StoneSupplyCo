import { NextRequest, NextResponse } from "next/server";
import { getMaterial, getRelatedMaterials } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const material = await getMaterial(slug);
    if (!material) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const related = await getRelatedMaterials(material, 3);
    return NextResponse.json({ material, related });
  } catch (err) {
    console.error(`[GET /api/materials/${slug}]`, err);
    return NextResponse.json(
      { error: "Failed to load material" },
      { status: 500 }
    );
  }
}
