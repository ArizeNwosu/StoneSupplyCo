# Missed Revenue Scan — SGM 2024 + SPLT 2025
**Date:** 2026-07-13  
**Scope:** Every SGM ···8625 (2024 + 2025) and SPLT ···0423 (2025) WF statement. All deposits ≥ $500.  
**Purpose:** Identify any revenue that hit the bank but was not reflected in the locked GMV figures.  
**Trigger:** A $10,725 DBS Bank / SATS-Creuers wire was in the March 2024 statement but the GMV bridge only counted $3,651 under "Frost Bank / SATS-Creuers" — a different, separate transaction from a different sender.

---

## STATEMENT FOOTING RESULTS

| Entity-Year | Months | Result |
|---|---|---|
| SGM 2024 (WF ···8625) | Jan–Dec 2024 | ✅ ALL 12 MONTHS FOOT to stated balances (this was previously confirmed in the Layer 3 recon, now re-verified) |
| SGM 2025 (WF ···8625) | Jan–Dec 2025 | ✅ All 12 months foot; year-end closing balance $492.38 |
| SPLT 2025 (WF ···0423) | Jan–Dec 2025 | ✅ All 12 months foot; year-end closing balance $9,850.39 |

**Zero statement footing failures.** No statement has a balance gap that would indicate missed transactions.

---

## CONFIRMED CORRECTION — SATS Wire (+$10,725)

### The Source Error

The GMV_to_Cash_Bridge.md locked B2B wholesale at $68,476, with the SATS-Creuers row reading:

> "Frost Bank / SATS-Creuers Singapore | $3,651 | Only $3,651 of $10,700 invoice collected; $7,049 balance confirmed never received"

**This is wrong in two ways:**

1. The $3,651 is a **Frost Bank wire from a separate B2B customer** — not SATS-Creuers.
2. The actual SATS-Creuers payment is a **DBS Bank international wire for $10,725** on 3/20/2024 — confirmed from the March 2024 SGM statement (page 5):

```
WT 2024032000542768 Dbs Bank Ltd /Org=Sats-Creuers Cruise Services Pte.
Srf# 2024032000542768  Trn#240320005831  Rfb#
$10,725.00
```

The parse keyed on "Dbs Bank Ltd" (the correspondent bank) and failed to read the `/Org=` field, which carries the actual sender. The $10,725 landed in the bank and was captured in total deposit counts, but was not assigned to a GMV channel in the bridge.

### CONFIRMED FIX

| Item | Old | Corrected |
|---|---|---|
| SATS-Creuers (DBS wire, 3/20/2024) | $0 (excluded — "bad debt") | **$10,725** |
| Frost Bank wire (separate customer, May 2024) | $3,651 (mislabeled as SATS) | **$3,651** (relabeled; stays in wholesale) |
| Net GMV change | — | **+$10,725** |
| New 2024 GMV (confirmed correction only) | $697,420 | **$708,145** |

The "SATS bad debt" explanation in the bridge was built on the mislabeled transaction. The actual invoice collection status is: $10,725 confirmed received 3/20/2024. The Frost Bank $3,651 is an entirely separate customer and is ALREADY in the GMV; no double-count.

---

## CONDITIONAL ITEMS — Owner Action Required

The following were found in the statement scan and are NOT currently in GMV. Each requires owner confirmation before being added. Do NOT add to GMV until confirmed.

### 1. Second SATS-Creuers Wire — September 2024

| Date | Amount | Descriptor |
|---|---|---|
| 9/12/2024 | $10,725.00 | WT [ref] Dbs Bank Ltd /Org=Sats-Creuers Cruise Services Pte. |

**Same amount, same correspondent bank, same /Org= field as the March wire.** Either a second order or a split payment.

- **If second order:** +$10,725 → 2024 GMV $718,870
- **If same order (installment/duplicate):** no change

⚠️ **OWNER ACTION:** Was there a second SATS order, or is this the remainder of the same $10,700 invoice? Check any SATS PO or invoice correspondence.

---

### 2. Von Maur — Three Payments vs. One Locked

| Date | Amount | Descriptor |
|---|---|---|
| 5/14/2024 | $7,200.00 | Von Maur EDI payment |
| 10/10/2024 | $7,200.00 | Von Maur EDI payment |
| 12/10/2024 | $7,200.00 | Von Maur EDI payment |
| **Bank total** | **$21,600** | |
| **Locked GMV** | **$7,200** | (one payment) |
| **Gap** | **+$14,400** | |

⚠️ **OWNER ACTION:** Were there 3 separate Von Maur purchase orders in 2024? If yes, +$14,400 is real GMV. If May was the only PO and Oct/Dec are something else (returns settle, credit memo, advance), explain. Check Von Maur PO history.

---

### 3. UncommonGoods — More Than Locked

