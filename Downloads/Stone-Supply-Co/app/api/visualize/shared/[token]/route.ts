import { NextRequest, NextResponse } from "next/server";
import { getVisualizerRenderByToken } from "@/lib/db/visualizer";
import { getMaterial } from "@/lib/db/materials";
import { createServiceClient } from "@/lib/supabase";
import { createVisualizerPhotoUrl } from "@/lib/visualizer-storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid share token." }, { status: 400 });
  }

  try {
    const render = await getVisualizerRenderByToken(token);
    if (!render) {
      return NextResponse.json({ error: "Render not found." }, { status: 404 });
    }

    // Fetch material details for each surface
    const materialDetails = await Promise.all(
      render.surfaces.map(async (sel) => {
        const mat = await getMaterial(sel.material_slug);
        return {
          surface: sel.surface,
          material_slug: sel.material_slug,
          material_name: mat?.name ?? sel.material_name,
          material_type: mat?.material_type ?? null,
          finish: mat?.finish ?? null,
          image_url: mat?.image_urls?.[0] ?? null,
          waterfall: sel.waterfall ?? false,
        };
      })
    );
    const photoUrl = await createVisualizerPhotoUrl(
      createServiceClient(),
      render.session.photo_url
    );

    return NextResponse.json({
      photo_url: photoUrl,
      room_type: render.session.room_type,
      render_url: render.render_url,
      surfaces: materialDetails,
    });
  } catch (err) {
    console.error("[GET /api/visualize/shared]", err);
    return NextResponse.json(
      { error: "Failed to load shared render." },
      { status: 500 }
    );
  }
}
