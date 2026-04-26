import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'frameshift.db'));

export function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      duration REAL DEFAULT 0,
      scene_count INTEGER DEFAULT 0,
      thumbnail TEXT DEFAULT '',
      upload_date TEXT NOT NULL,
      status TEXT DEFAULT 'processing',
      file_url TEXT,
      server_id TEXT,
      progress INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      type TEXT NOT NULL,
      duration REAL NOT NULL,
      thumbnail TEXT DEFAULT '',
      visual_quality TEXT DEFAULT 'medium',
      tags TEXT DEFAULT '[]',
      start_time REAL,
      end_time REAL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      structure TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      clips TEXT NOT NULL,
      status TEXT DEFAULT 'generating',
      thumbnail TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      scheduled_for TEXT,
      composition_url TEXT
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      variant_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      downloaded_at TEXT NOT NULL
    );
  `);

  // Seed default templates if table is empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM templates').get() as { c: number }).c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO templates (id, name, description, structure) VALUES (?, ?, ?, ?)');
    insert.run('t1', 'Tutorial Flow', 'Hook to engage, step-by-step breakdown, end with result.', JSON.stringify(['hook', 'step 1', 'step 2', 'result']));
    insert.run('t2', 'Before/After', 'Show the problem, transition to the solution.', JSON.stringify(['problem', 'before clip', 'transition', 'after clip', 'result']));
    insert.run('t3', 'Compilation', 'Fast-paced montage of best moments.', JSON.stringify(['hook', 'b-roll 1', 'b-roll 2', 'b-roll 3', 'CTA']));
  }
}

// ── Videos ──────────────────────────────────────────────────────────────────

export function saveVideo(v: {
  id: string; title: string; duration: number; sceneCount: number;
  thumbnail: string; uploadDate: string; status: string;
  fileUrl?: string; serverId?: string; progress: number;
}): void {
  db.prepare(`INSERT OR REPLACE INTO videos VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(v.id, v.title, v.duration, v.sceneCount, v.thumbnail, v.uploadDate, v.status, v.fileUrl ?? null, v.serverId ?? null, v.progress);
}

export function updateVideoStatus(id: string, status: string, fileUrl?: string, serverId?: string, thumbnail?: string): void {
  db.prepare(`UPDATE videos SET status=?, file_url=COALESCE(?,file_url), server_id=COALESCE(?,server_id), thumbnail=COALESCE(?,thumbnail) WHERE id=?`)
    .run(status, fileUrl ?? null, serverId ?? null, thumbnail ?? null, id);
}

export function getAllVideos(): object[] {
  return (db.prepare('SELECT * FROM videos').all() as any[]).map(row => ({
    id: row.id,
    title: row.title,
    duration: row.duration,
    sceneCount: row.scene_count,
    thumbnail: row.thumbnail,
    uploadDate: row.upload_date,
    status: row.status,
    fileUrl: row.file_url,
    serverId: row.server_id,
    progress: row.progress,
  }));
}

// ── Clips ────────────────────────────────────────────────────────────────────

export function saveClips(clips: {
  id: string; videoId: string; type: string; duration: number;
  thumbnail: string; visualQuality: string; tags: string[];
  startTime?: number; endTime?: number;
}[]): void {
  const insert = db.prepare(`INSERT OR REPLACE INTO clips VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const c of clips) {
    insert.run(c.id, c.videoId, c.type, c.duration, c.thumbnail, c.visualQuality, JSON.stringify(c.tags), c.startTime ?? null, c.endTime ?? null);
  }
}

export function getAllClips(): object[] {
  return (db.prepare('SELECT * FROM clips').all() as any[]).map(row => ({
    id: row.id,
    videoId: row.video_id,
    type: row.type,
    duration: row.duration,
    thumbnail: row.thumbnail,
    visualQuality: row.visual_quality,
    tags: JSON.parse(row.tags),
    startTime: row.start_time,
    endTime: row.end_time,
  }));
}

// ── Templates ────────────────────────────────────────────────────────────────

export function getAllTemplates(): object[] {
  return (db.prepare('SELECT * FROM templates').all() as any[]).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    structure: JSON.parse(row.structure),
  }));
}

// ── Variants ─────────────────────────────────────────────────────────────────

export function saveVariant(v: {
  id: string; templateId: string; clips: string[];
  status: string; thumbnail: string; createdAt: string;
  scheduledFor?: string; compositionUrl?: string;
}): void {
  db.prepare(`INSERT OR REPLACE INTO variants VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(v.id, v.templateId, JSON.stringify(v.clips), v.status, v.thumbnail, v.createdAt, v.scheduledFor ?? null, v.compositionUrl ?? null);
}

export function updateVariantStatus(id: string, status: string, compositionUrl?: string): void {
  db.prepare(`UPDATE variants SET status=?, composition_url=COALESCE(?,composition_url) WHERE id=?`)
    .run(status, compositionUrl ?? null, id);
}

export function getAllVariants(): object[] {
  return (db.prepare('SELECT * FROM variants').all() as any[]).map(row => ({
    id: row.id,
    templateId: row.template_id,
    clips: JSON.parse(row.clips),
    status: row.status,
    thumbnail: row.thumbnail,
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for,
    compositionUrl: row.composition_url,
  }));
}

// ── Downloads ────────────────────────────────────────────────────────────────

export function saveDownload(d: {
  id: string; variantId: string; fileName: string;
  filePath: string; fileSize: number; downloadedAt: string;
}): void {
  db.prepare(`INSERT INTO downloads VALUES (?, ?, ?, ?, ?, ?)`)
    .run(d.id, d.variantId, d.fileName, d.filePath, d.fileSize, d.downloadedAt);
}

export function getAllDownloads(): object[] {
  return (db.prepare('SELECT * FROM downloads').all() as any[]).map(row => ({
    id: row.id,
    variantId: row.variant_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    downloadedAt: row.downloaded_at,
  }));
}

export default db;
