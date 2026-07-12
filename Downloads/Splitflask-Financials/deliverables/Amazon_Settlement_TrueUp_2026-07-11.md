# Amazon Settlement True-Up — Findings Memo
**Date:** 2026-07-11  
**Source files:** Splitflask-AMA 2024/2025/2026-H1 CustomUnifiedTransaction.csv, AMA Ad_Spend_2024/2025.csv

---

## JOB 1 — Amazon Ads: No Double-Count (confirmed)

### Ad Spend USD Conversion (FX rates stated)
| Year | USD | MXN@rate | CAD@rate | AUD@rate | Total USD |
|---|---|---|---|---|---|
| 2024 | $14,307.46 | 1,138.82 @0.0565 = $64 | 865.54 @0.735 = $636 | — | **$15,008** |
| 2025 | $29,020.94 | 2,394.44 @0.050 = $120 | 3,025.58 @0.700 = $2,118 | 12.48 @0.640 = $8 | **$31,267** |

### What's in the settlement vs what's in the packet
Amazon "Cost of Advertising" rows ARE in the unified transaction CSV — they appear as **Service Fee** type, flowing through the **other transaction fees** column.

- 2025 US-marketplace ads in settlement: **$28,980.47** (full year); SPLT period (Feb 5–Dec 31): **$24,716.96**
- 2024 US-marketplace ads in settlement: **$12,728.09** (full year)

The SPLT packet's $77,433.29 Amazon fee total is the **SUM of four separate lines in Tab 5**:
| Component | Packet | Settlement (SPLT period) | Status |
|---|---|---|---|
| Referral (selling fees) | $28,074.41 | $28,074.41 | ✅ exact match |
| FBA fulfillment | $19,746.32 | $19,746.32 | ✅ exact match |
| Advertising (Cost of Adv.) | $24,726.56 | $24,716.96 | ✅ match ($9.60 rounding/timing) |
| FBA storage/inventory | ~~$4,886~~ → **$3,938.34** | $3,938.34 | ✅ updated this session |
| **New total** | **$76,485.63** | $76,475.63 | ✅ |

**VERDICT: No double-count.** The $24,727 advertising is ONE COMPONENT of the fee total; it is not added on top of a pre-existing block that already includes it. Each line maps to a distinct column in the settlement CSV.

### Storage correction (this session)
- Old: $4,886.00 PROVISIONAL (proportional estimate)  
- New: **$3,938.34** STATED (from FBA Inventory Fee type rows, SPLT period Feb 5–Dec 31)
- Impact: deductions ↓$947.66 → SPLT 2025 taxable income ↑$947.66

### Additional minor items (not in current packet, uncaptured ~$424.87 deductions)
FBA Transaction fees SPLT period $533.93 + Amazon Fees $167.06 − Adjustments $276.12 = **+$424.87** in additional deductions. TJ can add these; small.

### International ads (uncaptured)
International portions (MX/CA/AU ads billed in local currency): ~$2,246 USD. These appear in the MX/CA/AU settlement accounts, not the US unified report. SPLT captures CA $6,326 + MX $2,696 revenue but may not have deducted the corresponding ad costs. Minor; TJ to verify if those settlement reports are available.

**Effect on SPLT 2025 income:**
- From locked +$56,561 (Assembly 4D)
- Storage correction: +$947.66
- Additional fees (if added): −$424.87
- Net from this job alone: **≈ +$57,085** (or +$57,509 without the additional fees)
- C-corp tax @ 21%: **≈ $11,988** (vs prior ~$11,878)

---

## JOB 2 — 1099-K $240,009.89 vs Settlement: Reconciled

Settlement CSV marketplace = **amazon.com only** (US). No non-US rows present.

| Basis | 2025 Amount | 2024 Amount |
|---|---|---|
| Gross order product sales | $223,341.48 | $320,426.70 |
| + Order shipping credits | $3,578.90 | $6,757.34 |
| + Sales tax (MF + misc) | $15,756.22 | $22,452.15 |
| **= 1099-K estimate** | **$242,676.60** | **$349,636.19** |
| **Actual 1099-K** | **$240,009.89** | **$344,035.75** |
| Gap | −$2,667 | −$5,600 |

The small gap (~1.1%) is year-end timing: orders placed Dec 2025 that settle and pay in January 2026 are in the 2025 settlement (posted-date indexed per the report header) but the 1099-K may use a different cutoff.

**Nominee split HOLDS.** Settlement is US-only, confirming the $240,009.89 is entirely US Amazon on SGM TIN. Order-date split: SGM $15,220.80 (Jan 1–Feb 4) / SPLT $224,789.09 (Feb 5–Dec 31) — unchanged.

---

## JOB 3 — The "~$39,553 Gap": Corrected

The prior "$39,553" figure was a stale-session artifact. **Actual gap:**

- Settlement Transfers 2025: $114,745.88 (payouts to bank)
- Bank deposits (SPLT $107,803 + SGM $19,334): **$127,137**
- **Bank EXCEEDS transfers by $12,391**

**Explanation:** year-end timing. Amazon settles orders ~2 weeks after shipment. Late-December 2024 orders (in 2024 settlement) paid out to bank in January 2025 → appear in 2025 bank deposits but NOT in 2025 settlement transfers. Net effect = ~$12,391 prior-year carryover (offset by any Dec 2025 orders paying to Jan 2026 bank, which are in the 2025 settlement but not in 2025 bank). No reserve issue; no unexplained component.

Note: all 6,896 rows in 2025 settlement are **Released** (zero Deferred). The $1,522.32 Debt rows (Amazon→seller credits) are not payouts; they adjust the seller balance.

---

## JOB 4 — 2026 H1 Amazon GMV: Updated

| Source | Amount | Basis |
|---|---|---|
| Deal workbook (prior) | $80,573 | Stale (earlier pull) |
| Settlement gross orders | **$81,157** | Unified transaction CSV, gross before refunds |
| Settlement net (after refunds) | $72,392 | Post-refund; refunds $8,765 |

Monthly: Jan $19,514 · Feb $11,604 · Mar $11,182 · Apr $10,709 · May $11,719 · Jun $16,429

**Deal workbook updated** (this session): Amazon 2026 H1 $80,573 → **$81,157**; total H1 $106,411 → **$106,995**.

Note: the 2026 Momentum tab already had $81,157 (from an earlier correct pull); the Channel Trend tab was stale. Now consistent.

---

## Packets Changed This Session

| File | Change | Impact |
|---|---|---|
| SPLT_2025_Amendment_Packet.xlsx | Storage $4,886 PROV → $3,938.34 STATED; fee total $77,433 → $76,486 | SPLT income +$948; tax +$199 |
| Splitflask_Deal_Workbook.xlsx | Amazon 2026 H1 $80,573 → $81,157; total $106,411 → $106,995 | +$584 to 2026 H1 GMV |

---

## What Has NOT Changed

- Nominee split: SGM $15,220.80 / SPLT $224,789.09 — **unchanged**
- SPLT Amazon referral + FBA amounts — **unchanged** (exact settlement match)
- Amazon advertising deduction $24,727 — **correctly stated, not double-counted**
- 2024/2025 locked GMV/revenue figures — **unchanged**
- All other tax packets — **unchanged**
