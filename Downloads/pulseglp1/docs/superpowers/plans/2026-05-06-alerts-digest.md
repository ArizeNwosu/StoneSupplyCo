# Alerts & Digest (#9–10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two distribution features: a real-time in-app alert system that fires when risk spikes, critical insights, or tag volume thresholds are crossed (#9), and a weekly auto-generated intelligence digest viewable as a panel in the app with optional webhook output (#10).

**Architecture:** Two new SQLite tables (`alerts`, `digests`) added to the existing `db.exec` block. `checkAlerts()` is called at the end of each `doDataRefresh()`. `generateDigest()` runs on a Monday 9am schedule (hourly check) and on-demand via POST endpoint. `AlertBanner` polls `/api/alerts` every 60s and renders a dismissible overlay. `DigestPanel` is a slide-out panel triggered by a header button. No SMTP required — webhook URL is optional via env var.

**Tech Stack:** Express + better-sqlite3 (server), React + Tailwind CSS v4 (client). No new npm dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `server.ts` | Add `alerts` + `digests` tables, `checkAlerts()`, `generateDigest()`, `scheduleWeeklyDigest()`, 4 new endpoints, call `checkAlerts()` in `doDataRefresh()`, call `scheduleWeeklyDigest()` in `startServer()` |
| Create | `src/components/AlertBanner.tsx` | Polls `/api/alerts` every 60s, renders dismissible alert toasts |
| Create | `src/components/DigestPanel.tsx` | Slide-out panel with latest digest content + Generate Now button |
| Modify | `src/App.tsx` | Import + render `AlertBanner`, add Mail icon header button, render `DigestPanel` conditionally |

---

## Task 1: Add DB tables + server logic

**Files:**
- Modify: `server.ts`

- [ ] **Step 1: Add `alerts` and `digests` tables to `db.exec`**

Find the `db.exec(`` block (around line 22). Add inside it after the existing `intel_cache` table:

```sql
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

  CREATE INDEX IF NOT EXISTS idx_alerts_fired ON alerts(fired_at);
```

- [ ] **Step 2: Add `checkAlerts()` and `generateDigest()` after the Intel extended endpoints block**

Insert immediately before the `// ─── Cache persistence` comment:

```typescript
// ─── Alerts ──────────────────────────────────────────────────────────────────

async function checkAlerts() {
  const now = Date.now();
  const DAY = 86400_000;
  const WEEK = 7 * DAY;

  // 1. Risk-Alert spike > 20% in last 24h per drug
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

  // 2. New CRITICAL insight in latest analysis run (within last hour)
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

  // 3. Tag volume spike: any tag with >= 50 mentions in 7 days (fire once per week per tag)
  const tagRows = db.prepare(`SELECT tags FROM evidence WHERE post_ts >= ? AND tags IS NOT NULL AND tags != '[]'`).all(now - WEEK) as any[];
  const tagCounts: Record<string, number> = {};
  for (const row of tagRows) {
    try { for (const t of JSON.parse(row.tags || '[]')) tagCounts[t] = (tagCounts[t] || 0) + 1; } catch {}
  }
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count >= 50) {
      const existing = db.prepare(`SELECT id FROM alerts WHERE type='volume-spike' AND message LIKE ? AND fired_at >= ?`).get(`%${tag}%`, now - WEEK);
      if (!existing) {
        db.prepare(`INSERT INTO alerts (type, message, value, threshold, fired_at) VALUES (?,?,?,?,?)`).run('volume-spike', `Topic "${tag}" has ${count} mentions this week (threshold: 50)`, count, 50, now);
      }
    }
  }

  // Fire webhook
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
    if (now.getDay() !== 1 || now.getHours() !== 9) return; // Monday 9am only
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = db.prepare("SELECT id FROM digests WHERE generated_at >= ?").get(today.getTime());
    if (existing) return;
    console.log("[digest] Generating weekly digest...");
    generateDigest().catch(e => console.error('[digest] Failed:', e.message));
  }, 60 * 60 * 1000); // check hourly
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
```

- [ ] **Step 3: Call `checkAlerts()` at the end of `doDataRefresh()`**

Find `doDataRefresh()` (around line 353). It currently ends with:
```typescript
  return buildCachePayload(analysis.topInsights, analysis.emergingTopics, runAt);
```

Change it to add the checkAlerts call:
```typescript
  checkAlerts().catch(e => console.error('[checkAlerts]', e.message));
  return buildCachePayload(analysis.topInsights, analysis.emergingTopics, runAt);
```

- [ ] **Step 4: Call `scheduleWeeklyDigest()` in `startServer()`**

