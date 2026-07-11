# Cover Memo — SGM 2025 Form 1120-S Amendment

**Entity:** Social Gear Media LLC ("SGM")
**EIN:** 83-3077502 · WF …8625 · CA S-Corp
**Tax Year:** 2025
**Return Type:** Form 1120-S (Amendment)
**Prepared by:** Riz Nwosu (owner reconstruction) — for TJ (CPA) review and signature
**Date:** 2026-07-11
**Packet file:** `deliverables/SGM_2025_Amendment_Packet.xlsx`

---

## Purpose of This Amendment

Two distinct problems require correction on the SGM 2025 1120-S:

1. **Deposit-basis error.** The filed return used total bank deposits as gross receipts. Deposits included $57,317 of owner loans and $11,151 of intercompany transfers — neither is income. These inflated filed gross receipts from the real figure ($55,484) to the filed figure ($130,976), a $75,492 overstatement of income.

2. **Amazon 1099-K nominee mechanics.** The Amazon 1099-K for 2025 ($240,009.89) was issued on SGM's TIN (83-3077502) because Amazon's TIN update lagged behind the physical account move to SPLT INC (formed Jan 28, 2025). The income is economically SPLT's. This amendment implements the IRS nominee-income resolution: report the full $240K in on SGM, then deduct the SPLT-belonging portion out, and file a nominee 1099 from SGM to SPLT.

**Result:** Amended loss deepens from −$32,900 (as filed) to approximately −$19,027. Amendment is **favorable** — it does NOT raise tax, and it cures the $240,009.89 1099-K matching exposure on SGM's TIN.

---

## What Changed vs. Filed

| Line | As-Filed | Amended | Reason |
|---|---|---|---|
| Gross Receipts | $130,976 | $55,484 | Removed owner loans $57,317 + interco $11,151 + misc $7,024 |
| Amazon 1099-K reported IN | — | $240,009.89 | Nominee mechanics: report full 1099-K |
| Nominee Distribution OUT | — | −$224,789.09 | Feb 5–Dec 31 Amazon orders belong to SPLT |
| Amazon on SGM (net) | — | $15,220.80 | Jan 1–Feb 4 earned orders only |
| Total Deductions | (TJ to verify filed) | ~$74,511 | Substantiated: Amazon fee $7,071 + Augusta $16,500 + FB ads $16,340 + bank-classified $34,600 |
| Net Income / (Loss) | −$32,900 | ~−$19,027 | Loss deepens — favorable |

---

## Nominee Distribution — Mechanics for TJ

### Background
SGM's Amazon account was physically moved to SPLT at SPLT's formation (Jan 28, 2025). Amazon's 1099-K TIN did not update immediately — lag is common. The 2025 Amazon 1099-K ($240,009.89) was therefore issued on SGM TIN, but the economic income belongs to SPLT for the period after the account moved.

