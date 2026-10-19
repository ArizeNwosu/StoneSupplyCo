import { NextRequest, NextResponse } from "next/server";
import { getMaterial } from "@/lib/db/materials";
import { createLead } from "@/lib/db/leads";

export const dynamic = "force-dynamic";

/**
 * POST /api/availability
 *
 * Creates a lead with source "availability-request" and returns the
 * current availability/quantity of the requested material.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = body.material_slug as string | undefined;
  if (!slug) {
    return NextResponse.json(
      { error: "material_slug is required." },
      { status: 400 }
    );
  }

  if (!body.email && !body.phone) {
    return NextResponse.json(
      { error: "Provide at least an email or phone number." },
      { status: 400 }
    );
  }

  try {
    const [material] = await Promise.all([getMaterial(slug)]);

    if (!material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    // Persist the lead
    await createLead({
      name: (body.name as string) || undefined,
      email: (body.email as string) || undefined,
      phone: (body.phone as string) || undefined,
      notes: `Availability request for: ${material.name}`,
      source: "availability-request",
      material_slug: slug,
    });

    return NextResponse.json({
      availability: material.availability,
      quantity: material.quantity,
      name: material.name,
    });
  } catch (err) {
    console.error("[POST /api/availability]", err);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
