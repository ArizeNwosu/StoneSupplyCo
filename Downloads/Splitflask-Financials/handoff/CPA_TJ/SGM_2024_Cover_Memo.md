# SGM 2024 Form 1120-S — Amendment Cover Memo

**To:** CPA / Bob (preparer)
**From:** Riz Nwosu, Social Gear Media LLC
**Re:** Amended 2024 Form 1120-S — Social Gear Media LLC (EIN 83-3077502)
**Date:** 2026-07-10
**Status:** DRAFT — CPA to finalize before filing

---

## Purpose

SGM's originally filed 2024 1120-S reported gross receipts of $418,990 on a net-of-fees deposits basis. A line-by-line bank reconstruction and 1099-K reconciliation show that figure sits below the SGM TIN's 1099-K gross floor of $604,026. This amendment restates gross receipts to the 1099-K floor (Splitflask-only portion: $521,762), adds the corresponding platform fee deductions as explicit line items, and corrects understated COGS. The amendment cures 1099-K matching exposure on Amazon US/MX/CA and TikTok without raising tax.

---

## What Changed vs. As Filed — and Why

### 1. Revenue (gross receipts)

| | As Filed | Amended |
|---|---|---|
| Gross receipts | $418,990 | $521,762 |
| Basis | Net bank deposits | Splitflask-only 1099-K floor |
| Gross-up needed | — | +$102,772 |

The original $418,990 was derived from net deposits — funds that reached the SGM bank account after Amazon, TikTok, and Shopify had already deducted their fees. This is the technically correct denominator (net-of-fees method is internally consistent), but it sits below the 1099-K floor that IRS matching sees. The amended return restates to the gross-of-fees 1099-K floor, then deducts the fees explicitly so taxable income is unchanged or improved.

The Shopify Splitflask store (1099-K on Personal TIN …7639, $164,614) is **not** included in SGM gross receipts (Option A: report on Personal Schedule C — 1099-K TIN matches filer). CPA to confirm Option A vs. Option B.

### 2. COGS

| | As Filed | Amended |
|---|---|---|
| COGS | $270,032 | $332,468 (inv. method) / $390,068 (cash method) |

The as-filed $270,032 was the owner's earlier estimate, given to CPA in good faith, that understated the actual inventory purchases. The reconstructed figure ($390,068 in total purchases) comes from 21 confirmed wire payments to Dongguan Kangdao Industrial Co. Ltd., plus the mold fabrication invoice ($25,000), product samples ($2,858), and minor supplier costs ($126) — all classified from footed bank statements.

Under the inventory method: $390,068 purchases − $57,600 ending inventory (6,000 units × $9.60 unit cost, physical count 12/24/24) = **$332,468 COGS**.
Under the cash method: $390,068 (no ending inventory adjustment).

**This is a replacement, not an addition**: the amended return uses the reconstructed COGS in place of the $270,032, not on top of it.

### 3. Platform fees (new explicit deductions, offset the gross-up)

| Platform | Amount | Basis |
|---|---|---|
| Amazon US — referral + FBA | $52,007 | Stated in Unified Transaction CSV |
| Amazon US — returns | $22,838 | Stated in same CSV |
| TikTok — fees + shipping + seller ads | $51,352 | Stated in TikTok Seller Center quarterly files |
| Amazon MX + CA fees | ~$26,996 | **ESTIMATE** — CPA action: request Seller Central reports |
| Shopify Payments fee | ~$5,276 | **ESTIMATE** — only if Shopify routes to SGM (Option B) |

These deductions are sourced from settlement reports, not back-derived. The gross-up adds $102,772 in revenue; sourced fees ($126,197) exceed that gross-up, making the amendment favorable net of COGS and fee changes.

TikTok note: $41,702 of co-funded promotions (TikTok-funded, not seller-borne) is **excluded** from deductions. Only the $51,352 of seller-borne costs is claimed.

### 4. Freight — new deduction

SGM paid $89,121 to Guangzhou Zunhuang International Freight and CGL Los Angeles for shipment of both Splitflask and Cyberbackpack goods. After intercompany reconciliation with Cyberbrands (Layer 6), SGM's net Splitflask freight is **$65,918** (Cyberbrands reimburses $15,067; $8,135.50 treated as intercompany receivable per Path b). This $65,918 was not in the original 1120-S deductions and is added as a new line.

### 5. Non-deductibles removed

