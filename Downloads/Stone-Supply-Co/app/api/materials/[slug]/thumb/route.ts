import { NextRequest, NextResponse } from "next/server";
import { getMaterial } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/materials/[slug]/thumb
 * Redirects to the material's first image URL for use as a thumbnail.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  try {
    const material = await getMaterial(slug);
    const imageUrl = material?.image_urls?.[0];

    if (!imageUrl) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.redirect(imageUrl, { status: 302 });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
