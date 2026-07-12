# Verification Pass — 4 Items
**Date:** 2026-07-12  
**Rule:** Document or it doesn't book. No recollection. No assumption.

---

## GMV RESULT FIRST

**2024 GMV: $700,134 — UNCHANGED**  
**2025 GMV: $399,412 — UNCHANGED**

None of the three "ambiguous revenue" items produced a bookable add. Reasons below.

---

## STATEMENT FOOTING

All entity-years report **$0.00 diff per statement** after correction passes:

- SGM 2024 (WF ···8625): all 12 months footed; parser-bug correction pass removed ~$1.37M of phantom debits; CLAUDE.md confirmed "ALL 12 months now FOOT to statement balances (diff $0.00)"
- SGM 2025: 720 rows, year-end balance $492.38 foots
- SPLT 2025 (WF ···0423): all 12 months footed, closing balance $9,850.39
- CB 2024 (WF ···5090): all 12 months (S140–S151) foot to the penny
- CB 2025: all 12 months foot (one-month-at-a-time protocol)

No BankIndex file exists as a separate document. Footing status is recorded in CLAUDE.md narrative and in the amendment packet source tabs.

---

## ITEM 1 — MUNRO & ASSOCIATES $11,079 (SGM 2024)

**Finding: NO SOURCE DOCUMENT EXISTS. Stays OUT of GMV.**

**What the document search found:**
- No invoice, contract, PO, or email containing "Munro" exists anywhere in the folder
- Wire memo field in the bank record: **"Wire from Munro & Associates, Inc."** — no product vs. services distinction preserved in any text-searchable file
- Bank record (SGM_2024_Deposit_Classification_Schedule_v4.xlsx, row 157): `Apr | 4/19 | $11,079.16 | Wire from Munro & Associates, Inc. (B2B customer) | REV`
- Amendment_Decision tab: `Munro & Associates wire | $11,079.16 | PENDING — consulting or SGM product | Management to classify`
- V11_TRIAGE_INVENTORY.md: `"classification PENDING since V11 — Owner must classify"`
- CLAUDE.md final entry: `"✅ Munro & Associates ($11,079, SGM 2024) is CONSULTING — NOT Splitflask. Stays OUT of GMV."`

**Verdict:** The owner answered "consulting." The prompt warned the owner answered both ways in different sessions. No document exists to resolve it independently. "Munro & Associates" is a well-known engineering/teardown firm — name is consistent with a consulting engagement, consistent with the owner's most recent answer.

Per the document rule: **no invoice or contract exists → no independent confirmation of product vs. services.** Owner's verbal final answer = consulting. STAYS OUT of GMV. **$700,134 unchanged.**

⚠️ **TJ action:** Confirm the $11,079 is reported in SGM 2024 gross receipts (it is taxable income regardless of classification). Confirm it is NOT in the product revenue line.

---

## ITEM 2 — SPLT 2025 PAYPAL/AFFIRM/KLARNA GAP ($27,927 HYPOTHESIS)

**Finding: No such deposits exist. Gap hypothesis NOT confirmed. No add.**

**What the bank search found in SPLT 2025 (WF ···0423):**
- **No PayPal deposits.** None.
- **No Klarna deposits.** None.
- **BNPL (Affirm/Klarna via Shopify): $9,062.79 IS in the bank** — but correctly zeroed in the revenue tab because it is already inside the Shopify 1099-K $109,064. Source note: "REMOVED — double-count. CB 2024 owner confirmation that Affirm/Klarna ran through Shopify Payments applies to Splitflask Shopify store." NOT additive.
- **Global-E $25,754.48** appears in the SPLT 2025 bank (REV_GLOBAL_E) but: (a) it is already inside the Shopify SKU export / monthly breakdown ($149,010), per CLAUDE.md: "Global-e: ALREADY captured in Shopify 'Total Sales Breakdown' (admin export incl. Managed Markets orders); bank payouts cross-tie. Zero add." (b) labeled PROVISIONAL in the CPA packet pending a settlement report — not an additive GMV line.

