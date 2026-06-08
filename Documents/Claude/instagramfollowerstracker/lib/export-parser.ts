import { inflateRawSync } from 'node:zlib';

export interface ExportPerson {
  handle: string;
  displayName?: string;
  followedAt?: Date;
}

export interface ExportData {
  followers: ExportPerson[];
  following: ExportPerson[];
}

export interface ParsedUpload {
  data: ExportData;
  recentlyUnfollowed: ExportPerson[];
}

export interface UnfollowDiff {
  newFollowers: ExportPerson[];
  lostFollowers: ExportPerson[];
}

type RelationshipKind = 'followers' | 'following';

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;

// ── Public entry point ─────────────────────────────────────────────────────
// Accepts one or more files — auto-detects format (JSON/HTML) and role
// (followers / following / recently_unfollowed) from filename.

export async function parseMultipleInstagramFiles(files: File[]): Promise<ParsedUpload> {
  const allFollowers: ExportPerson[] = [];
  const allFollowing: ExportPerson[] = [];
  const allRecentlyUnfollowed: ExportPerson[] = [];

  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (lowerName.endsWith('.zip') || file.type.includes('zip')) {
      const extracted = extractInstagramFilesFromZip(buffer);
      allFollowers.push(
        ...extracted.followersJson.flatMap((c) => parsePeopleJson(c, 'followers')),
        ...extracted.followersHtml.flatMap((c) => parsePeopleHtml(c, 'followers'))
      );
      allFollowing.push(
        ...(extracted.followingJson ? parsePeopleJson(extracted.followingJson, 'following') : []),
        ...(extracted.followingHtml ? parsePeopleHtml(extracted.followingHtml, 'following') : [])
      );
      allRecentlyUnfollowed.push(
        ...(extracted.recentlyUnfollowedHtml
          ? parseRecentlyUnfollowedHtml(extracted.recentlyUnfollowedHtml)
          : [])
      );
      continue;
    }

    const text = buffer.toString('utf8');
    const role = detectRole(lowerName);

    if (role === 'recently_unfollowed') {
      allRecentlyUnfollowed.push(...parseRecentlyUnfollowedHtml(text));
    } else if (role === 'following') {
      allFollowing.push(...(lowerName.endsWith('.html') ? parsePeopleHtml(text, 'following') : parsePeopleJson(text, 'following')));
    } else {
      // followers (or unknown JSON — try both)
      if (lowerName.endsWith('.html')) {
        allFollowers.push(...parsePeopleHtml(text, 'followers'));
      } else {
        const parsed = parseInstagramExport(text);
        allFollowers.push(...parsed.followers);
        allFollowing.push(...parsed.following);
      }
    }
  }

  return {
    data: {
      followers: dedupePeople(allFollowers),
      following: dedupePeople(allFollowing),
    },
    recentlyUnfollowed: dedupePeople(allRecentlyUnfollowed),
  };
}

// Legacy single-file entry point (kept for compatibility).
export async function parseInstagramUpload(file: File): Promise<ExportData> {
  const result = await parseMultipleInstagramFiles([file]);
  return result.data;
}

// ── Role detection ─────────────────────────────────────────────────────────

function detectRole(lowerName: string): 'followers' | 'following' | 'recently_unfollowed' {
  if (/recently.unfollowed/.test(lowerName)) return 'recently_unfollowed';
  // "following" but NOT "followers"
  if (/\bfollowing\b/.test(lowerName) && !/\bfollowers\b/.test(lowerName)) return 'following';
  return 'followers';
}

// ── HTML: recently_unfollowed_profiles.html ────────────────────────────────
// Structure: <td>Username</td><td>handle</td> table pairs

function parseRecentlyUnfollowedHtml(html: string): ExportPerson[] {
  const people: ExportPerson[] = [];
  const re = /Username<\/td><td[^>]*>([^<]+)<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const handle = match[1]!.trim().toLowerCase();
    if (/^[a-z0-9._]{1,30}$/.test(handle)) {
      people.push({ handle });
    }
  }
  return dedupePeople(people);
}

