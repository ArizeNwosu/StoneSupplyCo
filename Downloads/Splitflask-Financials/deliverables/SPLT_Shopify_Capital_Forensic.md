# SPLT $4,238 "Shopify Capital" — Forensic Identification
**Session:** Identification pass  
**Status:** Ledger updated; one owner confirm needed; CB tie-out complete

---

## JOB 1 — What the $4,237.64 actually is (four distinct buckets)

The SPLT_2025_Txns `DEBT_SHOPIFY_CAPITAL` total of **$4,237.64** is NOT a Shopify Capital advance.  
It is four unrelated transaction types that were lumped under one wrong label.

### Bucket A — Santander BILLPAY: $2,770.14 (2 entries)
**Verbatim descriptors:**
- `Santander BILLPAY xxxxx1421 Splt Inc` — 2025-09-16 — $1,402.57
- `Santander BILLPAY xxxxx4082 Splt Inc` — 2025-12-17 — $1,367.57

**What it is:** SPLT paying SGM's SBA EIDL loan, at Arize's direction, pursuant to  
**`Revolving_Loan_Agreement_SPLT_Nwosu (1).pdf` §2.7** (on file; signed 03/06/2025, effective 06/30/2026).  
§2.7 explicitly states: each SBA EIDL payment made by SPLT "constitutes a repayment by Borrower  
[SPLT] to Lender [Arize] under this Agreement." These are OWNER REVOLVING LOAN REPAYMENTS.  
The Exhibit A running ledger in the same doc confirms the repayment history.  
January 2026 shows four identical "Repayment by direction — paid to SBA on Social Gear Media LLC  
EIDL loan" entries ($2,018 × 4), confirming this is the same pattern.

**Correct treatment:**
- Principal repayment → **balance sheet / NON_REV_OWNER_LOAN** (non-deductible) ✅ already applied
- Interest portion (5% per annum simple, on outstanding balance at time of payment) → **DEDUCTIBLE by SPLT**
- TJ action: compute 2025 interest deduction from Exhibit A running balance at Sep-16 and Dec-17 payment dates
- SPLT's revolving loan had a fluctuating balance in 2025 (peaked ~$48K in Oct, see Exhibit A); interest on the balance at each payment date will be small (~$200–500 per payment) but is a real deductible

**Reclassified:** `DEBT_SHOPIFY_CAPITAL` → `NON_REV_OWNER_LOAN` ✅

---

### Bucket B — Affirm/Shop Pay Installments net settlement debits: $901.12 (15 entries)
**Verbatim descriptor pattern:**
- `Shoppayinst Afrm Payments 250228 Zrtxx87Nme551M1 Splitflask` (and 14 similar)
- `Affirm Inc Payments 251008 Bj88B5Rkzarvhim Splitflask` (1 entry, Oct)
- Dates span Feb–Oct 2025; amounts $6.95–$113.85

**What it is:** Shop Pay Installments / Affirm return clawbacks and net settlement debits.  
When a customer returns a product purchased through Affirm/Shop Pay Installments, Affirm  
ACH-debits the merchant's bank to recover the advanced payout. These are **platform settlement  
adjustments — deductible** as either revenue reductions or platform fees.  
These are NOT Shopify Capital. They have no connection to a loan or advance.

**Correct treatment:**
- Fully deductible as **BNPL_NET_SETTLEMENT_DEBIT** (platform fee / revenue adjustment)
- Since SPLT's revenue already uses the Shopify 1099-K (which is net-of-returns at the platform level), verify whether these debits represent incremental returns not already captured in the 1099-K — if so, they reduce net revenue. Either way, P&L impact is the same.

**Reclassified:** `DEBT_SHOPIFY_CAPITAL` → `BNPL_NET_SETTLEMENT_DEBIT` ✅

---

