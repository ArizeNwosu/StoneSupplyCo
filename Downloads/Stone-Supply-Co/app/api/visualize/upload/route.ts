// app/api/visualize/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { createVisualizerSession } from "@/lib/db/visualizer";
import { isRateLimited, getIp } from "@/lib/rateLimiter";
import type { RoomType } from "@/types/visualizer";

export const dynamic = "force-dynamic";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000, key: "viz-upload" };
const VALID_ROOMS: RoomType[] = ["kitchen", "bathroom"];

export async function POST(request: NextRequest) {
  if (isRateLimited(getIp(request), RATE)) {
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

  const photoData = body.photo_data as string | undefined;
  const roomType = body.room_type as string | undefined;

  if (!photoData || !String(photoData).startsWith("data:image/")) {
    return NextResponse.json(
      { error: "photo_data must be a data:image/* data URL." },
      { status: 400 }
    );
  }

  if (!roomType || !VALID_ROOMS.includes(roomType as RoomType)) {
    return NextResponse.json(
      { error: "room_type must be 'kitchen' or 'bathroom'." },
      { status: 400 }
    );
  }

  // Extract binary from data URL
  const base64Match = photoData.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) {
    return NextResponse.json(
      { error: "Invalid photo_data format." },
      { status: 400 }
    );
  }

  const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
  const buffer = Buffer.from(base64Match[2], "base64");

  // 10MB limit
  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Photo exceeds 10MB limit." },
      { status: 413 }
    );
  }

  const supabase = createServiceClient();
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("visualizer-photos")
    .upload(fileName, buffer, {
      contentType: `image/${base64Match[1]}`,
      upsert: false,
    });

  if (uploadError) {
    console.error("[POST /api/visualize/upload] storage:", uploadError.message);
    return NextResponse.json(
      { error: "Failed to upload photo." },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("visualizer-photos")
    .getPublicUrl(fileName);

  try {
    const session = await createVisualizerSession({
      photo_url: urlData.publicUrl,
      room_type: roomType as RoomType,
    });

    return NextResponse.json(
      { session_id: session.id, photo_url: urlData.publicUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/visualize/upload] db:", err);
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }
}