// ── HTML: followers_1.html / following.html ────────────────────────────────
// followers_1.html → href="https://www.instagram.com/HANDLE"
// following.html   → href="https://www.instagram.com/_u/HANDLE"
// Date appears in the next sibling div: </a></div><div>May 16, 2026 6:17 am</div>

function parsePeopleHtml(html: string, kind: RelationshipKind): ExportPerson[] {
  const people: ExportPerson[] = [];
  // \s* between elements allows for whitespace / newlines in Instagram's export HTML
  const re =
    kind === 'following'
      ? /href="https:\/\/www\.instagram\.com\/_u\/([a-z0-9._]{1,30})"[^>]*>[^<]*<\/a>\s*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/gi
      : /href="https:\/\/www\.instagram\.com\/(?!_u\/)([a-z0-9._]{1,30})"[^>]*>[^<]*<\/a>\s*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const handle = match[1]!.toLowerCase();
    if (/^[a-z0-9._]{1,30}$/.test(handle)) {
      const followedAt = parseInstagramHtmlDate(match[2]?.trim() ?? '');
      people.push({ handle, ...(followedAt ? { followedAt } : {}) });
    }
  }
  return dedupePeople(people);
}

const MONTH_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function parseInstagramHtmlDate(dateStr: string): Date | undefined {
  // "May 16, 2026 6:17 am"  or  "May 16, 2026 6:17 pm"
  const m = dateStr.match(/^(\w+)\s+(\d+),\s+(\d{4})\s+(\d+):(\d+)\s+(am|pm)$/i);
  if (!m) return undefined;
  const monthNum = MONTH_INDEX[m[1]!.toLowerCase()];
  if (monthNum === undefined) return undefined;
  let h = parseInt(m[4]!, 10);
  if (m[6]!.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (m[6]!.toLowerCase() === 'am' && h === 12) h = 0;
  return new Date(Date.UTC(parseInt(m[3]!, 10), monthNum, parseInt(m[2]!, 10), h, parseInt(m[5]!, 10)));
}

// ── JSON ───────────────────────────────────────────────────────────────────

export function parseInstagramExport(fileContent: string): ExportData {
  return {
    followers: parsePeopleJson(fileContent, 'followers'),
    following: parsePeopleJson(fileContent, 'following'),
  };
}

function parsePeopleJson(fileContent: string, kind: RelationshipKind): ExportPerson[] {
  let data: unknown;
  try {
    data = JSON.parse(fileContent);
  } catch {
    throw new Error('Invalid JSON - could not parse the uploaded file.');
  }
  const entries = findRelationshipEntries(data, kind);
  return dedupePeople(parseRelationshipEntries(entries));
}

function findRelationshipEntries(data: unknown, kind: RelationshipKind): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  const keys =
    kind === 'followers'
      ? ['relationships_followers', 'followers_1', 'followers']
      : ['relationships_following', 'following'];
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseRelationshipEntries(entries: unknown[]): ExportPerson[] {
  const people: ExportPerson[] = [];
  for (const item of entries) {
    if (!item || typeof item !== 'object') continue;
    const itemObj = item as Record<string, unknown>;
    const title = typeof itemObj.title === 'string' ? itemObj.title : undefined;
    const listData = itemObj.string_list_data;
    if (!Array.isArray(listData)) continue;
    for (const entry of listData) {
      if (!entry || typeof entry !== 'object') continue;
      const entryObj = entry as Record<string, unknown>;
      const handle = normalizeHandle(entryObj.value, entryObj.href);
      if (!handle) continue;
      people.push({
        handle,
        displayName: title || undefined,
        followedAt:
          typeof entryObj.timestamp === 'number' && entryObj.timestamp > 0
            ? new Date(entryObj.timestamp * 1000)
            : undefined,
      });
    }
  }
  return people;
}

function normalizeHandle(value: unknown, href: unknown): string | null {
  const raw =
    typeof value === 'string' && value.trim()
      ? value
      : typeof href === 'string'
        ? href.split('/').filter(Boolean).at(-1) ?? ''
        : '';
  const handle = raw.trim().replace(/^@/, '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

function dedupePeople(people: ExportPerson[]): ExportPerson[] {
  const byHandle = new Map<string, ExportPerson>();
  for (const person of people) {
    if (!byHandle.has(person.handle)) byHandle.set(person.handle, person);
  }
  return [...byHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

// ── ZIP extraction ─────────────────────────────────────────────────────────
// Only decompresses the target files — skips all media and unrelated entries.

function extractInstagramFilesFromZip(buffer: Buffer): {
  followersJson: string[];
  followersHtml: string[];
  followingJson?: string;
  followingHtml?: string;
  recentlyUnfollowedHtml?: string;
} {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  const result: {
    followersJson: string[];
    followersHtml: string[];
    followingJson?: string;
    followingHtml?: string;
    recentlyUnfollowedHtml?: string;
  } = { followersJson: [], followersHtml: [] };

  let offset = centralDirectoryOffset;
  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error('Invalid ZIP central directory.');
    }
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer.toString('utf8', nameStart, nameStart + fileNameLength).toLowerCase();

    const isFollowersJson = /(^|\/)followers_?\d*\.json$/.test(name);
    const isFollowersHtml = /(^|\/)followers_?\d*\.html$/.test(name);
    const isFollowingJson = !result.followingJson && /(^|\/)following\.json$/.test(name);
    const isFollowingHtml = !result.followingHtml && /(^|\/)following\.html$/.test(name);
    const isRecentlyUnfollowedHtml =
      !result.recentlyUnfollowedHtml && /(^|\/)recently_unfollowed_profiles\.html$/.test(name);

    if (isFollowersJson || isFollowersHtml || isFollowingJson || isFollowingHtml || isRecentlyUnfollowedHtml) {
      const text = readZipEntryText(buffer, localHeaderOffset, compressedSize, compressionMethod);
      if (isFollowersJson) result.followersJson.push(text);
      else if (isFollowersHtml) result.followersHtml.push(text);
      else if (isFollowingJson) result.followingJson = text;
      else if (isFollowingHtml) result.followingHtml = text;
      else if (isRecentlyUnfollowedHtml) result.recentlyUnfollowedHtml = text;
    }

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  const hasData =
    result.followersJson.length > 0 ||
    result.followersHtml.length > 0 ||
    result.followingJson ||
    result.followingHtml;

  if (!hasData) {
    throw new Error(
      'No followers/following files found in the ZIP. Extract the ZIP and upload the small followers_and_following folder files instead.'
    );
  }
  return result;
}

function readZipEntryText(
  buffer: Buffer,
  localHeaderOffset: number,
  compressedSize: number,
  compressionMethod: number
): string {
  if (buffer.readUInt32LE(localHeaderOffset) !== ZIP_LOCAL_FILE_SIGNATURE) {
    throw new Error('Invalid ZIP local file header.');
  }
  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
  if (compressionMethod === 0) return compressed.toString('utf8');
  if (compressionMethod === 8) return inflateRawSync(compressed).toString('utf8');
  throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minOffset = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minOffset; offset--) {
    if (buffer.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) return offset;
  }
  throw new Error('Invalid ZIP file.');
}

// ── Diff ───────────────────────────────────────────────────────────────────

export function diffExports(previous: ExportData, current: ExportData): UnfollowDiff {
  const prevHandles = new Set(previous.followers.map((f) => f.handle));
  const currHandles = new Set(current.followers.map((f) => f.handle));
  return {
    newFollowers: current.followers.filter((f) => !prevHandles.has(f.handle)),
    lostFollowers: previous.followers.filter((f) => !currHandles.has(f.handle)),
  };
}
