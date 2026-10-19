import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/db/leads";
import { isRateLimited, getIp } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

// 5 lead submissions per 10 minutes per IP
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000, key: "leads" };

const LeadSchema = z.object({
  source: z.enum([
    "stone-finder",
    "availability-request",
    "trade-application",
    "contact",
  ]),
  // At least one contact method required (validated below)
  name: z.string().max(120).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(30).optional(),
  // Optional fields — capped lengths to prevent oversized payloads
  project_type: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  square_feet: z.number().int().min(0).max(100_000).optional(),
  timeline: z.string().max(100).optional(),
  fabricator_status: z.string().max(100).optional(),
  customer_type: z.string().max(100).optional(),
  preferred_materials: z.array(z.string().max(100)).max(20).optional(),
  saved_material_ids: z.array(z.string().uuid()).max(50).optional(),
  ai_preferences: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
  material_slug: z.string().max(120).optional(),
  // Honeypot — bots fill this in, humans don't see it
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  // Body size guard (~16 KB should be more than enough)
  const contentLength = parseInt(
    request.headers.get("content-length") ?? "0",
    10
  );
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const ip = getIp(request);
  if (await isRateLimited(ip, RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Honeypot check
  if (body.website) {
    // Silently accept to avoid tipping off bots
    return NextResponse.json({ id: "ok" }, { status: 201 });
  }

  if (!body.email && !body.phone) {
    return NextResponse.json(
      { error: "Provide at least an email or phone number." },
      { status: 400 }
    );
  }

  try {
    const lead = await createLead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      project_type: body.project_type,
      location: body.location,
      square_feet: body.square_feet,
      timeline: body.timeline,
      fabricator_status: body.fabricator_status,
      customer_type: body.customer_type,
      preferred_materials: body.preferred_materials,
      saved_material_ids: body.saved_material_ids,
      ai_preferences: body.ai_preferences,
      notes: body.notes,
      source: body.source,
      material_slug: body.material_slug,
    });

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json(
      { error: "Failed to save your request. Please try again." },
      { status: 500 }
    );
  }
}
