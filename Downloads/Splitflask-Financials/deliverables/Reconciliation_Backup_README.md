# Reconciliation Backup — Splitflask Due Diligence

**File:** `Reconciliation_Backup.xlsx`  
**Purpose:** Audit trail tying every headline figure in both deliverable sets back to its source document.

## Two audiences

| Audience | Question | Tab |
|---|---|---|
| TJ / IRS | Where does each tax figure come from? | Tax Figures Trace |
| Kendra's team | Where does each GMV / deal figure come from? | Deal GMV Trace |

## Tabs

| Tab | Contents |
|---|---|
| README | Purpose, two-denominator wall, verification legend |
| Tax Figures Trace | All 5 entity-years: gross receipts → COGS → deductions → net, each sourced |
| Cross-Packet Ties | 4 matched intercompany/nominee pairs (both sides shown, both verified) |
| Deal GMV Trace | 2024 $751,891 / 2025 $513,987 / 2026 H1 $106,411 per channel + 2024 waterfall |
| Corrections & Findings Log | 5 material discoveries: bug, how caught, before/after |
| Source Index | Every source document, type, what it supports, verification status |

## The two-denominator wall

**Never mix these:**

1. **Splitflask GMV (deal)** — tumbler only, 4 channels, no Cyberbackpack  
2. **Total gross receipts (tax)** — all products, all entities, incl. Cyberbackpack  

Bridge: Cyberbackpack ~$104,678 (1099-K) is a separate product on separate accounts → excluded from deal, included in tax.

## Verification status key

- ✅ FOOTED — bank statement passes per-statement balance gate  
- ✅ PLATFORM-DOC — from settlement report / dashboard / export (not derived from deposits)  
- ✅ 1099-K — Box 1a from IRS form, penny-verified  
- ⚠ ESTIMATE-LABELED — estimate, clearly labeled, TJ to confirm before filing  
- ⚠ PRELIMINARY — 2026 data only, unaudited  

## Five material findings (Corrections log)

1. **WF Parser Bug** — running balance captured as transaction amount; 77 lines, ~$1.37M phantom removed from SGM 2024. Caught by mandatory per-statement balance footing.
2. **Plug Trap** — fees derived as (1099-K − deposits) gave 2–4× real rates. Replaced with stated settlement fees (Amazon 15.1%, TikTok 33.1%, Shopify ~3%).
3. **Commingled QB Filing** — CB 2024 Schedule C had ~$104K unsubstantiated deductions from QuickBooks Self-Employed catch-all. Real deductions $79,598 (all bank-sourced).
4. **FB Invoice Comma-Parse Bug** — 2025 total initially parsed as $85,325; real $97,769.11. Card-by-card re-sum caught it.
5. **2026 $430K Stale Estimate** — provenance gate refused it; real confirmed H1 core = $106,411. Declining trajectory (2024→2025→2026), not re-acceleration.
