import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { XMLParser } from "fast-xml-parser";
import Database from "better-sqlite3";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ─── Database ────────────────────────────────────────────────────────────────

const db = new Database(path.join(__dirname, "pulseglp1.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS evidence (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL,
    source        TEXT NOT NULL,
    drug          TEXT NOT NULL,
    text          TEXT NOT NULL,
    url           TEXT NOT NULL,
    post_ts       INTEGER NOT NULL,
    first_seen_at INTEGER NOT NULL,
    stage         TEXT,
    sentiment     TEXT,
    tags          TEXT,
    coverage      INTEGER
  );

  CREATE TABLE IF NOT EXISTS analysis_runs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at          INTEGER NOT NULL,
    top_insights    TEXT NOT NULL,
    emerging_topics TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS intel_cache (
    key       TEXT PRIMARY KEY,
    value     TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    type      TEXT    NOT NULL,
    message   TEXT    NOT NULL,
    drug      TEXT,
    value     REAL,
    threshold REAL,
    fired_at  INTEGER NOT NULL,
    ack_at    INTEGER
  );

  CREATE TABLE IF NOT EXISTS digests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_at INTEGER NOT NULL,
    data         TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_evidence_drug    ON evidence(drug);
  CREATE INDEX IF NOT EXISTS idx_evidence_post_ts ON evidence(post_ts);
  CREATE INDEX IF NOT EXISTS idx_runs_at          ON analysis_runs(run_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_fired     ON alerts(fired_at);
`);

const stmtUpsert = db.prepare(`
  INSERT INTO evidence (id, type, source, drug, text, url, post_ts, first_seen_at)
  VALUES (@id, @type, @source, @drug, @text, @url, @post_ts, @first_seen_at)
  ON CONFLICT(id) DO NOTHING
`);

const stmtClassify = db.prepare(`
  UPDATE evidence SET stage=@stage, sentiment=@sentiment, tags=@tags, coverage=@coverage
  WHERE id=@id
`);

const stmtInsertRun = db.prepare(`
  INSERT INTO analysis_runs (run_at, top_insights, emerging_topics) VALUES (?, ?, ?)
`);

function saveEvidence(rows: any[]) {
  const insert = db.transaction((items: any[]) => {
    for (const r of items) stmtUpsert.run(r);
  });
  insert(rows);
}

function applyClassifications(classifications: any[]) {
  const update = db.transaction((items: any[]) => {
    for (const c of items) {
      stmtClassify.run({
        id: c.id,
        stage: c.stage,
        sentiment: c.sentimentLabel,
        tags: JSON.stringify(c.tags || []),
        coverage: c.coverage ?? 50
      });
    }
  });
  update(classifications);
}

function loadAllEvidence(): any[] {
  return (db.prepare("SELECT * FROM evidence ORDER BY post_ts DESC LIMIT 500").all() as any[])
    .map(row => ({
      ...row,
      timestamp: row.post_ts,
      sentimentLabel: row.sentiment,
      tags: JSON.parse(row.tags || '[]')
    }));
}

// ─── Text cleaning ───────────────────────────────────────────────────────────

function decodeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')            // strip HTML comments
    .replace(/submitted by[\s\S]*/i, '')         // strip Reddit footer
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')                   // strip HTML tags
    .replace(/\[link\]|\[comments?\]/gi, '')     // strip Reddit placeholders
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Reddit scraping ─────────────────────────────────────────────────────────

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const SUBS = [
  { name: "Ozempic",           drug: "Ozempic"      },
  { name: "Mounjaro",          drug: "Mounjaro"     },
  { name: "WegovyWeightLoss",  drug: "Wegovy"       },
  { name: "Zepbound",          drug: "Zepbound"     },
  { name: "Semaglutide",       drug: "Semaglutide"  }
];

async function rssEntries(url: string): Promise<any[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PulseGLP1/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml'
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  return parsed?.feed?.entry || [];
}

async function fetchPosts(name: string, drug: string): Promise<any[]> {
  try {
    const entries = await rssEntries(`https://www.reddit.com/r/${name}/new/.rss?limit=25`);
    return entries.map((e: any, i: number) => {
      const title = decodeHtml(e.title?.["#text"] || e.title || "");
      const body  = decodeHtml(e.content?.["#text"] || e.content || "");
      const text  = `${title} ${body}`.replace(/\s+/g, ' ').trim().substring(0, 800);
      const url   = e.link?.["@_href"] || e.id || "";
      const ts    = e.published ? new Date(e.published).getTime() : Date.now();
      return { id: `post-${name}-${i}-${ts}`, type: 'post', source: `r/${name}`, drug, text, url, post_ts: ts, first_seen_at: Date.now() };
    }).filter((p: any) => p.text.length > 20);
  } catch (err: any) {
    console.warn(`[posts] r/${name} RSS failed: ${err.message}`);
    return [];
  }
}

async function fetchComments(name: string, drug: string): Promise<any[]> {
  try {
    const entries = await rssEntries(`https://www.reddit.com/r/${name}/comments.rss?limit=25`);
    return entries.map((e: any, i: number) => {
      const body = decodeHtml(e.content?.["#text"] || e.content || e.summary?.["#text"] || "");
      const url  = e.link?.["@_href"] || e.id || "";
      const ts   = e.updated ? new Date(e.updated).getTime() : Date.now();
      return { id: `comment-${name}-${i}-${ts}`, type: 'comment', source: `r/${name}`, drug, text: body.substring(0, 600), url, post_ts: ts, first_seen_at: Date.now() };
    }).filter((p: any) => p.text.length > 20);
  } catch (err: any) {
    console.warn(`[comments] r/${name} RSS failed: ${err.message}`);
    return [];
  }
}

