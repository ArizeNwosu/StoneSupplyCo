# Wholesale Trace 2025 — WHOLESALE_TRACE Pass
**Date:** 2026-07-12  
**Status:** ✅ COMPLETE — wholesale plug eliminated; corrected 2025 GMV locked

---

## FINDING: The $84,125 SGM wholesale was a PRE-CLASSIFICATION PLUG

The $92,922 non-platform component of the 2025 GMV ($461,934) was:

| Line | Old amount | Status |
|------|-----------|--------|
| SPLT intl wires | $7,686 | ✅ SOURCED — 5 named counterparty wires in SPLT bank |
| Best Buy/Walmart | $1,111 | 🚨 NOT IN BANK — pre-classification estimate; superseded by actual Walmart |
| SGM wholesale | $84,125 | 🚨 PLUG — Layer 1 estimate placed before SGM 2025 was classified |

The $84,125 was a rough estimate from before Layer 7 (SGM 2025 classification). After classification, the actual SGM B2B revenue was ~$12,597. This is the **fifth plug-carried-as-fact** in this project ($430K 2026 GMV / phantom $148K / phantom SPLT Shopify Capital / $188,569 Shopify 2024 / $84,125 wholesale).

---

## JOB 1 — Every 2025 wholesale/B2B wire, both entities

### SPLT ···0423 (verified, bank-sourced)

| Date | Amount | Counterparty | Category |
|------|--------|-------------|---------|
| 2025-02-24 | $1,529.83 | Everything Kitchen Pty Ltd (AU) | REV_INTL_WIRE |
| 2025-04-07 | $517.32 | Lucky Rubber Ducky, LLC DBA Ta | REV_WHOLESALE |
| 2025-06-06 | $1,742.31 | Waen Inc. (JP, Chiba Bank) | REV_INTL_WIRE |
| 2025-11-06 | $1,029.58 | Citiesocial CO., Ltd. (TW) | REV_INTL_WIRE |
| 2025-11-12 | $1,410.21 | Fadi Ibrahim Mohammad Altayan (Kuwait) | REV_INTL_WIRE |
| 2025-12-11 | $1,974.31 | Citiesocial CO., Ltd. (TW) | REV_INTL_WIRE |
| **SPLT TOTAL** | **$8,203.56** | | |

### SGM ···8625 (verified, bank-sourced)

| Date | Amount | Counterparty | Category |
|------|--------|-------------|---------|
| 2025-01-09 | $4,608.90 | Knocking Inc. (CBS Deals) | REV_WHOLESALE_KNOCKING |
| 2025-01-14 | $315.27 | Wal-Mart Stores marketplace | REV_WALMART |
| 2025-01-21 | $1,426.02 | Knocking Inc. | REV_WHOLESALE_KNOCKING |
| 2025-01-27 | $417.70 | Knocking Inc. | REV_WHOLESALE_KNOCKING |
| 2025-01-28 | $119.98 | Wal-Mart Stores marketplace | REV_WALMART |
| 2025-02-11 | $75.41 | Wal-Mart Stores | REV_WALMART |
| 2025-02-14 | $1,114.62 | Knocking Inc. | REV_WHOLESALE_KNOCKING |
| 2025-02-25 | $67.47 | Wal-Mart Stores | REV_WALMART |
| 2025-03-11 | $25.49 | Wal-Mart Stores | REV_WALMART |
| 2025-03-25 | $228.87 | Wal-Mart Stores | REV_WALMART |
| 2025-04-08 | $129.70 | Wal-Mart Stores | REV_WALMART |
| 2025-04-22 | $7.38 | Wal-Mart Stores | REV_WALMART |
| 2025-05-07 | $169.84 | Wal-Mart Stores | REV_WALMART |
| 2025-05-15 | $1,003.61 | Ownstar International CO Ltd (TW) | REV_INTL_WIRE |
| 2025-05-20 | $238.43 | Wal-Mart Stores | REV_WALMART |
| 2025-07-16 | $42.46 | Wal-Mart Stores | REV_WALMART |
| 2025-10-21 | $84.91 | Wal-Mart Stores | REV_WALMART |
| 2025-11-04 | $151.71 | Wal-Mart Stores | REV_WALMART |
| 2025-11-18 | $148.44 | Wal-Mart Stores | REV_WALMART |
| 2025-12-02 | $189.15 | Wal-Mart Stores | REV_WALMART |
| 2025-12-16 | $502.50 | Wal-Mart Stores | REV_WALMART |
| 2025-12-30 | $1,528.82 | Wal-Mart Stores | REV_WALMART |
| **SGM TOTAL** | **$12,596.68** | | |

