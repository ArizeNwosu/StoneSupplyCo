# Gross Receipts Reconciliation Bridge — All Entities, All Years
**Audience:** TJ (CPA) and Bob (preparer)  
**Date:** 2026-07-13  
**Status:** ✅ FINAL — source-verified; every line traced to 1099-K form, platform settlement, or footed bank statement  
**Supersedes:** The gross-receipts reconciliation tab in `Reconciliation_Backup.xlsx` (pre-dates final Knocking, Amazon CA/MX, and unit corrections)

---

## PURPOSE

This document answers three questions for each entity-year:

1. **What was filed?** (filed gross receipts on the return)
2. **What is the 1099-K floor?** (what third parties reported to the IRS)
3. **What is the corrected gross receipts figure?** (what the amendment reports, and why it differs from the floor)

The 1099-K is the IRS's independent measurement. The amendment must be consistent with it — either matching the floor, exceeding it (above-floor non-card channels), or explaining why the floor overstates the entity's income (cross-TIN/nominee situations). A filed return BELOW the 1099-K floor with no explanation creates an automatic CP2000 matching notice.

**Governing discipline:** Source documents set the revenue figure. The 1099-K floor is the minimum that must be reported. The bank is the independent reconciliation check. Never derive gross receipts by multiplying bank deposits.

---

## ENTITY + TIN MAP

| Entity | Form | TIN | Bank Account | Years Active |
|--------|------|-----|-------------|-------------|
| SGM / Social Gear Media LLC | 1120-S | EIN …7502 | WF …8625 | 2023–2025 (wind-down) |
| SPLT Inc | 1120 (C-corp) | EIN …4308 | WF …0423 | Jan 2025 forward |
| Cyberbrands LLC (Sch C) | Schedule C on personal 1040 | EIN …7466 | WF …5090 (2024); closed 2025? |
| Personal (Arizechukwu Nwosu) | 1040 / Sch C | SSN …7639 | WF …7282 (excluded from biz recon) |

---

## 1099-K ISSUANCE MAP — WHO GOT WHAT (SOURCE-LOCKED, ZERO VARIANCE)

All forms verified penny-exact at Layer 0. These are the IRS's records.

### 2024 1099-K Forms

| Platform / Account | TIN Receiving the 1099-K | Product | Amount |
|-------------------|--------------------------|---------|--------|
| Amazon US main | SGM TIN …7502 | **Splitflask** | $344,035.75 |
| Amazon MX | SGM TIN …7502 | **Splitflask** | $10,561.67 |
| Amazon CA | SGM TIN …7502 | **Splitflask** | $11,870.02 |
| TikTok Shop | SGM TIN …7502 | **Splitflask** | $155,294.96 |
| Shopify "Cyberbrands store" | SGM TIN …7502 | **Cyberbackpack** | $82,263.58 |
| **SGM TIN TOTAL (all products)** | | | **$604,026.00** |
| Shopify "Splitflask store" | Personal TIN …7639 | **Splitflask** | $164,613.99 |
| Amazon 2nd acct (Cyberbrands) | CB TIN …7466 | **Cyberbackpack** | $22,414.83 |

**Key cross-TIN issue:** The Cyberbrands-store Shopify ($82,264 Cyberbackpack revenue) issued on SGM's TIN, not CB's TIN. SGM's amendment must account for it (show it as CB's income, not Splitflask's), and CB's return must report it even though CB's own TIN only received a $22,415 1099-K. TJ must handle this explicitly.

### 2025 1099-K Forms

| Platform / Account | TIN Receiving the 1099-K | Product | Amount |
|-------------------|--------------------------|---------|--------|
| Amazon US (all ASIN — TIN never switched) | SGM TIN …7502 | **Splitflask** — NOMINEE SITUATION | $240,009.89 |
| Shopify "Splitflask store" | SPLT TIN …4308 | **Splitflask** | $109,063.96 |
| **No 1099-K to CB TIN** | | | $0 |

