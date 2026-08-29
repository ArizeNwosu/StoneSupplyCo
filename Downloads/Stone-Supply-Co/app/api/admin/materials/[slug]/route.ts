import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase";
import type { Material } from "@/types/material";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  const urlToken = new URL(request.url).searchParams.get("token");
  return auth === `Bearer ${secret}` || urlToken === secret;
}

type Params = { params: Promise<{ slug: string }> };

/**
 * PATCH /api/admin/materials/[slug]
 * Partial update of a material row.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let body: Partial<Material>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Prevent slug reassignment via body
  delete (body as Record<string, unknown>).slug;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("materials")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("id,slug,name,availability,quantity")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ material: data });
}

/**
 * DELETE /api/admin/materials/[slug]
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const supabase = createPublicClient();
  const { error } = await supabase.from("materials").delete().eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