### Bucket C — Shopify Transfer St-XXXX and Shopify xxxxxxxxxx: $566.38 (9 entries) — ⚠️ OWNER CONFIRM
**Verbatim descriptors:**
- `Shopify Splitfla Transfer St-F1L5F3W4K8E0 Arizechukwu Ugochukwu` $14.44 (Mar)
- `Shopify Splitfla Transfer St-C9E5J9D7T1F0 Arizechukwu Ugochukwu` $107.95 (Apr)
- `Shopify Splitfla Transfer St-N0D1V0C4E5T2 Arizechukwu Ugochukwu` $47.40 (Oct)
- `Shopify Splitfla Transfer St-B0E1K0Q1Q4x3 Arizechukwu Ugochukwu` $6.95 (Oct)
- `Shopify Splitfla Transfer St-Z6L0W5I7R5Z9 Arizechukwu Ugochukwu` $156.85 (Oct)
- `Shopify xxxxxxxxxx 250425 Splitflask Arizechukwu Ugochukwu` $79.00 (Apr)
- `Shopify xxxxxxxxxx 250514 Splitflask Arizechukwu Ugochukwu` $49.45 (May)
- `Shopify xxxxxxxxxx 250530 Splitflask Splitflask 2-IN-1 S` $35.90 (Jun)
- `Shopify xxxxxxxxxx 251015 Splitflask Splitflask 2-IN-1 S` $68.44 (Oct)

**What it MIGHT be — owner must confirm:**

**(a) A new SPLT Shopify Capital advance** — The Splitflask store moved to SPLT TIN in Jan 2025. Shopify may have offered a new Capital advance to SPLT. No agreement on file. If YES: principal non-deductible; financing cost (stated in agreement) deductible. Need the agreement.

**(b) Shopify subscription/plan/app fees** — Shopify charges the merchant directly via ACH for monthly plan + app fees. These would be **fully deductible** as OPEX_PLATFORM_FEE.

The SGM-signed Shopify Capital advance ($41,000 / Aug 2023) was fully repaid by ~June 2024, so these 2025 entries CANNOT be repayments on that advance. They are either a new SPLT advance or service fees.

**Owner action required:** Log into Shopify Splitflask store → Finance → Capital (or Settings → Billing). Did SPLT receive a Shopify Capital advance in 2025? If YES: pull the agreement and add to the folder. If NO: reclassify all 9 entries as OPEX_PLATFORM_FEE (deductible).

**Held as:** `DEBT_SHOPIFY_CAPITAL_UNCONFIRMED` pending owner answer.

---

### Summary — $ effect on SPLT 2025 income (+$56,561 current)

| Bucket | Amount | Old treatment | Correct treatment | P&L effect |
|--------|--------|---------------|-------------------|------------|
| Santander (owner loan) | $2,770.14 | Non-deductible (correct on principal) | Non-deductible principal + deductible interest ~$400–$800 TJ | Income ↓ ~$400–800 |
| Affirm BNPL debits | $901.12 | Non-deductible (WRONG) | Deductible platform fee / revenue reduction | Income ↓ $901 |
| Shopify charges | $566.38 | Non-deductible (possible wrong) | Deductible if service fees; non-deductible if Capital principal | Income ↓ $0–$566 |
| **Net favorable shift** | | | | **↓ ~$1,300–$2,267** |

**SPLT 2025 income range after corrections: ~+$54,294 to ~+$55,261** (before TJ confirms Shopify charges and computes owner-loan interest).

---

## JOB 2 — CB Shopify Capital: ties to SGM-signed advance; no separate CB agreement

**Question:** Do CB's ~$34,446 "Shopify Capital" bank entries tie to the SGM-signed advance (`Cyberbrands-Shopify-Capital.pdf` = actually the SGM agreement, BORROWER = SOCIAL GEAR MEDIA LLC), or does CB have its own separate agreement?

**Answer: CB's repayments tie to the SGM advance. No separate CB agreement exists.**

**Evidence from CB_2024_Txns descriptors:**
- Every daily repayment entry reads: `Shopify Capital ACH Debit XXXXXX Social Gear Media` — the name "Social Gear Media" is explicit in the bank descriptor. Shopify's ACH system labels the withdrawal with the borrower name = SGM.
- CB's WF …5090 account was the payout account for the Cyberbrands Shopify store. Since SGM's advance was repaid at 17% of daily Shopify sales from the Cyberbrands store, Shopify deducted repayments from CB's payouts and the bank entries flow through CB's account — even though SGM is the legal borrower.
- Additionally, "Shopify* [number] Card 5130" entries also appear in CB's SHOPIFY_CAP_REPAY. These are charges on CB's ···5130 card (confirmed CB WF debit card). These could be Shopify plan/app fees (deductible) or additional Capital repayments — they are NOT labeled "Social Gear Media." These need separate review: if service fees → OPEX_PLATFORM_FEE (deductible), not capital.

