// app/api/visualize/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getVisualizerSession, reserveVisualizerRender, createVisualizerRender } from "@/lib/db/visualizer";
import { getMaterial } from "@/lib/db/materials";
import { getOpenAIClient } from "@/lib/openai";
import { buildVisualizerPrompt } from "@/lib/visualizer-prompt";
import { createVisualizerPhotoUrl } from "@/lib/visualizer-storage";
import { isRateLimited, getIp } from "@/lib/rateLimiter";
import type { SurfaceSelection } from "@/types/visualizer";
import { MAX_RENDERS_SELF_SERVE } from "@/types/visualizer";
import { ROOM_SURFACES } from "@/types/visualizer";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RATE = { limit: 10, windowMs: 60 * 60 * 1000, key: "viz-render" };

export async function POST(request: NextRequest) {
  if (await isRateLimited(getIp(request), RATE)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
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
  const surfaces = body.surfaces as SurfaceSelection[] | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }
  if (!surfaces || !Array.isArray(surfaces) || surfaces.length === 0) {
    return NextResponse.json(
      { error: "surfaces must be a non-empty array." },
      { status: 400 }
    );
  }
  if (surfaces.length > 4) {
    return NextResponse.json({ error: "Too many surfaces selected." }, { status: 400 });
  }

  // Validate session exists and check render limit
  let session;
  try {
    session = await getVisualizerSession(sessionId);
  } catch (err) {
    console.error("[POST /api/visualize/render] session lookup:", err);
    return NextResponse.json({ error: "Failed to look up session." }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.render_count >= MAX_RENDERS_SELF_SERVE) {
    return NextResponse.json(
      {
        error: "Render limit reached. A Stone Supply Co representative will reach out to help you explore more options.",
        limit_reached: true,
      },
      { status: 402 }
    );
  }

  const allowedSurfaces = new Set(ROOM_SURFACES[session.room_type].map((option) => option.value));
  const seenSurfaces = new Set<string>();
  for (const selection of surfaces) {
    if (
      !selection ||
      !allowedSurfaces.has(selection.surface) ||
      seenSurfaces.has(selection.surface) ||
      typeof selection.material_slug !== "string" ||
      typeof selection.material_name !== "string"
    ) {
      return NextResponse.json({ error: "Invalid surface selection." }, { status: 400 });
    }
    seenSurfaces.add(selection.surface);
  }

  // Fetch material data for each selected surface
  let materialLookups: { selection: SurfaceSelection; material: NonNullable<Awaited<ReturnType<typeof getMaterial>>> }[];
  try {
    materialLookups = await Promise.all(
      surfaces.map(async (sel) => {
        const material = await getMaterial(sel.material_slug);
        if (!material) throw new Error(`Material not found: ${sel.material_slug}`);
        return { selection: sel, material };
      })
    );
  } catch {
    return NextResponse.json(
      { error: "One or more selected materials not found." },
      { status: 400 }
    );
  }


  // Reserve the paid render atomically before contacting OpenAI. Failed
  // generations intentionally consume the slot so retries cannot bypass quota.
  const reservedCount = await reserveVisualizerRender(sessionId, MAX_RENDERS_SELF_SERVE);
  if (reservedCount === null) {
    return NextResponse.json(
      { error: "Render limit reached.", limit_reached: true },
      { status: 402 }
    );
  }

  // Build prompt and call OpenAI
  const prompt = buildVisualizerPrompt(session.room_type, materialLookups);

  try {
    const openai = getOpenAIClient();

    // Photos are in a private bucket — create a signed URL to fetch them
    const supabase = createServiceClient();
    const signedPhotoUrl = await createVisualizerPhotoUrl(
      supabase,
      session.photo_url,
      300
    );

    const response = await openai.images.edit({
      model: "gpt-image-1.5",
      image: await fetchImageAsFile(signedPhotoUrl),
      prompt,
      size: "auto",
      input_fidelity: "high",
      quality: "high",
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error("OpenAI returned no image data");
    }

    // Upload render to Supabase Storage
    const renderFileName = `${crypto.randomUUID()}.png`;
    const renderBuffer = Buffer.from(imageBase64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("visualizer-renders")
      .upload(renderFileName, renderBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("visualizer-renders")
      .getPublicUrl(renderFileName);

    // Create the render record. The quota was reserved before generation.
    const shareToken = crypto.randomUUID().slice(0, 12);
    const render = await createVisualizerRender({
      session_id: sessionId,
      render_url: urlData.publicUrl,
      surfaces,
      share_token: shareToken,
    });

    return NextResponse.json({
      render_id: render.id,
      render_url: urlData.publicUrl,
      share_token: shareToken,
      renders_remaining: MAX_RENDERS_SELF_SERVE - reservedCount,
    });
  } catch (err) {
    console.error("[POST /api/visualize/render] OpenAI/storage:", err);

    const apiError = err as { status?: number; message?: string };
    const creditsExhausted =
      apiError.status === 429 &&
      apiError.message?.toLowerCase().includes("no credits remaining");

    if (creditsExhausted) {
      return NextResponse.json(
        {
          error:
            "The visualizer is temporarily unavailable because its image-generation credits are exhausted.",
          code: "IMAGE_CREDITS_EXHAUSTED",
        },
        { status: 503 }
      );
    }

    if (apiError.status === 429) {
      return NextResponse.json(
        {
          error: "The visualizer is busy right now. Please wait a moment and try again.",
          code: "IMAGE_RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate visualization. Please try again." },
      { status: 500 }
    );
  }
}

/** Fetch an image URL and return it as a File object for the OpenAI API. */
async function fetchImageAsFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch photo: ${res.status}`);
  const blob = await res.blob();
  return new File([blob], "photo.png", { type: blob.type });
}