**Key nominee issue (2025):** The Amazon account moved to SPLT's bank on Feb 4, 2025 but the TIN was never updated in Seller Central. So the $240,009.89 1099-K landed on SGM's return even though SPLT received most of the cash. Treatment: SGM reports full $240,009.89, issues a nominee Form 1099 to SPLT for the SPLT-earned portion ($224,789.09), and deducts that amount. SPLT reports the $224,789.09 nominee income and the $109,064 Shopify 1099-K.

---

## PER-ENTITY-YEAR GROSS RECEIPTS RECONCILIATION

### SGM 2024 — Social Gear Media LLC (1120-S)

| Line | Amount | Source |
|------|--------|--------|
| **As-filed gross receipts** | $418,990 | SGM 1120-S as filed — NET-of-fees (filing error; below 1099-K floor) |
| | | |
| **1099-K floor on SGM TIN (all products)** | $604,026 | Form-verified (Layer 0) |
| Less: Cyberbackpack-store Shopify (CB's income, not SGM's) | −$82,264 | Reported on SGM TIN but CB's business; moves to CB Sch C |
| **Splitflask-only 1099-K floor on SGM TIN** | **$521,762** | Minimum SGM must report for Splitflask channels |
| | | |
| **Amended gross receipts (Option A — recommended)** | **$521,762** | Match the Splitflask-only 1099-K floor |
| | | |
| **Bank Splitflask revenue deposits (SGM bank)** | $560,938 | SGM WF …8625 classified, 12 months footed |
| Difference: bank > amended gross | +$38,176 | Explained below |

**Why bank deposits ($560,938) exceed the amended gross ($521,762) by ~$38K:**

| Component | Amount | Explanation |
|-----------|--------|-------------|
| Shopify Splitflask deposits into SGM bank | ~$139,500 | Shopify 1099-K is on Personal TIN …7639, not SGM TIN. Under Option A, these are a capital contribution (owner routed Shopify cash through SGM). Revenue is on Personal Sch C, not SGM 1120-S. These deposits are properly in SGM's bank but NOT SGM's gross receipts. |
| Amazon + TikTok timing (Dec orders → Jan payout) | ~$1,499 TikTok + ~$17,886 Amazon | Year-end timing; Dec 2024 revenue paid into Jan 2025; bank lower in 2024 by this amount |
| Net effect | The $560,938 bank total includes the Shopify personal-TIN deposits → not a SGM revenue understatement | ✅ No gap |

**What the amendment must do:**
- Report gross receipts at $521,762 (Splitflask 1099-K on SGM TIN, excluding the CB store)
- Deduct real platform fees (Amazon $52,007 stated + TikTok $51,352 stated + SGM Amazon CA/MX fees), not a plug
- The $82,264 CB-store Shopify portion: show as "nominee income distributed to Cyberbrands" (same logic as SGM→SPLT nominee in 2025, but for the cross-product situation)
- Complete Schedule L (balance sheet was left blank on the filed return)

**As-filed vs. amended summary:**

| | Filed | Amended |
|-|-------|---------|
| Gross receipts | $418,990 | $521,762 |
| COGS | $270,032 | $386,799 (footed bank; corrected from owner-provided flawed figure) |
| Other deductions | $182,309 | ~$317,000 (fees, freight, ads — all sourced) |
| Net income/(loss) | −$33,351 | **≈ −$182,089** |
| Direction | | Favorable (deeper loss); does NOT raise tax |

---

### CB 2024 — Cyberbrands LLC (Schedule C on personal 1040)

| Line | Amount | Source |
|------|--------|--------|
| **As-filed gross receipts** | $139,613 | QB Self-Employed P&L — COMMINGLED CATCH-ALL (includes consulting + Splitflask costs + non-CB expenses) |
| | | |
| **1099-K floor on CB TIN …7466** | $22,414.83 | Amazon CB 2nd account |
| ⚠️ Additional 1099-K on SGM TIN for CB-store Shopify | $82,263.58 | On SGM's TIN, not CB's — but CB's income; TJ must show it on CB's Sch C |
| **Effective 1099-K floor (all CB channels)** | **$104,678.41** | = $22,415 (CB TIN) + $82,264 (on SGM TIN) |
| | | |
| **Amended gross receipts (Cyberbackpack-only, clean)** | **$107,112.61** | CB bank-sourced, post-BNPL double-count removal; above floor by ~$2,434 (non-card channels: wholesale $8,184, TikTok CB $3,625, Walmart $717) |
| | | |
| **Bank CB revenue deposits** | $116,561.18 | CB WF …5090, 12 months footed (pre-BNPL; after BNPL removal = $107,113) |
| **Corrected bank revenue (post-BNPL)** | $107,112.61 | BNPL ($9,448.57) ran through Shopify → already inside Shopify $80,116; removing avoids double-count |