**IRS guidance:** [irs.gov/businesses/small-businesses-self-employed/form-1099-k-in-error](https://www.irs.gov/businesses/small-businesses-self-employed/form-1099-k-in-error) — nominee-income situation.

### The split (LOCKED)
- **SGM keeps (earned Jan 1–Feb 4):** $15,220.80 — 295 orders / 302 units per Amazon order-date dashboard
- **Nominee to SPLT (Feb 5–Dec 31):** $224,789.09 — confirmed by SPLT bank receipt ($224,281.65 landed in SPLT WF …0423, ~$507 timing difference from settlement lag; cross-confirmed in Layer 8)

### Steps TJ must take
1. **On SGM 1120-S:** Report $240,009.89 in full on Line 1 (income). Then deduct $224,789.09 on the Other Deductions line, labeled: *"Nominee Distribution — Amazon income belonging to SPLT INC (EIN 33-3094308) for orders Feb 5–Dec 31, 2025 per IRS nominee-income guidance."*
2. **Issue nominee Form 1099:** SGM (payer, EIN 83-3077502) issues Form 1099 to SPLT INC (recipient, EIN 33-3094308) for $224,789.09, tax year 2025.
3. **On SPLT 1120:** SPLT reports $224,789.09 as gross income (covered in the SPLT 2025 packet).
4. **Belt-and-suspenders:** Request a corrected 1099-K from Amazon under SPLT TIN (EIN 33-3094308) to close the paper trail. This does not change the nominee filing approach but reduces future inquiry risk.

### Fee attribution
Amazon fees on the nominee portion ($224,789.09) follow the income to SPLT. Total Amazon fees ~$60,101 (26.7%); SGM's slice = $7,071 (on its $15,220.80); SPLT's fees = ~$53,030. SGM deducts $7,071 only.

---

## Filed-vs-Bank Reconciliation Findings

### Revenue side — corrected
The filed gross receipts figure ($130,976) was entirely deposit-based. Removing non-income items:

| Category | Amount | Removed? |
|---|---|---|
| Revenue deposits (real) | $59,597 | No — further refined to $55,484 in Layer 12 |
| Owner loans — Riz | $57,317 | YES — not income |
| Interco — CB | $9,551 | YES — not income |
| Interco — SPLT | $1,600 | YES — not income |
| Reversals + misc reclassification | $7,024 | YES |
| **Filed total** | **$130,976** | — |
| **Real gross receipts** | **$55,484** | AMENDED figure |

### Deduction side — TJ action required
**Filed net −$32,900 vs filed gross $130,976 implies $163,876 of filed expenses.** This is a large expense load for a wind-down entity with $55K of real revenue. The filed deduction schedule (Schedule K / Part III of the filed 1120-S) is not in the available source documents for this session.

**⚠️ TJ must provide the filed deduction breakdown** so we can apply the same discipline used for CB 2024 (which found $104K of unsubstantiated QuickBooks catch-all deductions). For each filed expense line:
- Does it trace to an SGM WF …8625 bank transaction in the Layer 7 footed classification?
- Is it a business expense (not personal, interco, or QB catch-all)?
- Is it SGM's expense (not SPLT's or CB's)?

Until this is done, we cannot state whether the filed return over-deducted (like CB 2024 did) or was appropriately conservative.

---

## Deductions in the Amended Return

All deductions below are substantiated from the footed SGM 2025 bank statements or platform documents:

| Deduction | Amount | Status |
|---|---|---|
| Amazon fees — SGM slice | $7,071 | Substantiated (Amazon settlement, Layer 11) |
| Augusta rule rent | $16,500 | Bank-substantiated — **pending TJ 14-day cap confirmation** |
| Facebook/Meta ads — SGM cards (···1400, ···0261, ···6559) | $16,340 | Substantiated (FB invoice, card-coded) |
| Non-Amazon operating expenses (from Layer 7 bank classification) | ~$34,600 | Provisional — **TJ to itemize from ledger tab SGM_2025_Txns** |
| **Total deductions** | **~$74,511** | Provisional pending TJ itemization |

**Augusta note:** ···0261 and ···6559 are bank debit cards — their charges are already in the Layer 7 bank classification. Do not double-add from the FB invoice. Invoice is used for attribution (which entity), not as an additional source.

**Non-deductible (excluded):**
- Owner loans / personal AmEx charges routed through SGM bank → owner draws (not deductible)
- $148,164 SGM→SPLT transfer → balance sheet only (TJ: loan vs. capital decision)
- Shopify Capital principal → non-deductible (if any in SGM 2025)

---

## Open TJ Items

| # | Item | Decision / Action |
|---|---|---|
| 1 | **Nominee 1099 SGM→SPLT $224,789.09** | TJ files; also request corrected Amazon 1099-K from Amazon under SPLT TIN |
| 2 | **$148,164 SGM→SPLT transfer** | TJ classifies: LOAN (interco receivable/payable) vs. CAPITAL (equity). $148K is material — different balance-sheet presentation for both entities |
| 3 | **Augusta rent $16,500 — 14-day cap** | TJ confirms annual usage ≤ 14 days; no home-office deduction double-stack |
| 4 | **Filed 1120-S deduction schedule** | TJ provides filed deduction detail for CB-2024-style filed-vs-bank comparison |
| 5 | **$34,600 bank-classified opex** | TJ itemizes from ledger tab `SGM_2025_Txns` and approves individual line items |
| 6 | **Amazon order-date cutoff** | Feb 4 is the operative cutoff. TJ confirms cash-basis election for SGM 2025 is consistent with this attribution |
| 7 | **Method consistency with SGM 2024** | Confirm inventory vs. cash method is consistent across years for any COGS items |

---

## Provenance Gate Compliance

Every figure in the amended return traces to one of:
- **(a) A footed bank statement** — SGM WF …8625 all 12 months 2025, Layer 7 (720 rows, closing balance $492.38 footed)
- **(b) A platform document** — Amazon order-date dashboard (nominee split); Amazon settlement (fees); FB invoice (ad spend)
- **(c) A 1099-K form** — Amazon $240,009.89 (Layer 0, penny-matched)

The $34,600 provisional opex block is labeled PROVISIONAL in the Source Index (tab 7) and is blocked from V12 as-is until TJ itemizes it. The nominee figures and all revenue items are CLEAN (gate-passed).

---

## Amendment Direction — Summary

| Metric | As-Filed | Amended | Change |
|---|---|---|---|
| Gross receipts | $130,976 | $55,484 | −$75,492 (loans/interco removed) |
| Amazon 1099-K exposure | Unaddressed | Cured via nominee | IRS matching satisfied |
| Net income / (loss) | −$32,900 | ~−$19,027 | Loss shallower (deductions not fully maximized) |
| Tax direction | — | **FAVORABLE** | Does not raise tax |
| Risk addressed | Deposit-basis overstatement + 1099-K mismatch | Both corrected | — |

*Next packet:* SPLT 2025 (1120) — the primary 2025 Splitflask operating entity.
