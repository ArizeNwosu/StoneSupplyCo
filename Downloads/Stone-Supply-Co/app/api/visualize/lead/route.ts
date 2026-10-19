import { NextRequest, NextResponse } from "next/server";
import { getVisualizerSession, createVisualizerLead, markLeadCaptured } from "@/lib/db/visualizer";
import { isRateLimited, getIp } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

const RATE = { limit: 5, windowMs: 10 * 60 * 1000, key: "viz-lead" };

export async function POST(request: NextRequest) {
  if (await isRateLimited(getIp(request), RATE)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sessionId = body.session_id as string | undefined;
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 160);
  const phone = String(body.phone ?? "").trim().slice(0, 40);

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone is required." },
      { status: 400 }
    );
  }

  try {
    const session = await getVisualizerSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const lead = await createVisualizerLead({
      session_id: sessionId,
      name,
      email,
      phone,
    });

    await markLeadCaptured(sessionId);

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/visualize/lead]", err);
    return NextResponse.json(
      { error: "Failed to save contact info." },
      { status: 500 }
    );
  }
}