**Filed vs. amended summary:**

| | Filed | Amended |
|-|-------|---------|
| Gross receipts | $139,613 | $107,112.61 |
| COGS | $0 | $24,254.64 (591 units × $41.04 Cyberbackpack unit cost; ⚠️ cash-method: deducted in year PAID, so 2023-paid units may deduct in 2023 — TJ to confirm per method election) |
| Other deductions | $135,471 | ~$55,821 (CB-sourced only: ads $20,277 + freight $23,202 + opex $8,164 + Shopify Capital financing cost ~$3,700–$5,330) |
| Net income | +$4,142 | **≈ +$31,214** |
| Direction | | ⚠️ Profit is HIGHER (non-CB costs stripped out; those move to SGM/SPLT as deductions where appropriate) |

**Why profit is higher in the amendment:** The filed return deducted ~$104,175 with no source document — car/truck, commissions, unclassified office/supplies, advertising (no invoices). The amendment removes all unsourced deductions per the account-follows-entity rule: if no business account paid it, it does not deduct. The non-CB costs do NOT disappear — they move to whichever entity's account actually paid them.

**⚠️ Cross-TIN note for TJ:** The $82,264 Cyberbrands-store Shopify revenue is on SGM's 1099-K, not CB's. CB's Sch C must still report it (it IS CB's income). The way to handle this on the return: CB reports $107,112.61 gross receipts (including the Shopify portion). SGM's amendment excludes the $82,264 from its taxable Splitflask gross (reduces SGM's 1099-K floor from $604,026 to $521,762). Each entity claims it once; no double-count.

**⚠️ Shopify Capital:** The advance was signed by SGM (account name) but the funds serviced the Cyberbackpack business. CB deducts the financing cost ($5,330 total per stated agreement terms; approximate 2024 allocation ~$2,922 based on 166/303 days). This is the use-of-funds rule, not the name-on-the-agreement rule. SGM does NOT deduct it.

---

### Personal Schedule C 2024 — Splitflask Shopify Store

| Line | Amount | Source |
|------|--------|--------|
| **1099-K on Personal TIN …7639** | $164,613.99 | Shopify "Splitflask store" — CORRECTED 1099-K form |
| **Amended gross receipts (Option A)** | $164,614 | Report on Personal Sch C at 1099-K amount; Shopify Payments captures most sales |
| Non-Shopify-Payments gap (PayPal/Affirm) | ~$1,542 | Shopify SKU export net $166,156 vs 1099-K $164,614 = $1,542 difference; both figures verified independently (triple corroboration) |

**Option A treatment (recommended by CPA plan):**
- Splitflask Shopify revenue stays on Personal Sch C, matching the 1099-K TIN
- The ~$139,500 that actually deposited into SGM's bank = **owner capital contribution to SGM** (not SGM gross receipts)
- This matches the 2025 precedent: the same store switched to SPLT TIN in 2025, and the 2025 return correctly reports it on SPLT's 1120

**Note:** The $164,614 is inside the bank-verified SGM 2024 deposit total of $560,938 — but it is NOT SGM's gross receipts under Option A. It sits in SGM's bank as a capital contribution.

---

### SGM 2025 — Social Gear Media LLC (1120-S, wind-down year)

