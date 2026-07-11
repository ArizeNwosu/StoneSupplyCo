# Splitflask — CPA Filing Package
**Prepared for:** CPA (and Bob, preparer)
**Prepared by:** Arizechukwu (Riz) Nwosu
**Date:** July 2026
**Entities:** SGM / Social Gear Media LLC (1120-S) · SPLT INC (1120) · Cyberbrands LLC (Schedule C)

---

## What This Is

Bank-sourced reconstruction of five entity-years (SGM 2024, CB 2024, SGM 2025, SPLT 2025, CB 2025). Originals were filed off a commingled QuickBooks Self-Employed export with unsubstantiated deductions and gross receipts below the 1099-K floor. Every figure in these packets traces to a footed bank statement, a platform settlement document, or a 1099-K form. No figure was derived from an estimated plug except where explicitly labeled ESTIMATE.

---

## Five Amendment Results

| Entity | Year | Form | Filed Net | Amended Net | Direction |
|--------|------|------|-----------|-------------|-----------|
| SGM | 2024 | 1120-S | −$33,351 | ~−$192,339 (inv.) / ~−$249,939 (cash) | Deeper loss; does not raise tax |
| CB | 2024 | Schedule C | +$4,142 | +$27,514 | Profit increases; commingled non-CB costs removed |
| SGM | 2025 | 1120-S | −$32,900 | ~−$11,915 | Shallower loss; owner loans removed from income |
| SPLT | 2025 | 1120 | +$9,850 | +$56,561 | Income increases; correct Kickstarter + nominee treatment |
| CB | 2025 | Schedule C | ~breakeven | ~−$16,470 | Loss; SPLT-paid FB ads added as interco deduction |

---

## The One Real Tax Owed

**SPLT INC 2025 C-corp tax: ~$11,878 (21% × $56,561 taxable income).**

SPLT is a C-corp — its income does NOT flow through to the personal 1040 and does NOT net against SGM or CB losses. This is the only entity-year across all five packets where tax is actually owed. Shopify Capital interest (CPA extracts from agreement) will reduce this modestly once extracted.

Personal return (SGM + CB pass-throughs): aggregate deeply net-negative (SGM 2024 −$192K dominates). No income tax on personal return. SE tax on CB profit may apply separately.

---

## File First

Work through these BEFORE finalizing any packet:

1. **A1 — Accounting method election** (cash vs. inventory/accrual) — cascades to COGS on all five packets. All entities filed cash; any change to inventory requires Form 3115.
2. **B1 — SGM 2024 filing model** (gross-up model in this packet vs. net-deposits alternative `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx`).
3. **C1 — Amazon nominee 1099 SGM→SPLT $224,789.09** — hard interlock: SGM 2025 and SPLT 2025 cannot both file without it.
4. **Verify cross-packet ties F1–F4 before filing either side of each pair.**
5. Then file in order: (SGM 2024 + CB 2024 together) → (SGM 2025 + SPLT 2025 together, with nominee 1099) → (CB 2025) → (personal 1040 last).

Full decision list with 41 items, urgency ratings, and the constrained filing order: `CPA_Decision_List.md`.

---

## Cross-Packet Ties (Both Sides Must Match Before Filing Either)

| Pair | Amount | Status |
|------|--------|--------|
| F1: SGM 2024 receivable = CB 2024 payable | $8,135.50 | Confirmed in packets — verify in filings |
| F2: SPLT 2025 receivable = CB 2025 payable | $17,818.73 | Confirmed in packets — verify in filings |
| F3: SGM 2025 nominee out = SPLT 2025 nominee in | $224,789.09 | $0.00 variance confirmed |
| F4: SGM 2024 freight + CB 2024 freight = gross | $65,918 + $23,202.50 = $89,120.50 | Confirmed in packets |

---

## Files in This Folder

| File | Contents |
|------|----------|
| `SGM_2024_Amendment_Packet.xlsx` | 7-tab workbook: Summary, 1099-K Recon, Revenue, COGS, Deductions, Interco, Source Index |
| `SGM_2024_Cover_Memo.md` | Narrative: what changed vs. as-filed, open CPA decisions |
| `CB_2024_Amendment_Packet.xlsx` | 7-tab workbook, includes QB commingling restructuring |
| `CB_2024_Cover_Memo.md` | Narrative: QB catch-all restructuring, freight, COGS method |
| `SGM_2025_Amendment_Packet.xlsx` | 7-tab workbook; nominee pass-through shown in full |
| `SGM_2025_Cover_Memo.md` | Narrative: wind-down entity, nominee mechanics, opex itemization |
| `SPLT_2025_Amendment_Packet.xlsx` | 7-tab workbook; Kickstarter, Chase card classification, nominee received-side |
| `SPLT_2025_Cover_Memo.md` | Narrative: C-corp treatment, Kickstarter income, nominee steps |
| `CB_2025_Amendment_Packet.xlsx` | 7-tab workbook; SPLT-paid interco FB ads deduction |
| `CB_2025_Cover_Memo.md` | Narrative: revenue gross-up, interco ads, method election |
| `CPA_Decision_List.md` | 41 open items (groups A–G) with constrained filing order |
| `Reconciliation_Backup.xlsx` | Full audit trail: every headline figure → source; cross-packet ties; source index |

---

## Methodology Notes (Reconciliation_Backup.xlsx — "Methodology Notes" tab)

The Reconciliation_Backup workbook's corrections log is titled **"Methodology Notes"** — it documents known data traps in the source documents and how they were caught and resolved. If you re-derive any figure from the same Wells Fargo PDF source documents, you will encounter the same traps; these notes will tell you what to look for.

Five material findings documented:
1. **Wells Fargo Parser Bug** — running balance captured as transaction amount across 77 lines in SGM 2024 (~$1.37M phantom debit inflation). Caught only by mandatory per-statement balance footing. All 12 SGM 2024 months now foot to $0.00 diff.
2. **Plug Trap** — fees derived as (1099-K − deposits) gave 2–4× real rates. Always use stated settlement fees from platform reports, not the deposit-gap back-calculation.
3. **Commingled QB Filing (CB 2024)** — QuickBooks Self-Employed catch-all had ~$104K unsubstantiated deductions and multiple businesses on one Schedule C. Real CB deductions $79,598, all bank-sourced.
4. **FB Invoice Comma-Parse** — 2025 total initially parsed as $85,325; real $97,769.11. Re-sum card-by-card against invoice PDF.
5. **2026 Stale Estimate** — provenance gate refused $430K interim estimate; real confirmed H1 core = $106,411.

---

## Working Set

`deliverables/` in the project root is the working set (originals intact). This folder (`handoff/CPA_TJ/`) is the clean hand-off copy. Do not edit the hand-off copy — make changes in `deliverables/` and re-copy.
