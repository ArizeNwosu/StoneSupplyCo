# Cover Memo — SPLT INC 2025 Form 1120 Amendment

**Entity:** SPLT INC
**EIN:** 33-3094308 · WF …0423 · C-Corp
**Tax Year:** 2025
**Return Type:** Form 1120 (Amendment)
**Prepared by:** Riz Nwosu (owner reconstruction) — for TJ (CPA) review and signature
**Date:** 2026-07-11
**Packet file:** `deliverables/SPLT_2025_Amendment_Packet.xlsx`
**Status:** PROVISIONAL — Chase $67K unsubstantiated; filed 1120 deduction detail not yet obtained from TJ

---

## Purpose of This Amendment

Two distinct problems require correction on the SPLT 2025 Form 1120:

1. **Nominee received-side — Amazon income.** The Amazon 1099-K for 2025 ($240,009.89) was issued on SGM's TIN (83-3077502) because Amazon's TIN update lagged behind the account move to SPLT (formed Jan 28, 2025). The income for orders Feb 5–Dec 31 is economically SPLT's. The SGM 2025 packet implements the nominee-distribution procedure on SGM's side; this packet reports the received-side on SPLT. The two packets must agree to the penny — they do: $224,789.09 out of SGM = $224,789.09 into SPLT. Cross-packet check: **PASS**.

2. **Gross receipts basis correction + platform fee substantiation.** The filed 1120 appears to have used bank deposits as gross receipts, which (a) excluded Amazon nominee income entirely, (b) included non-revenue items (owner loans $81,204, Kickstarter $54,386, reversals), and (c) missed platform fees netted at source before bank disbursement. The amendment corrects all three: gross receipts move to platform-gross basis; non-revenue items are removed; substantiated platform fees are added as deductions.

**Current result:** Amended taxable income approximately **+$62,883** (before Chase $67K substantiation). This is higher than the estimated filed figure (~$9,850 based on bank three-way match). The amendment is **COMPLIANCE-DRIVEN** — the 1099-K matching exposure must be cured regardless of tax direction. If Chase ···3247 business expenses (~$67K) are substantiated from card statements, amended income flips to approximately **−$4,228** (small loss — favorable direction). Chase substantiation is the key open item.

---

## What Changed vs. Filed

| Line | As-Filed | Amended | Reason |
|---|---|---|---|
| Gross Receipts | $369,980.87 (est.) | $411,398.82 | Filed = bank deposits (incl. non-revenue). Amended = platform-gross: Amazon nominee $224,789 + Shopify 1099-K $109,064 + TikTok $25,417 + other channels |
| Non-revenue removed | (in filed bank-feed) | Excluded | Owner loans $81,204 + Kickstarter $54,386 EXCLUDED — not income |
| Kickstarter $54,386 | Inside filed deposits | DEFERRED (excluded) | Unfulfilled as of 12/31/25 — deferred revenue liability |
| Amazon nominee IN | Not reported | +$224,789.09 | Nominee received-side; agrees with SGM packet nominee-out ✓ |
| Amazon fees (follow income) | — | −$77,433.29 | Stated from S339 — follows nominee income to SPLT |
| Amazon shipping labels | — | −$9,719.19 | Stated S339 |
| Amazon returns/refunds | — | −$17,631.26 | Revenue reduction S339 |
| Total Deductions | ~$360,131 (all WF debits, est.) | $330,884.44 | Removes personal $56K + Chase card pmts $118K (balance sheet) + interco $1.6K; adds platform fees $100K + Chase FB ads $51K |
| Net Income / (Loss) | ~$9,850 est. | ~$62,883 | ⚠️ Amendment currently raises income ~$53K vs estimated filed. Chase $67K → breakeven/loss. |
| 1099-K compliance | Unaddressed | Cured via nominee | Amazon $240,010 on SGM TIN resolved; Shopify $109,064 on SPLT TIN clean |
| Tax direction | — | COMPLIANCE-DRIVEN | Required regardless. Chase $67K = path to favorable outcome. |

---

## Nominee Received-Side — Mechanics for TJ

### Background
SPLT INC was formed Jan 28, 2025. The Amazon selling account moved to SPLT at formation, but Amazon's TIN update lagged. The 2025 Amazon 1099-K ($240,009.89) was issued on SGM TIN (83-3077502). The SGM 2025 amendment packet addresses the nominee-out side. This packet addresses the received-side.