The bank reconstruction found $23,676 in SGM→AmEx payments that were paying down Riz's personal AmEx balance (a 2021 carry balance, not SGM business charges). These are owner draws and are not deductible. The net AmEx business charges (PatentYogi, ALL IN Podcast, IONOS: ~$720) remain deductible. Similarly, Shopify Capital principal (~$37K) is excluded per owner decision; only the interest component is deductible (CPA: pull Shopify Capital statement to isolate interest).

---

## Result

| Method | As Filed | Amended |
|---|---|---|
| Gross receipts | $418,990 | $521,762 |
| COGS | $270,032 | $332,468 (inv.) / $390,068 (cash) |
| Platform fees | (netted in revenue) | $126,197 sourced |
| Freight | — | $65,918 |
| Operating deductions | $182,309 | $189,517 |
| **Ordinary income (loss)** | **($33,351)** | **(~$192,339) inv. / (~$249,939) cash** |

The amendment results in a deeper loss passed through to Riz/Cheryl's K-1. It does **not** raise tax. All sourced-only deductions confirm this direction; confirmed by Layer 5 coherence audit (no double-count) and Layer 6 intercompany reconciliation.

---

## Open CPA Decisions (needed before filing)

1. **Filing model**: Gross-up model (this packet, cures 1099-K matching) vs. Net-deposits packet (`SGM_2024_1120S_Amendment_Packet_FINAL.xlsx`, simpler but matching risk may remain). Models differ by ~$158K in reported loss.

2. **Accounting method for inventory**: Cash method (COGS = $390,068, no ending inventory) vs. inventory/accrual method (COGS = $332,468, deducts $57,600 ending inventory). Both favorable. CPA elects under IRC §471 small-business exception.

3. **Shopify entity routing**: Option A (Splitflask store on Personal Schedule C, recommended) vs. Option B (include in SGM 1120-S). Decision affects whether Shopify $164,614 appears on this return.

4. **Amazon MX/CA fees**: ~$26,996 is an estimate. Request Seller Central settlement reports for MX and CA accounts to source this figure before filing.

5. **Mold $25,000 (Chukwuezugo Nwosu)**: Related-party payment (Riz's brother). Confirm arm's length and commercially reasonable rate. Reclassify from COGS to Section 179 if appropriate (no income effect with S179 election, but different form line).

6. **Mold $8,733.33 (Kangdao 12/13/24)**: Confirm this is a separate mold phase, not a duplicate of the Chukwuezugo $25K.

7. **SBA EIDL**: Confirm $9,528 interest is interest-only (principal is non-deductible). Provide principal/interest breakdown.

8. **Shopify Capital interest**: Isolate interest from principal repayment. Pull Shopify Capital 2024 statement.

9. **Card ···1400 ads ($5,145)**: Confirm if this is an SGM bank-debit card (already in the reconciled $6,368 ads) or a separate credit card (incremental deduction of $5,145). Small item but needs to be clean before filing.

10. **Rent ($30,241 vs as-filed $22,500)**: Confirm the additional $7,741 is deductible warehouse rent under a signed agreement.

11. **Cyberbackpack store on SGM TIN**: CPA to confirm Shopify CB store ($82,264) is excluded from SGM amended gross receipts (Option A routing) and handled on the Cyberbrands return instead.

---

## Context Note for Diligence

The entity losses shown here ($192K–$250K, inventory vs. cash method) are the **tax picture** for compliance purposes. They are not the deal picture. Splitflask GMV (consumer-paid, tumbler-only) was $751,891 in 2024 and approximately $514K in 2025. The losses reflect a DTC launch-and-scale year with heavy inventory purchasing, freight, and advertising — a normal cost profile for a fast-growing physical goods brand. These figures go in the tax/compliance section of the diligence package; GMV and demand metrics go in the brand/deal section. They are not in tension.

---

## Supporting Documents in This Packet

- `SGM_2024_Amendment_Packet.xlsx` — 7-tab workbook: Summary, 1099-K Recon, Revenue, COGS & Inventory, Deductions, Intercompany, Source Index
- `PATH_B_FEE_SUBSTANTIATION.md` — fee sourcing session report
- `LAYER_5_COHERENCE_AUDIT.md` — waterfall coherence audit (no double-count confirmed)
- `ledger.xlsx` → tabs SGM_2024_Txns, CB_2024_Txns — classified, footed transactions
- `SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf` — original return
- `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx` — Model B net-deposits packet (alternative)

All bank-based figures trace to footed statements (opening ± transactions = closing balance, verified for all 12 months). No figure in this packet comes from an unfooted parse.
