import { NextRequest, NextResponse } from "next/server";
import { getMaterial } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

/**
 * POST /api/visualize
 *
 * Mock adapter: returns the stone slab image overlaid on a room scene.
 * Full implementation: Gemini Vision inpaints the stone texture into the scene.
 * MVP: returns a generated CSS gradient approximating the stone colour family.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = body.material_slug as string | undefined;
  const room = (body.room as string | undefined) ?? "kitchen";

  if (!slug) {
    return NextResponse.json({ error: "material_slug is required." }, { status: 400 });
  }

  let material = null;
  try {
    material = await getMaterial(slug);
  } catch {
    return NextResponse.json({ error: "DB unavailable." }, { status: 503 });
  }

  if (!material) {
    return NextResponse.json({ error: "Material not found." }, { status: 404 });
  }

  // Mock adapter: map color family → gradient palette
  const COLOR_PALETTES: Record<string, string[]> = {
    White: ["#f5f2ee", "#e8e4de", "#d9d4cc"],
    Cream: ["#f0e8d8", "#e4d8c0", "#d4c4a0"],
    Grey: ["#b8b4ae", "#989490", "#787470"],
    Black: ["#2c2a28", "#1c1a18", "#3c3a38"],
    Brown: ["#8c6844", "#7a5838", "#6a4828"],
    Green: ["#5c7c5c", "#4c6c4c", "#3c5c3c"],
    Blue: ["#5c6c8c", "#4c5c7c", "#6c7c9c"],
    Multi: ["#9c8c7c", "#8c7c6c", "#7c6c5c"],
  };

  const palette = COLOR_PALETTES[material.color_family ?? "Grey"] ?? COLOR_PALETTES.Grey;

  const ROOM_DESCRIPTIONS: Record<string, string> = {
    kitchen: "Kitchen countertop",
    bathroom: "Bathroom vanity",
    floor: "Floor installation",
    wall: "Feature wall",
    outdoor: "Outdoor patio",
  };

  return NextResponse.json({
    slug: material.slug,
    name: material.name,
    room,
    room_label: ROOM_DESCRIPTIONS[room] ?? room,
    // Visualisation data — used by client to render preview
    preview: {
      type: "gradient",
      colors: palette,
      texture_url: material.image_urls[0] ?? null,
      material_type: material.material_type,
      finish: material.finish,
    },
    note: "Full room visualization coming soon — real Gemini Vision integration will composite the stone texture into a live room photo.",
  });
}