const FALLBACK_POSTS = [
  { id: 'f-1a', type: 'post', source: 'r/Ozempic', drug: 'Ozempic', text: 'I started Ozempic 3 weeks ago for weight loss. Nausea was bad week 1 but now manageable. However, I have noticed severe fatigue the day after my injection.', url: 'https://reddit.com/r/Ozempic/comments/f1a', post_ts: Date.now() - 3600000, first_seen_at: Date.now() },
  { id: 'f-1b', type: 'post', source: 'r/Ozempic', drug: 'Ozempic', text: 'Lost 15 lbs so far, but I am terrified of "Ozempic face". Does taking collagen actually help preserve facial volume or is it a myth?', url: 'https://reddit.com/r/Ozempic/comments/f1b', post_ts: Date.now() - 7200000, first_seen_at: Date.now() },
  { id: 'f-1c', type: 'post', source: 'r/Ozempic', drug: 'Ozempic', text: 'Week 8 on 0.5mg. Down 18 lbs. Hair loss started week 6 — is this permanent? Dermatologist says telogen effluvium from calorie restriction.', url: 'https://reddit.com/r/Ozempic/comments/f1c', post_ts: Date.now() - 5400000, first_seen_at: Date.now() },
  { id: 'f-2a', type: 'post', source: 'r/Mounjaro', drug: 'Mounjaro', text: 'Month 6 on Mounjaro. Hit a plateau for 3 weeks on 7.5mg. Doctor suggested 10mg but I am worried about side effects returning.', url: 'https://reddit.com/r/Mounjaro/comments/f2a', post_ts: Date.now() - 14400000, first_seen_at: Date.now() },
  { id: 'f-2b', type: 'post', source: 'r/Mounjaro', drug: 'Mounjaro', text: 'Insurance denied my prior authorization for Mounjaro. They said I need step therapy first. Has anyone successfully appealed this?', url: 'https://reddit.com/r/Mounjaro/comments/f2b', post_ts: Date.now() - 86400000, first_seen_at: Date.now() },
  { id: 'f-2c', type: 'comment', source: 'r/Mounjaro', drug: 'Mounjaro', text: 'Tirzepatide compound at $199/month vs $1,100 name brand Mounjaro. Anyone have safety concerns about compounded versions from telehealth?', url: 'https://reddit.com/r/Mounjaro/comments/f2c', post_ts: Date.now() - 32000000, first_seen_at: Date.now() },
  { id: 'f-3a', type: 'post', source: 'r/WegovyWeightLoss', drug: 'Wegovy', text: 'Switched from Ozempic to Wegovy due to shortages. Transition was smooth, but food noise is coming back slightly.', url: 'https://reddit.com/r/WegovyWeightLoss/comments/f3a', post_ts: Date.now() - 1200000, first_seen_at: Date.now() },
  { id: 'f-3b', type: 'comment', source: 'r/WegovyWeightLoss', drug: 'Wegovy', text: 'Six months in, down 52 lbs. Cardiologist says heart disease risk markers improved dramatically. This drug saved my life.', url: 'https://reddit.com/r/WegovyWeightLoss/comments/f3b', post_ts: Date.now() - 28800000, first_seen_at: Date.now() },
  { id: 'f-3c', type: 'comment', source: 'r/WegovyWeightLoss', drug: 'Wegovy', text: 'Rebound weight gain after stopping Wegovy — regained 20 of 40 lbs in 3 months due to cost. Is anyone staying on it indefinitely?', url: 'https://reddit.com/r/WegovyWeightLoss/comments/f3c', post_ts: Date.now() - 52000000, first_seen_at: Date.now() },
  { id: 'f-4a', type: 'post', source: 'r/Zepbound', drug: 'Zepbound', text: 'First week on Zepbound! Down 4 lbs water weight. No side effects except mild constipation. Any tips for getting more fiber?', url: 'https://reddit.com/r/Zepbound/comments/f4a', post_ts: Date.now() - 24000000, first_seen_at: Date.now() },
  { id: 'f-4b', type: 'comment', source: 'r/Zepbound', drug: 'Zepbound', text: 'Zepbound single-dose vials now available at $399/month for 2.5mg. Game changer for access compared to the pen format.', url: 'https://reddit.com/r/Zepbound/comments/f4b', post_ts: Date.now() - 10800000, first_seen_at: Date.now() },
  { id: 'f-4c', type: 'comment', source: 'r/Zepbound', drug: 'Zepbound', text: 'PCOS and Zepbound — testosterone levels normalized completely after 4 months. Anyone else seeing hormonal benefits beyond weight loss?', url: 'https://reddit.com/r/Zepbound/comments/f4c', post_ts: Date.now() - 19200000, first_seen_at: Date.now() },
];

async function scrapeAll(): Promise<any[]> {
  const results = await Promise.allSettled(
    SUBS.flatMap(({ name, drug }) => [fetchPosts(name, drug), fetchComments(name, drug)])
  );

  const fresh: any[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') fresh.push(...r.value);
  }

  if (fresh.length < 5) {
    console.log("[scrape] Reddit unreachable — using built-in fallback posts.");
    return FALLBACK_POSTS;
  }

  fresh.sort((a, b) => b.post_ts - a.post_ts);
  console.log(`[scrape] Collected ${fresh.length} posts+comments across ${SUBS.length} subreddits.`);
  return fresh.slice(0, 80);
}

// ─── Gemini analysis ─────────────────────────────────────────────────────────

async function analyzeWithGemini(items: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
Analyze these recent Reddit posts AND comments from GLP-1 drug communities (Ozempic, Mounjaro, Wegovy, Zepbound).
The dataset includes both original posts and comment replies — use the richer comment data for deeper sentiment analysis.

ITEMS (type: post|comment):
${JSON.stringify(items.map(p => ({ id: p.id, type: p.type, source: p.source, text: p.text.substring(0, 350) })))}

Your task:
1. Provide 3 "Top Insights". Each: title (max 4 words), description (1-2 sentences), momentum (e.g. "+18% WoW"), status ("CRITICAL"|"EMERGING"|"TRENDING"), action (pharma recommendation), actionDesc.
2. Provide 5 "Emerging Sub-Topics". Each: topic (max 5 words), desc, volume (e.g. "12,408"), momStr (e.g. "+14%"), sentimentScore (0-100), topicDomain (one of: 'Side Effects & Tolerability'|'Market Access & Pricing'|'Clinical Efficacy'|'Off-label Prescribing'), tags (1-3 short tags), relatedDrugs, momentum ("up"|"down"|"flat").
3. Classify EACH item (post and comment alike). For each id: stage ("Starting"|"Maintenance"|"Titration"|"Off-Ramp"), sentimentLabel ("Positive"|"Neutral-Low"|"Risk-Alert"|"Analytical"), tags (2-3 short tags), coverage (0-100).

Return pure JSON only.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topInsights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, momentum: { type: Type.STRING }, status: { type: Type.STRING }, action: { type: Type.STRING }, actionDesc: { type: Type.STRING } }, required: ["title","description","momentum","status","action","actionDesc"] } },
          emergingTopics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, desc: { type: Type.STRING }, volume: { type: Type.STRING }, momStr: { type: Type.STRING }, sentimentScore: { type: Type.INTEGER }, topicDomain: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, relatedDrugs: { type: Type.ARRAY, items: { type: Type.STRING } }, momentum: { type: Type.STRING } }, required: ["topic","desc","volume","momStr","sentimentScore","topicDomain","tags","relatedDrugs","momentum"] } },
          postClassifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, stage: { type: Type.STRING }, sentimentLabel: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, coverage: { type: Type.INTEGER } }, required: ["id","stage","sentimentLabel","tags","coverage"] } }
        },
        required: ["topInsights","emergingTopics","postClassifications"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

// ─── Arctic Shift backfill ───────────────────────────────────────────────────

const ARCTIC = "https://arctic-shift.photon-reddit.com/api";
const BATCH  = 100; // max per request

interface BackfillJob {
  status: 'running' | 'done' | 'error';
  subreddit: string;
  type: 'posts' | 'comments';
  saved: number;
  cursor: number;   // unix timestamp — current position
  startTs: number;
  endTs: number;
  error?: string;
}

// In-memory job registry (survives until server restart)
const backfillJobs = new Map<string, BackfillJob>();

async function arcticPage(
  subreddit: string,
  type: 'posts' | 'comments',
  after: number,
  before: number
): Promise<any[]> {
  const endpoint = type === 'posts' ? 'posts' : 'comments';
  const url = `${ARCTIC}/${endpoint}/search?subreddit=${subreddit}&after=${after}&before=${before}&limit=${BATCH}&sort=asc`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PulseGLP1/1.0' },
    signal: AbortSignal.timeout(20_000)
  });
  if (!res.ok) throw new Error(`Arctic ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data || [];
}

function arcticToEvidence(raw: any, sub: string, drug: string, type: 'post' | 'comment'): any {
  const title   = raw.title ? decodeHtml(raw.title) : '';
  const body    = raw.selftext || raw.body || '';
  const text    = `${title} ${decodeHtml(body)}`.replace(/\s+/g, ' ').trim().substring(0, 800);
  const ts      = (raw.created_utc || 0) * 1000;
  const url     = raw.permalink
    ? `https://reddit.com${raw.permalink}`
    : raw.link_permalink
    ? `https://reddit.com${raw.link_permalink}`
    : '';
  return {
    id:           `arctic-${type}-${raw.id}`,
    type,
    source:       `r/${sub}`,
    drug,
    text,
    url,
    post_ts:      ts,
    first_seen_at: Date.now()
  };
}