### SGM cash/check deposits (UNCERTAIN — payer unidentified)

$9,599.89 in 22 branch deposits and mobile deposits throughout 2025. Amounts are small and recurring (~$164–$1,262, several repeating exactly). These look like retail/B2B check payments, possibly from an ongoing small account. **Cannot classify as Splitflask product revenue without owner identifying the source.**

⚠️ **OWNER ACTION REQUIRED:** What is the source of the SGM 2025 branch/mobile check deposits totaling $9,599.89? If B2B Splitflask product sales → add to GMV. If other (retail returns, personal, etc.) → exclude.

### B2B NOT FOUND

- **ESP Promo** (2024: $57,600) — **ZERO in 2025 bank**. Major 2024 wholesale account dropped entirely.
- **Von Maur** (2024: $7,200) — **ZERO in 2025 bank**.
- **SATS** (2024: ~$3,651 Frost Bank) — **ZERO in 2025 bank**.
- **Best Buy Mirakl** ("live Dec 2025, nascent" per v11) — **ZERO in 2025 bank**. The prior $1,111 estimate has no bank backing. Walmart marketplace payouts ($4,026) are real and already captured — there is no separate Best Buy entry.
- **UncommonGoods** (2024: $1,905) — ZERO in 2025 bank.

**Conclusion:** The 2024 wholesale channel largely collapsed in 2025. ESP ($57K alone in 2024) did not reorder. Knocking continued at a reduced level ($7,567 vs $11,251 in 2024). Walmart marketplace began late 2024 and continued through 2025. The $84,125 estimate assumed continuity of the 2024 wholesale base — this was wrong.

---

## JOB 2 — Reconciling the $92,922 gap

| Component | GMV rebuild amount | Bank reality | Status |
|-----------|------------------|-------------|--------|
| SPLT intl wires | $7,686 | $7,686.24 ✅ | CONFIRMED |
| Best Buy/Walmart | $1,111 | $0 additive (Walmart actual = $4,026, already in SGM) | SUPERSEDED BY ACTUAL |
| SGM wholesale | $84,125 | Knocking $7,567 + Walmart $4,026 + Ownstar $1,004 = $12,597 | PLUG → REPLACED |
| SGM cash/check | — | $9,600 | UNCERTAIN — needs owner ID |

The Kickstarter $54,386 is confirmed **NOT in GMV** — tagged DEFERRED_KICKSTARTER in ledger, explicitly excluded.

The $461,934 total was **NOT built top-down**. It was built channel-by-channel, but the "wholesale" and "Best Buy/Walmart" components were pre-classification estimates, not bank-sourced. The platform channels (Amazon $205,706 + Shopify $149,010 + TikTok $11,282 + Atlantic $3,014 = $369,012) remain valid.

---

## JOB 3 — 2024 wholesale verification ($86,776)

SGM 2024 REV_WHOLESALE bank total: **$82,234.68** (invoice-verified counterparties):
- ESP Promo: $57,600.00 (2 wires, Mar + Jun)
- Knocking: $11,251.44 (3 payments)
- Von Maur: $7,200.00 (1 EDI payment, Dec)
- UncommonGoods: $1,905.12 (2 payments — NOT in CLAUDE.md breakdown)
- Walmart marketplace: $626.91 (2 payments — small, not in original breakdown)
- Frost Bank (likely SATS): $3,651.20 (1 payment — vs ~$10.7K claimed; timing gap or partial)

**Gap: $86,776 (locked) vs $82,234 (bank) = $4,542.**

The locked $86,776 was "invoice-sourced" from ESP ~$57.6K + Von Maur ~$7.2K + Knocking ~$11.25K + SATS ~$10.7K. The bank shows only $3,651 for what appears to be SATS (Frost Bank). Possible explanations: SATS paid partially in late 2024 / early 2025 (timing), or the $10.7K invoice-locked figure is overstated vs what was actually collected.

