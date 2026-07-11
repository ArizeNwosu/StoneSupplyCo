# CB 2024 Schedule C Amendment — Cover Memo (Assembly 2C — Commingling Restructuring)

**To:** CPA / Bob (preparer)
**From:** Riz Nwosu
**Re:** Cyberbrands LLC / Cyberbackpack — 2024 Schedule C Amendment
**Packet:** `deliverables/CB_2024_Amendment_Packet.xlsx`
**Date:** 2026-07-10
**Revision:** Assembly 2C (2026-07-11) — Three deferred items resolved from source docs; Restructuring Bridge added; Shopify Capital financing cost derived

---

## Entity / Filing Context

**Cyberbrands LLC** (EIN …7466, WF …5090) is the Schedule C business name on the **personal Form 1040** (joint return, Arizechukwu & Cheryl Nwosu). This packet covers the **Cyberbackpack product line only** — not Splitflask. The two products are completely separate: different bank account, different TIN (for the Amazon 1099-K), and different revenue universe.

---

## Purpose of the Amendment

The 2024 Schedule C was filed on a **bank-deposit (net-of-fees) basis** without reconciling to the 1099-K floors. The amendment restates to an accurate gross-receipts basis with offsetting deductions, and applies four specific corrections identified during due-diligence reconstruction. The amendment is **favorable** — it does not raise tax.

---

## What Changed vs As-Filed (Assembly 2C adds items 5–7)

### 1. Revenue: BNPL double-count removed
- **Correction:** Removed $9,448.57 of BNPL entries (Affirm/Klarna/Afterpay) from revenue.
- **Why:** Owner confirmed BNPL ran through Shopify. Shopify remits BNPL in its total payout to CB's bank. The `REV_BNPL_*` bank entries were already captured inside `REV_SHOPIFY_CB` and inside the Shopify 1099-K ($82,263.58 on SGM TIN). Counting them separately was a double-count.
- **Effect:** Revenue drops $9,448.57 → **amended gross receipts = $107,112.61** (LOCKED). Still above the CB-product 1099-K floor of $104,678.41.

### 2. Freight: Path-b split applied (intercompany correction)
- **Correction:** CB deducts **$23,202.50** total Cyberbackpack freight (vs $15,067 direct payments only in the pre-reconciliation pass).
- **Why:** SGM fronted a $10,135.50 freight wire (Guangzhou Wangbuliao) for a CB Cyberbackpack shipment in May 2024. CB paid $2,000 of it; the remaining **$8,135.50 is CB's cost**, now recorded as a CB intercompany payable / SGM intercompany receivable (Path b — owner decision). The freight deduction follows the economic beneficiary (CB). Freight deducted exactly once: CB $23,202.50 + SGM $65,918.00 = $89,120.50 = SGM gross third-party freight.
- **Cross-packet dependency:** This payable ($8,135.50) must match the receivable in the **SGM 2024 Amendment Packet**. Both packets must agree before either is filed.

### 3. Advertising: card ···5130 confirmed as CB card
- **Correction:** Card ···5130 = Cyberbrands WF debit card. The $7,873.38 in 2024 Facebook charges on this card is a **CB deduction** (within the total $20,276.87 advertising deduction), not SGM.
- **Why:** Prior sessions had this card unattributed. Owner confirmed ···5130 is CB's card. This is not an additive deduction — it is the attribution of charges already within the $20,276.87 CB advertising total.

### 4. COGS correction — inventory method (Assembly 2B)
- **Correction:** COGS restated from bank-sourced **$4,178.29** to inventory method **$24,254.64** (+$20,076.35).
- **Why:** The bank-sourced COGS captured only cash paid to suppliers *in 2024* ($3,721 + $456 sourcing). Under the **inventory / accrual method**, the cost recognized should be for units *sold* in 2024 — which were manufactured and paid to Kangdao in 2023. The per-unit cost ($41.04) applied to 591 CB 2024 units sold yields the corrected figure.
- **Method note for CPA:**
  - (a) Inventory method must be **consistent with SGM 2024** — both entities same method, same year. CPA to confirm.
  - (b) The 2023 Kangdao payments must **NOT** also be deducted on the 2023 Schedule C — one COGS, one year. No cross-year double-deduct.
  - (c) The corrected COGS *replaces* (does not stack on) the bank-sourced figures.