function drugForSub(sub: string): string {
  return sub === 'WegovyWeightLoss' ? 'Wegovy' : sub;
}

// Runs a single backfill job in the background (non-blocking)
async function runBackfillJob(jobId: string) {
  const job = backfillJobs.get(jobId)!;
  const drug = drugForSub(job.subreddit);

  try {
    while (job.cursor < job.endTs) {
      const windowEnd = Math.min(job.cursor + 86400 * 30, job.endTs); // 30-day windows
      const rows = await arcticPage(job.subreddit, job.type, job.cursor, windowEnd);

      if (rows.length > 0) {
        const items = rows.map(r => arcticToEvidence(r, job.subreddit, drug, job.type === 'posts' ? 'post' : 'comment'));
        saveEvidence(items);
        job.saved += items.length;
      }

      // Advance cursor past this window (or to last item's ts if we got a full page)
      job.cursor = rows.length === BATCH
        ? (rows[rows.length - 1].created_utc + 1) * 1000
        : windowEnd + 1000;

      // Polite delay between requests (~3 req/s max)
      await new Promise(r => setTimeout(r, 350));
    }

    job.status = 'done';
    console.log(`[backfill] Job ${jobId} done — ${job.saved} ${job.type} saved.`);
    // Bust the API cache so the UI picks up new data
    cache = null;
  } catch (err: any) {
    job.status = 'error';
    job.error = err.message;
    console.error(`[backfill] Job ${jobId} failed:`, err.message);
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

let cache: any = null;
let cacheTsMs = 0;

// ─── API ──────────────────────────────────────────────────────────────────────

async function doDataRefresh() {
  const fresh = await scrapeAll();
  saveEvidence(fresh);
  const analysis = await analyzeWithGemini(fresh);
  if (analysis.postClassifications) applyClassifications(analysis.postClassifications);
  const now = Date.now();
  stmtInsertRun.run(now, JSON.stringify(analysis.topInsights), JSON.stringify(analysis.emergingTopics));
  cache = buildCachePayload(analysis.topInsights, analysis.emergingTopics, now);
  cacheTsMs = now;
  checkAlerts().catch(e => console.error('[checkAlerts]', e.message));
  return cache;
}

app.get("/api/data", async (req, res) => {
  try {
    if (cache && Date.now() - cacheTsMs < 600_000) return res.json(cache);
    res.json(await doDataRefresh());
  } catch (err: any) {
    console.error("[/api/data]", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Paginated historical evidence — used by "LOAD HISTORICAL EVIDENCE" button
// GET /api/evidence?offset=50&limit=50&days=30
app.get("/api/evidence", (req, res) => {
  try {
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const limit  = Math.min(100, parseInt(req.query.limit  as string) || 50);
    const days   = parseInt(req.query.days as string) || 0;

    let query = "SELECT * FROM evidence";
    const params: any[] = [];
    if (days > 0) {
      const cutoff = Date.now() - days * 86400_000;
      query += " WHERE post_ts >= ?";
      params.push(cutoff);
    }
    query += " ORDER BY post_ts DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = (db.prepare(query).all(...params) as any[]).map(row => ({
      ...row,
      timestamp: row.post_ts,
      sentimentLabel: row.sentiment,
      tags: JSON.parse(row.tags || '[]')
    }));

    const countQuery = days > 0
      ? `SELECT COUNT(*) as n FROM evidence WHERE post_ts >= ${Date.now() - days * 86400_000}`
      : "SELECT COUNT(*) as n FROM evidence";
    const total = (db.prepare(countQuery).get() as any).n;

    res.json({ items: rows, total, offset, limit });
  } catch (err: any) {
    console.error("[/api/evidence]", err);
    res.status(500).json({ error: err.message });
  }
});

// PDF report — GET /api/report
app.get("/api/report", (req, res) => {
  try {
    if (!cache) return res.status(503).json({ error: "No analysis available yet. Load the dashboard first." });

    const { topInsights = [], emergingTopics = [], evidenceFeed = [], timestamp, dbStats } = cache;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PulseGLP1-Report-${new Date().toISOString().slice(0,10)}.pdf"`);
    doc.pipe(res);

    const PRIMARY = '#0891b2';
    const MUTED   = '#64748b';
    const DARK    = '#0f172a';

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fill('white').fontSize(22).font('Helvetica-Bold').text('PULSEGLP1', 50, 25);
    doc.fill(PRIMARY).fontSize(10).font('Helvetica').text('GLP-1 Market Intelligence Report', 50, 52);
    doc.fill(MUTED).fontSize(8).text(`Generated ${new Date(timestamp).toLocaleString()}  |  DB: ${dbStats?.total ?? '–'} items`, 50, 64);
    doc.moveDown(3);

    const sectionTitle = (title: string) => {
      doc.moveDown(0.5);
      doc.fill(DARK).fontSize(13).font('Helvetica-Bold').text(title);
      doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke(PRIMARY);
      doc.moveDown(0.8);
    };

    const badge = (label: string, x: number, y: number) => {
      const color = label === 'CRITICAL' ? '#ef4444' : label === 'EMERGING' ? PRIMARY : '#f97316';
      doc.fill(color).fontSize(7).font('Helvetica-Bold').text(label, x, y);
    };

    // ── Top Insights ────────────────────────────────────────────────────────
    sectionTitle('TOP INSIGHTS THIS WEEK');
    for (const ins of topInsights.slice(0, 3)) {
      const y0 = doc.y;
      doc.fill(DARK).fontSize(11).font('Helvetica-Bold').text(ins.title || '', { continued: false });
      badge(ins.status || '', 400, y0);
      doc.fill(MUTED).fontSize(9).font('Helvetica').text(ins.description || '', { indent: 10 });
      doc.fill(PRIMARY).fontSize(8).text(`Momentum: ${ins.momentum || ''}`, { indent: 10 });
      doc.fill(DARK).fontSize(8).text(`→ Action: ${ins.action || ''}`, { indent: 10 });
      doc.moveDown(0.8);
    }

    // ── Emerging Sub-Topics ─────────────────────────────────────────────────
    sectionTitle('EMERGING SUB-TOPICS');
    const colW = [200, 60, 70, 80, 80];
    const headers = ['TOPIC', 'VOLUME', 'SENTIMENT', 'MOMENTUM', 'DOMAIN'];
    let tx = 50;
    doc.fill(MUTED).fontSize(7).font('Helvetica-Bold');
    headers.forEach((h, i) => { doc.text(h, tx, doc.y, { width: colW[i], lineBreak: false }); tx += colW[i]; });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.3);

    for (const t of emergingTopics.slice(0, 5)) {
      tx = 50;
      const rowY = doc.y;
      const cells = [t.topic || '', t.volume || '', `${t.sentimentScore}/100`, t.momStr || '', t.topicDomain?.split(' ')[0] || ''];
      doc.fill(DARK).fontSize(8).font('Helvetica');
      cells.forEach((c, i) => { doc.text(c, tx, rowY, { width: colW[i], lineBreak: false }); tx += colW[i]; });
      doc.moveDown(0.5);
    }

    // ── Recent High-Signal Verbatims ────────────────────────────────────────
    sectionTitle('HIGH-SIGNAL PATIENT VERBATIMS');
    const topPosts = evidenceFeed
      .filter((e: any) => (e.coverage || 0) >= 60)
      .slice(0, 8);
    for (const post of topPosts) {
      if (doc.y > doc.page.height - 120) doc.addPage();
      const excerpt = (post.text || '').substring(0, 280) + ((post.text?.length || 0) > 280 ? '…' : '');
      doc.fill(PRIMARY).fontSize(7).font('Helvetica-Bold').text(`${post.drug}  ·  ${post.source}  ·  ${post.sentimentLabel || ''}  ·  ${post.stage || ''}`);
      doc.fill(DARK).fontSize(8.5).font('Helvetica').text(`"${excerpt}"`, { indent: 10 });
      doc.fill(MUTED).fontSize(7).text(post.url || '', { indent: 10 });
      doc.moveDown(0.6);
    }

    // ── DB Coverage ─────────────────────────────────────────────────────────
    if (dbStats) {
      sectionTitle('DATA COVERAGE');
      doc.fill(DARK).fontSize(9).font('Helvetica')
        .text(`Total items in database: ${dbStats.total}`)
        .text(`Posts: ${dbStats.posts}    Comments: ${dbStats.comments}`)
        .text(`Subreddits: r/Ozempic, r/Mounjaro, r/WegovyWeightLoss, r/Zepbound, r/Semaglutide`);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.fill(MUTED).fontSize(7).text('PulseGLP1 — Confidential. For internal use only.', { align: 'center' });

    doc.end();
  } catch (err: any) {
    console.error("[/api/report]", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// POST /api/backfill  { subreddit, from, to?, type }
// Starts a background backfill job. Returns jobId immediately.
app.use(express.json());
app.post("/api/backfill", (req, res) => {
  const { subreddit, from, to, type = 'both' } = req.body || {};
  if (!subreddit || !from) return res.status(400).json({ error: "subreddit and from are required" });

  const startTs = new Date(from).getTime();
  const endTs   = to ? new Date(to).getTime() : Date.now();
  if (isNaN(startTs) || isNaN(endTs)) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

  const jobs: string[] = [];
  const types: Array<'posts' | 'comments'> = type === 'both' ? ['posts', 'comments'] : [type];

  for (const t of types) {
    const jobId = `${subreddit}-${t}-${Date.now()}`;
    const job: BackfillJob = { status: 'running', subreddit, type: t, saved: 0, cursor: startTs, startTs, endTs };
    backfillJobs.set(jobId, job);
    runBackfillJob(jobId); // fire and forget
    jobs.push(jobId);
  }

  res.json({ jobs, message: `Backfill started. Poll /api/backfill/status for progress.` });
});

// GET /api/backfill/status
app.get("/api/backfill/status", (_req, res) => {
  const all: Record<string, any> = {};
  for (const [id, job] of backfillJobs) {
    all[id] = {
      ...job,
      progress: job.endTs > job.startTs
        ? `${Math.min(100, Math.round((job.cursor - job.startTs) / (job.endTs - job.startTs) * 100))}%`
        : '0%'
    };
  }
  const dbTotal = (db.prepare("SELECT COUNT(*) as n FROM evidence").get() as any).n;
  res.json({ jobs: all, dbTotal });
});

// ─── Intel endpoints ──────────────────────────────────────────────────────────

const INTEL_DRUGS = ['Ozempic', 'Wegovy', 'Mounjaro', 'Zepbound', 'Semaglutide'];

app.get("/api/intel/compare", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;

    const drugs = db.prepare(`
      SELECT drug,
        COUNT(*) as total,
        SUM(CASE WHEN type='post'    THEN 1 ELSE 0 END) as posts,
        SUM(CASE WHEN type='comment' THEN 1 ELSE 0 END) as comments,
        SUM(CASE WHEN sentiment='Positive'    THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment='Risk-Alert'  THEN 1 ELSE 0 END) as risk_alert,
        SUM(CASE WHEN sentiment='Neutral-Low' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment='Analytical'  THEN 1 ELSE 0 END) as analytical,
        ROUND(AVG(COALESCE(coverage, 50)), 1) as avg_signal
      FROM evidence
      WHERE drug != '' AND post_ts >= ?
        AND drug IN ('Ozempic','Wegovy','Mounjaro','Zepbound','Semaglutide')
        AND sentiment IS NOT NULL
      GROUP BY drug
      ORDER BY total DESC
    `).all(cutoff);

    // Brand-switch co-mentions: posts mentioning two drugs + a switch keyword
    const SWITCH_KW = ['switch', 'switched', 'switching', 'changed from', 'moved from', 'transitioned'];
    const switches: any[] = [];
    for (const from of INTEL_DRUGS) {
      for (const to of INTEL_DRUGS) {
        if (from === to) continue;
        const kwClause = SWITCH_KW.map(() => `LOWER(text) LIKE ?`).join(' OR ');
        const params: any[] = [
          cutoff,
          `%${from.toLowerCase()}%`,
          `%${to.toLowerCase()}%`,
          ...SWITCH_KW.map(k => `%${k}%`)
        ];
        const n = (db.prepare(`
          SELECT COUNT(*) as n FROM evidence
          WHERE post_ts >= ?
            AND LOWER(text) LIKE ?
            AND LOWER(text) LIKE ?
            AND (${kwClause})
        `).get(...params) as any).n;
        if (n > 0) switches.push({ from, to, count: n });
      }
    }

    res.json({
      drugs,
      switches: switches.sort((a, b) => b.count - a.count).slice(0, 10)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const AE_CATEGORIES = [
  { id: 'gi',      label: 'GI & Digestive',      keywords: ['nausea','vomit','constipat','diarrhea','stomach','bowel','heartburn','gastroparesis','reflux'] },
  { id: 'body',    label: 'Body Composition',     keywords: ['hair loss','ozempic face','muscle loss','facial volume','hair thin','loose skin','sarcopenia','face chang'] },
  { id: 'fatigue', label: 'Fatigue & Energy',     keywords: ['fatigue','tired','exhausted','weakness','brain fog','lethargy','no energy','sluggish'] },
  { id: 'cardiac', label: 'Cardiac & Systemic',   keywords: ['heart rate','palpitation','pancreatitis','gallbladder','pulse','thyroid','kidney'] },
  { id: 'psych',   label: 'Mood & Mental Health', keywords: ['depression','anxiety','mood','mental health','suicidal','emotional','panic','irritable'] },
];

app.get("/api/intel/adverse-events", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;

    const result = AE_CATEGORIES.map(cat => {
      const clause = cat.keywords.map(() => `LOWER(text) LIKE ?`).join(' OR ');
      const kParams = cat.keywords.map(k => `%${k}%`);

      const total = (db.prepare(
        `SELECT COUNT(*) as n FROM evidence WHERE post_ts >= ? AND (${clause})`
      ).get(cutoff, ...kParams) as any).n;

      const byDrug = db.prepare(`
        SELECT drug, COUNT(*) as count
        FROM evidence
        WHERE post_ts >= ? AND (${clause}) AND drug != ''
        GROUP BY drug ORDER BY count DESC
      `).all(cutoff, ...kParams);

      const verbatims = (db.prepare(`
        SELECT id, drug, text, url, sentiment, post_ts
        FROM evidence
        WHERE post_ts >= ? AND (${clause})
        ORDER BY CASE WHEN sentiment='Risk-Alert' THEN 0 ELSE 1 END, post_ts DESC
        LIMIT 3
      `).all(cutoff, ...kParams) as any[]).map(r => ({ ...r, timestamp: r.post_ts }));

      return { ...cat, total, byDrug, verbatims };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/intel/funnel", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;

    const STAGE_ORDER = ['Starting', 'Titration', 'Maintenance', 'Off-Ramp'];

    const stages = db.prepare(`
      SELECT stage, COUNT(*) as count
      FROM evidence
      WHERE post_ts >= ? AND stage IS NOT NULL AND stage != ''
      GROUP BY stage
    `).all(cutoff) as any[];

    // Sort into canonical funnel order, fill missing with 0
    const orderedStages = STAGE_ORDER.map(s => ({
      stage: s,
      count: (stages.find((r: any) => r.stage === s) || { count: 0 }).count
    }));

    const byDrug = db.prepare(`
      SELECT drug, stage, COUNT(*) as count
      FROM evidence
      WHERE post_ts >= ? AND stage IS NOT NULL AND stage != '' AND drug != ''
      GROUP BY drug, stage
      ORDER BY drug, count DESC
    `).all(cutoff);

    const offRamp = (db.prepare(`
      SELECT id, drug, text, url, sentiment, tags, post_ts
      FROM evidence
      WHERE post_ts >= ? AND stage = 'Off-Ramp'
      ORDER BY CASE WHEN sentiment='Risk-Alert' THEN 0 ELSE 1 END, post_ts DESC
      LIMIT 6
    `).all(cutoff) as any[]).map(r => ({
      ...r,
      timestamp: r.post_ts,
      tags: JSON.parse(r.tags || '[]')
    }));

    res.json({ stages: orderedStages, byDrug, offRamp });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Intel extended endpoints ─────────────────────────────────────────────────

// #4 Brand Switch Intelligence
app.get("/api/intel/switches", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;
    const SWITCH_KW = ['switch', 'switched', 'switching', 'changed from', 'moved from', 'transitioned', 'stopped', 'quit', 'discontin'];

    const flows: any[] = [];
    for (const from of INTEL_DRUGS) {
      for (const to of INTEL_DRUGS) {
        if (from === to) continue;
        const kwClause = SWITCH_KW.map(() => `LOWER(text) LIKE ?`).join(' OR ');
        const params: any[] = [cutoff, `%${from.toLowerCase()}%`, `%${to.toLowerCase()}%`, ...SWITCH_KW.map(k => `%${k}%`)];
        const rows = db.prepare(`
          SELECT id, drug, text, url, post_ts, sentiment FROM evidence
          WHERE post_ts >= ? AND LOWER(text) LIKE ? AND LOWER(text) LIKE ? AND (${kwClause})
          LIMIT 20
        `).all(...params) as any[];
        if (rows.length === 0) continue;
        const verbatims: string[] = [];
        for (const row of rows.slice(0, 3)) {
          const sentences = row.text.split(/[.!?]+/).map((s: string) => s.trim()).filter(Boolean);
          const hit = sentences.find((s: string) => SWITCH_KW.some(k => s.toLowerCase().includes(k)));
          if (hit && hit.length > 20) verbatims.push(hit.substring(0, 200));
        }
        flows.push({ from, to, count: rows.length, verbatims });
      }
    }

    const net: Record<string, number> = {};
    for (const drug of INTEL_DRUGS) net[drug] = 0;
    for (const f of flows) { net[f.to] = (net[f.to] || 0) + f.count; net[f.from] = (net[f.from] || 0) - f.count; }
    const netRanking = Object.entries(net).map(([drug, netFlow]) => ({ drug, netFlow })).sort((a, b) => b.netFlow - a.netFlow);

    res.json({ flows: flows.sort((a, b) => b.count - a.count).slice(0, 15), netRanking });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// #6 Dosage-Level Intelligence
app.get("/api/intel/dosage", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;
    const rows = db.prepare(`SELECT drug, text, sentiment FROM evidence WHERE post_ts >= ? AND drug != '' AND sentiment IS NOT NULL`).all(cutoff) as any[];
    const DOSE_RE = /\b(\d+(?:\.\d+)?)\s*mg\b/gi;
    const counts: Record<string, Record<string, { total: number; positive: number; risk: number; neutral: number; analytical: number }>> = {};
    for (const row of rows) {
      const doses = [...new Set([...row.text.matchAll(DOSE_RE)].map((m: any) => parseFloat(m[1]).toString() + 'mg'))];
      for (const dose of doses as string[]) {
        if (!counts[row.drug]) counts[row.drug] = {};
        if (!counts[row.drug][dose]) counts[row.drug][dose] = { total: 0, positive: 0, risk: 0, neutral: 0, analytical: 0 };
        counts[row.drug][dose].total++;
        if (row.sentiment === 'Positive')    counts[row.drug][dose].positive++;
        if (row.sentiment === 'Risk-Alert')  counts[row.drug][dose].risk++;
        if (row.sentiment === 'Neutral-Low') counts[row.drug][dose].neutral++;
        if (row.sentiment === 'Analytical')  counts[row.drug][dose].analytical++;
      }
    }
    const result: any[] = [];
    for (const [drug, doses] of Object.entries(counts)) {
      for (const [dose, stats] of Object.entries(doses)) {
        if (stats.total < 3) continue;
        result.push({ drug, dose, ...stats, positivePct: Math.round((stats.positive / stats.total) * 100), riskPct: Math.round((stats.risk / stats.total) * 100) });
      }
    }
    result.sort((a, b) => a.drug !== b.drug ? a.drug.localeCompare(b.drug) : b.total - a.total);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// #7 Access & Payer Intelligence
const PAYER_CATEGORIES = [
  { id: 'insurance',   label: 'Insurance & Prior Auth', color: 'var(--color-error)',   keywords: ['insurance', 'prior auth', 'denied', 'not covered', 'formulary', 'step therapy', 'appeal', 'PA denied', 'reject'] },
  { id: 'cost',        label: 'Out-of-Pocket Cost',     color: 'var(--color-tertiary)', keywords: ['out of pocket', 'expensive', 'afford', 'cost', 'price', 'copay', 'deductible', 'per month', 'monthly cost'] },
  { id: 'compounding', label: 'Compounding & Grey Mkt', color: '#a855f7',               keywords: ['compound', 'compounded', 'compounding pharmacy', '503b', 'grey market', 'tirzepatide powder', 'semaglutide powder'] },
  { id: 'telehealth',  label: 'Telehealth Providers',   color: 'var(--color-primary)', keywords: ['telehealth', 'telemedicine', 'hims', 'ro health', 'found health', 'calibrate', 'noom', 'sequence health', 'weight loss clinic'] },
];

app.get("/api/intel/payer", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;
    const now = Date.now();
    const result = PAYER_CATEGORIES.map(cat => {
      const clause  = cat.keywords.map(() => `LOWER(text) LIKE ?`).join(' OR ');
      const kParams = cat.keywords.map(k => `%${k}%`);
      const total    = (db.prepare(`SELECT COUNT(*) as n FROM evidence WHERE post_ts >= ? AND (${clause})`).get(cutoff, ...kParams) as any).n;
      const byDrug   = db.prepare(`SELECT drug, COUNT(*) as count FROM evidence WHERE post_ts >= ? AND (${clause}) AND drug != '' GROUP BY drug ORDER BY count DESC`).all(cutoff, ...kParams);
      const verbatims = (db.prepare(`SELECT id, drug, text, url, sentiment, post_ts FROM evidence WHERE post_ts >= ? AND (${clause}) ORDER BY CASE WHEN sentiment='Risk-Alert' THEN 0 ELSE 1 END, post_ts DESC LIMIT 3`).all(cutoff, ...kParams) as any[]).map(r => ({ ...r, timestamp: r.post_ts }));
      const recentWeek = (db.prepare(`SELECT COUNT(*) as n FROM evidence WHERE post_ts >= ? AND (${clause})`).get(now - 7 * 86400_000, ...kParams) as any).n;
      const priorWeek  = (db.prepare(`SELECT COUNT(*) as n FROM evidence WHERE post_ts >= ? AND post_ts < ? AND (${clause})`).get(now - 14 * 86400_000, now - 7 * 86400_000, ...kParams) as any).n;
      const trend = priorWeek > 0 ? Math.round(((recentWeek - priorWeek) / priorWeek) * 100) : 0;
      return { ...cat, total, byDrug, verbatims, trend, recentWeek, priorWeek };
    });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// #8 HCP Signal Separation
const HCP_KEYWORDS = [
  'my patient', 'patients report', 'i prescribe', 'prescribing', 'titrate', 'titration protocol',
  'contraindicated', 'comorbid', 'pharmacist', 'prescriber', 'informed consent',
  'side effect profile', 'dose adjustment', 'therapeutic', 'renal', 'hepatic',
  'a1c', 'glycemic', 'insulin resistance', 'endocrinolog', 'bariatric',
  'mg/week', 'mg/kg', 'subcutaneous', 'injection site', 'pen device'
];

app.get("/api/intel/hcp", (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;
    const rows = db.prepare(`SELECT id, drug, text, url, sentiment, post_ts, type FROM evidence WHERE post_ts >= ? AND length(text) > 50`).all(cutoff) as any[];
    const hcpPosts: any[] = [];
    let totalHcp = 0, totalPatient = 0;
    for (const row of rows) {
      const lower = row.text.toLowerCase();
      const hits = HCP_KEYWORDS.filter(k => lower.includes(k));
      if (hits.length >= 2) { hcpPosts.push({ ...row, timestamp: row.post_ts, hcpSignals: hits.slice(0, 4) }); totalHcp++; }
      else totalPatient++;
    }
    hcpPosts.sort((a, b) => {
      if (a.sentiment === 'Risk-Alert' && b.sentiment !== 'Risk-Alert') return -1;
      if (b.sentiment === 'Risk-Alert' && a.sentiment !== 'Risk-Alert') return  1;
      return b.post_ts - a.post_ts;
    });
    const hcpSentiments = hcpPosts.reduce((acc, p) => { acc[p.sentiment] = (acc[p.sentiment] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byDrugMap: Record<string, number> = {};
    for (const p of hcpPosts) { if (p.drug) byDrugMap[p.drug] = (byDrugMap[p.drug] || 0) + 1; }
    const byDrug = Object.entries(byDrugMap).map(([drug, count]) => ({ drug, count })).sort((a, b) => b.count - a.count);
    res.json({ hcpPosts: hcpPosts.slice(0, 20), totalHcp, totalPatient, hcpPct: rows.length > 0 ? Math.round((totalHcp / rows.length) * 100) : 0, hcpSentiments, byDrug });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// #11 Trend Forecasting
app.get("/api/intel/trends", (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const cutoff = Date.now() - weeks * 7 * 86400_000;
    const rows = db.prepare(`SELECT tags, post_ts, drug FROM evidence WHERE post_ts >= ? AND tags IS NOT NULL AND tags != '[]'`).all(cutoff) as any[];

    const tagWeeks: Record<string, Record<string, number>> = {};
    const drugWeeks: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      const d = new Date(row.post_ts);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().substring(0, 10);
      let tags: string[] = []; try { tags = JSON.parse(row.tags || '[]'); } catch { continue; }
      for (const tag of tags) { if (!tagWeeks[tag]) tagWeeks[tag] = {}; tagWeeks[tag][weekKey] = (tagWeeks[tag][weekKey] || 0) + 1; }
      if (row.drug) { if (!drugWeeks[row.drug]) drugWeeks[row.drug] = {}; drugWeeks[row.drug][weekKey] = (drugWeeks[row.drug][weekKey] || 0) + 1; }
    }

    const allWeeks: string[] = [];
    const cursor = new Date(cutoff); cursor.setDate(cursor.getDate() - cursor.getDay());
    while (cursor <= new Date()) { allWeeks.push(cursor.toISOString().substring(0, 10)); cursor.setDate(cursor.getDate() + 7); }

    const trendedTopics: any[] = [];
    for (const [tag, weekMap] of Object.entries(tagWeeks)) {
      const series = allWeeks.map(w => weekMap[w] || 0);
      const total = series.reduce((s, v) => s + v, 0);
      if (total < 10) continue;
      const growthRates: number[] = [];
      for (let i = 1; i < series.length; i++) { const prev = series[i - 1] || 1; growthRates.push((series[i] - prev) / prev); }
      const last3 = growthRates.slice(-3);
      const isAccelerating = last3.length === 3 && last3.every(r => r > 0);
      const last4 = series.slice(-4);
      const slope = last4.length > 1 ? (last4[last4.length - 1] - last4[0]) / (last4.length - 1) : 0;
      const currentWeekCount = series[series.length - 1] || 0;
      const avgGrowthPct = growthRates.length > 0 ? Math.round((growthRates.reduce((s, r) => s + r, 0) / growthRates.length) * 100) : 0;
      trendedTopics.push({ tag, total, series: allWeeks.map((w, i) => ({ week: w, count: series[i] })), isAccelerating, avgGrowthPct, currentWeekCount, slope: Math.round(slope * 10) / 10, projectedPeakWeeks: slope > 0 ? Math.ceil(currentWeekCount / slope) : null });
    }
    trendedTopics.sort((a, b) => { if (a.isAccelerating && !b.isAccelerating) return -1; if (b.isAccelerating && !a.isAccelerating) return 1; return b.total - a.total; });

    const drugTrends = Object.entries(drugWeeks).map(([drug, weekMap]) => ({ drug, series: allWeeks.map(w => ({ week: w, count: weekMap[w] || 0 })) }));
    res.json({ topics: trendedTopics.slice(0, 20), drugTrends, weeks: allWeeks });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// #5 Unmet Needs Extractor (Gemini-powered, 6h cache)
app.get("/api/intel/unmet-needs", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const cacheKey = `unmet-needs-${days}`;
    const CACHE_TTL = 6 * 3600_000;
    const cached = db.prepare("SELECT value, cached_at FROM intel_cache WHERE key = ?").get(cacheKey) as any;
    if (cached && Date.now() - cached.cached_at < CACHE_TTL) return res.json(JSON.parse(cached.value));

    const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;
    const rows = db.prepare(`SELECT id, drug, text FROM evidence WHERE post_ts >= ? AND length(text) > 40 ORDER BY RANDOM() LIMIT 200`).all(cutoff) as any[];
    if (rows.length === 0) return res.json({ needs: [], sampleSize: 0, generatedAt: Date.now() });

    const corpus = rows.map(r => `[${r.drug || 'unknown'}] ${r.text}`).join('\n\n');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a patient insights analyst. Read these GLP-1 community posts and extract unmet patient needs.

Focus ONLY on these signal phrases: "I wish", "why can't", "the biggest problem is", "if only", "no one talks about", "I want", "they should", "there needs to be", "frustrated", "disappointed".

POSTS:
${corpus.substring(0, 28000)}

Return 5-10 distinct unmet needs grounded in actual post language.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { theme: { type: Type.STRING }, description: { type: Type.STRING }, frequency: { type: Type.STRING }, drug: { type: Type.STRING }, quote: { type: Type.STRING } }, required: ['theme','description','frequency','drug','quote'] } }
          },
          required: ['needs']
        }
      }
    });

    const result = { ...JSON.parse(response.text || '{"needs":[]}'), sampleSize: rows.length, generatedAt: Date.now() };
    db.prepare("INSERT OR REPLACE INTO intel_cache (key, value, cached_at) VALUES (?, ?, ?)").run(cacheKey, JSON.stringify(result), Date.now());
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Alerts ──────────────────────────────────────────────────────────────────

async function checkAlerts() {
  const now = Date.now();
  const DAY = 86400_000;
  const WEEK = 7 * DAY;

  for (const drug of INTEL_DRUGS) {
    const recent = db.prepare(`SELECT COUNT(*) as n, SUM(CASE WHEN sentiment='Risk-Alert' THEN 1 ELSE 0 END) as risk FROM evidence WHERE drug = ? AND post_ts >= ?`).get(drug, now - DAY) as any;
    if (recent.n < 5) continue;
    const riskPct = (recent.risk / recent.n) * 100;
    if (riskPct > 20) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE type='risk-spike' AND drug=? AND fired_at >= ? AND ack_at IS NULL`).get(drug, now - DAY);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, message, drug, value, threshold, fired_at) VALUES (?,?,?,?,?,?)`).run('risk-spike', `${drug} Risk-Alert rate is ${riskPct.toFixed(1)}% in the last 24h (threshold: 20%)`, drug, riskPct, 20, now);
      }
    }
  }

  const latestRun = db.prepare("SELECT top_insights, run_at FROM analysis_runs ORDER BY run_at DESC LIMIT 1").get() as any;
  if (latestRun && Date.now() - latestRun.run_at < 3600_000) {
    const insights: any[] = JSON.parse(latestRun.top_insights || '[]');
    for (const ins of insights.filter((i: any) => i.status === 'CRITICAL' || i.momentum === 'CRITICAL')) {
      const titleSnip = ins.title.substring(0, 40);
      const existing = db.prepare(`SELECT id FROM alerts WHERE type='critical-insight' AND message LIKE ? AND fired_at >= ?`).get(`%${titleSnip}%`, now - DAY);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, message, fired_at) VALUES (?,?,?)`).run('critical-insight', `CRITICAL insight: ${ins.title}`, now);
      }
    }
  }

  const tagRows = db.prepare(`SELECT tags FROM evidence WHERE post_ts >= ? AND tags IS NOT NULL AND tags != '[]'`).all(now - WEEK) as any[];
  const tagCounts: Record<string, number> = {};
  for (const row of tagRows) {
    try { for (const t of JSON.parse(row.tags || '[]') as string[]) tagCounts[t] = (tagCounts[t] || 0) + 1; } catch {}
  }
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count >= 50) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE type='volume-spike' AND message LIKE ? AND fired_at >= ?`).get(`%${tag}%`, now - WEEK);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, message, value, threshold, fired_at) VALUES (?,?,?,?,?)`).run('volume-spike', `Topic "${tag}" has ${count} mentions this week (threshold: 50)`, count, 50, now);
      }
    }
  }

  const newAlerts = db.prepare("SELECT * FROM alerts WHERE fired_at >= ? ORDER BY fired_at DESC").all(now - 5000) as any[];
  if (newAlerts.length > 0 && process.env.ALERT_WEBHOOK_URL) {
    fetch(process.env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alerts: newAlerts, firedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000)
    }).catch(e => console.error('[alerts] Webhook failed:', e.message));
  }
}

app.get("/api/alerts", (_req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM alerts WHERE ack_at IS NULL ORDER BY fired_at DESC LIMIT 20").all());
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/alerts/:id/ack", (req, res) => {
  try {
    db.prepare("UPDATE alerts SET ack_at = ? WHERE id = ?").run(Date.now(), parseInt(req.params.id));
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Digest ───────────────────────────────────────────────────────────────────

async function generateDigest() {
  const now = Date.now();
  const weekAgo = now - 7 * 86400_000;

  const runs = db.prepare("SELECT top_insights, emerging_topics, run_at FROM analysis_runs WHERE run_at >= ? ORDER BY run_at DESC").all(weekAgo) as any[];
  const topInsights    = runs.length > 0 ? JSON.parse(runs[0].top_insights    || '[]').slice(0, 5) : [];
  const emergingTopics = runs.length > 0 ? JSON.parse(runs[0].emerging_topics || '[]').slice(0, 5) : [];

  const sentimentShifts = INTEL_DRUGS.map(drug => {
    const recent = db.prepare(`SELECT COUNT(*) as n, SUM(CASE WHEN sentiment='Positive' THEN 1 ELSE 0 END) as pos FROM evidence WHERE drug=? AND post_ts >= ?`).get(drug, weekAgo) as any;
    const prior  = db.prepare(`SELECT COUNT(*) as n, SUM(CASE WHEN sentiment='Positive' THEN 1 ELSE 0 END) as pos FROM evidence WHERE drug=? AND post_ts >= ? AND post_ts < ?`).get(drug, weekAgo - 7 * 86400_000, weekAgo) as any;
    const recentPct = recent.n > 0 ? Math.round((recent.pos / recent.n) * 100) : 0;
    const priorPct  = prior.n  > 0 ? Math.round((prior.pos  / prior.n)  * 100) : 0;
    return { drug, recentPct, priorPct, shift: recentPct - priorPct, recentN: recent.n };
  }).filter(d => d.recentN > 0).sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

  const riskAlerts = INTEL_DRUGS.map(drug => {
    const risk  = db.prepare(`SELECT COUNT(*) as n FROM evidence WHERE drug=? AND sentiment='Risk-Alert' AND post_ts >= ?`).get(drug, weekAgo) as any;
    const total = db.prepare(`SELECT COUNT(*) as n FROM evidence WHERE drug=? AND post_ts >= ?`).get(drug, weekAgo) as any;
    return { drug, riskCount: risk.n, riskPct: total.n > 0 ? Math.round((risk.n / total.n) * 100) : 0 };
  }).filter(d => d.riskPct > 15).sort((a, b) => b.riskPct - a.riskPct);

  const dbTotal = (db.prepare("SELECT COUNT(*) as n FROM evidence").get() as any).n;
  const digest  = { topInsights, emergingTopics, sentimentShifts, riskAlerts, dbTotal, generatedAt: now };

  db.prepare("INSERT INTO digests (generated_at, data) VALUES (?, ?)").run(now, JSON.stringify(digest));

  if (process.env.DIGEST_WEBHOOK_URL) {
    fetch(process.env.DIGEST_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(digest),
      signal: AbortSignal.timeout(10_000)
    }).catch(e => console.error('[digest] Webhook failed:', e.message));
  }

  return digest;
}

function scheduleWeeklyDigest() {
  setInterval(() => {
    const now = new Date();
    if (now.getDay() !== 1 || now.getHours() !== 9) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = db.prepare("SELECT id FROM digests WHERE generated_at >= ?").get(today.getTime());
    if (existing) return;
    console.log("[digest] Generating weekly digest...");
    generateDigest().catch(e => console.error('[digest] Failed:', e.message));
  }, 60 * 60 * 1000);
}

app.get("/api/digest/latest", (_req, res) => {
  try {
    const row = db.prepare("SELECT * FROM digests ORDER BY generated_at DESC LIMIT 1").get() as any;
    if (!row) return res.json(null);
    res.json(JSON.parse(row.data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/digest/generate", async (_req, res) => {
  try { res.json(await generateDigest()); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Cache persistence ────────────────────────────────────────────────────────

function buildCachePayload(topInsights: any[], emergingTopics: any[], runAt: number) {
  const recentEvidence = loadAllEvidence().slice(0, 50);
  const dbStats = {
    total:    (db.prepare("SELECT COUNT(*) as n FROM evidence").get() as any).n,
    posts:    (db.prepare("SELECT COUNT(*) as n FROM evidence WHERE type='post'").get() as any).n,
    comments: (db.prepare("SELECT COUNT(*) as n FROM evidence WHERE type='comment'").get() as any).n
  };
  return { timestamp: runAt, topInsights, emergingTopics, evidenceFeed: recentEvidence, dbStats };
}

/** Try to restore the in-memory cache from the most recent DB analysis run.
 *  Returns true if the run is still within the 10-minute TTL, false if stale / missing. */
function restoreCacheFromDB(): boolean {
  const CACHE_TTL = 600_000; // 10 minutes — must match the TTL in /api/data
  const row = db.prepare("SELECT * FROM analysis_runs ORDER BY run_at DESC LIMIT 1").get() as any;
  if (!row) return false;

  const age = Date.now() - row.run_at;
  if (age > CACHE_TTL) {
    console.log(`[pre-warm] Last analysis was ${Math.round(age / 60000)}m ago — cache stale, will re-run.`);
    return false;
  }

  try {
    cache = buildCachePayload(JSON.parse(row.top_insights), JSON.parse(row.emerging_topics), row.run_at);
    cacheTsMs = row.run_at;
    console.log(`[pre-warm] Restored from DB (${Math.round(age / 1000)}s ago). Skipping Gemini re-run.`);
    return true;
  } catch (e: any) {
    console.warn("[pre-warm] Failed to parse stored analysis:", e.message);
    return false;
  }
}

// ─── Daily auto-scrape ────────────────────────────────────────────────────────

function scheduleDailyScrape() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    console.log("[daily] Running scheduled scrape...");
    try {
      const fresh = await scrapeAll();
      saveEvidence(fresh);
      const analysis = await analyzeWithGemini(fresh);
      if (analysis.postClassifications) applyClassifications(analysis.postClassifications);
      stmtInsertRun.run(Date.now(), JSON.stringify(analysis.topInsights), JSON.stringify(analysis.emergingTopics));
      cache = null; // bust cache so next request picks up new data
      console.log(`[daily] Done — ${fresh.length} items scraped.`);
    } catch (err: any) {
      console.error("[daily] Scrape failed:", err.message);
    }
  }, TWENTY_FOUR_HOURS);
  console.log("[daily] Auto-scrape scheduled every 24 hours.");
}

// ─── Vite / static ───────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Pre-warm: restore from DB if recent enough, otherwise run fresh
    setTimeout(() => {
      if (!restoreCacheFromDB()) {
        console.log("[pre-warm] Running fresh scrape + analysis...");
        doDataRefresh()
          .then(() => console.log("[pre-warm] Cache ready."))
          .catch((e: any) => console.error("[pre-warm] Failed:", e.message));
      }
    }, 1500);
    scheduleDailyScrape();
    scheduleWeeklyDigest();
  });
}

startServer();