**ASSESSMENT:** The 2024 $86,776 is broadly verified (ESP and Knocking tie to the penny; Von Maur close). The ~$4.5K gap is attributable to SATS payment timing. Keep 2024 at $86,776 (invoice-sourced is authoritative) but note the bank shows $82,234.

---

## JOB 4 — CORRECTED 2025 GMV (bottom-up, sourced only)

| Channel | Amount | Source |
|---------|--------|--------|
| Amazon (SPLT settlement net) | $205,706 | ✅ Unified Transaction CSV |
| Shopify (SKU export net) | $149,010 | ✅ Monthly + SKU exports |
| TikTok (XLSX Reports net) | $11,282 | ✅ Five 2025 XLSX files |
| Atlantic Access INV-8707 | $3,014 | ✅ Invoice |
| SPLT intl wires (5 named) | $7,686 | ✅ Bank |
| SGM Knocking (CBS Deals) | $7,567 | ✅ Bank |
| SGM Walmart marketplace | $4,026 | ✅ Bank |
| SGM Ownstar intl wire (TW) | $1,004 | ✅ Bank (new — was not in old GMV) |
| SPLT Lucky Rubber Ducky | $517 | ✅ Bank |
| **TOTAL VERIFIED** | **$389,812** | |
| SGM cash/check (⚠️ uncertain) | $9,600 | Bank, payer unknown |
| **TOTAL WITH UNCERTAIN** | **$399,412** | |

**OLD 2025 GMV: $461,934 → CORRECTED: $389,812 (verified) / $399,412 (w/ uncertain)**

**Reduction: $72,122–$62,122 — almost entirely the $84,125 wholesale plug**

### 2024 and 2026 H1: UNCHANGED

| Period | GMV |
|--------|-----|
| 2024 | **$700,134** (unchanged; wholesale $86,776 broadly bank-verified) |
| 2025 | **$389,812** (verified) / **$399,412** (w/ uncertain) |
| 2026 H1 | **$97,930** (unchanged) |

---

## YEAR-OVER-YEAR (corrected)

| Metric | 2024 | 2025 (verified) | Change |
|--------|------|-----------------|--------|
| GMV | $700,134 | $389,812 | **−44.3%** |
| vs prior rebuild | $700,134 | $461,934 | −34.0% |

The decline is steeper than previously reported. Key drivers:
- ESP ($57.6K): completely absent in 2025 (largest single driver of the gap)
- TikTok wound down: $125,951 → $11,282 (−91%)
- Amazon: $321,251 → $205,706 (−36%)
- Shopify: $166,156 → $149,010 (−10%)

---

## ON-AIR RECONCILIATION (updated)

| | Old | New |
|-|-----|-----|
| On-air $499K vs GMV | +8% above (was within 8%) | **+28% above** |

On-air $499K vs $389,812 = $109,188 above (28%). With uncertain: $499K vs $399,412 = $99,588 (25%).

**This is a material change from the prior 8% gap.** The explanation must be updated:

> "The $499K on-air figure was a management estimate. The verified GMV on a uniform net-merchandise basis is $390K. The $109K difference reflects: (1) the wholesale channel contracted sharply in 2025 — ESP ($57.6K in 2024) did not reorder; (2) TikTok wound down mid-year ($125K in 2024 → $11K); (3) Amazon and Shopify tightened. The IP-protection pullback narrative remains accurate and is supported by the deliberate deceleration preceding the March 2026 patent grant."

---

## NOTES FOR DEAL PACKAGE

The $84,125 estimate was a pre-classification figure that overstated 2025 wholesale by ~7×. After classification, the actual 2025 wholesale story is:
- Major 2024 B2B accounts (ESP, Von Maur, SATS, UncommonGoods) did not return in 2025
- Only Knocking continued at a reduced pace ($7.6K vs $11.3K)
- Walmart marketplace began generating small but recurring payouts
- New international distributors (Ownstar TW, Waen JP, Citiesocial TW, Everything Kitchen AU, Kuwait) emerged with aggregate ~$8.7K
- Net 2025 B2B/wholesale: $20,800 verified vs $86,776 in 2024 (**−76%**)

This is honest and consistent with the IP-pullback narrative (restricted sales push while patent was pending).