**On the SGM 2024 ShopPay/Affirm claim:** SGM 2024 bank (v4) shows **$15,261.28 of Affirm / Shop Pay Installments** deposits, all classified REV. These are Splitflask Shopify store payments (Affirm/ShopPay settles into whichever bank the store's payout account was pointed at). They are NOT unattributed and NOT a gap — they are already inside the $166,156 Shopify GMV because the Shopify SKU export captures all orders regardless of payment method. NOT additive.

**Verdict:** The $27,927 gap does not exist as a separate non-Shopify-Payments revenue stream in SPLT 2025. **$399,412 unchanged.**

---

## ITEM 3 — UNCOMMONGOODS $1,905 + FROST/SATS $3,651 (SGM 2024)

**Finding: Both confirmed in bank. Both ALREADY INSIDE the verified $86,776 wholesale. NOT additive.**

**UncommonGoods $1,905.12:**
- SGM_2024_Deposit_Classification_Schedule_v4.xlsx, two rows:
  - Row 319: `Jun | 6/21 | $952.56 | UncommonGoods LLC payment (B2B wholesale customer) | REV`
  - Row 375: `Jul | 7/5 | $952.56 | UncommonGoods LLC payment (B2B wholesale customer) | REV`
- Channel_Subtotals tab: `UncommonGoods LLC — EDI wholesale | $1,905.12`
- Amendment_Decision tab: `Von Maur + UncommonGoods EDI | $9,105.12 | SGM — Splitflask wholesale | CONFIRMED`
- GMV_Rebuild_Net_Basis.md footnote confirms 2024 wholesale $86,776 is bank-verified and includes all these accounts. UncommonGoods is inside that total.

**Frost Bank / SATS $3,651.20:**
- Row 645 (v4): `Oct | 10/8 | $3,651.20 | Frost Bank incoming — management classified 7/3/26 as SGM Splitflask wholesale revenue | REV`
- CLAUDE.md: "bank-verified ($82,234 cleared: ESP $57.6K exact, Knocking $11.3K exact, Von Maur $7.2K exact, Frost/SATS $3.7K partial; $4,542 timing gap)"
- The Frost/SATS $3,651 IS the "$3.7K partial" already inside $86,776.

**Verdict:** Both items confirmed from bank records. Both already counted in $86,776 / $700,134. **Zero net change. $700,134 unchanged.**

---

## ITEM 4 — SGM 2025/2026 CHANNELS STILL ACTIVE (DEAL DISCLOSURE ITEM)

**Finding: Walmart marketplace is STILL LANDING IN SGM INTO 2026. Must be disclosed.**

**SGM 2025 revenue by channel and last deposit date:**

| Channel | Total 2025 | Last Deposit |
|---------|-----------|-------------|
| Amazon US (pre-switch Jan 1–Feb 4) | $15,220.80 | Feb 4 (order-date basis) |
| Knocking / CBS Deals | $7,567 (4 wires) | **Feb 14, 2025** — CLOSED |
| Walmart marketplace | $4,026 (16–18 payments) | **Dec 30, 2025** — ACTIVE |
| Ownstar intl wire (TW) | $1,004 | May 15, 2025 (one-time) |
| Consulting (Teslarati/Video Elephant) | $6,011 | — |
| Cash/check (22 deposits, payer identified by owner as Splitflask) | $9,600 | — |

**SGM 2026 bank reads (Jan, Mar, May — verbatim credits):**

*January 2026:*
- `"Amazon Commercia Intl Pymnt 260112 ... Social Gear Media"` — **$94.85**
- `"Wal-Mart Stores 938816987 260113 ... Walmart Stores, Inc"` — **$467.05**
- Branch cash deposits — $932.96 + $1,646.40 (payer unknown)

*March 2026:*
- `"Amazon Commercia Intl Pymnt 260309 ... Social Gear Media"` — **$243.67**
- `"Amazon Commercia Intl Pymnt 260323 ... Social Gear Media"` — **$108.17**
- Branch deposit — $547.68

*May 2026:*
- `"Wal-Mart Stores 983468623 260505 ... Walmart Stores, Inc"` — **$29.55**
- `"WT Fed ... Video Elephant Limited ... Volty Q1 Payment"` — $268.74 (consulting)
- `"Amazon.Com Servi Payments 260529"` — $10.21 + $3.32
- `"Teslarati Bill_Pay 052626"` — $2,632.00 (consulting)
- Branch deposits — $164.64 + $218.96

**Summary of 2026 Splitflask product revenue landing in SGM (3 months sample):**
- Walmart marketplace: $467.05 (Jan) + $29.55 (May) = **$496.60**
- Amazon (likely legacy settlements or international): ~$460 across Jan/Mar/May

**Status of each channel:**
- **Walmart marketplace: STILL ACTIVE IN SGM AS OF MAY 2026** — small payments, but live
- **Knocking: CLOSED** — last payment Feb 14, 2025; zero in 2026
- **Amazon: near-zero trickle** — likely international marketplace residuals or tail settlements; not a live sales channel

---

## DEAL COUNSEL FLAG ⚠️⚠️

**Splitflask product revenue (Walmart marketplace) is still landing in SGM WF ···8625 as of at least January 2026, and possibly continuing.** Kendra is investing in SPLT. The Walmart marketplace account, if tied to SGM, is directing Splitflask revenue outside the entity she is funding.

**Required actions before close:**
1. Identify the Walmart marketplace seller account — is it registered under SGM's entity or EIN?
2. If under SGM: redirect payments to SPLT, or explicitly disclose the channel split in investment documents
3. Confirm whether the Amazon residuals in SGM (small, but non-zero in 2026) are legacy tail-off or an active account that needs redirection
4. Branch cash deposits in SGM 2026 (unknown payer) — if Splitflask revenue, same redirection issue

**This is the same structural issue as the Amazon EIN/bank mismatch (SGM TIN, SPLT bank) — except Walmart is the reverse: payments still reaching SGM's bank after SPLT should be the operating entity.**

---

## SUMMARY TABLE

| Item | Investigated | Source Found? | GMV Change |
|------|-------------|--------------|------------|
| Munro $11,079 — product or consulting? | ✅ | No invoice/contract exists; wire memo uninformative; owner verbal = consulting | None — stays OUT |
| SPLT 2025 PayPal/Affirm/Klarna gap $27,927 | ✅ | No such deposits found in SPLT 2025 bank; BNPL inside Shopify 1099-K; Global-E inside Shopify SKU export | None |
| UncommonGoods $1,905 | ✅ | Confirmed in bank (2 × $952.56) | None — already in $86,776 |
| Frost/SATS $3,651 | ✅ | Confirmed in bank (Oct 8 Frost wire) | None — already in $86,776 |
| SGM 2025/2026 active channels | ✅ | Walmart still landing in SGM Jan 2026 | Not a GMV issue — a deal-structure issue |

**Final GMV: 2024 = $700,134 | 2025 = $399,412 | 2026 H1 = $97,930**

These numbers are bottom-up sourced (platform settlements + SKU exports + bank wires) and bank-reconciled. No change from the last locked state.
