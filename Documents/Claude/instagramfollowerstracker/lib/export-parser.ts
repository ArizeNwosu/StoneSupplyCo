// Parses Instagram data export JSON and diffs two exports.
// Called only from app/api/exports/route.ts — never from client components.

export interface ExportPerson {
  handle: string;
  displayName?: string;
  followedAt?: Date;
}

export interface ExportData {
  followers: ExportPerson[];
  following: ExportPerson[];
}

export interface UnfollowDiff {
  newFollowers: ExportPerson[];   // in current, not in previous
  lostFollowers: ExportPerson[];  // in previous, not in current
}

/**
 * Parses an Instagram followers JSON export file.
 * Handles both the current array format and the older object-with-key format.
 * The `following` array will be empty when uploading just followers_1.json —
 * that is acceptable; diff is computed on followers only.
 */
export function parseInstagramExport(fileContent: string): ExportData {
  let data: unknown;
  try {
    data = JSON.parse(fileContent);
  } catch {
    throw new Error('Invalid JSON — could not parse the uploaded file.');
  }

  const followers: ExportPerson[] = [];
  const following: ExportPerson[] = [];

  // Determine which array holds the follower entries
  let followerEntries: unknown[] = [];
  if (Array.isArray(data)) {
    // Current Instagram format: top-level array is the followers list
    followerEntries = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Older format: { relationships_followers: [...] }
    const raw = obj['relationships_followers'] ?? obj['followers_1'] ?? [];
    followerEntries = Array.isArray(raw) ? raw : [];
  }

  for (const item of followerEntries) {
    if (!item || typeof item !== 'object') continue;
    const entries = (item as Record<string, unknown>)['string_list_data'];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      if (typeof e['value'] !== 'string' || !e['value']) continue;
      followers.push({
        handle: (e['value'] as string).replace(/^@/, '').toLowerCase(),
        followedAt:
          typeof e['timestamp'] === 'number'
            ? new Date((e['timestamp'] as number) * 1000)
            : undefined,
      });
    }
  }

  return { followers, following };
}

/**
 * Computes who followed and unfollowed between two exports.
 * Only considers the followers list — following diff not computed here.
 */
export function diffExports(
  previous: ExportData,
  current: ExportData
): UnfollowDiff {
  const prevHandles = new Set(previous.followers.map((f) => f.handle));
  const currHandles = new Set(current.followers.map((f) => f.handle));

  return {
    newFollowers: current.followers.filter((f) => !prevHandles.has(f.handle)),
    lostFollowers: previous.followers.filter((f) => !currHandles.has(f.handle)),
  };
}