Find `startServer()` at the bottom. It already calls `scheduleDailyScrape()`. Add after it:
```typescript
    scheduleWeeklyDigest();
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add server.ts
git commit -m "feat: alerts system + weekly digest — tables, checkAlerts(), generateDigest(), endpoints"
```

---

## Task 2: Create `AlertBanner.tsx`

**Files:**
- Create: `src/components/AlertBanner.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/AlertBanner.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WarningIcon } from './WarningIcon';

interface Alert {
  id: number;
  type: 'risk-spike' | 'critical-insight' | 'volume-spike';
  message: string;
  drug?: string;
  fired_at: number;
}

function timeAgo(ms: number) {
  const d = Date.now() - ms;
  const h = Math.floor(d / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = () => {
      fetch('/api/alerts').then(r => r.json()).then(setAlerts).catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const ack = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(`/api/alerts/${id}/ack`, { method: 'POST' })
      .then(() => setAlerts(prev => prev.filter(a => a.id !== id)));
  };

  if (alerts.length === 0) return null;

  const isHigh = (type: string) => type === 'risk-spike' || type === 'critical-insight';

  return (
    <div className="fixed top-16 left-0 right-0 z-[80] pointer-events-none">
      <div className="max-w-container-max mx-auto px-margin pt-2 space-y-2">
        {alerts.slice(0, 3).map(alert => (
          <div
            key={alert.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded analytical-border bg-surface-container-high shadow-lg"
            style={{ borderColor: isHigh(alert.type) ? 'var(--color-error)' : 'var(--color-primary)' }}
          >
            <WarningIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isHigh(alert.type) ? 'text-error' : 'text-primary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-on-surface">{alert.message}</p>
              <span className="text-[10px] text-on-surface-variant">{timeAgo(alert.fired_at)}</span>
            </div>
            <button onClick={e => ack(alert.id, e)} className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AlertBanner.tsx
git commit -m "feat: AlertBanner component — polls /api/alerts every 60s, dismissible toasts"
```

---

## Task 3: Create `DigestPanel.tsx`

**Files:**
- Create: `src/components/DigestPanel.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/DigestPanel.tsx
import { useState, useEffect } from 'react';
import { X, Mail, RefreshCw } from 'lucide-react';
import { WarningIcon } from './WarningIcon';

interface DigestData {
  topInsights: { title: string; description: string }[];
  emergingTopics: { topic: string }[];
  sentimentShifts: { drug: string; shift: number; recentPct: number; priorPct: number }[];
  riskAlerts: { drug: string; riskPct: number; riskCount: number }[];
  dbTotal: number;
  generatedAt: number;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function DigestPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [digest, setDigest]       = useState<DigestData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/digest/latest').then(r => r.json()).then(d => { setDigest(d); setLoading(false); }).catch(() => setLoading(false));
  }, [open]);

  const generate = () => {
    setGenerating(true);
    fetch('/api/digest/generate', { method: 'POST' }).then(r => r.json()).then(d => { setDigest(d); setGenerating(false); }).catch(() => setGenerating(false));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div
        className="absolute top-16 right-4 w-full max-w-md bg-surface-container rounded-lg analytical-border shadow-2xl overflow-y-auto max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant sticky top-0 bg-surface-container">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-label-caps text-on-surface">WEEKLY INTELLIGENCE DIGEST</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <p className="text-center py-8 text-body-sm text-on-surface-variant">Loading digest...</p>
          ) : !digest ? (
            <div className="text-center py-8">
              <p className="text-body-sm text-on-surface-variant mb-4">No digest generated yet.</p>
              <button onClick={generate} disabled={generating} className="px-4 py-2 bg-primary text-on-primary rounded text-label-caps cursor-pointer disabled:opacity-60">
                {generating ? 'Generating…' : 'GENERATE NOW'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-on-surface-variant">Generated {fmtDate(digest.generatedAt)}</span>
                <button onClick={generate} disabled={generating} className="flex items-center gap-1 text-[10px] text-primary cursor-pointer disabled:opacity-60">
                  <RefreshCw className="w-3 h-3" />{generating ? 'Generating…' : 'Refresh'}
                </button>
              </div>

              <div className="text-[10px] text-on-surface-variant">Corpus: {digest.dbTotal.toLocaleString()} posts & comments</div>

              {digest.topInsights.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">TOP INSIGHTS THIS WEEK</h3>
                  <div className="space-y-2">
                    {digest.topInsights.slice(0, 3).map((ins, i) => (
                      <div key={i} className="bg-surface-container-high rounded p-3">
                        <p className="text-body-sm font-medium text-on-surface">{ins.title}</p>
                        {ins.description && <p className="text-[10px] text-on-surface-variant mt-1">{ins.description.substring(0, 120)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {digest.sentimentShifts.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">SENTIMENT SHIFTS</h3>
                  <div className="space-y-2">
                    {digest.sentimentShifts.slice(0, 4).map(d => (
                      <div key={d.drug} className="flex items-center gap-3">
                        <span className="text-body-sm text-on-surface w-24 shrink-0">{d.drug}</span>
                        <span className={`text-data-mono text-[11px] ${d.shift > 0 ? 'text-success' : 'text-error'}`}>{d.shift > 0 ? '+' : ''}{d.shift}pp</span>
                        <span className="text-[10px] text-on-surface-variant">{d.recentPct}% positive this week</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {digest.riskAlerts.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-error mb-3">RISK SPIKES</h3>
                  <div className="space-y-2">
                    {digest.riskAlerts.map(r => (
                      <div key={r.drug} className="flex items-center gap-2">
                        <WarningIcon className="w-3.5 h-3.5 text-error shrink-0" />
                        <span className="text-body-sm text-on-surface">{r.drug}</span>
                        <span className="text-data-mono text-error text-[11px]">{r.riskPct}% risk alerts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {digest.emergingTopics.length > 0 && (
                <div>
                  <h3 className="text-label-caps text-on-surface mb-3">EMERGING TOPICS</h3>
                  <div className="flex flex-wrap gap-2">
                    {digest.emergingTopics.slice(0, 8).map((t, i) => (
                      <span key={i} className="text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface">{t.topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DigestPanel.tsx
git commit -m "feat: DigestPanel — weekly digest slide-out with sentiment shifts, risk alerts, emerging topics"
```