- **Effect:** Total deductions increase $20,076.35 → **amended net Schedule C = $31,214.42** (down from provisional $51,290.77). Still profitable; still FAVORABLE.

### 5. Shopify Capital financing cost derived (Assembly 2C — Item 1)
- **Correction:** Added Shopify Capital financing cost **$3,700 (ESTIMATE)** as a deductible expense.
- **Why:** Filed QB treated "Loan principal $2,791" as non-deductible (correct for principal). But the FINANCING COST (interest/factor fee embedded in repayments) IS deductible business interest. From bank: 2024 net repayments = $34,446.07 (gross $34,713.07 − $267 return). 2025 repayments ~$11,860. Total repaid ~$46,306. Using standard Shopify Capital factor 1.10–1.15: estimated advance ~$40,266–$42,096; total financing cost ~$4,210–$6,040; 2024 prorated share (74.4% of repayments) = **$3,131–$4,493. Midpoint $3,700 used.** Principal $34,446 remains non-deductible.
- **Caveat:** This is an estimate derived from the factor method — NOT sourced from the Shopify Capital agreement. CPA/Bob: pull the Shopify Capital 2024 amortization schedule from Shopify (or capital agreement) to confirm the exact financing cost amount. Replace $3,700 with the stated figure.
- **Effect:** Deductions increase $3,700 → **amended net Schedule C = $27,514.42** (down from $31,214.42 per Assembly 2B).

### 6. Consulting income placement confirmed (Assembly 2C — Item 2)
- **Finding:** Teslarati + Video Elephant consulting (~$6,011) landed in the **SGM 2025 bank** (identified in Layer 7 SGM 2025 classification). It is **SGM 2025 income, not CB 2024**.
- **Implication:** If QuickBooks Self-Employed pulled these deposits into the filed CB 2024 Schedule C (inflating the $139,613), that would be a double-report across years AND entities. **CPA to confirm:** check whether the $139,613 gross receipts on the filed CB Schedule C included consulting payments that actually landed in SGM's bank in 2025. If so, the filed $139,613 overstates CB 2024 income by ~$6K.
- **No action on this packet:** The CB 2024 amended gross receipts ($107,112.61) is derived from the CB WF …5090 bank (footed) — it does NOT include SGM deposits, so the consulting exclusion is already implicit. This item requires CPA confirmation, not a packet change.

### 7. 2024 advertising split derived exactly from card-coded FB invoices (Assembly 2C — Item 3)
- **Two separate FB ad accounts identified:**
  - Cyberbrands ad acct 817352319422187 (Cyberbackpack product ads): **$8,093.15** total billed
  - Splitflask ad acct 1131220967651378 (Splitflask product ads): **$13,018.14** total billed
  - Combined 2024 FB spend: **$21,111.29**
- **Card → entity split:**

| Card | Entity | CB Acct | SPLT Acct | Total |
|------|--------|---------|-----------|-------|
| ···5130 | CB (Cyberbrands debit) | $6,869.80 | $7,873.38 | **$14,743.18** |
| ···1400 | SGM card | $1,223.35 | $5,144.76 | **$6,368.11** |
| **Total** | | $8,093.15 | $13,018.14 | **$21,111.29** |

