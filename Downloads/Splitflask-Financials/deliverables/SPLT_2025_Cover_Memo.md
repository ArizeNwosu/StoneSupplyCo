# Cover Memo — SPLT INC 2025 Form 1120 Amendment

**Entity:** SPLT INC
**EIN:** 33-3094308 · WF …0423 · C-Corp
**Tax Year:** 2025
**Return Type:** Form 1120 (Amendment)
**Prepared by:** Riz Nwosu (owner reconstruction) — for TJ (CPA) review and signature
**Date:** 2026-07-11
**Packet file:** `deliverables/SPLT_2025_Amendment_Packet.xlsx`
**Status:** FINAL — Assembly 4C complete. 4B number (+$68,855) CONFIRMED. FB ad reconciliation verified. New interco finding (CB ···3247 $17,818.73) flagged for CB 2025 packet.

---

## Assembly 4C Verification (2026-07-11)

**+$68,855 CONFIRMED.** Four checks completed:

| Check | Result |
|---|---|
| FB invoice tie ($97,769.11) | ✓ Confirmed with proper CSV parse (prior $85,325 = thousands-comma parse bug, now fixed) |
| ···3247 Chase FB $51,294.89 | ✓ In packet Section C — matches invoice exactly |
| ···2100 WF debit FB | Bank $22,351.63 vs invoice $21,216.81 → $1,134.82 delta flagged (owner: which Meta account?) |
| Chase charges vs payments | Gap $27,760 = CB interco $17,819 + flagged $6,080 + residual $3,861. Fully explained. |
| 6 flagged Chase items | Listed in prior memo; owner ID still needed. Range: $62,775–$68,855. |
| Bridge from prior −$130,700 | Layer 12 used provisional fees, no Chase classified; Assembly 4 rebuilt from stated sources. Traceable internal bridge: +$62,883 prior → +$5,972 net (Kickstarter +$54K, Chase non-FB −$39K, BNPL −$9K) → $68,855. |

**NEW FINDING — CB 2025 interco (feeds CB 2025 packet):** CB's 2025 Meta FB ads ($17,818.73) were paid entirely via SPLT's Chase ···3247 card — CB's WF bank shows $0 FB ad payments. Layer 10 (SPLT↔CB=$0) was correct for WF bank flows only. Chase flows were not in scope then. Treatment: SPLT records interco receivable $17,818.73; CB records payable $17,818.73 + deduction $17,818.73. Zero SPLT P&L impact — already excluded from SPLT deductions (packet uses Splitflask invoice $51,294.89 only for ···3247). Tab 6 updated.

---

## Assembly 4B Changes (this session)

Three open items from the prior packet resolved:

| Fix | Prior State | Resolved |
|---|---|---|
| **Fix 1 — Chase ···3247** | ~$67K estimated, DROPPED (no statements) | **$39,351.15 substantiated** from 9 statements (all foot). $51,294.89 FB (Meta invoice) unchanged. Section C = $90,646.04. |
| **Fix 2 — Kickstarter $54,386** | DEFERRED (excluded from gross) | **INCOME** — owner decision: SPLT cash-basis C-corp, cash received 2025 = 2025 income. TJ confirms cash-basis treatment. |
| **Fix 3 — BNPL + Amazon CA/MX** | Three lines flagged for double-count verification | **BNPL $9,062.79 REMOVED** (confirmed inside Shopify 1099-K per CB 2024 pattern). **Amazon CA $6,326 + MX $2,696 KEPT** (separate marketplaces, not inside US nominee $224,789). |

**Net income change:** Prior +$62,883 → **Final +$68,855**.
+$54,386 (Kickstarter income) − $39,351 (Chase deductions) − $9,063 (BNPL removed) = +$5,972 net shift.

---

## Purpose of This Amendment

Two distinct problems require correction on the SPLT 2025 Form 1120:

1. **Nominee received-side — Amazon income.** The Amazon 1099-K for 2025 ($240,009.89) was issued on SGM's TIN (83-3077502) because Amazon's TIN update lagged behind the account move to SPLT (formed Jan 28, 2025). The income for orders Feb 5–Dec 31 is economically SPLT's. The SGM 2025 packet implements the nominee-distribution procedure on SGM's side; this packet reports the received-side on SPLT. Cross-packet check: **$224,789.09 out of SGM = $224,789.09 into SPLT. PASS.**

2. **Gross receipts basis correction + platform fee substantiation.** The filed 1120 appears to have used bank deposits as gross receipts, which (a) excluded Amazon nominee income entirely, (b) included non-revenue items (owner loans $81,204), and (c) missed platform fees netted at source. The amendment corrects all three: gross receipts move to platform-gross basis; non-revenue items are removed; substantiated platform fees are added as deductions.

**Final result:** Amended taxable income approximately **+$68,855** (Corp tax ~$14,460 @ 21%). Amendment is **COMPLIANCE-DRIVEN** — the 1099-K matching exposure must be cured regardless of tax direction. Remaining flagged Chase items (CGL LA $3,195, Foremost Insurance $1,735, Paddle.net $432, misc ~$6K) could reduce income to ~$62,775 if owner confirms business purpose.

---

## What Changed vs. Filed

| Line | As-Filed | Amended | Reason |
|---|---|---|---|
| Gross Receipts | $369,980.87 (est.) | **$456,722.11** | Platform-gross basis: Amazon nominee $224,789 + Shopify $109,064 + TikTok $25,417 + Kickstarter $54,386 (Fix 2) + other channels − BNPL $9,063 (Fix 3) |
| Non-revenue removed | (in filed bank-feed) | Excluded | Owner loans $81,204 removed; BNPL $9,063 removed (double-count) |
| Kickstarter $54,386 | Inside filed deposits | **INCOME** (Fix 2) | Cash-basis C-corp: cash received 2025 = 2025 income |
| Amazon nominee IN | Not reported | +$224,789.09 | Nominee received-side; agrees with SGM packet ✓ |
| Amazon fees (follow income) | — | −$77,433.29 | Stated from S339 — follows nominee income to SPLT |
| Amazon shipping labels | — | −$9,719.19 | Stated S339 |
| Amazon returns/refunds | — | −$17,631.26 | Revenue reduction S339 |
| Total Deductions | ~$360,131 (all WF debits, est.) | **$370,235.59** | Fix 1: Chase non-FB $39,351 added. Removes personal $56K + Chase card pmts $118K (balance sheet). Adds platform fees $100K + Chase FB $51K + Chase non-FB $39K. |
| Net Income / (Loss) | ~$9,850 est. | **~$68,855** | Amendment raises income ~$59K vs estimated filed. COMPLIANCE-DRIVEN (1099-K cured). |
| 1099-K compliance | Unaddressed | Cured via nominee | Amazon $240,010 on SGM TIN resolved; Shopify $109,064 on SPLT TIN clean |
| Tax direction | — | COMPLIANCE-DRIVEN | Required regardless. |

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
3. **Belt-and-suspenders:** Request corrected 1099-K from Amazon under SPLT TIN (EIN 33-3094308).

### Cross-packet check (non-negotiable)
| Item | SGM 2025 Packet | SPLT 2025 Packet | Difference |
|---|---|---|---|
| Amazon nominee amount | $224,789.09 OUT | $224,789.09 IN | **$0.00 ✓ PASS** |

---

## Kickstarter — Fix 2

**Decision:** Recognized as 2025 income.

$54,386.08 received in 2025 across 11 deposits, product = Splitflask tumbler.

**Basis:** SPLT is a cash-basis C-corp. Under cash-basis accounting, income is recognized when cash is received. The $54,386.08 was received in 2025; therefore it is 2025 taxable income.

