import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTO_BUCKET = "visualizer-photos";
const PHOTO_URL_MARKERS = [
  `/storage/v1/object/public/${PHOTO_BUCKET}/`,
  `/storage/v1/object/sign/${PHOTO_BUCKET}/`,
  `/${PHOTO_BUCKET}/`,
];

export function getVisualizerPhotoPath(photoUrl: string): string {
  for (const marker of PHOTO_URL_MARKERS) {
    const markerIndex = photoUrl.indexOf(marker);
    if (markerIndex === -1) continue;

    const encodedPath = photoUrl.slice(markerIndex + marker.length).split("?")[0];
    if (!encodedPath) break;

    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  throw new Error("Invalid visualizer photo URL");
}

export async function createVisualizerPhotoUrl(
  supabase: SupabaseClient,
  photoUrlOrPath: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  const photoPath = photoUrlOrPath.includes("/")
    ? getVisualizerPhotoPath(photoUrlOrPath)
    : photoUrlOrPath;

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create photo URL: ${error?.message ?? "unknown error"}`);
  }

  return data.signedUrl;
}