- **Reconciliation:** Filed CB Sch C advertising $45,027 = CB bank $20,276.87 (footed, stays on CB) + SGM bank $6,368.11 (already in SGM 2024 ads — do NOT add again) + **$18,382 unallocated** (not in any footed bank statement — source unknown, do not deduct without documentation).
- **Double-count check CLEAR:** ···1400 total $6,368.11 matches SGM 2024 bank ads $6,368 to the penny ($0.11 rounding). SGM already holds these charges; moving them off CB Sch C reduces CB income only — SGM unchanged.
- **Splitflask costs moving off CB (restructuring bridge):** $6,368 (···1400, to SGM — already there) + $18,382 (unallocated — to CPA). Net: CB keeps $20,276.87 bank-footed ads. The Restructuring Bridge tab in the packet shows the full commingled → CB-only transformation.

### 8. Shareholder loan round-trip — balance sheet, no P&L effect
- **Item:** Dec 26, 2023: Arize wired $18,766.58 personal funds (Charles Schwab) into CB as a shareholder loan. CB repaid $18,766.58 in Feb 2024 (branch withdrawal, previously flagged as "unknown cash withdrawal").
- **Treatment:** Both legs are balance-sheet only (loan proceeds ≠ income; repayment ≠ deduction). Zero P&L impact. The Feb 2024 withdrawal is no longer a diligence flag — it has a verified source (S139 CB Dec 2023 stmt).

---

## Amended Position (Assembly 2C)

| | Amount | Status |
|---|---|---|
| Amended gross receipts | **$107,112.61** | LOCKED |
| Less: advertising | ($20,276.87) | SOURCED |
| Less: COGS (inventory method, corrected) | ($24,254.64) | SOURCED — CORRECTED |
| Less: freight (Path b) | ($23,202.50) | LOCKED |
| Less: OPEX | ($8,164.18) | SOURCED |
| Less: Shopify Capital financing cost | ($3,700.00) | ESTIMATE (Assembly 2C) |
| **Total deductions** | **($79,598.19)** | |
| **Amended net Schedule C income** | **$27,514.42** | PROVISIONAL |

**As-filed gross receipts and net income:** Filed QB return showed gross $139,613, expenses $135,471, net $4,142 — commingled (Cyberbackpack + Splitflask + potentially consulting). CB-only restructuring produces the $107,112.61 revenue and $27,514 net above. CPA/Bob: supply from 2024 personal Schedule C to confirm as-filed figures match QB P&L.

**Provisional — pending CPA decisions that may further reduce profit:**
- Shopify Capital exact financing cost (confirm $3,700 ESTIMATE with Shopify Capital agreement)
- CB→SGM ad transfers $2,559.41 (if CB deduction: reduces profit)
- CB→SGM management/marketing $6,000 (if CB deduction: reduces profit)
- $18,382 unallocated advertising (source documentation needed before any deduction)

**Platform fees (gross-up washes — NOT in totals above):**
- Shopify Payments fee ~$2,148 ESTIMATE: only additive if CB Shopify revenue is simultaneously grossed up to $82,263.58; net P&L impact = $0
- Amazon CB fees ~$7,947 ESTIMATE/PLUG: only additive if Amazon CB revenue is simultaneously grossed up to $22,414.83; net P&L impact = $0; CPA: source from Amazon CB Seller Central settlement

---

## Verdict

**Amendment does not raise tax.** Corrected COGS deepens the deduction base. The filed QB return was a commingled Schedule C (Cyberbackpack + Splitflask costs); the amendment restructures to Cyberbackpack-only, raising CB's apparent profit ($27,514 vs $4,142 as filed) while moving Splitflask costs to SGM/SPLT where they deepen those losses. **Cross-entity net tax effect ≈ wash or REDUCTION.** This is a restructuring, not new income. Shopify Capital financing cost $3,700 (ESTIMATE) added; pending confirmation from agreement. Pending CPA items could further reduce the $27,514 net.

---

## Items for CPA/Bob to Decide or Confirm