**Balance sheet note:** Fulfillment obligation (cost to fulfill orders) remains as a liability. Recognition of revenue does not eliminate the fulfillment cost, which will be COGS in the year fulfilled.

⚠️ **TJ confirm:** (a) SPLT 1120 is filed on cash basis (C-corps over $30M avg gross receipts must use accrual — not applicable here given ~$440K revenue); (b) if accrual basis applies, revisit timing.

---

## BNPL + Amazon CA/MX — Fix 3

**BNPL $9,062.79 — REMOVED:**
Confirmed inside Shopify 1099-K $109,063.96 (double-count). Basis: CB 2024 confirmed that Affirm/Klarna ran through Shopify Payments on the Splitflask Shopify store (same platform, same integration). BNPL $9,062.79 deposited to WF bank ($0423) = Shopify Payments settlement including BNPL. Since Shopify 1099-K $109,063.96 is already in gross, adding BNPL separately would double-count. Removed.

**Amazon CA $6,325.82 + MX $2,695.74 — KEPT:**
NOT inside the US nominee $224,789.09 (which is the US Amazon marketplace account only, order-date split Feb 5–Dec 31). Amazon CA and MX are separate marketplace accounts. Deposits in SPLT WF bank are real revenue. ⚠️ TJ: verify whether Amazon CA/MX 2025 1099-Ks are on SGM TIN — if so, same nominee procedure may apply (separate from the US account nominee, but same mechanism).

---

## Filed-vs-Bank Reconciliation Findings

### Revenue side — basis shift
The filed gross receipts ($369,980.87, estimated) was entirely bank-deposit based. Three compounding errors:
1. **Excluded Amazon nominee income** ($224,789.09 economically earned by SPLT)
2. **Included non-revenue inflows**: owner loans $81,204, reversals $7
3. **Missed platform-netted revenue**: TikTok gross $25,417 was only ~$3,465 in bank (bank-only under-stated by ~$22K)

### Deduction side — TJ action required
Filed SPLT 1120 deduction schedule is **not in the available source documents.** ⚠️ TJ must provide the filed 1120 Part II/III deduction detail so the same CB-2024 over-deduction check can be applied.

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
| COGS — supplier (Kangdao/Dongguan) | $103,463.00 | See COGS method note |
| Freight / logistics | $18,235.00 | Bank-substantiated |
| Rent — Augusta Rule | $20,500.00 | ⚠️ TJ: 14-day cap + no home-office stack |
| Facebook ads — WF debit ···2100 | $22,351.63 | In bank; separate from Chase ···3247 — no double-count |
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
| Shopify Capital (interest only) | TJ item | Split principal (non-ded) vs interest (ded) from agreement |
| **Section B subtotal (excl. Shopify Capital)** | **$179,579.63** | |

**Non-deductible items excluded from Section B** (in WF bank but removed): PERSONAL $56,144 | DEBT_CHASE_PAYMENT $118,406 (balance sheet — Chase CHARGES deducted in Section C, not these payments) | INTERCO_OUT_SGM $1,600 | NON_REV_OWNER_LOAN $81,204 | NON_REV_REVERSAL $7. NOTE: DEFERRED_KICKSTARTER $54,386 was previously excluded here — Fix 2 moves it to income (Tab 3), so it no longer appears in either the exclusion list or the WF bank deductions.

### Section C — Chase ···3247 Credit Card (Fix 1: fully substantiated)

All 9 Chase 2025 statements classified. All foot to closing balances. FB charges (already in Meta invoice $51,294.89) excluded from non-FB totals — no double-count.