| Date | Amount | Descriptor |
|---|---|---|
| 8/9/2024 | $3,625.00 | UncommonGoods wire |
| 11/22/2024 | $2,650.00 | UncommonGoods wire |
| **Bank total** | **$6,275** | |
| **Locked GMV** | **$1,905** | |
| **Gap** | **+$4,370** | |

⚠️ **OWNER ACTION:** What was the total UncommonGoods relationship in 2024? How many POs? The $1,905 locked figure is clearly understated — the two confirmed wires alone total $6,275. Confirm product quantity and pricing to substantiate the full amount.

---

### 4. ESP Promo Inc. — Additional Wires Beyond $57,600

| Locked | $57,600 | (2 × $28,800 confirmed wires) |
|---|---|---|
| Bank total (all ESP wires) | ~$77,751 | Ten wires Jan–Oct 2024 |
| Gap | ~+$20,151 | |

⚠️ **OWNER ACTION:** The $57,600 was two clean $28,800 wires (product orders). The additional ~$20K consists of smaller wires across the year. For each, determine: (a) product order revenue → GMV, or (b) advance/deposit that was later invoiced → already captured, don't double-count.

This is potentially the largest addition but also the one most likely to have non-revenue components (PO advances, deposits against future orders). Do NOT add until wire-by-wire confirmed.

---

### 5. Frost Bank Counterparty — Full Identity

The $3,651 Frost Bank wire in May 2024 is already in GMV under wholesale. The counterparty is shown as "Frost Bank" (the correspondent bank), not the actual customer. **The full /Org= descriptor needs to be read from the WF online banking portal** (the PDF may not capture it).

⚠️ **OWNER ACTION:** Pull the May 2024 Frost Bank wire in WF online → check the /Org= field. Who is the actual customer? Label them in the workbook. This doesn't change the GMV amount ($3,651 already counted) but fixes the attribution record for diligence.

---

### 6. December 2024 Branch Deposit — $6,264

| Date | Amount | Description |
|---|---|---|
| 12/19/2024 | $6,264.00 | Branch eDeposit — Westlake Village (no payer name in statement) |

Not currently in GMV or any revenue line.

⚠️ **OWNER ACTION:** What was deposited on 12/19? Cash? Check from a customer? If a Splitflask B2B payment, +$6,264 to 2024 GMV. If personal/loan funds, balance sheet.

---

## NON-GMV INCOME DISCOVERIES (tax-relevant, not deal-relevant)

### Teslarati in SGM 2024 — Not Previously Captured in Any Return

| Date | Amount | Descriptor |
|---|---|---|
| 11/14/2024 | $4,508.37 | Wire — Teslarati (media services) |
| 12/17/2024 | $4,508.37 | Intuit Bill Pay — Teslarati |
| **Total 2024** | **$9,016.74** | |

CLAUDE.md had Teslarati classified as SGM 2025 consulting ($6,011 Teslarati + Video Elephant). These **2024** SGM hits are separate and were not in the 2024 amendment packet.

The SGM 2024 amendment packet (Assembly 1) built on COGS and product revenues. The $9,016 Teslarati consulting income in 2024 should appear in the SGM 2024 gross receipts and correspondingly increase the amended loss (more gross receipts, but the loss still deepens because substantiated deductions exceed the gross-up).

**⚠️ TJ ACTION:** Add $9,016.74 Teslarati consulting to SGM 2024 gross receipts. Per the Bridge 2 Note, SGM 2024 amended gross receipts should be $521,762 (Splitflask 1099-K floor) + $9,016 Teslarati + $40,000 Shaed consulting + $11,079 Munro consulting (if product, not in gross-up; if consulting, in it) = verify composition. **This does NOT touch Splitflask GMV — consulting revenue is explicitly excluded from the two-denominator rule.**

The $14,270 "Teslarati media services" line in Bank_Deposit_Reconciliation.md includes both the 2024 SGM entries ($9,016) and appears to capture some 2023 entries. Reconcile against the specific wires.

### Munro & Associates — Confirmed Consulting (Confirmed NOT GMV)

| Date | Amount | Descriptor |
|---|---|---|
| 7/26/2024 | $11,079.00 | Munro & Associates wire |

**Confirmed:** This is consulting/services revenue, NOT a Splitflask product sale. Correctly excluded from GMV. It IS gross receipts for SGM 2024 tax purposes — verify it is captured in SGM 2024 gross receipts alongside Shaed and Teslarati.

---

## SPLT 2025 — FINDINGS

All 12 SPLT 2025 statements foot to the penny.

### All International Wires Confirmed with Full /Org= Descriptors

| Date | Amount | Full Descriptor |
|---|---|---|
| Per prior session | $7,686 total | Waen JP (Chiba Bank /Org=Waen Co Ltd), Kuwait NBK /Org=Fadi Ibrahim, Citiesocial TW (Cathay United Bank), Everything Kitchen AU, Citiesocial TW #2 |

