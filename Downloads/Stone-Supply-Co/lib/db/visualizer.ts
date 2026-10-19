import { createServiceClient } from "@/lib/supabase";
import type {
  RoomType,
  SurfaceSelection,
  VisualizerSession,
  VisualizerRender,
  VisualizerLead,
} from "@/types/visualizer";

// ── Sessions ──────────────────────────────────────────────

export async function createVisualizerSession(input: {
  photo_url: string;
  room_type: RoomType;
}): Promise<VisualizerSession> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_sessions")
    .insert({
      photo_url: input.photo_url,
      room_type: input.room_type,
      render_count: 0,
      lead_captured: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerSession: ${error.message}`);
  return data as VisualizerSession;
}

export async function getVisualizerSession(
  id: string
): Promise<VisualizerSession | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getVisualizerSession: ${error.message}`);
  }
  return data as VisualizerSession;
}

export async function incrementRenderCount(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("increment_render_count", {
    session_id: sessionId,
  });
  if (error) {
    // Fallback: read-then-write if RPC not available
    const session = await getVisualizerSession(sessionId);
    if (!session) throw new Error("Session not found");
    const { error: updateError } = await supabase
      .from("visualizer_sessions")
      .update({ render_count: session.render_count + 1 })
      .eq("id", sessionId);
    if (updateError)
      throw new Error(`incrementRenderCount: ${updateError.message}`);
  }
}

export async function reserveVisualizerRender(
  sessionId: string,
  limit: number
): Promise<number | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("reserve_visualizer_render", {
    target_session_id: sessionId,
    render_limit: limit,
  });
  if (error) throw new Error(`reserveVisualizerRender: ${error.message}`);
  return typeof data === "number" && data >= 0 ? data : null;
}

export async function markLeadCaptured(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("visualizer_sessions")
    .update({ lead_captured: true })
    .eq("id", sessionId);
  if (error) throw new Error(`markLeadCaptured: ${error.message}`);
}

// ── Renders ───────────────────────────────────────────────

export async function createVisualizerRender(input: {
  session_id: string;
  render_url: string;
  surfaces: SurfaceSelection[];
  share_token: string;
}): Promise<VisualizerRender> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_renders")
    .insert({
      session_id: input.session_id,
      render_url: input.render_url,
      surfaces: input.surfaces,
      share_token: input.share_token,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerRender: ${error.message}`);
  return data as VisualizerRender;
}

export async function getVisualizerRenderByToken(
  token: string
): Promise<(VisualizerRender & { session: VisualizerSession }) | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_renders")
    .select("*, session:visualizer_sessions(*)")
    .eq("share_token", token)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getVisualizerRenderByToken: ${error.message}`);
  }
  return data as VisualizerRender & { session: VisualizerSession };
}

// ── Leads ─────────────────────────────────────────────────

export async function createVisualizerLead(input: {
  session_id: string;
  name: string;
  email: string;
  phone: string;
}): Promise<VisualizerLead> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("visualizer_leads")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(`createVisualizerLead: ${error.message}`);
  return data as VisualizerLead;
}