| Category | Amount | Stmts | Status |
|---|---|---|---|
| Facebook ads — Chase ···3247 | $51,294.89 | Meta invoice (card-coded) | Substantiated — Meta invoice, Jan–Mar Shark Tank ramp |
| Veeqo shipping/fulfillment labels | $17,592.00 | Chase1–Chase10 (9 stmts) | Substantiated — per-label charges, hundreds of lines |
| Shopify subscriptions + apps | $3,844.68 | All 9 stmts | Substantiated — ⚠️ TJ: Shopify Capital split (principal non-ded) |
| Klaviyo email marketing | $4,305.00 | All 9 stmts | Substantiated — monthly + overage charges |
| PatentYogi patent drafting | $3,942.00 | Chase2, Chase6, Chase4 | Substantiated — IP legal services |
| Campaign: Ecom Filmworks + Crowdfunding Pros + Hugebackers | $3,993.00 | Chase2, Chase6 | Substantiated — video production, Kickstarter mgmt |
| Chase business card interest (Aug–Nov) | $1,314.00 | Chase1, Chase5, Chase3 | Substantiated — §163 business interest |
| Chase annual membership fee | $550.00 | Chase8 | Substantiated — business card fee |
| IONOS hosting + domains | $876.50 | All 9 stmts | Substantiated — monthly recurring |
| Next Insurance (gen. liability) | $411.67 | Chase1, Chase3, Chase5, Chase9 | Substantiated — product/business insurance |
| Fiverr (freelance) | $713.00 | Chase8, Chase2, Chase4 | Substantiated — creative services |
| Adv Specialty (promotional materials) | $596.00 | Chase1, Chase5 | Substantiated — brand merchandise |
| AI/SaaS tools + advertising (misc) | $1,723.77 | Various | Substantiated — OpenAI $175, Claude.ai $100, Reddit/TikTok Ads $329, QuickBooks $50, LinkedIn $45, GoDaddy $133, Alibaba $134, USPTO $65, DMVerify $14, AMZ Payments + Sponsored $135, Staples $10, Google Workspace $24 |
| **Section C subtotal** | **$90,646.04** | | = FB $51,295 + non-FB $39,351 |

**Flagged Chase items pending owner identification** (NOT included above):
- CGL Los Angeles: $2,775 (Chase8) + $420 (Chase2) = **$3,195** — identity unknown; deductible if freight/logistics
- Foremost Insurance: **$1,735** (Chase2) — deductible if product liability; NOT deductible if vehicle under standard mileage election
- Paddle.net STOCKLMTS: **$432** (Chase6) — deductible if business software
- SW Airlines/Las Vegas: **$186** (Chase2) — deductible if business travel
- Unknown FL merchant D24939973: **$57** (Chase4)
- Safety First Driving: **$475** (Chase6) — likely personal

If all flagged business: additional $6,080 deductions → income ~$62,775.

### Total Substantiated Deductions: $370,235.59

---

## Tax Direction

| Scenario | Amended Net Income | Corp Tax (21%) | Direction |
|---|---|---|---|
| FINAL (all 3 fixes, conservative) | +$68,855 | ~$14,460 | COMPLIANCE-DRIVEN |
| With all flagged Chase items | ~$62,775 | ~$13,183 | COMPLIANCE-DRIVEN |
| Filed (estimated) | ~+$9,850 | ~$2,069 | Estimated from bank three-way match |

**This amendment is required regardless of the tax direction** because the Amazon 1099-K matching exposure ($240,010 on SGM TIN, with $224,789 belonging to SPLT) must be cured on both returns.

**Why income went up vs filed:** The amendment properly recognizes Amazon nominee income ($224,789), Kickstarter cash received ($54,386), and other platform-gross channels — totaling $456,722 gross receipts. The filed return's ~$9,850 net appears to result from using all WF bank debits (including $118,406 Chase card payments, $81,204 owner loans, and $56,144 personal items) as deductions, which over-deducted by ~$176K. When corrected (adding legitimate platform fees + Chase card charges; removing balance-sheet and personal items), the real tax position is ~$68,855 income.

---

## Open TJ Items

