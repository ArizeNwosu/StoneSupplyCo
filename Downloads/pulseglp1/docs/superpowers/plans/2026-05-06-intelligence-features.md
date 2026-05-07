# Intelligence Features (#4–8, #11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six high-value Intel tab sections: Brand Switch Intelligence (#4), Unmet Needs Extractor (#5, Gemini-powered), Dosage-Level Intelligence (#6), Access & Payer Dashboard (#7), HCP Signal Separation (#8), and Trend Forecasting (#11).

**Architecture:** Six new Express endpoints added to `server.ts` after the existing `/api/intel/funnel` route. Intel.tsx is refactored into a thin composition layer — shared utilities extracted to `src/components/intel/shared.tsx`, existing sections moved to individual files in `src/components/intel/`, six new section files created alongside them. One new DB table (`intel_cache`) stores Gemini results with a 6h TTL to avoid repeat API calls.

**Tech Stack:** Express + better-sqlite3 (server), React + Recharts + Tailwind CSS v4 design tokens (client), `@google/genai` (unmet needs Gemini pass only).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `server.ts` | Add `intel_cache` table to `db.exec`, add 6 endpoints after `/api/intel/funnel` |
| Create | `src/components/intel/shared.tsx` | `useFetch<T>`, `SectionShell`, `timeAgo`, `TIMEFRAMES`, `DRUG_COLORS` |
| Create | `src/components/intel/DrugCompare.tsx` | Extracted from Intel.tsx — drug cards + stacked bar + switch table |
| Create | `src/components/intel/AdverseEvents.tsx` | Extracted from Intel.tsx — AE category cards with click-to-expand |
| Create | `src/components/intel/JourneyFunnel.tsx` | Extracted from Intel.tsx — stage funnel + per-drug table + off-ramp |
| Create | `src/components/intel/BrandSwitch.tsx` | Net flow bar + switch flow list with verbatims (#4) |
| Create | `src/components/intel/UnmetNeeds.tsx` | Gemini wish-statement cards (#5) |
| Create | `src/components/intel/DosageIntel.tsx` | Per-drug dose × sentiment bars (#6) |
| Create | `src/components/intel/PayerIntel.tsx` | Payer category cards with WoW trend + verbatims (#7) |
| Create | `src/components/intel/HCPSignals.tsx` | HCP post feed + drug breakdown (#8) |
| Create | `src/components/intel/TrendForecast.tsx` | Accelerating topics + sparklines + drug volume lines (#11) |
| Rewrite | `src/components/Intel.tsx` | Thin composition: imports shared timeframe selector + all 9 sections |

---

## Task 1: Add `intel_cache` table + 6 server endpoints

**Files:**
- Modify: `server.ts` — add table to `db.exec` (around line 22), add 6 endpoints after line 702

- [ ] **Step 1: Add `intel_cache` table to the `db.exec` block**

Find the `db.exec(`` block starting around line 22. Add inside it, after the existing index lines:

```typescript
  CREATE TABLE IF NOT EXISTS intel_cache (
    key       TEXT PRIMARY KEY,
    value     TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  );
```

- [ ] **Step 2: Add all 6 endpoints after the `/api/intel/funnel` route (after line ~702)**

Insert the following block immediately before the `// ─── Cache persistence` comment:

```typescript
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
      for (const dose of doses) {
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
  { id: 'insurance',   label: 'Insurance & Prior Auth', color: 'var(--color-error)',            keywords: ['insurance', 'prior auth', 'denied', 'not covered', 'formulary', 'step therapy', 'appeal', 'PA denied', 'reject'] },
  { id: 'cost',        label: 'Out-of-Pocket Cost',     color: 'var(--color-tertiary)',          keywords: ['out of pocket', 'expensive', 'afford', 'cost', 'price', 'copay', 'deductible', 'per month', 'monthly cost'] },
  { id: 'compounding', label: 'Compounding & Grey Mkt', color: '#a855f7',                        keywords: ['compound', 'compounded', 'compounding pharmacy', '503b', 'grey market', 'tirzepatide powder', 'semaglutide powder'] },
  { id: 'telehealth',  label: 'Telehealth Providers',   color: 'var(--color-primary)',           keywords: ['telehealth', 'telemedicine', 'hims', 'ro health', 'found health', 'calibrate', 'noom', 'sequence health', 'weight loss clinic'] },
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
cd /Users/riz/Downloads/pulseglp1
git add server.ts
git commit -m "feat: intel_cache table + 6 new intel endpoints (switches, dosage, payer, hcp, trends, unmet-needs)"
```

---

## Task 2: Create `src/components/intel/shared.tsx`

**Files:**
- Create: `src/components/intel/shared.tsx`

- [ ] **Step 1: Create the shared utilities file**

```typescript
// src/components/intel/shared.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const TIMEFRAMES = [
  { label: '7D',  days: 7  },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: 0  },
];

export const DRUG_COLORS: Record<string, string> = {
  Ozempic:     'var(--color-primary)',
  Wegovy:      'var(--color-tertiary)',
  Mounjaro:    'var(--color-success)',
  Zepbound:    '#a855f7',
  Semaglutide: 'var(--color-secondary)',
};

export function timeAgo(ms: number) {
  const d = Date.now() - ms;
  const h = Math.floor(d / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function useFetch<T>(url: string, deps: any[] = []) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  useEffect(() => {
    setLoading(true); setError(null);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error };
}

export function SectionShell({ title, subtitle, children, loading, error }: {
  title: string; subtitle: string; children: React.ReactNode; loading: boolean; error: string | null;
}) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 analytical-border rounded bg-surface-container-low">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 py-8 px-6 analytical-border rounded bg-surface-container-low text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-body-sm">Failed to load: {error}</span>
        </div>
      ) : children}
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/intel/shared.tsx
git commit -m "feat: extract shared Intel utilities to src/components/intel/shared.tsx"
```

---

## Task 3: Extract existing sections into `intel/` sub-files

**Files:**
- Create: `src/components/intel/DrugCompare.tsx`
- Create: `src/components/intel/AdverseEvents.tsx`
- Create: `src/components/intel/JourneyFunnel.tsx`

- [ ] **Step 1: Create `src/components/intel/DrugCompare.tsx`**

```typescript
// src/components/intel/DrugCompare.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

export function DrugCompare({ days }: { days: number }) {
  const { data, loading, error } = useFetch<{ drugs: any[]; switches: any[] }>(
    `/api/intel/compare?days=${days}`, [days]
  );
  const chartData = (data?.drugs || []).map(d => ({
    name: d.drug, Positive: d.positive, 'Risk-Alert': d.risk_alert, 'Neutral-Low': d.neutral, Analytical: d.analytical,
  }));
  return (
    <SectionShell title="Drug vs Drug Competitive Benchmark" subtitle="Sentiment breakdown, volume, and brand-switch flow across all 5 drugs." loading={loading} error={error}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {(data?.drugs || []).map(d => {
          const sentimentScore = d.total > 0 ? Math.round((d.positive / d.total) * 100) : 0;
          const riskPct        = d.total > 0 ? Math.round((d.risk_alert / d.total) * 100) : 0;
          return (
            <div key={d.drug} className="analytical-border bg-surface-container-low p-4 rounded flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-body-base font-semibold text-on-surface">{d.drug}</span>
                <span className="text-data-mono text-outline text-[10px]">{d.total.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${sentimentScore}%`, background: DRUG_COLORS[d.drug] || 'var(--color-primary)' }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: DRUG_COLORS[d.drug] }}>{sentimentScore}% positive</span>
                <span className="text-error">{riskPct}% risk</span>
              </div>
              <div className="text-[10px] text-on-surface-variant border-t border-outline-variant/30 pt-2">
                {d.posts.toLocaleString()} posts · {d.comments.toLocaleString()} comments
              </div>
            </div>
          );
        })}
      </div>
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-8">
        <h3 className="text-label-caps text-on-surface-variant mb-4">SENTIMENT DISTRIBUTION BY DRUG</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem' }} itemStyle={{ color: 'var(--color-on-surface)' }} labelStyle={{ color: 'var(--color-on-surface-variant)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Positive"    stackId="s" fill="var(--color-primary)"           radius={[0,0,0,0]} />
              <Bar dataKey="Neutral-Low" stackId="s" fill="var(--color-on-surface-variant)" opacity={0.4} />
              <Bar dataKey="Analytical"  stackId="s" fill="var(--color-tertiary)"           opacity={0.6} />
              <Bar dataKey="Risk-Alert"  stackId="s" fill="var(--color-error)"              radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {(data?.switches || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-6 rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">BRAND SWITCH FLOW (co-mentions with switch intent)</h3>
          <div className="space-y-2">
            {data!.switches.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-outline-variant/30 last:border-0">
                <span className="text-body-sm font-medium text-on-surface w-28">{s.from}</span>
                <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                <span className="text-body-sm font-medium text-primary flex-1">{s.to}</span>
                <span className="text-data-mono text-on-surface-variant">{s.count} mentions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 2: Create `src/components/intel/AdverseEvents.tsx`**

```typescript
// src/components/intel/AdverseEvents.tsx
import { useState } from 'react';
import { useFetch, SectionShell, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

const AE_COLORS: Record<string, string> = {
  gi: 'var(--color-error)', body: 'var(--color-tertiary)', fatigue: 'var(--color-on-surface-variant)', cardiac: '#ef4444', psych: 'var(--color-primary)',
};

export function AdverseEvents({ days }: { days: number }) {
  const { data, loading, error } = useFetch<any[]>(`/api/intel/adverse-events?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="Adverse Event Signal Monitor" subtitle="Keyword-matched safety signals aggregated by category and drug. Click a card to see top verbatims." loading={loading} error={error}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).map(cat => {
          const isOpen = openId === cat.id;
          return (
            <div key={cat.id} className={`analytical-border rounded overflow-hidden cursor-pointer transition-colors ${isOpen ? 'bg-surface-container' : 'bg-surface-container-low hover:bg-surface-container'}`} onClick={() => setOpenId(isOpen ? null : cat.id)}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-label-caps text-on-surface-variant">{cat.label.toUpperCase()}</span>
                  {cat.total > 0 && <span style={{ color: AE_COLORS[cat.id] }}><WarningIcon className="w-4 h-4" /></span>}
                </div>
                <div className="text-data-mono text-headline-md mb-1" style={{ color: cat.total > 0 ? AE_COLORS[cat.id] : 'var(--color-on-surface-variant)' }}>{cat.total.toLocaleString()}</div>
                <div className="text-[10px] text-on-surface-variant mb-3">mentions in window</div>
                {cat.byDrug?.length > 0 && (
                  <div className="space-y-1.5">
                    {cat.byDrug.slice(0, 3).map((d: any) => (
                      <div key={d.drug} className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant w-20 truncate">{d.drug}</span>
                        <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / (cat.byDrug[0]?.count || 1)) * 100)}%`, background: AE_COLORS[cat.id] }} />
                        </div>
                        <span className="text-[10px] text-data-mono text-on-surface-variant w-6 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isOpen && cat.verbatims?.length > 0 && (
                <div className="border-t border-outline-variant px-5 pb-5 pt-4 space-y-3">
                  <span className="text-label-caps text-on-surface-variant">TOP VERBATIMS</span>
                  {cat.verbatims.map((v: any) => (
                    <div key={v.id} className="bg-surface-container-highest rounded p-3">
                      <div className="flex gap-2 mb-2">
                        <span className="text-[10px] text-primary">{v.drug}</span>
                        <span className="text-[10px] text-outline ml-auto">{timeAgo(v.post_ts || v.timestamp)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface leading-relaxed">"{v.text.substring(0, 200)}{v.text.length > 200 ? '…' : ''}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 3: Create `src/components/intel/JourneyFunnel.tsx`**

```typescript
// src/components/intel/JourneyFunnel.tsx
import { useFetch, SectionShell, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

const STAGE_ORDER = ['Starting', 'Titration', 'Maintenance', 'Off-Ramp'];

export function JourneyFunnel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<{ stages: any[]; byDrug: any[]; offRamp: any[] }>(`/api/intel/funnel?days=${days}`, [days]);
  const total = (data?.stages || []).reduce((s, r) => s + r.count, 0);
  const drugMap: Record<string, Record<string, number>> = {};
  (data?.byDrug || []).forEach((r: any) => { if (!drugMap[r.drug]) drugMap[r.drug] = {}; drugMap[r.drug][r.stage] = r.count; });
  const drugs = Object.keys(drugMap);
  return (
    <SectionShell title="Patient Journey Funnel" subtitle="Distribution across treatment stages — where patients are, and why they exit." loading={loading} error={error}>
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-6">
        <div className="space-y-3">
          {(data?.stages || []).map((s, i) => {
            const pct = total > 0 ? (s.count / total) * 100 : 0;
            const colors = ['var(--color-primary)', 'var(--color-tertiary)', 'var(--color-success)', 'var(--color-error)'];
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="text-body-sm text-on-surface w-24 shrink-0">{s.stage}</span>
                <div className="flex-1 h-8 bg-surface-container-highest rounded overflow-hidden">
                  <div className="h-full flex items-center px-3 rounded transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: colors[i] }}>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{s.count.toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-data-mono text-on-surface-variant w-10 text-right text-[11px]">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
      {drugs.length > 0 && (
        <div className="analytical-border bg-surface-container-low rounded overflow-hidden mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-4 py-3 text-label-caps text-on-surface-variant">DRUG</th>
                {STAGE_ORDER.map(s => <th key={s} className="px-4 py-3 text-label-caps text-on-surface-variant text-right">{s.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {drugs.map(drug => (
                <tr key={drug} className="hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-body-sm font-medium text-on-surface">{drug}</td>
                  {STAGE_ORDER.map(stage => <td key={stage} className="px-4 py-3 text-data-mono text-right text-on-surface">{(drugMap[drug][stage] || 0).toLocaleString()}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(data?.offRamp || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-6 rounded">
          <h3 className="text-label-caps text-on-surface-variant mb-4">WHY PATIENTS EXIT — OFF-RAMP VERBATIMS</h3>
          <div className="space-y-3">
            {data!.offRamp.map(v => (
              <div key={v.id} className="bg-surface-container-highest rounded p-4">
                <div className="flex gap-2 items-center mb-2 flex-wrap">
                  <span className="text-label-caps px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded">{v.drug}</span>
                  {v.sentiment === 'Risk-Alert' && <WarningIcon className="w-3.5 h-3.5 text-error" />}
                  <span className="text-data-mono text-outline ml-auto">{timeAgo(v.timestamp)}</span>
                </div>
                <p className="text-body-sm text-on-surface leading-relaxed">"{v.text.substring(0, 300)}{v.text.length > 300 ? '…' : ''}"</p>
                {v.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.tags.map((t: string) => <span key={t} className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/intel/DrugCompare.tsx src/components/intel/AdverseEvents.tsx src/components/intel/JourneyFunnel.tsx
git commit -m "refactor: extract DrugCompare, AdverseEvents, JourneyFunnel into intel/ sub-directory"
```

---

## Task 4: Create `BrandSwitch.tsx` (#4)

**Files:**
- Create: `src/components/intel/BrandSwitch.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/intel/BrandSwitch.tsx
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface SwitchFlow { from: string; to: string; count: number; verbatims: string[]; }
interface NetRanking { drug: string; netFlow: number; }
interface SwitchData  { flows: SwitchFlow[]; netRanking: NetRanking[]; }

export function BrandSwitch({ days }: { days: number }) {
  const { data, loading, error } = useFetch<SwitchData>(`/api/intel/switches?days=${days}`, [days]);
  const [openFlow, setOpenFlow] = useState<string | null>(null);
  const winner = data?.netRanking?.[0];
  const loser  = data?.netRanking?.slice(-1)[0];
  return (
    <SectionShell title="Brand Switch Intelligence" subtitle="Detected switching intent: who patients are leaving, who they're moving to, and why." loading={loading} error={error}>
      {/* Winner / Loser */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {winner && winner.netFlow > 0 && (
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <div className="text-label-caps text-success mb-2">NET WINNER</div>
            <div className="text-headline-md font-bold text-on-surface">{winner.drug}</div>
            <div className="text-data-mono text-success mt-1">+{winner.netFlow} net mentions</div>
          </div>
        )}
        {loser && loser.netFlow < 0 && (
          <div className="analytical-border bg-surface-container-low p-5 rounded">
            <div className="text-label-caps text-error mb-2">NET LOSER</div>
            <div className="text-headline-md font-bold text-on-surface">{loser.drug}</div>
            <div className="text-data-mono text-error mt-1">{loser.netFlow} net mentions</div>
          </div>
        )}
      </div>
      {/* Net flow bar */}
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-8">
        <h3 className="text-label-caps text-on-surface-variant mb-4">NET PATIENT FLOW (inflow − outflow)</h3>
        <div className="space-y-2">
          {(data?.netRanking || []).map(r => {
            const max = Math.max(...(data?.netRanking || []).map(x => Math.abs(x.netFlow)), 1);
            const pct = (Math.abs(r.netFlow) / max) * 100;
            const positive = r.netFlow >= 0;
            return (
              <div key={r.drug} className="flex items-center gap-3">
                <span className="text-body-sm text-on-surface w-24 shrink-0">{r.drug}</span>
                <div className="flex-1 h-6 flex items-center">
                  <div className="h-full rounded" style={{ width: `${Math.max(pct, 2)}%`, minWidth: '4px', backgroundColor: positive ? (DRUG_COLORS[r.drug] || 'var(--color-primary)') : 'var(--color-error)' }} />
                </div>
                <span className={`text-data-mono w-12 text-right text-[11px] ${positive ? 'text-success' : 'text-error'}`}>
                  {positive ? '+' : ''}{r.netFlow}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Flow list */}
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">DETECTED SWITCH FLOWS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.flows || []).slice(0, 12).map(f => {
            const key = `${f.from}-${f.to}`;
            const isOpen = openFlow === key;
            return (
              <div key={key} className="cursor-pointer hover:bg-surface-container transition-colors" onClick={() => setOpenFlow(isOpen ? null : key)}>
                <div className="flex items-center gap-3 px-6 py-3">
                  <span className="text-body-sm font-medium text-on-surface w-24">{f.from}</span>
                  <ArrowRight className="w-4 h-4 text-outline shrink-0" />
                  <span className="text-body-sm font-medium flex-1" style={{ color: DRUG_COLORS[f.to] || 'var(--color-primary)' }}>{f.to}</span>
                  <span className="text-data-mono text-on-surface-variant">{f.count} mentions</span>
                </div>
                {isOpen && f.verbatims.length > 0 && (
                  <div className="px-6 pb-4 space-y-2 bg-surface-container">
                    <span className="text-label-caps text-on-surface-variant">VERBATIMS</span>
                    {f.verbatims.map((v, vi) => <p key={vi} className="text-body-sm text-on-surface-variant italic">"{v}"</p>)}
                  </div>
                )}
              </div>
            );
          })}
          {(data?.flows || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">No switch co-mentions detected in this time window. Try a longer window.</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/intel/BrandSwitch.tsx
git commit -m "feat: BrandSwitch section — net flow ranking + verbatims (#4)"
```

---

## Task 5: Create `DosageIntel.tsx` (#6), `PayerIntel.tsx` (#7), `HCPSignals.tsx` (#8)

**Files:**
- Create: `src/components/intel/DosageIntel.tsx`
- Create: `src/components/intel/PayerIntel.tsx`
- Create: `src/components/intel/HCPSignals.tsx`

- [ ] **Step 1: Create `src/components/intel/DosageIntel.tsx`**

```typescript
// src/components/intel/DosageIntel.tsx
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface DosageRow { drug: string; dose: string; total: number; positivePct: number; riskPct: number; }

export function DosageIntel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<DosageRow[]>(`/api/intel/dosage?days=${days}`, [days]);
  const byDrug: Record<string, DosageRow[]> = {};
  (data || []).forEach(r => { if (!byDrug[r.drug]) byDrug[r.drug] = []; byDrug[r.drug].push(r); });
  return (
    <SectionShell title="Dosage-Level Intelligence" subtitle="Sentiment breakdown per dose — extracted from mg values mentioned in posts and comments." loading={loading} error={error}>
      {Object.keys(byDrug).length === 0 && (
        <div className="text-center py-8 text-on-surface-variant text-body-sm analytical-border rounded bg-surface-container-low">
          No dosage mentions found in this window. Try a longer window or wait for more posts.
        </div>
      )}
      <div className="space-y-8">
        {Object.entries(byDrug).map(([drug, doses]) => {
          const color = DRUG_COLORS[drug] || 'var(--color-primary)';
          return (
            <div key={drug} className="analytical-border bg-surface-container-low rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-outline-variant flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-label-caps text-on-surface">{drug}</h3>
              </div>
              <div className="divide-y divide-outline-variant">
                {doses.map(d => (
                  <div key={d.dose} className="px-6 py-3 flex items-center gap-4">
                    <span className="text-data-mono text-on-surface w-16 shrink-0">{d.dose}</span>
                    <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div style={{ width: `${d.positivePct}%`, backgroundColor: 'var(--color-primary)' }} />
                        <div style={{ width: `${Math.max(0, 100 - d.positivePct - d.riskPct)}%`, backgroundColor: 'var(--color-on-surface-variant)', opacity: 0.25 }} />
                        <div style={{ width: `${d.riskPct}%`, backgroundColor: 'var(--color-error)' }} />
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] shrink-0">
                      <span style={{ color: 'var(--color-primary)' }}>{d.positivePct}%+</span>
                      <span className="text-error">{d.riskPct}%⚠</span>
                      <span className="text-on-surface-variant">{d.total} posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Create `src/components/intel/PayerIntel.tsx`**

```typescript
// src/components/intel/PayerIntel.tsx
import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFetch, SectionShell, timeAgo } from './shared';

interface PayerCat { id: string; label: string; color: string; total: number; trend: number; recentWeek: number; priorWeek: number; byDrug: { drug: string; count: number }[]; verbatims: any[]; }

export function PayerIntel({ days }: { days: number }) {
  const { data, loading, error } = useFetch<PayerCat[]>(`/api/intel/payer?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="Access & Payer Intelligence" subtitle="Insurance denials, cost barriers, compounding adoption, and telehealth signals — with week-over-week trends." loading={loading} error={error}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data || []).map(cat => {
          const isOpen = openId === cat.id;
          const TrendIcon = cat.trend > 10 ? TrendingUp : cat.trend < -10 ? TrendingDown : Minus;
          const trendColor = cat.trend > 10 ? 'var(--color-error)' : cat.trend < -10 ? 'var(--color-success)' : 'var(--color-on-surface-variant)';
          return (
            <div key={cat.id} className={`analytical-border rounded overflow-hidden cursor-pointer transition-colors ${isOpen ? 'bg-surface-container' : 'bg-surface-container-low hover:bg-surface-container'}`} onClick={() => setOpenId(isOpen ? null : cat.id)}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-label-caps text-on-surface-variant">{cat.label.toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
                    <span className="text-[10px] font-medium" style={{ color: trendColor }}>{cat.trend > 0 ? '+' : ''}{cat.trend}% WoW</span>
                  </div>
                </div>
                <div className="text-data-mono text-headline-md mb-1" style={{ color: cat.color }}>{cat.total.toLocaleString()}</div>
                <div className="text-[10px] text-on-surface-variant mb-3">mentions in window</div>
                {cat.byDrug?.length > 0 && (
                  <div className="space-y-1.5">
                    {cat.byDrug.slice(0, 3).map((d: any) => (
                      <div key={d.drug} className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant w-20 truncate">{d.drug}</span>
                        <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / (cat.byDrug[0]?.count || 1)) * 100)}%`, background: cat.color }} />
                        </div>
                        <span className="text-[10px] text-data-mono text-on-surface-variant w-6 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isOpen && cat.verbatims?.length > 0 && (
                <div className="border-t border-outline-variant px-5 pb-5 pt-4 space-y-3">
                  <span className="text-label-caps text-on-surface-variant">TOP VERBATIMS</span>
                  {cat.verbatims.map((v: any, i: number) => (
                    <div key={i} className="bg-surface-container-highest rounded p-3">
                      <div className="flex gap-2 mb-2">
                        <span className="text-[10px] text-primary">{v.drug}</span>
                        <span className="text-[10px] text-outline ml-auto">{timeAgo(v.post_ts || v.timestamp)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface leading-relaxed">"{v.text.substring(0, 200)}{v.text.length > 200 ? '…' : ''}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 3: Create `src/components/intel/HCPSignals.tsx`**

```typescript
// src/components/intel/HCPSignals.tsx
import { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useFetch, SectionShell, DRUG_COLORS, timeAgo } from './shared';
import { WarningIcon } from '../WarningIcon';

interface HCPData { hcpPosts: any[]; totalHcp: number; totalPatient: number; hcpPct: number; hcpSentiments: Record<string, number>; byDrug: { drug: string; count: number }[]; }

export function HCPSignals({ days }: { days: number }) {
  const { data, loading, error } = useFetch<HCPData>(`/api/intel/hcp?days=${days}`, [days]);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SectionShell title="HCP Signal Separation" subtitle="Posts likely authored by healthcare professionals — detected via clinical language patterns. HCP sentiment is high-value signal." loading={loading} error={error}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP POSTS</div>
          <div className="text-headline-md text-on-surface text-data-mono">{(data?.totalHcp || 0).toLocaleString()}</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP RATE</div>
          <div className="text-headline-md text-primary text-data-mono">{data?.hcpPct || 0}%</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP POSITIVE</div>
          <div className="text-headline-md text-success text-data-mono">{data?.totalHcp ? Math.round(((data.hcpSentiments?.['Positive'] || 0) / data.totalHcp) * 100) : 0}%</div>
        </div>
        <div className="analytical-border bg-surface-container-low p-4 rounded">
          <div className="text-label-caps text-on-surface-variant mb-1">HCP RISK ALERTS</div>
          <div className="text-headline-md text-error text-data-mono">{data?.hcpSentiments?.['Risk-Alert'] || 0}</div>
        </div>
      </div>
      {(data?.byDrug || []).length > 0 && (
        <div className="analytical-border bg-surface-container-low p-5 rounded mb-6">
          <h3 className="text-label-caps text-on-surface-variant mb-4">HCP DISCUSSION BY DRUG</h3>
          <div className="space-y-2">
            {data!.byDrug.map(d => {
              const max = data!.byDrug[0]?.count || 1;
              return (
                <div key={d.drug} className="flex items-center gap-3">
                  <span className="text-body-sm text-on-surface w-24 shrink-0">{d.drug}</span>
                  <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((d.count / max) * 100)}%`, background: DRUG_COLORS[d.drug] || 'var(--color-primary)' }} />
                  </div>
                  <span className="text-data-mono text-on-surface-variant text-[11px] w-8 text-right">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">LIKELY HCP POSTS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.hcpPosts || []).slice(0, 10).map((p: any) => {
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className="cursor-pointer hover:bg-surface-container transition-colors" onClick={() => setOpenId(isOpen ? null : p.id)}>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] text-primary font-medium">{p.drug || 'General'}</span>
                    {p.sentiment === 'Risk-Alert' && <WarningIcon className="w-3.5 h-3.5 text-error" />}
                    <span className="text-[10px] text-outline ml-auto">{timeAgo(p.post_ts)}</span>
                  </div>
                  <p className="text-body-sm text-on-surface leading-relaxed">{p.text.substring(0, 180)}{p.text.length > 180 ? '…' : ''}</p>
                  {isOpen && (
                    <div className="mt-3">
                      <p className="text-body-sm text-on-surface leading-relaxed mb-3">"{p.text.substring(0, 500)}{p.text.length > 500 ? '…' : ''}"</p>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {(p.hcpSignals || []).map((s: string) => <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{s}</span>)}
                      </div>
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline" onClick={e => e.stopPropagation()}>VIEW ON REDDIT</a>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(data?.hcpPosts || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">No HCP posts detected in this window.</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/intel/DosageIntel.tsx src/components/intel/PayerIntel.tsx src/components/intel/HCPSignals.tsx
git commit -m "feat: DosageIntel, PayerIntel, HCPSignals sections (#6, #7, #8)"
```

---

## Task 6: Create `TrendForecast.tsx` (#11) and `UnmetNeeds.tsx` (#5)

**Files:**
- Create: `src/components/intel/TrendForecast.tsx`
- Create: `src/components/intel/UnmetNeeds.tsx`

- [ ] **Step 1: Create `src/components/intel/TrendForecast.tsx`**

```typescript
// src/components/intel/TrendForecast.tsx
import { Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface TrendTopic { tag: string; total: number; series: { week: string; count: number }[]; isAccelerating: boolean; avgGrowthPct: number; currentWeekCount: number; projectedPeakWeeks: number | null; }
interface TrendData   { topics: TrendTopic[]; drugTrends: { drug: string; series: { week: string; count: number }[] }[]; weeks: string[]; }

function formatWeek(iso: string) { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}`; }

export function TrendForecast({ days }: { days: number }) {
  const weeks = days === 0 ? 52 : Math.max(4, Math.ceil(days / 7));
  const { data, loading, error } = useFetch<TrendData>(`/api/intel/trends?weeks=${weeks}`, [weeks]);
  const accelerating = (data?.topics || []).filter(t => t.isAccelerating);
  return (
    <SectionShell title="Trend Forecasting" subtitle="Week-over-week topic growth with acceleration detection. ⚡ = 3+ consecutive weeks of growth." loading={loading} error={error}>
      {accelerating.length > 0 && (
        <div className="analytical-border border-primary/30 bg-primary/5 p-5 rounded mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-label-caps text-primary">ACCELERATING TOPICS</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {accelerating.map(t => (
              <div key={t.tag} className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded">
                <span className="text-body-sm text-on-surface font-medium">{t.tag}</span>
                <span className="text-[10px] text-success font-bold">+{t.avgGrowthPct}%/wk</span>
                {t.projectedPeakWeeks && t.projectedPeakWeeks < 10 && <span className="text-[10px] text-on-surface-variant">peak ~{t.projectedPeakWeeks}w</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="analytical-border bg-surface-container-low p-6 rounded mb-6">
        <h3 className="text-label-caps text-on-surface-variant mb-4">DRUG DISCUSSION VOLUME BY WEEK</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <XAxis dataKey="week" tickFormatter={formatWeek} stroke="var(--color-on-surface-variant)" fontSize={9} tickLine={false} />
              <YAxis stroke="var(--color-on-surface-variant)" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline)', borderRadius: '0.5rem', fontSize: '11px' }} labelFormatter={(l: string) => `Week of ${l}`} />
              {(data?.drugTrends || []).map(dt => (
                <Line key={dt.drug} data={dt.series} dataKey="count" name={dt.drug} stroke={DRUG_COLORS[dt.drug] || '#888'} strokeWidth={2} dot={false} type="monotone" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="analytical-border bg-surface-container-low rounded overflow-hidden">
        <div className="px-6 py-3 bg-surface-container-high border-b border-outline-variant">
          <h3 className="text-label-caps text-on-surface-variant">TOP TOPIC TRENDS</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {(data?.topics || []).slice(0, 12).map(t => (
            <div key={t.tag} className="px-6 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2 w-40 shrink-0">
                {t.isAccelerating && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                <span className="text-body-sm text-on-surface font-medium truncate">{t.tag}</span>
              </div>
              <div className="flex-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={t.series.slice(-8)}>
                    <Line dataKey="count" stroke={t.isAccelerating ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'} strokeWidth={1.5} dot={false} type="monotone" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 shrink-0 text-[10px]">
                <span className={`font-bold ${t.avgGrowthPct > 0 ? 'text-success' : 'text-error'}`}>{t.avgGrowthPct > 0 ? '+' : ''}{t.avgGrowthPct}%/wk</span>
                <span className="text-on-surface-variant">{t.total} total</span>
              </div>
            </div>
          ))}
          {(data?.topics || []).length === 0 && (
            <div className="px-6 py-8 text-center text-body-sm text-on-surface-variant">Not enough data for trend analysis. Try a longer window (90D or ALL).</div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Create `src/components/intel/UnmetNeeds.tsx`**

```typescript
// src/components/intel/UnmetNeeds.tsx
import { useFetch, SectionShell, DRUG_COLORS } from './shared';

interface UnmetNeed { theme: string; description: string; frequency: 'High' | 'Medium' | 'Low'; drug: string; quote: string; }
interface UnmetNeedsData { needs: UnmetNeed[]; sampleSize: number; generatedAt: number; }

const FREQ_COLORS: Record<string, string> = { High: 'var(--color-error)', Medium: 'var(--color-tertiary)', Low: 'var(--color-on-surface-variant)' };

export function UnmetNeeds({ days }: { days: number }) {
  const { data, loading, error } = useFetch<UnmetNeedsData>(`/api/intel/unmet-needs?days=${days}`, [days]);
  return (
    <SectionShell
      title="Unmet Needs Extractor"
      subtitle={`AI-identified patient wish statements and product gaps from ${data?.sampleSize || 0} sampled posts. Results cached 6 hours.`}
      loading={loading} error={error}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data?.needs || []).map((need, i) => (
          <div key={i} className="analytical-border bg-surface-container-low p-5 rounded flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-label-caps text-on-surface">{need.theme}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: FREQ_COLORS[need.frequency] || 'var(--color-outline)' }}>{need.frequency}</span>
            </div>
            <p className="text-body-sm text-on-surface leading-relaxed">{need.description}</p>
            <blockquote className="text-body-sm text-on-surface-variant italic border-l-2 border-outline-variant pl-3">"{need.quote}"</blockquote>
            {need.drug && (
              <div className="mt-auto">
                <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ color: DRUG_COLORS[need.drug] || 'var(--color-primary)', backgroundColor: 'var(--color-surface-container-highest)' }}>{need.drug}</span>
              </div>
            )}
          </div>
        ))}
        {(data?.needs || []).length === 0 && !loading && (
          <div className="col-span-2 text-center py-8 text-on-surface-variant text-body-sm">No unmet needs detected. Try a longer time window.</div>
        )}
      </div>
      {data?.generatedAt && (
        <p className="text-[10px] text-on-surface-variant mt-4 text-right">Generated {new Date(data.generatedAt).toLocaleString()} · Cached 6h</p>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/intel/TrendForecast.tsx src/components/intel/UnmetNeeds.tsx
git commit -m "feat: TrendForecast (#11) and UnmetNeeds Gemini extractor (#5)"
```

---

## Task 7: Rewrite `Intel.tsx` as thin composition layer

**Files:**
- Rewrite: `src/components/Intel.tsx`

- [ ] **Step 1: Replace the entire file content**

```typescript
// src/components/Intel.tsx
import { useState } from 'react';
import { TIMEFRAMES } from './intel/shared';
import { DrugCompare }   from './intel/DrugCompare';
import { AdverseEvents } from './intel/AdverseEvents';
import { JourneyFunnel } from './intel/JourneyFunnel';
import { BrandSwitch }   from './intel/BrandSwitch';
import { UnmetNeeds }    from './intel/UnmetNeeds';
import { DosageIntel }   from './intel/DosageIntel';
import { PayerIntel }    from './intel/PayerIntel';
import { HCPSignals }    from './intel/HCPSignals';
import { TrendForecast } from './intel/TrendForecast';

export default function Intel() {
  const [days, setDays] = useState(30);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-headline-md text-on-surface">Intelligence Hub</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Competitive benchmarks, safety signals, patient journey analytics, and trend forecasting.</p>
        </div>
        <div className="flex border border-outline-variant rounded overflow-hidden shrink-0">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setDays(tf.days)}
              className={`px-4 py-2 text-label-caps transition-colors cursor-pointer ${days === tf.days ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container'} ${tf.label === '30D' ? 'border-x border-outline-variant' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <DrugCompare   days={days} />
      <BrandSwitch   days={days} />
      <AdverseEvents days={days} />
      <PayerIntel    days={days} />
      <HCPSignals    days={days} />
      <DosageIntel   days={days} />
      <JourneyFunnel days={days} />
      <TrendForecast days={days} />
      <UnmetNeeds    days={days} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/riz/Downloads/pulseglp1 && npx tsc --noEmit
```

- [ ] **Step 3: Start dev server and verify Intel tab loads**

```bash
npm run dev
```

Open http://localhost:3000 and click the Intel tab. Expected: all 9 sections render (most will show loading spinners that resolve to data or empty states).

- [ ] **Step 4: Commit**

```bash
git add src/components/Intel.tsx
git commit -m "refactor: Intel.tsx becomes thin composition layer — 9 sections from intel/ sub-directory"
```

---

## Self-Review

**Spec coverage:**
- ✅ #4 Brand Switch — `BrandSwitch.tsx` + `/api/intel/switches` (net flow, verbatims, winner/loser)
- ✅ #5 Unmet Needs — `UnmetNeeds.tsx` + `/api/intel/unmet-needs` (Gemini, 6h cache)
- ✅ #6 Dosage Intelligence — `DosageIntel.tsx` + `/api/intel/dosage` (regex extraction, per-drug bars)
- ✅ #7 Payer Intelligence — `PayerIntel.tsx` + `/api/intel/payer` (4 categories, WoW trend)
- ✅ #8 HCP Separation — `HCPSignals.tsx` + `/api/intel/hcp` (keyword classifier, expandable feed)
- ✅ #11 Trend Forecasting — `TrendForecast.tsx` + `/api/intel/trends` (acceleration, sparklines, drug volume lines)
- ✅ `intel_cache` table for Gemini result caching

**Placeholder scan:** None. All steps have complete code.

**Type consistency:** All interfaces defined per-file. `useFetch<T>` generics match the response shapes. `WarningIcon` imported from `../WarningIcon` in files that use it. `DRUG_COLORS` exported from `shared.tsx` and imported everywhere it's needed.