**The split (LOCKED, Layer 7):**
- SGM keeps Amazon earned Jan 1–Feb 4: **$15,220.80** (295 orders / 302 units, Amazon order-date dashboard)
- Nominee to SPLT Feb 5–Dec 31: **$224,789.09** = $240,009.89 − $15,220.80
- SPLT bank confirmation: $224,281.65 landed in WF …0423 (~$507 timing difference from settlement lag) ✓

### Steps TJ must take (received-side)
1. **On SPLT 1120:** Report $224,789.09 as gross income on Line 1. Source = nominee 1099 issued by SGM (EIN 83-3077502) to SPLT (EIN 33-3094308).
2. **Amazon fees follow income to SPLT:** Deduct Amazon fees on the nominee portion ($77,433.29: referral + FBA + advertising + storage) on SPLT's return. SGM deducts only its Jan 1–Feb 4 slice ($7,071).
3. **Belt-and-suspenders:** Request corrected 1099-K from Amazon under SPLT TIN (EIN 33-3094308). Does not change the nominee filing approach but closes the paper trail.

### Cross-packet check (non-negotiable — must pass before filing either return)
| Item | SGM 2025 Packet | SPLT 2025 Packet | Difference |
|---|---|---|---|
| Amazon nominee amount | $224,789.09 OUT | $224,789.09 IN | **$0.00 ✓ PASS** |

---

## Kickstarter Deferred Revenue

$54,386.08 received in 2025 across 11 deposits, product = Splitflask tumbler. As of 12/31/25, the product was not fulfilled. Treatment:

- **Excluded from 2025 gross receipts** — unearned as of year-end
- Recorded as **deferred revenue / fulfillment liability** on SPLT's balance sheet
- When fulfilled: recognized as revenue in the year of fulfillment
- ⚠️ **TJ — cash-basis question:** Cash-basis C-corps may need to recognize cash received in the year of receipt regardless of fulfillment. TJ determines whether SPLT's 1120 uses cash vs accrual basis and applies accordingly. If cash-basis, $54,386 may be 2025 income.

---

## Filed-vs-Bank Reconciliation Findings

### Revenue side — basis shift
The filed gross receipts ($369,980.87, estimated) was entirely bank-deposit based. This created three compounding errors:
1. **Excluded Amazon nominee income** ($224,789.09 economically earned by SPLT but not in the bank-feed reconciliation the way the filed return treated it)
2. **Included non-revenue inflows**: owner loans $81,204, Kickstarter $54,386 (deferred), reversals $7
3. **Missed platform-netted revenue**: TikTok gross $25,417 was only ~$3,465 in bank (heavy seller fees netted at source; bank-only basis under-stated TikTok by ~$22K)

### Deduction side — TJ action required
Unlike the CB 2024 amendment (where a QuickBooks P&L provided the filed deduction breakdown), the filed SPLT 1120 deduction schedule is **not in the available source documents this session.**

**⚠️ TJ must provide the filed 1120 Part II/III deduction detail** so we can apply the same discipline used for CB 2024 (which found $104K of unsubstantiated deductions). Specific risks to check:
- Did the filed return deduct WF bank debits that include personal expenses ($56,144), Chase card payments ($118,406 — balance sheet, not a deduction), or intercompany transfers ($1,600)?
- If so, the filed return over-deducted — and the amendment corrects that while simultaneously adding legitimate platform fees and Chase FB ads.
- The estimated filed net ~$9,850 (= WF bank closing balance) is consistent with a bank-all-debits approach, which would carry this over-deduction pattern.

---

## Deductions in the Amended Return

### Section A — Platform Fees (netted at source, not in WF bank)

| Deduction | Amount | Status |
|---|---|---|
| Amazon referral fee (Feb 5–Dec 31) | $28,074.41 | Substantiated — S339 stated |
| Amazon FBA fulfillment fee | $19,746.32 | Substantiated — S339 stated |
| Amazon advertising (Cost of Advertising) | $24,726.56 | Substantiated — S339 stated |
| Amazon FBA storage (proportional, SPLT period) | $4,886.00 | Provisional — proportional allocation |
| Amazon shipping labels | $9,719.19 | Substantiated — S339 stated |
| Shopify Payments fee (2.9% × $109,064) | $3,163.00 | Provisional — rate stated, amount derived |
| TikTok platform costs (fees + shipping) | $9,694.44 | Substantiated — S341/S342/S343 stated |
| **Section A subtotal** | **$100,009.92** | |