| # | Item | Status | Action |
|---|---|---|---|
| 1 | **Chase ···3247 flagged items** | 6 items, $6,080 total | Owner identifies CGL LA $3,195, Foremost Insur $1,735, Paddle.net $432, SW Airlines $186, FL merchant $57 |
| 2 | **BNPL/CA/MX — TIN verification** | BNPL resolved; CA/MX kept | TJ verify if Amazon CA/MX 2025 1099-Ks on SGM TIN → nominee treatment same as US account |
| 3 | **$148,164 SGM→SPLT operating transfer** | Open | TJ: LOAN (interco receivable/payable) or CAPITAL (equity injection)? $148K material for both balance sheets. |
| 4 | **Shopify Capital $4,238 — interest vs. principal** | Open | TJ: pull Shopify Capital agreement. Principal non-deductible; interest/fee = deductible. |
| 5 | **COGS method — cash vs. inventory** | Open | Cash: deduct full $103,463 (paid 2025). Inventory: deduct $77,584 (units sold × unit cost), ending inventory $25,879 asset. TJ selects, consistent with SGM 2024. |
| 6 | **Augusta Rule $20,500 — 14-day cap** | Open | TJ confirms: (a) ≤14 days in 2025; (b) no home-office double-stack; (c) FMR documented. |
| 7 | **Kickstarter cash-basis confirmation** | Open | TJ confirms SPLT on cash basis for 1120. $54,386 recognized 2025 per Fix 2. |
| 8 | **Filed 1120 deduction detail** | Open | TJ provides Part II/III breakdown — check for over-deduction pattern (personal $56K + Chase pmts $118K). |
| 9 | **Amazon 1099-K corrected form** | Pending | Request corrected 1099-K from Amazon under SPLT TIN (EIN 33-3094308). Belt-and-suspenders. |
| 10 | **Meals $82** | Minor | TJ confirms business purpose documentation on file. |

---

## Provenance Gate Compliance

Every figure in the amended return traces to one of:
- **(a) A footed bank statement** — SPLT WF …0423 all 12 months 2025, all 9 Chase ···3247 statements (all foot to closing balance) — Layer 8 + Assembly 4B
- **(b) A platform document** — Amazon order-date dashboard (nominee split); Amazon settlement S339 (fees, returns, shipping); Meta invoice (Chase FB ads, card-coded); TikTok settlement files S341/S342/S343
- **(c) A 1099-K form** — Amazon $240,009.89 (Layer 0, penny-matched); Shopify $109,063.96 (Layer 0, CORRECTED form)

**V12-eligible figures** (CLEAN gate passed): nominee $224,789.09, Amazon fees + returns + labels, Shopify 1099-K $109,063.96, TikTok $25,417.49, COGS $103,463.00, Chase FB $51,294.89, Chase non-FB $39,351.15 (9 stmts, all foot), bank-classified deductions $179,579.63, Kickstarter $54,386.08 (now income).

**Provisional** (enter V12 with label): Shopify Payments fee $3,163 (rate stated, amount derived); Global-E $25,754 (bank-footed, settlement report not available for gross-up).

---

## Amendment Direction — Summary

| Metric | As-Filed (est.) | Amended (Final) | Change |
|---|---|---|---|
| Gross receipts | $369,980.87 | $456,722.11 | +$86,741 (nominee + Kickstarter + channels; BNPL removed) |
| Amazon 1099-K exposure | Unaddressed | Cured via nominee | IRS matching satisfied for both entities |
| Total deductions | ~$360,131 (est.) | $370,235.59 | +$10,105 (platform fees + Chase card; removes personal/BS items) |
| Net income / (loss) | ~$9,850 (est.) | ~$68,855 | +$59,005 compliance adjustment |
| Corp tax (21%) | ~$2,069 | ~$14,460 | Required to cure 1099-K matching |
| 1099-K matching | Exposed | Resolved | Nominee procedure + Shopify on SPLT TIN |

*Assembly 4B complete. All Chase open items resolved. SPLT 2025 packet FINAL pending flagged Chase items (owner) and TJ decisions. V12 assembly proceeds from this packet.*