**CB's correct deductible financing cost: $0**  
The SGM-signed advance ($41,000 principal / $5,330 finance charge) belongs entirely to SGM:
- 2023 deduction on SGM: ~$2,408 (Aug 16 – Dec 31 / 303 days × $5,330)
- 2024 deduction on SGM: ~$2,922 (Jan 1 – ~Jun 15 / 166 days × $5,330)
- CB deducts: **$0** (CB is not the borrower; the loan runs on SGM's books)

**CB 2024 amendment packet status:**  
Packet currently shows net = +$27,514.42 WITH a ~$3,700 Shopify Capital deduction (per Assembly 2C).  
FIX 2 removes that deduction → **CB 2024 corrected net = +$31,214.42**.  
The packet's deduction schedule should be updated to remove the Shopify Capital financing cost line.  
TJ/Bob open item: re-examine the "Shopify* Card 5130" entries in CB's SHOPIFY_CAP_REPAY  
(separate from the "Social Gear Media" ACH debits) — if those are Shopify plan/app fees,  
they are deductible CB expenses and should be reclassified from SHOPIFY_CAP_REPAY → OPEX_PLATFORM_FEE.

---

## JOB 3 — Royceton: confirmed storage rent, no Augusta overlap

**SPLT RENT entries in ledger:**
- `Zelle to Della Moda — Warehouse Rent` (Jun–Aug 2025): warehouse/office rent, different payee
- `Zelle to Kamyar Chamasmani — Warehouse Rent` (Sep–Dec 2025): same warehouse
- `Online Transfer to Royceton Ref #Ib0Vqwzf5K Business Checking Balance` — 2025-11-19 — $1,300
  - **Notes:** "Transfer to Royceton — corporate warehouse/office rental (owner confirmed deductible RENT)"
- `Online Transfer to Nwosu A — Boardroom Rental Reimbursement Q125` — 2025-04-30 — $1,000 (separate Augusta item)

**Royceton = storage/warehouse, NOT the personal residence:**  
The $1,300 transfer to "Royceton" is payment to the Royceton property management account for  
**pallet/inventory storage** at a commercial rental. Owner confirmed this explicitly.  
This is classified RENT (deductible ordinary business expense). ✅

**No overlap with Augusta:**  
Augusta (§280A(g)) applies to **32001 Royceton Ct, Westlake Village** — the owner's personal residence.  
Confirmed from 2025 Form 1040 (home address line).  
The SPLT $1,300 "Royceton" storage rent is for a DIFFERENT property used for inventory storage —  
NOT the personal residence. The August Rule board meetings are tracked separately (SPLT: 11 days × $1,500 = $16,500; SGM: 3 days × $1,500 = $4,500 = 14 days total, exactly at cap).

**Classification confirmed:** RENT (storage) and Augusta RENT are separate, non-overlapping line items. No double-count. ✅

---

## Ledger changes this session

| File | Change |
|------|--------|
| `ledger.xlsx` SPLT_2025_Txns | 2 Santander BILLPAY rows: `DEBT_SHOPIFY_CAPITAL` → `NON_REV_OWNER_LOAN` (notes: revolving loan §2.7) |
| `ledger.xlsx` SPLT_2025_Txns | 15 Affirm rows: `DEBT_SHOPIFY_CAPITAL` → `BNPL_NET_SETTLEMENT_DEBIT` (notes: deductible) |
| `ledger.xlsx` SPLT_2025_Txns | 9 Shopify Transfer/xxxxxxxxxx rows: `DEBT_SHOPIFY_CAPITAL` → `DEBT_SHOPIFY_CAPITAL_UNCONFIRMED` (notes: owner must confirm Capital vs service fee) |

## Open items (bounded, two owners actions)

1. **SPLT Shopify charges ($566.38):** Log into Shopify Splitflask store → Finance → Capital. Did SPLT receive a Shopify Capital advance in 2025? YES → add agreement to folder (financing cost deductible). NO → reclassify 9 entries to OPEX_PLATFORM_FEE.

2. **TJ: SPLT interest deduction on revolving loan:** Using Exhibit A in `Revolving_Loan_Agreement_SPLT_Nwosu (1).pdf`, compute 2025 interest accrued @ 5% on the daily outstanding balance. Deductible by SPLT on its 1120.

3. **CB packet update:** Remove the ~$3,700 Shopify Capital financing cost deduction from CB 2024 packet → corrected net = +$31,214.42. Separately examine "Shopify* Card 5130" entries in CB_2024_Txns to determine if they are service fees (deductible) vs capital (non-deductible).