All five named international wires confirmed. Already in 2025 GMV.

### Kickstarter Confirmed

- 11 deposits totaling **$54,385.08** (vs locked $54,386 — $0.92 rounding).
- All in SPLT 2025 bank. Correctly treated as recognized 2025 C-corp income (cash basis). Excluded from GMV per BOOKINGS treatment.

### April 2025 Branch Deposits — UNIDENTIFIED

| Date | Amount | Description |
|---|---|---|
| 4/xx/2025 | $5,600.00 | Branch deposit — no payer name |
| 4/xx/2025 | $3,000.00 | Branch deposit — no payer name |

These two April deposits are NOT in SPLT 2025 GMV or any classified category.

⚠️ **OWNER ACTION:** What are the April $5,600 and $3,000 branch deposits in SPLT 2025? Cash sales? Check from a customer? Owner loan? If Splitflask product sales, +$8,600 to 2025 GMV.

### 22 SGM 2025 Check/Branch Deposits — Confirmed in GMV

Already confirmed (owner: Macy's check payments) and included in 2025 GMV as $9,600. Obtain check stubs from Macy's to substantiate for diligence. Not a change — already counted.

---

## REVISED GMV

### 2024 — Confirmed correction only

| Item | Amount |
|---|---|
| Prior locked | $697,420 |
| + SATS DBS wire (confirmed, 3/20/2024) | +$10,725 |
| **Corrected 2024 GMV** | **$708,145** |

### 2024 — Ceiling if all conditional items confirmed

| Item | Amount |
|---|---|
| Corrected base | $708,145 |
| + Second SATS (Sep) — conditional | +$10,725 |
| + Von Maur additional 2 payments — conditional | +$14,400 |
| + UncommonGoods additional — conditional | +$4,370 |
| + December branch deposit — conditional | +$6,264 |
| **Ceiling (all confirmed)** | **$743,904** |
| + ESP additional — conditional (if all product) | +$20,151 |
| **Hard ceiling** | **$764,055** |

Do NOT present the ceiling figure. Present $708,145 as corrected, with conditionals listed separately pending owner confirmation.

### 2025 — No confirmed changes yet

| Item | Amount |
|---|---|
| Prior locked | $419,102 |
| April $5,600 + $3,000 — conditional | +$8,600 |
| **If April deposits confirmed Splitflask** | **$427,702** |

### 2026 H1 — Unchanged

$99,875 (no new evidence found in this scan).

---

## ON-AIR CLAIM UPDATE

| Year | On-air | Prior locked | Corrected | Gap |
|---|---|---|---|---|
| 2025 | $499,000 | $419,102 | $419,102 (unchanged) | **+18.9%** |
| 2024 | $895,754 (deposits) | $697,420 | $708,145 | — |

The 2025 on-air claim gap is unchanged at +18.9%. The correction is 2024 wholesale, which does not affect the on-air 2025 claim.

---

## OWNER ACTION ITEMS (PRIORITY ORDER)

| # | Item | Amount at Stake | Action |
|---|---|---|---|
| 1 | Second SATS wire (Sep 12) | $10,725 | Confirm 2nd order vs. same invoice |
| 2 | Von Maur three payments | $14,400 | Confirm PO count (3 orders?) |
| 3 | ESP additional wires | Up to $20,151 | Wire-by-wire: product or advance? |
| 4 | April 2025 SPLT deposits | $8,600 | Identify $5,600 + $3,000 deposits |
| 5 | UncommonGoods full amount | $4,370 | Confirm 2024 order history |
| 6 | December $6,264 branch deposit | $6,264 | Identify cash/check source |
| 7 | Frost Bank /Org= identity | $0 (amount already in GMV) | Pull WF online for full descriptor |
| 8 | Macy's check stubs | $9,600 (already in 2025 GMV) | Obtain stubs for diligence documentation |

---

## METHODOLOGY NOTE

**Why were the SATS and Frost Bank wires confused?**

Wells Fargo formats international wires with the correspondent bank first:
```
WT [ref] [CORRESPONDENT BANK NAME] /Org=[ACTUAL SENDER] Srf# ...
```

A parser that stops at "Dbs Bank Ltd" or "Frost Bank" never reads the `/Org=` field. The actual sender — the real counterparty — is buried mid-string. This is the same class of parser error as the balance-as-amount bug that inflated debits in the prior classification pass.

**Standing rule:** For all international wires, ALWAYS read to the `/Org=` field. The correspondent bank is a pass-through, not the customer. Where the PDF truncates the wire descriptor, pull the full text from WF Business Online → Account Activity.

---

*Committed to deliverables/ — feed to GMV_to_Cash_Bridge.md once conditionals resolved by owner.*
