# HANDOFF.md — Splitflask DD Ledger

## What This Is

This is a forensic financial due-diligence reconstruction for three related entities: SGM / Social Gear Media LLC, SPLT INC, and Cyberbrands LLC. There is no pre-existing accounting system — the general ledger is being built from scratch using bank statements, 1099-K forms, transaction exports, and CPA amendment workbooks. **The filesystem is the state; git history is the changelog.** Every session that touches figures must commit before closing. No figure may reach `locked` status in `ledger.xlsx → Figures` without a real `source_id` pointing at a confirmed row in `ledger.xlsx → Sources`. Downstream layers build only on `locked` figures. One layer per session — do not skip ahead.

---

## Entity Map

| Short | Legal Name | Type | EIN | Primary Bank |
|-------|-----------|------|-----|-------------|
| SGM | Social Gear Media LLC | CA S-corp | 83-3077502 | WF ending 8625 |
| SPLT | SPLT INC | C-corp (DE), formed Jan 2025 | 33-3094308 | WF ending 0423 |
| Cyberbrands | Cyberbrands LLC | holding / related | EIN ending 7466 | WF (see stmts) |
| personal | Arizechukwu Nwosu + Cheryl Benefield | personal | — | — |

**Key rule on intercompany:** Freight and inventory transfers land on whichever entity **paid the third party**, exactly once. Check `Intercompany` tab for double-count verification before accepting any figure that crosses entities.

---

## Layer Sequence

| Layer | Name | Goal | Status |
|-------|------|------|--------|
| **0** | Source-truth + per-entity classification | Read every bank statement; classify every deposit and debit by entity and nature; lock 1099-K gross figures against PDF forms | **NEXT** |
| **1** | Tax positions lock | Reconcile as-filed returns against reconstructed figures; identify amendments required; lock all tax-position figures | Pending |
| **2** | Investor cascade | Build investor-facing P&L and balance sheet from locked Layer-1 figures; produce V12 workbook | Pending |
| **3** | 24-tab V12 assembly | Final assembly into the investor DD workbook | Pending |

---

## Current State

**Setup complete. Nothing locked yet.**

- `ledger.xlsx` has six tabs: `Figures`, `Sources`, `ChangeLog`, `OpenItems`, `Intercompany`, `EntityMap`
- `Sources` tab: all staged files inventoried; missing-placeholder rows added for unconfirmed 1099-K PDFs
- `OpenItems` tab: four open items seeded (Kangdao wire, FB ad double-count risk, patent valuation, COGS substantiation)
- `Figures` tab: empty — no figures locked

**Next: Layer 0 source-truth pull**

Priority order for Layer 0:
1. Identify which entity each unlabeled WellsFargo statement belongs to (compare account numbers on the PDFs to WF 8625 / 0423 / Cyberbrands acct)
2. Confirm platform for `2024-1099K.pdf` (Amazon SGM vs TikTok) — resolve `S050–S052` status
3. Pull gross revenue figures from all 1099-K PDFs and lock them in `Figures` tab
4. Classify bank statement deposits against 1099-K floors entity by entity
5. Resolve Kangdao Sep 2024 wire (OpenItem)

**Outstanding gaps (obtain before Layer 0 can complete):**
- Amazon 1099-K for SGM primary account 2024: may be `2024-1099K.pdf` — verify
- Amazon 1099-K for Cyberbrands 2024: `Amazon-Cyberbrands-2024-1099K-2.pdf` staged but needs confirmation it is the actual form
- Amazon 1099-K 2025: `2025-1099K.pdf` staged but platform unconfirmed

---

## Session Discipline

- Read this file and `ledger.xlsx → Sources` at the start of every session
- Work exactly one layer per session
- Commit with `git add -A && git commit -m "Layer N: ..."` before closing
- A `locked` figure without a `source_id` is a data error — do not accept it
- Never reach out to Google Drive — all source documents are in this folder
