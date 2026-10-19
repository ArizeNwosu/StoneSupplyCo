import { createServiceClient } from "@/lib/supabase";

export async function isRateLimited(
  ip: string,
  opts: { limit: number; windowMs: number; key?: string }
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("check_api_rate_limit", {
    rate_key: `${opts.key ?? "default"}:${ip}`,
    request_limit: opts.limit,
    window_seconds: Math.ceil(opts.windowMs / 1000),
  });

  if (error) {
    console.error("[rate-limit] persistent limiter failed:", error.message);
    return true;
  }

  return data !== true;
}

export function getIp(request: Request): string {
  return (
    (request.headers as Headers).get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}