1. **As-filed figures** — supply from 2024 personal Schedule C to complete the "as-filed vs amended" comparison in the Summary tab.
2. **COGS method consistency** — this packet uses inventory/accrual method ($24,254.64). Must be consistent with SGM 2024 method. Confirm both entities are on the same method before filing either return. Confirm 2023 Kangdao payments are NOT deducted on the 2023 return.
3. **Travel/meals documentation** — OPEX includes travel $1,345.52 and meals $242.12. Confirm business purpose docs for deductibility; note 50% meals limitation as of 2023.
4. **Contract labor/freelance** — OPEX_CONTRACT_LABOR $68.30 + OPEX_FREELANCE $55.25. Confirm 1099-NEC issued to any individual > $600/year.
5. **CB→SGM ad transfers ($2,559.41)** — currently balance-sheet on both sides (neither entity deducting). If SGM ran CB-product ads using these funds, deduction moves to CB. If Splitflask ads, no change. Confirm with owner.
6. **CB→SGM management/marketing $6,000** — currently balance-sheet. If arm's-length service agreement: CB deducts $6,000; SGM recognizes revenue. CPA to establish the correct treatment.
7. **Shopify Capital financing cost** — principal repayments $34,446.07 are non-deductible (principal). **Financing cost $3,700 ESTIMATED** (Assembly 2C, factor method: 2024 prorated $3,131–$4,493, midpoint $3,700 used). **Confirm exact figure from Shopify Capital agreement** — replace estimate with stated financing cost. The $3,700 is already deducted in this packet as an estimate.
8. **Kangdao Nov $3,266.67** — related-party inventory purchase funded by Chukwuezugo Nwosu loan. Confirm arm's-length pricing and that Kangdao delivered Cyberbackpack units. (Note: cost per unit is embedded in the $41.04 inventory method COGS.)
9. **Amazon CB platform fees** — implied fees $7,947 (gap between 1099-K $22,415 and bank deposits $14,467). Source from Amazon CB Seller Central 2024 settlement report for stated fees rather than bank-plug. If grossing up Amazon revenue to $22,414.83, add stated fee as offsetting deduction (net P&L = $0).

---

## Scope Note — Cyberbackpack ≠ Splitflask

This packet covers **Cyberbackpack only**. The Kendra Scott due-diligence universe (Splitflask GMV $751,891, deal denominator) is a completely separate file. Cyberbackpack revenue is included in the **total gross receipts / tax universe** ($855K) and **excluded from the Splitflask deal universe**. The two must never be combined for investor purposes.

---

*Source documentation: CB WF …5090 bank statements S139–S151 (all footed), Amazon CB 1099-K S053, Shopify-SGM 1099-K S058, ledger.xlsx CB_2024_Txns (933 rows classified), Intercompany tab (Layer 6, 0 FAIL). COGS sourced from 591-unit sales tally × $41.04 per-unit Kangdao landed cost. Ad split: Cyberbrands FB Invoice (ad acct 817352319422187) + Splitflask FB Invoice (ad acct 1131220967651378) — card ···5130 = CB debit, ···1400 = SGM card. Shopify Capital: 2024 repayments from CB bank S140–S151 ($34,446.07 net); financing cost factor-estimated. All figures comply with the V12 provenance gate. Revision: Assembly 2C (2026-07-11).*

---

## Restructuring Bridge Summary (Assembly 2C)

The filed CB Schedule C used QuickBooks Self-Employed which lumped income and costs across multiple businesses. This packet's restructuring:

| | Filed (QB Commingled) | CB-Only Amended |
|---|---|---|
| Gross receipts | $139,613 | $107,112.61 |
| COGS | $0 | $24,254.64 |
| Advertising | $45,027 | $20,276.87 |
| Freight | $0 | $23,202.50 |
| OPEX / other | ~$90,444 | $8,164.18 |
| Shopify Capital financing | $0 | $3,700 (ESTIMATE) |
| **Net Schedule C** | **$4,142** | **$27,514.42** |

**Why CB amended profit is HIGHER than as-filed:** Non-CB costs (Splitflask ads ···1400, car/truck, office, commissions, supplies, travel) are removed from CB and reallocated to the entities that actually incurred them. CB "looks" more profitable in isolation, but those costs deepen SGM/SPLT losses by the same amount. Cross-entity net ≈ wash.