### Section B — WF Bank (all 12 months footed, closing balance $9,850.39)

| Deduction | Amount | Notes |
|---|---|---|
| COGS — supplier (Kangdao/Dongguan) | $103,463.00 | See COGS method note below |
| Freight / logistics | $18,235.00 | Bank-substantiated |
| Rent — Augusta Rule | $20,500.00 | ⚠️ TJ: 14-day cap + no home-office stack |
| Facebook ads — WF debit ···2100 | $22,351.63 | In bank; separate from Chase ···3247 |
| Google ads | $497.77 | Bank-substantiated |
| Contractor / freelance | $2,035.47 | Bank-substantiated |
| Legal / patent | $2,538.00 | Bank-substantiated |
| Platform fees / SaaS subscriptions | $3,591.37 | Bank-substantiated |
| Shipping (non-freight) | $364.06 | Bank-substantiated |
| Software | $2,002.15 | Bank-substantiated |
| Supplies | $2,364.67 | Bank-substantiated |
| Travel | $494.24 | Business purpose docs required |
| Other operating | $388.49 | Bank-substantiated |
| Bank fees | $498.78 | Bank-substantiated |
| Meals (50% of $163.30) | $81.65 | Applied 50% haircut |
| State / franchise taxes | $255.00 | Bank-substantiated |
| Shopify Capital (interest only) | TJ item | Split principal (non-ded) vs interest (ded) |
| **Section B subtotal (excl. Shopify Capital)** | **$179,579.63** | |

**Non-deductible items excluded from Section B** (in WF bank but removed): PERSONAL $56,144 | DEBT_CHASE_PAYMENT $118,406 (balance sheet — Chase CHARGES deducted in Section C, not these payments) | INTERCO_OUT_SGM $1,600 | DEFERRED_KICKSTARTER $54,386 | NON_REV_OWNER_LOAN $81,204 | NON_REV_REVERSAL $7.

### Section C — Chase ···3247 Credit Card

| Deduction | Amount | Notes |
|---|---|---|
| Facebook ads — Chase ···3247 | $51,294.89 | Substantiated — Meta invoice, card-coded. Jan–Mar 2025 (Shark Tank airing). No double-count with WF debit ···2100. |
| Chase ···3247 non-FB charges | **DROPPED** | ⚠️ ~$67K estimated residual — UNSUBSTANTIATED. Cannot deduct without Chase 2025 card statements. Pull Chase 2025. |
| **Section C subtotal (substantiated)** | **$51,294.89** | |

### Total Substantiated Deductions: $330,884.44

---

## Tax Direction

| Scenario | Amended Net Income | Direction |
|---|---|---|
| Current (Chase $67K dropped) | +$62,883 | COMPLIANCE-DRIVEN (income higher than filed est.) |
| If Chase $67K substantiated | ~−$4,228 | Favorable (small loss) |
| Filed (estimated) | ~+$9,850 | Estimated from bank three-way match |

**This amendment is required regardless of the tax direction** because the Amazon 1099-K matching exposure ($240,010 on SGM TIN, with $224,789 belonging to SPLT) must be cured on both returns. The nominee procedure and the gross-receipts basis correction are both legally correct treatments, not elective adjustments.

**Chase $67K is the single most important unresolved item.** If the Chase 2025 card statements show ~$67K+ of legitimate SPLT business expenses, the amendment becomes favorable. Without them, the amendment increases taxable income by approximately $53K above the estimated filed figure.

---

## Open TJ Items

