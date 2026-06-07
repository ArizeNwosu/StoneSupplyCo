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

export interface UnfollowDiff {
  newFollowers: ExportPerson[];
  lostFollowers: ExportPerson[];
}

type RelationshipKind = 'followers' | 'following';

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;

export async function parseInstagramUpload(file: File): Promise<ExportData> {
  const lowerName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (lowerName.endsWith('.zip') || file.type.includes('zip')) {
    const files = extractInstagramFilesFromZip(buffer);
    return {
      followers: dedupePeople([
        ...files.followersJson.flatMap((c) => parsePeopleJson(c, 'followers')),
        ...files.followersHtml.flatMap((c) => parsePeopleHtml(c, 'followers')),
      ]),
      following: dedupePeople([
        ...(files.followingJson ? parsePeopleJson(files.followingJson, 'following') : []),
        ...(files.followingHtml ? parsePeopleHtml(files.followingHtml, 'following') : []),
      ]),
    };
  }

  const text = buffer.toString('utf8');

  if (lowerName.endsWith('.html')) {
    // Single HTML file: determine type by filename
    const kind: RelationshipKind = lowerName.includes('following') ? 'following' : 'followers';
    const people = parsePeopleHtml(text, kind);
    return kind === 'following'
      ? { followers: [], following: people }
      : { followers: people, following: [] };
  }

  return parseInstagramExport(text);
}

export function parseInstagramExport(fileContent: string): ExportData {
  return {
    followers: parsePeopleJson(fileContent, 'followers'),
    following: parsePeopleJson(fileContent, 'following'),
  };
}

// ── HTML parsing ───────────────────────────────────────────────────────────
// followers_1.html  → href="https://www.instagram.com/HANDLE"
// following.html    → href="https://www.instagram.com/_u/HANDLE"

function parsePeopleHtml(html: string, kind: RelationshipKind): ExportPerson[] {
  const people: ExportPerson[] = [];
  const re =
    kind === 'following'
      ? /href="https:\/\/www\.instagram\.com\/_u\/([a-z0-9._]{1,30})"/gi
      : /href="https:\/\/www\.instagram\.com\/(?!_u\/)([a-z0-9._]{1,30})"/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const handle = match[1]!.toLowerCase();
    if (/^[a-z0-9._]{1,30}$/.test(handle)) {
      people.push({ handle });
    }
  }
  return dedupePeople(people);
}

// ── JSON parsing ───────────────────────────────────────────────────────────

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
          typeof entryObj.timestamp === 'number'
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
    if (!byHandle.has(person.handle)) {
      byHandle.set(person.handle, person);
    }
  }
  return [...byHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

// ── ZIP extraction ─────────────────────────────────────────────────────────
// Only decompresses the specific files we need — skips all media/other files.

function extractInstagramFilesFromZip(buffer: Buffer): {
  followersJson: string[];
  followersHtml: string[];
  followingJson?: string;
  followingHtml?: string;
} {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  const result: {
    followersJson: string[];
    followersHtml: string[];
    followingJson?: string;
    followingHtml?: string;
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

    if (isFollowersJson || isFollowersHtml || isFollowingJson || isFollowingHtml) {
      const text = readZipEntryText(buffer, localHeaderOffset, compressedSize, compressionMethod);
      if (isFollowersJson) result.followersJson.push(text);
      else if (isFollowersHtml) result.followersHtml.push(text);
      else if (isFollowingJson) result.followingJson = text;
      else if (isFollowingHtml) result.followingHtml = text;
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
      'No Instagram followers/following files found in the ZIP. Upload the original Instagram data ZIP, followers_1.json, or followers_1.html.'
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
    if (buffer.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) {
      return offset;
    }
  }
  throw new Error('Invalid ZIP file.');
}

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
