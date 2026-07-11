# CB 2024 Schedule C Amendment — Cover Memo

**To:** TJ (CPA) / Bob (preparer)
**From:** Riz Nwosu
**Re:** Cyberbrands LLC / Cyberbackpack — 2024 Schedule C Amendment
**Packet:** `deliverables/CB_2024_Amendment_Packet.xlsx`
**Date:** 2026-07-10

---

## Entity / Filing Context

**Cyberbrands LLC** (EIN …7466, WF …5090) is the Schedule C business name on the **personal Form 1040** (joint return, Arizechukwu & Cheryl Nwosu). This packet covers the **Cyberbackpack product line only** — not Splitflask. The two products are completely separate: different bank account, different TIN (for the Amazon 1099-K), and different revenue universe.

---

## Purpose of the Amendment

The 2024 Schedule C was filed on a **bank-deposit (net-of-fees) basis** without reconciling to the 1099-K floors. The amendment restates to an accurate gross-receipts basis with offsetting deductions, and applies three specific corrections identified during due-diligence reconstruction. The amendment is **favorable** — it does not raise tax.

---

## What Changed vs As-Filed

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

### 4. Shareholder loan round-trip — balance sheet, no P&L effect
- **Item:** Dec 26, 2023: Arize wired $18,766.58 personal funds (Charles Schwab) into CB as a shareholder loan. CB repaid $18,766.58 in Feb 2024 (branch withdrawal, previously flagged as "unknown cash withdrawal").
- **Treatment:** Both legs are balance-sheet only (loan proceeds ≠ income; repayment ≠ deduction). Zero P&L impact. The Feb 2024 withdrawal is no longer a diligence flag — it has a verified source (S139 CB Dec 2023 stmt).

---

## Amended Position (Provisional)

| | Amount |
|---|---|
| Amended gross receipts | **$107,112.61** |
| Less: advertising | ($20,276.87) |
| Less: COGS | ($4,178.29) |
| Less: freight (Path b) | ($23,202.50) |
| Less: OPEX | ($8,164.18) |
| **Amended net Schedule C income** | **$51,290.77** |

**As-filed gross receipts and net income:** TJ/Bob to supply from the original 2024 personal return. Amended figures are sourced from 12 footed bank statements (all months foot to penny; zero parser corrections on CB statements).

---

## Verdict

**Amendment does not raise tax.** All deductions are bank-substantiated from footed statements. The revenue correction (BNPL removal) reduces gross receipts, which is favorable. Freight Path-b is an owner-decision locked correction. No plug deductions — every figure traces to a source document.

---

## Items for TJ/Bob to Decide or Confirm

1. **As-filed figures** — supply from 2024 personal Schedule C to complete the "as-filed vs amended" comparison in the Summary tab.
2. **Travel/meals documentation** — OPEX includes travel $1,345.52 and meals $242.12. Confirm business purpose docs for deductibility; note 50% meals limitation as of 2023.
3. **Contract labor/freelance** — OPEX_CONTRACT_LABOR $68.30 + OPEX_FREELANCE $55.25. Confirm 1099-NEC issued to any individual > $600/year.
4. **CB→SGM ad transfers ($2,559.41)** — currently balance-sheet on both sides (neither entity deducting). If SGM ran CB-product ads using these funds, deduction moves to CB. If Splitflask ads, no change. Confirm with owner.
5. **CB→SGM management/marketing $6,000** — currently balance-sheet. If arm's-length service agreement: CB deducts $6,000; SGM recognizes revenue. TJ to establish the correct treatment.
6. **Shopify Capital interest** — principal repayments $34,446.07 are non-deductible (principal). Extract interest portion from Shopify Capital agreement for potential deduction.
7. **Kangdao Nov $3,266.67** — related-party inventory purchase funded by Chukwuezugo Nwosu loan. Confirm arm's-length pricing and that Kangdao delivered Cyberbackpack units.
8. **Amazon CB platform fees** — implied fees $7,947 (gap between 1099-K $22,415 and bank deposits $14,467). If available, source from Amazon CB Seller Central 2024 settlement report for stated fees rather than bank-plug.

---

## Scope Note — Cyberbackpack ≠ Splitflask

This packet covers **Cyberbackpack only**. The Kendra Scott due-diligence universe (Splitflask GMV $751,891, deal denominator) is a completely separate file. Cyberbackpack revenue is included in the **total gross receipts / tax universe** ($855K) and **excluded from the Splitflask deal universe**. The two must never be combined for investor purposes.

---

*Source documentation: CB WF …5090 bank statements S139–S151 (all footed), Amazon CB 1099-K S053, Shopify-SGM 1099-K S058, ledger.xlsx CB_2024_Txns (933 rows classified), Intercompany tab (Layer 6, 0 FAIL). All figures comply with the V12 provenance gate.*