---

## Task 4: Wire `AlertBanner` and `DigestPanel` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports at the top of `src/App.tsx`**

After the existing component imports, add:
```typescript
import { AlertBanner } from './components/AlertBanner';
import { DigestPanel }  from './components/DigestPanel';
```

- [ ] **Step 2: Add `Mail` to the lucide-react import**

Change:
```typescript
import { Activity, LayoutDashboard, Search, BookOpen, Circle, TrendingUp } from 'lucide-react';
```
to:
```typescript
import { Activity, LayoutDashboard, Search, BookOpen, Circle, TrendingUp, Mail } from 'lucide-react';
```

- [ ] **Step 3: Add `digestOpen` state inside the `App` function**

After the `const [currentTab, ...]` state line, add:
```typescript
  const [digestOpen, setDigestOpen] = useState(false);
```

- [ ] **Step 4: Add digest button to the header**

Find the LIVE badge div in the header:
```typescript
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-success)]/40 ...">
```

Add a digest button directly before that div:
```typescript
            <button
              onClick={() => setDigestOpen(d => !d)}
              className="flex items-center gap-2 px-3 py-1.5 rounded analytical-border bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Weekly Digest"
            >
              <Mail className="w-4 h-4" />
              <span className="text-label-caps hidden md:inline">DIGEST</span>
            </button>
```

- [ ] **Step 5: Render `AlertBanner` and `DigestPanel` just before the closing `</div>` of the App return**

Find the closing `</div>` at the end of the App return (after the `</nav>` mobile nav close). Add:
```typescript
      <AlertBanner />
      <DigestPanel open={digestOpen} onClose={() => setDigestOpen(false)} />
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 7: Start dev server and verify**

```bash
npm run dev
```

Open http://localhost:3000. Expected:
- "DIGEST" button appears in the header to the left of the LIVE badge
- Clicking it opens a slide-out panel
- Panel shows "No digest generated yet" with a "GENERATE NOW" button
- Clicking "GENERATE NOW" posts to `/api/digest/generate` and shows the digest
- `AlertBanner` is invisible (no alerts yet — they only fire after a data refresh triggers `checkAlerts`)

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire AlertBanner + DigestPanel into App.tsx header"
```

---

## Self-Review

**Spec coverage:**
- ✅ #9 Alert system — `checkAlerts()` fires on risk spike >20%, new CRITICAL insight, tag volume ≥50; `AlertBanner` polls every 60s and renders dismissible toasts; webhook via `ALERT_WEBHOOK_URL` env var
- ✅ #10 Weekly Digest — `generateDigest()` aggregates week's insights, sentiment shifts, risk alerts, emerging topics; `scheduleWeeklyDigest()` fires Monday 9am; `DigestPanel` previews in-app; webhook via `DIGEST_WEBHOOK_URL`; on-demand via POST `/api/digest/generate`

**Placeholder scan:** None. All steps contain complete code.

**Type consistency:** `Alert` and `DigestData` interfaces defined in their respective component files. Server endpoints return shapes that match the interfaces. `INTEL_DRUGS` is already defined in `server.ts` and reused in `checkAlerts()` / `generateDigest()` — no re-declaration needed.