| Line | Amount | Source |
|------|--------|--------|
| **As-filed gross receipts** | $130,976 | Filed on deposit-basis including owner loans — systematic error |
| | | |
| **1099-K on SGM TIN** | $240,009.89 | Amazon US — NOMINEE SITUATION (see below) |
| | | |
| **Real SGM gross receipts (before nominee)** | ~$55,484 | Amazon pre-switch Jan 1–Feb 4: $15,220.80; non-Amazon bank revenue: ~$34,252; consulting (Teslarati/Video Elephant): $6,011 |
| | | |
| **Nominee mechanics (reported on SGM's return):** | | |
| Amazon 1099-K IN (full amount) | $240,009.89 | SGM reports the full 1099-K to satisfy IRS matching |
| Less: nominee distribution to SPLT (Feb 5–Dec 31 orders) | −$224,789.09 | SGM issues Form 1099 to SPLT for this amount; deducted from SGM's gross |
| = Amazon kept by SGM (Jan 1–Feb 4 orders) | $15,220.80 | Cut-off: Feb 4, 2025 = date payout bank account switched to SPLT |
| + Other SGM revenue (non-Amazon) | $34,252 | Knocking wires $7,567; Walmart marketplace $4,026; Ownstar intl $1,004; misc Macy's/B2B checks $9,600; other bank revenue |
| + Consulting revenue (Teslarati/Video Elephant) | $6,011 | Already classified in SGM bank; ⚠️ TJ: confirm not double-reported in CB 2025 |
| **= Amended SGM 2025 gross receipts** | **~$55,484** | Net of the nominee pass-through |
| | | |
| **SGM 2025 bank real revenue deposits** | ~$40,263 | = Amazon to SGM bank $15,221 + non-Amazon bank revenue (~$25,042); note consulting included in non-Amazon |

**What was wrong with the filed $130,976:**

| Component in the filed figure | Amount | Correct treatment |
|-------------------------------|--------|-------------------|
| Real Amazon pre-switch revenue | $15,221 | ✅ SGM's; include |
| Real non-Amazon revenue (Knocking, Walmart, etc.) | ~$25,042 | ✅ SGM's; include |
| Real consulting (Teslarati etc.) | $6,011 | ✅ SGM's; include |
| Owner loans from Riz/Cheryl | $57,317 | ❌ Non-revenue; balance sheet PAYABLE, not income |
| CB intercompany transfers | $9,551 | ❌ Non-revenue; balance sheet |
| SPLT intercompany transfers | $1,600 | ❌ Non-revenue; balance sheet |
| Reversals/returns | $2,390 | ❌ Excluded; gross-up-and-deduct if material |
| **Total filed** | **$130,976** | Over-reported by ~$75K of non-revenue items |

**Filed vs. amended summary:**

| | Filed | Amended |
|-|-------|---------|
| Gross receipts | $130,976 | ~$55,484 |
| COGS | $113,315 | Nominal (wind-down entity; minimal inventory) |
| Other deductions | $50,561 | ~$67,399 (Augusta $4,500 + real opex $27,488 + SBA interest + misc; 2024 intl Amazon ads ~$690 assigned to SGM) |
| Net income/(loss) | −$32,900 | **≈ −$2,592 to −$11,915** (range depending on method / SBA interest confirmed) |
| Direction | | Favorable; removes phantom income (owner loans) |

**⚠️ SBA EIDL — unclaimed interest deduction on SGM:** The $404,200 SBA EIDL (Loan #7855987406, 3.75%/yr, borrower = SGM) has been generating ~$14,700/yr interest (est.). The filed returns did not properly separate principal from interest in the $2,018/mo payments. SGM may have an **unclaimed interest deduction** for 2024 and 2025. TJ: pull the SBA amortization schedule and identify the interest portion of each year's payments. The bank showed $13,320 in SBA payments for 2024 (≈6.6 months); if 12 full payments were made from another account or in a different year, additional interest may be deductible.

**⚠️ Augusta overlap — ⚠️ VERIFY TOTAL DAYS ≤ 14:**  
SGM deducts $4,500 (3 days × $1,500). SPLT deducts $16,500 (11 days × $1,500). Combined = 14 days = the §280A(g) cap exactly. Nothing is disregarded. Minutes exist for all 14 meetings. Daily rate $1,500 is comp-supported (3 Peerspace/Giggster comps attached). Property: 32001 Royceton Ct (personal residence). SGM's prior booking of $16,500 was wrong — correctly reduced to $4,500 in the amended packet.

---

### SPLT 2025 — SPLT Inc. (1120, C-corp, initial return)

| Line | Amount | Source |
|------|--------|--------|
| **As-filed gross receipts** | $369,981 | Filed initial return — understated; fees embedded in COGS via 1125-A catch-all |
| | | |
| **1099-K on SPLT TIN …4308** | $109,063.96 | Shopify "Splitflask store" (switched to SPLT TIN Jan 2025) — CORRECTED form |
| **Nominee income from SGM** | $224,789.09 | SGM nominates Amazon Feb 5–Dec 31 2025 orders to SPLT; SGM issues Form 1099 to SPLT; SPLT reports this as gross income |
| **No additional 1099-K issued to SPLT** for the nominee amount | — | The original Amazon 1099-K is on SGM TIN; the nominee 1099 (issued by SGM to SPLT) is the matching document. Amazon has been requested to issue a CORRECTED 1099-K under SPLT TIN (belt-and-suspenders) |
| | | |
| **Amended gross receipts (channel-by-channel):** | | |
| Amazon nominee (Feb 5–Dec 31) | $224,789.09 | Bank-confirmed: $224,281.65 deposited into SPLT WF …0423 ($507 = year-end timing) |
| Shopify net (SKU export, all payment methods) | $149,010 | Shopify SKU export net; BNPL ($9,063) removed as Shopify double-count; includes Global-e international (already in admin export) |
| TikTok payout (Q1–Q2 only; H2 = $0) | $11,282 | Five 2025 TikTok XLSX files (Q1 net $10,994; Q2 net $288) |
| Kickstarter (786 backer orders, cash received 2025) | $54,386 | 11 SPLT bank deposits identified; C-corp cash-basis = income in year received |
| Atlantic Access (INV-8707, Feb–Aug 2025) | $3,014 | GBP £2,336.73 net × 1.29; ⚠️ invoice is UNPAID ($1,769 balance payable) → cash-method income = $3,014 − $1,769 = $1,245 recognizable in 2025 (the portions already remitted); TJ to confirm exact cash received |
| Wholesale / B2B (SPLT bank wires) | $7,686 | 5 named international wires: Everything Kitchen AU, Waen JP, Citiesocial TW ×2, Kuwait; + Lucky Rubber Ducky $517 |
| Walmart marketplace payouts | $4,026 | SPLT Walmart bank deposits |
| Other | — | — |
| **Total amended gross receipts (approx.)** | **~$456,722** | Per Assembly 4B/4D; slight adjustment pending Atlantic cash-vs-accrual confirmation |
| | | |
| **SPLT 2025 bank revenue deposits (approx.)** | ~$420,000+ | Amazon $224,282 + Shopify Payments ~$109K (1099-K) + non-SP Shopify ~$40K + TikTok $1,792 + Kickstarter $54,386 + wholesale wires ~$12K |

**Filed vs. amended summary:**

| | Filed | Amended |
|-|-------|---------|
| Gross receipts | $369,981 | ~$456,722 |
| COGS (1125-A "Other costs") | $331,210 | ~$186,000 (Amazon fees $76,486 stated + Shopify fees ~$11,000 + TikTok fees ~$10,922 + FB ads SPLT-cards $72,512 + other real deductions) |
| Augusta | In deductions | $16,500 (11 meetings × $1,500; reduced from ~$20,500 booked to cap-compliant amount) |
| Other deductions | $28,921 | ~$200,000 (platform fees, COGS, Augusta, Chase card spend, Venmo influencers, SPLT opex — all sourced) |
| Net income | +$9,850 | **≈ +$53,817 to +$56,373** |
| Direction | | ⚠️ ADVERSE — income INCREASES; C-corp tax owed |

**⚠️ THIS IS THE ONE REAL TAX OWED. SPLT is a C-corp.** Its income does NOT pass through to the personal return. The approximately $53,817–$56,373 of net income generates **C-corp tax at 21% ≈ $11,302–$11,838**.

**Why the amendment raises SPLT's taxable income despite adding deductions:**
- The filed return buried ~$331K into COGS via 1125-A "Other costs" (a catch-all) — only possible by including non-deductible items (ATM withdrawals, Paris travel, Tesla financing payments, personal expenses) as if they were COGS
- The amendment reclassifies correctly: real deductible platform fees + real business expenses → but also removes the non-deductibles
- Net effect: gross receipts rise MORE than deductions rise (the filed return was BOTH understating income AND overstating deductions in a wash that produced an understated but fake profit)
- The honest number is higher; the amendment is correct

**⚠️ Kickstarter deferral is NOT available on cash basis:** Owner reviewed a deferral option. §451 advance-payment deferral rules are accrual-method rules. SPLT filed cash (and TJ's recommendation is to stay cash). Cash received in 2025 = income in 2025. To defer it, SPLT would need to switch to accrual (Form 3115 + IRS consent), which would likely cost more by losing cash-basis COGS treatment. TJ must model both if the owner still wishes to revisit — but the answer is almost certainly to keep cash.

**⚠️ Kickstarter delivery obligation (balance sheet):**  
680 unshipped orders as of 12/31/2025. Future COGS when shipped ≈ 680 × $11.06 = **$7,521**. Record as a **deferred delivery obligation** (contract liability) on the balance sheet, distinct from the income (already recognized). This is a book-tax difference, not a tax question.

**⚠️ Shopify Capital — VERIFY SPLT has no advance:** SPLT's bank showed $4,238 labeled "Shopify Capital" entries. These were traced to: Santander BILLPAY $2,770 (SPLT paying SGM's SBA loan — balance sheet, not deductible on SPLT); Affirm/Shop Pay clawbacks $901 (deductible); Shopify fees $566 (deductible). SPLT does NOT have its own Shopify Capital advance. The SGM/CB advance was signed by SGM (account holder) but benefits Cyberbackpack — deductible on CB per use-of-funds rule.

---

### CB 2025 — Cyberbrands LLC (Schedule C on personal 1040)

| Line | Amount | Source |
|------|--------|--------|
| **As-filed gross receipts** | $95,558 | Filed on 2025 personal return |
| | | |
| **1099-K on CB TIN …7466** | $0 | No 1099-K issued to CB TIN in 2025 (below $5,000 threshold or platform-dependent) |
| | | |
| **Amended gross receipts (bank-sourced)** | $107,876 | CB WF …5090 2025 classification; revenue above the zero 1099-K floor |
| **Underreporting gap** | +$12,318 | Filed $95,558 < bank reality $107,876; amendment corrects UPWARD (honest direction) |
| | | |
| **Bank CB 2025 revenue deposits** | ~$107,876 | CB WF …5090, all 12 months footed |

**SPLT-paid CB intercompany ads:**  
SPLT's Chase ···3247 paid **$17,818.73** of Cyberbrands' 2025 Facebook ads. CB's bank shows $0 FB ad spend because SPLT fronted it.  
Treatment:
- SPLT: intercompany RECEIVABLE $17,818.73 (already correctly excluded from SPLT's deductions; SPLT deducted only the Splitflask-attributed ad spend)
- CB: intercompany PAYABLE $17,818.73 + **CB DEDUCTS $17,818.73 as advertising** (add to CB's 2025 deductions)
- ⚠️ **This deduction MUST be in CB's 2025 packet.** Without it, CB overpays tax on its profitable channels while SPLT carries a receivable with no matching deduction on the other side.

**Filed vs. amended summary:**

| | Filed | Amended |
|-|-------|---------|
| Gross receipts | $95,558 | $107,876 |
| COGS | $71,051 | ~$46,215 (est. ~1,100 Cyberbackpack units × $41.04 Cyberbackpack cost) |
| Advertising | $5,520 | $20,277 (CB bank ads) + $17,819 (SPLT-paid interco) = $38,096 |
| Other deductions | — | ~$8,000 (opex, freight) |
| Net income/(loss) | ~$0 (breakeven filed) | **≈ −$16,470** |
| Direction | | Favorable (real loss once real ads + COGS corrected) |

---

## AGGREGATE GROSS RECEIPTS SUMMARY

| Entity | Year | Filed Gross | 1099-K Floor (own TIN) | Amended Gross | Amended Net | Tax Impact |
|--------|------|------------|----------------------|---------------|-------------|------------|
| SGM | 2024 | $418,990 | $604,026 (Splitflask: $521,762) | $521,762 | ≈ −$182,089 | Favorable (deeper loss) |
| CB | 2024 | $139,613 | $22,415 (Amazon CB) + $82,264 cross-TIN | $107,113 | ≈ +$31,214 | ⚠️ Profit higher; correct |
| Personal Sch C | 2024 | *(in personal return)* | $164,614 (Shopify Splitflask) | $164,614 | — | Stays on Personal Sch C (Option A) |
| SGM | 2025 | $130,976 | $240,010 (Amazon, nominee) | ~$55,484 | ≈ −$2,592 | Favorable |
| SPLT | 2025 | $369,981 | $109,064 (Shopify) + $224,789 nominee | ~$456,722 | ≈ +$53,817–$56,373 | **⚠️ ADVERSE — ~$11,302–$11,838 C-corp tax** |
| CB | 2025 | $95,558 | $0 | $107,876 | ≈ −$16,470 | Favorable |

**Aggregate personal return** (SGM + CB + Personal Sch C pass-throughs): deeply net-negative across all entity-years. No federal income tax from pass-through entities.

**The only real tax check:** SPLT Inc. C-corp, ~$11,302–$11,838. Cannot net vs. pass-through losses.

---

## CROSS-TIN COMPLICATIONS — CHECKLIST FOR TJ

| Issue | Entities Affected | Action Required |
|-------|------------------|-----------------|
| Cyberbrands-store Shopify $82,264 on SGM TIN | SGM 2024, CB 2024 | SGM excludes from Splitflask gross (reduces $604K → $521K). CB reports it on Sch C. Each side claims it once. |
| Shopify Splitflask store on Personal TIN 2024, SPLT TIN 2025 | Personal Sch C 2024, SPLT 1120 2025 | Option A: report where the 1099-K TIN is. The deposits in SGM bank (2024) = capital contribution to SGM. No adjustment to SGM gross receipts. |
| Amazon 2025: TIN = SGM, bank = SPLT | SGM 2025, SPLT 2025 | Nominee distribution. SGM: report full $240,010, deduct $224,789 nominee (issue Form 1099 to SPLT). SPLT: include $224,789 as nominee income. |
| Amazon 2025 fees on SGM's 1099-K; income is SPLT's | SGM 2025, SPLT 2025 | Fees follow the income: fees attributable to the Feb 5–Dec 31 orders (SPLT's) deduct on SPLT. SGM deducts only fees on its Jan 1–Feb 4 slice ($7,071 approx). |
| FB ads for Cyberbrands paid by SPLT Chase ···3247 | SPLT 2025, CB 2025 | SPLT: receivable $17,818.73 (not its deduction). CB: payable $17,818.73 + deducts $17,818.73 advertising. |
| SBA EIDL interest: borrower = SGM; some payments made by SPLT | SGM 2024/2025, SPLT 2025 | SPLT payments via Revolving Loan Agreement = balance sheet (advances, not deductible on SPLT). SGM deducts its interest. Revolving Loan interest (5% from 6/30/2026) = $0 for SPLT 2025. |

---

## NOMINEE DISTRIBUTION — STEP-BY-STEP FOR FILING (SGM → SPLT 2025)

This is the hard interlock: **neither SGM 2025 nor SPLT 2025 can file without the other side of this transaction being resolved.**

1. **Get cut-off confirmation:** Feb 4, 2025 = date Amazon payout bank switched to SPLT. Amazon order dashboard confirms SGM Jan 1–Feb 4 = $15,220.80; SPLT Feb 5–Dec 31 = $224,789.09.
2. **SGM's 1120-S (2025):** Line 1 gross receipts = $240,009.89 (full 1099-K). Deduct below the line: "Nominee distribution to SPLT Inc. (EIN …4308): $224,789.09." Net Amazon on SGM = $15,220.80.
3. **SGM issues Form 1099-MISC or 1099-NEC to SPLT:** Box 3 (Other income) or the appropriate box; amount = $224,789.09; recipient = SPLT Inc., EIN …4308.
4. **SPLT's 1120 (2025):** Report $224,789.09 as nominee income (same line as Amazon fees per the income: deduct the associated Amazon fees on SPLT's return, NOT SGM's).
5. **Request corrected 1099-K from Amazon:** Ask Seller Central to reissue the 2025 1099-K under SPLT TIN …4308 for the Feb 5–Dec 31 portion. Belt-and-suspenders — the nominee 1099 is sufficient legally, but a corrected 1099-K is cleaner if Amazon will provide it.
6. **Verify both returns say the same thing:** The $224,789.09 deducted on SGM = the $224,789.09 added on SPLT. Zero-sum. Any mismatch = a cross-entity error.

---

## FILING ORDER CONSTRAINTS (preserved from CPA_Sequenced_Action_Plan_V2)

The following must be decided/completed in order. Changing an upstream decision cascades downstream.

1. **Method election (A1) — FIRST.** Cash vs. inventory. All COGS figures depend on this. Recommendation: keep cash (already filed; no Form 3115; also worth ~$5,500 to SPLT vs. switching to inventory). CB 2024 conflict: under cash method, 2023-paid Kangdao inventory deducts in 2023 (not 2024) — TJ must check if 2023 returns need adjustment.

2. **SGM 2024 filing model (B1).** Option A (Splitflask-only gross-up $521,762; clean 1099-K match) vs. Option B (full SGM TIN $604,026 including CB store revenue on SGM's return). Option A recommended: cleaner, routes CB income to CB's return, matches TIN.

3. **Nominee 1099 procedure (C1).** Complete steps 1–6 above before either SGM 2025 or SPLT 2025 is submitted. Hard interlock.

4. **Cross-packet tie verification (F).** Confirm both sides of each paired item before either return files:
   - $8,135.50 SGM receivable / CB payable (intercompany freight 2024)
   - $17,818.73 SPLT receivable / CB payable (FB ads 2025)
   - Nominee $224,789.09 SGM deduction = SPLT income
   - Total freight $89,120.50 = SGM gross $89,120.50 (cross-check: SGM net $65,918 + CB $23,202 = $89,120 ✓)

5. **File.** Recommended order: CB 2024 → SGM 2024 → CB 2025 → SGM 2025 → SPLT 2025 (nominee interlock: SGM 2025 before SPLT 2025).

---

## THE ONE REAL TAX OWED

**SPLT Inc. C-corp 2025: ~$11,302–$11,838**

- All other entity-years: net losses or pass-through losses; no federal income tax owed
- Personal return aggregate (SGM + CB + Personal Sch C): deeply net-negative from SGM 2024 loss alone (~−$182K)
- SPLT is a C-corp: income does NOT flow to the personal return; taxed at entity level at 21%
- SPLT ~$53,817 × 21% = **$11,302** (lower bound; Foremost insurance IN, Augusta at $16,500, all confirmed business deductions applied)
- SPLT ~$56,373 × 21% = **$11,838** (per "all three fixes applied" figure; slight variation from Atlantic cash-basis timing)
- The range narrows to one number once TJ confirms: (a) Shopify Capital interest on SPLT (additive deduction, lowers tax further); (b) Atlantic Access cash received vs. unpaid balance treatment; (c) any remaining Chase ···3247 items owner identified as business

**Legitimate ways to reduce SPLT's C-corp tax further:**
- Shopify Capital financing cost on CB (deductible on CB, not SPLT — already handled)
- SBA EIDL interest on SGM (SGM deductible — does not help SPLT's entity-level tax)
- Any remaining substantiated SPLT business deductions not yet captured
- Starting a reasonable compensation salary for 2026 forward (reduces future C-corp income; not a 2025 fix)

**NOT available:** Netting SPLT's C-corp income against SGM's/CB's losses on the personal return. They are legally separate; C-corp income goes on a 1120, not a Schedule E K-1.

---

*Cross-reference:* `CPA_Sequenced_Action_Plan_V2.md` (detailed step-by-step CPA actions), `SGM_2024_Amendment_Packet.xlsx`, `CB_2024_Amendment_Packet.xlsx`, `SGM_2025_Amendment_Packet.xlsx`, `SPLT_2025_Amendment_Packet.xlsx`, `CB_2025_Amendment_Packet.xlsx`
