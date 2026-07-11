# CB 2024 Schedule C Amendment — Cover Memo (Assembly 2B — COGS Corrected)

**To:** TJ (CPA) / Bob (preparer)
**From:** Riz Nwosu
**Re:** Cyberbrands LLC / Cyberbackpack — 2024 Schedule C Amendment
**Packet:** `deliverables/CB_2024_Amendment_Packet.xlsx`
**Date:** 2026-07-10
**Revision:** Assembly 2B (2026-07-10) — COGS corrected to inventory method; deduction sweep completed

---

## Entity / Filing Context

**Cyberbrands LLC** (EIN …7466, WF …5090) is the Schedule C business name on the **personal Form 1040** (joint return, Arizechukwu & Cheryl Nwosu). This packet covers the **Cyberbackpack product line only** — not Splitflask. The two products are completely separate: different bank account, different TIN (for the Amazon 1099-K), and different revenue universe.

---

## Purpose of the Amendment

The 2024 Schedule C was filed on a **bank-deposit (net-of-fees) basis** without reconciling to the 1099-K floors. The amendment restates to an accurate gross-receipts basis with offsetting deductions, and applies four specific corrections identified during due-diligence reconstruction. The amendment is **favorable** — it does not raise tax.

---

## What Changed vs As-Filed (Assembly 2B adds item 4)

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
- **Method note for TJ:**
  - (a) Inventory method must be **consistent with SGM 2024** — both entities same method, same year. TJ to confirm.
  - (b) The 2023 Kangdao payments must **NOT** also be deducted on the 2023 Schedule C — one COGS, one year. No cross-year double-deduct.
  - (c) The corrected COGS *replaces* (does not stack on) the bank-sourced figures.
- **Effect:** Total deductions increase $20,076.35 → **amended net Schedule C = $31,214.42** (down from provisional $51,290.77). Still profitable; still FAVORABLE.

### 5. Shareholder loan round-trip — balance sheet, no P&L effect
- **Item:** Dec 26, 2023: Arize wired $18,766.58 personal funds (Charles Schwab) into CB as a shareholder loan. CB repaid $18,766.58 in Feb 2024 (branch withdrawal, previously flagged as "unknown cash withdrawal").
- **Treatment:** Both legs are balance-sheet only (loan proceeds ≠ income; repayment ≠ deduction). Zero P&L impact. The Feb 2024 withdrawal is no longer a diligence flag — it has a verified source (S139 CB Dec 2023 stmt).

---

## Amended Position (Assembly 2B — COGS corrected)

| | Amount | Status |
|---|---|---|
| Amended gross receipts | **$107,112.61** | LOCKED |
| Less: advertising | ($20,276.87) | SOURCED |
| Less: COGS (inventory method, corrected) | ($24,254.64) | SOURCED — CORRECTED |
| Less: freight (Path b) | ($23,202.50) | LOCKED |
| Less: OPEX | ($8,164.18) | SOURCED |
| **Total deductions** | **($75,898.19)** | |
| **Amended net Schedule C income** | **$31,214.42** | PROVISIONAL |

**As-filed gross receipts and net income:** TJ/Bob to supply from the original 2024 personal return.

**Provisional — pending TJ decisions that may further reduce profit:**
- Shopify Capital interest (unknown; extract from capital agreement)
- CB→SGM ad transfers $2,559.41 (if CB deduction: reduces profit)
- CB→SGM management/marketing $6,000 (if CB deduction: reduces profit)

**Platform fees (gross-up washes — NOT in totals above):**
- Shopify Payments fee ~$2,148 ESTIMATE: only additive if CB Shopify revenue is simultaneously grossed up to $82,263.58; net P&L impact = $0
- Amazon CB fees ~$7,947 ESTIMATE/PLUG: only additive if Amazon CB revenue is simultaneously grossed up to $22,414.83; net P&L impact = $0; TJ: source from Amazon CB Seller Central settlement

---

## Verdict

**Amendment does not raise tax.** Corrected COGS deepens the deduction base. All deductions are bank-substantiated or inventory-method sourced from footed statements. The revenue correction (BNPL removal) reduces gross receipts, favorable. Freight Path-b locked. COGS corrected from bank-sourced $4,178 to inventory method $24,255 per Assembly 2B. Pending TJ items (Shopify Capital interest, interco service calls) could further reduce net income below $31,214.

---

## Items for TJ/Bob to Decide or Confirm

1. **As-filed figures** — supply from 2024 personal Schedule C to complete the "as-filed vs amended" comparison in the Summary tab.
2. **COGS method consistency** — this packet uses inventory/accrual method ($24,254.64). Must be consistent with SGM 2024 method. Confirm both entities are on the same method before filing either return. Confirm 2023 Kangdao payments are NOT deducted on the 2023 return.
3. **Travel/meals documentation** — OPEX includes travel $1,345.52 and meals $242.12. Confirm business purpose docs for deductibility; note 50% meals limitation as of 2023.
4. **Contract labor/freelance** — OPEX_CONTRACT_LABOR $68.30 + OPEX_FREELANCE $55.25. Confirm 1099-NEC issued to any individual > $600/year.
5. **CB→SGM ad transfers ($2,559.41)** — currently balance-sheet on both sides (neither entity deducting). If SGM ran CB-product ads using these funds, deduction moves to CB. If Splitflask ads, no change. Confirm with owner.
6. **CB→SGM management/marketing $6,000** — currently balance-sheet. If arm's-length service agreement: CB deducts $6,000; SGM recognizes revenue. TJ to establish the correct treatment.
7. **Shopify Capital interest** — principal repayments $34,446.07 are non-deductible (principal). Extract interest portion from Shopify Capital agreement for potential deduction (currently unquantified).
8. **Kangdao Nov $3,266.67** — related-party inventory purchase funded by Chukwuezugo Nwosu loan. Confirm arm's-length pricing and that Kangdao delivered Cyberbackpack units. (Note: cost per unit is embedded in the $41.04 inventory method COGS.)
9. **Amazon CB platform fees** — implied fees $7,947 (gap between 1099-K $22,415 and bank deposits $14,467). Source from Amazon CB Seller Central 2024 settlement report for stated fees rather than bank-plug. If grossing up Amazon revenue to $22,414.83, add stated fee as offsetting deduction (net P&L = $0).

---

## Scope Note — Cyberbackpack ≠ Splitflask

This packet covers **Cyberbackpack only**. The Kendra Scott due-diligence universe (Splitflask GMV $751,891, deal denominator) is a completely separate file. Cyberbackpack revenue is included in the **total gross receipts / tax universe** ($855K) and **excluded from the Splitflask deal universe**. The two must never be combined for investor purposes.

---

*Source documentation: CB WF …5090 bank statements S139–S151 (all footed), Amazon CB 1099-K S053, Shopify-SGM 1099-K S058, ledger.xlsx CB_2024_Txns (933 rows classified), Intercompany tab (Layer 6, 0 FAIL). COGS sourced from 591-unit sales tally (CB_2024_Txns) × $41.04 per-unit Kangdao landed cost. All figures comply with the V12 provenance gate. Revision: Assembly 2B (2026-07-10).*