| # | Item | Decision / Action Required |
|---|---|---|
| 1 | **Chase 2025 card statements (···3247)** | CRITICAL. Pull Chase 2025 statements for SPLT card ···3247. Every charge needs business-vs-personal classification. Potentially $67K+ of substantiated deductions — difference between +$62,883 and −$4,228. |
| 2 | **BNPL $9,063 + Amazon CA $6,326 + Amazon MX $2,696 — double-count verify** | If BNPL ran through Shopify Payments → inside Shopify 1099-K $109,064 → remove from gross. If Amazon CA/MX are inside the $240,010 SGM Amazon 1099-K / nominee computation → already counted → remove from gross. Minimum gross if all overlap: $393,315. |
| 3 | **$148,164 SGM→SPLT operating transfer — loan vs. capital** | TJ classifies as LOAN (interco receivable SGM / payable SPLT) or CAPITAL (equity injection, affects equity + possible SGM distribution implications). $148K is material — different balance-sheet presentation for both entities. |
| 4 | **Shopify Capital $4,238 — extract interest vs. principal** | Total DEBT_SHOPIFY_CAPITAL repayments $4,237.64. Split: principal = non-deductible; interest/financing cost = deductible. TJ: pull Shopify Capital loan agreement to state the deductible interest/fee amount. |
| 5 | **COGS method — cash vs. inventory/accrual** | Cash method: deduct full $103,463 supplier payments (paid 2025). Inventory method: deduct $77,584 (11,244 units × $6.897), ending inventory asset $25,879. TJ selects method, consistent with SGM 2024. |
| 6 | **Augusta Rule rent $20,500 — 14-day cap** | Bank-substantiated. TJ confirms: (a) annual usage ≤ 14 days in 2025; (b) no home-office deduction double-stack; (c) fair market rate documented. Disallow if cap exceeded. |
| 7 | **Meals 50% haircut** | Applied: $163.30 × 50% = $81.65 deductible. TJ confirms business purpose documentation on file. |
| 8 | **Filed 1120 deduction detail** | TJ provides Part II/III deduction breakdown from the filed SPLT 2025 1120 so filed-vs-bank over-deduction check (CB-2024 pattern) can be completed. Without this, we cannot confirm whether filed return over-deducted. |
| 9 | **Corrected Amazon 1099-K from Amazon** | Request corrected 1099-K from Amazon under SPLT TIN (EIN 33-3094308) as belt-and-suspenders. Does not change nominee filing treatment but reduces future inquiry risk. |
| 10 | **Kickstarter $54,386 — cash vs. accrual tax treatment** | If SPLT 1120 is filed on cash basis, $54,386 received in 2025 may be 2025 income despite non-fulfillment. TJ determines accounting method and applies consistently. |

---

## Provenance Gate Compliance

Every figure in the amended return traces to one of:
- **(a) A footed bank statement** — SPLT WF …0423 all 12 months 2025, Layer 8 (916 rows, closing balance $9,850.39 footed — three-way match confirmed)
- **(b) A platform document** — Amazon order-date dashboard (nominee split); Amazon settlement S339 (fees, returns, shipping); Meta invoice (Chase FB ads); TikTok settlement files S341/S342/S343
- **(c) A 1099-K form** — Amazon $240,009.89 (Layer 0, penny-matched); Shopify $109,063.96 (Layer 0, CORRECTED form)

**V12-eligible figures** (CLEAN gate passed): nominee $224,789.09, Amazon fees $77,433.29 + $9,719.19 + $17,631.26, Shopify 1099-K $109,063.96, TikTok $25,417.49, COGS $103,463.00, Chase FB $51,294.89, bank-classified deductions $179,579.63.

**Provisional** (enter V12 with label): Shopify Payments fee $3,163.00 (rate stated, amount derived); Global-E + bank-channel revenue $48,507 (bank-footed but double-count risk on BNPL/Amazon CA/MX).

**BLOCKED from V12**: Chase ···3247 non-FB charges (~$67K) — residual estimate, no card statements.

---

## Amendment Direction — Summary

| Metric | As-Filed (est.) | Amended | Change |
|---|---|---|---|
| Gross receipts | $369,980.87 | $411,398.82 | +$41,418 (Amazon nominee added; non-revenue removed) |
| Amazon 1099-K exposure | Unaddressed | Cured via nominee | IRS matching satisfied for both entities |
| Total deductions | ~$360,131 (est.) | $330,884.44 | Lower: removes personal/balance-sheet items; adds platform fees + Chase FB ads |
| Net income / (loss) | ~$9,850 (est.) | ~$62,883 | +$53,033 before Chase $67K |
| Chase $67K scenario | — | ~−$4,228 | If substantiated: favorable |
| Tax direction | — | **COMPLIANCE-DRIVEN** | Required for 1099-K matching cure |
| 1099-K matching | Exposed | Resolved | Nominee procedure + Shopify on SPLT TIN |

*This completes the 2025 entity-year packet set. All entity-year amendment packets are now built: SGM 2024, CB 2024, SGM 2025, SPLT 2025. CB 2025 follows the same structure. V12 assembly proceeds from these packets once TJ open items are resolved.*
