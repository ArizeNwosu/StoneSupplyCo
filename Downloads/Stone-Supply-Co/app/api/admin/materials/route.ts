import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase";
import type { Material } from "@/types/material";

export const dynamic = "force-dynamic";

// Simple bearer token guard — set ADMIN_SECRET in env
function authorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false; // No secret = admin locked out by default

  const auth = request.headers.get("authorization") ?? "";
  // Also accept ?token= in URL for browser convenience
  const urlToken = new URL(request.url).searchParams.get("token");

  return auth === `Bearer ${secret}` || urlToken === secret;
}

/**
 * GET /api/admin/materials
 * Returns all materials (full rows, not summary).
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ materials: data });
}

/**
 * POST /api/admin/materials
 * Upsert a material (by slug).
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Material>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.slug || !body.name || !body.material_type) {
    return NextResponse.json(
      { error: "slug, name, and material_type are required." },
      { status: 400 }
    );
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("materials")
    .upsert(body, { onConflict: "slug" })
    .select("id,slug,name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ material: data }, { status: 201 });
}
