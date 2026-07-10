# HANDOFF PACKET — SPLT/SGM Financial Reconstruction: v12 Cut + CPA Packet v2 Revision
**Date:** July 8, 2026 | **From:** prior Claude session (context exhausted) | **Owner:** Riz, Splitflask

---

## 1. MISSION

Multi-session financial reconstruction + tax amendment project for **SPLT INC** (C-corp) and **Social Gear Media / SGM** (CA S-corp), building a due-diligence package for the **Kendra Scott Shark Tank deal**. All financials reconstructed from bank statements — no accounting system exists. All revenue numbers below are now **final, locked, and platform-documented** (user confirmed). The residual-estimation method is retired.

**Two deliverables remain (user said GO on both):**
1. **Cut workbook v12** — edit v11 (do NOT rebuild from scratch): clean-slate Key_Findings + corrected channel data + new tabs. Philosophy per Riz: v12 contains ONLY "previously stated facts" (on-air claims + as-filed returns) and current final facts. **No interim figures, no changelog, no version archaeology** inside the workbook.
2. **Revise both CPA amendment packets to v2** on a **gross-receipts (1099-K-aligned) filing basis**, consistent across 2024 and 2025. Both currently file revenue net-of-fees, which creates an automated IRS 1099-K matching mismatch (~$135K+ for 2024). Taxable income must be UNCHANGED in the restatement.

---

## 2. LOCKED FINAL NUMBERS (do not re-derive; these are verified to source)

### 2024 (SGM operating year)
| Item | Value | Source |
|---|---|---|
| **GMV, consumer-paid/charged basis** | **$751,891** | All four channels platform-documented |
| — Amazon | $321,251.25 (net of refunds $298,379.63) | Settlement/unified txn actuals |
| — Shopify | $188,569 charged ($181,912 settled; $305,066 gross before discounts; discounts $132,253 = 43%) | Shopify sales reports |
| — TikTok Shop | **$155,294.96** (1099-K actual: SKU subtotal $273,886.23 − seller discounts $147,934.77 [54%] + shipping $29,343.50; 5,977 orders; reconciles to the penny) | Nine monthly 1099-K detail CSVs |
| — Wholesale | $86,776 (ESP $57.6K, Von Maur $7.2K, Knocking $11.25K, SATS $10.7K) | Invoices/bank |
| **Four-line bridge** | List demand ~$1,032,079 → promo discounts −$280,188 → GMV $751,891 → **net revenue $560,938** (ties to bank) | |
| **On-air $895,754.12** | = total 2024 deposits, penny-exact: $560,938 revenue + $269,467.48 non-revenue (founder/family loans, refunds, transfers, interest) + $65,348.68 Teslarati/Shaed/Munro consulting | **RULING: deposits reconciliation is PRIMARY for the $895K claim; discount framing is footnote only** |
| Fee reality | Amazon 34.9% haircut; TikTok ~44% (bank-tied, replaces old 37% assumption); Shopify ~3% | |
| Amazon ads deducted from payouts | $12,728 | |

### 2025
- GMV charged ~$489,477 (Amazon $224,155 + Shopify $168,497 + intl/misc ~$12.7K + SGM ~$84,125); settled ~$462K
- **On-air $499K ≈ 2025 GMV within 2%** — key verified claim
- Net revenue $332,015 (SPLT $279,815 + SGM $52,200)
- Amazon ads 2025: $28,980; Amazon 2025 haircut 48.8%

### 2026 H1
- Amazon gross $81,680 (disbursed $42,180); Shopify settled $25,261 / charged $26,945; ads $8,474
- Shopify discount trend 43% → 34% → 48% (2024/2025/2026H1). Prepared one-liner: bundle promos + airing-prep list-building.

### 2024 MONTHLY BY CHANNEL (for new Channel_Monthly_Actuals_2024 tab — all computed & tied)
| Month | Amazon charged | Amazon refunds | Shopify gross | TikTok (1099-K) |
|---|---|---|---|---|
| Jan | 122.57 | 0 | 13,534.67 | 0 |
| Feb | 11,062.49 | −626.57 | 19,603.11 | 255.83 |
| Mar | 112.00 | −448.00 | 7,221.86 | 0 |
| Apr | 25,369.79 | 0 | 6,693.59 | 0 |
| May | 19,456.12 | −3,179.08 | 32,960.81 | 2,177.85 |
| Jun | 24,248.22 | −1,469.88 | 25,768.35 | 5,044.69 |
| Jul | 48,911.50 | −2,735.43 | 46,471.50 | 6,265.76 |
| Aug | 45,123.24 | −3,829.12 | 56,032.32 | 32,133.24 |
| Sep | 34,128.96 | −3,676.00 | 30,249.73 | 46,641.32 (peak) |
| Oct | 24,704.76 | −2,006.16 | 24,253.05 | 16,868.95 |
| Nov | 31,665.72 | −2,164.34 | 18,315.12 | 18,613.97 |
| Dec | 56,345.88 | −2,737.04 | 23,961.79 | 27,293.35 |
| **Total** | **321,251.25** | **−22,871.62** | **305,066.42*** | **155,294.96** |

\*Shopify monthly values shown are gross sales over time (before discounts) — label the tab column accordingly; charged basis annual = $188,569.

---

## 3. THE 1099-K PROBLEM & THE FIX (packet v2 spec)

**Confirmed this session:** BOTH packets direct net-of-fees filing.
- 2024 packet, Filing_Instructions verbatim: *"Revenue reported NET of platform fees ($560,938) — matches bank deposits exactly. NOT grossed-up."*
- 2025 packet: SPLT gross receipts $279,815 and SGM $52,200 are net-of-deposit figures.

**Exposure:** IRS matches Σ(1099-Ks) to line 1a. 2024: TikTok $155,295 (in hand) + Amazon ~$350K est. (gross incl. tax/shipping) + Shopify Payments ~$184–190K est. ≈ $690K+ vs filed $560,938 → ~$135K+ automated mismatch (CP2000 risk). Same structural issue in 2025.

**Fix (income-neutral, both years, consistent):**
- Line 1a = sum of 1099-Ks AS ISSUED + non-processor revenue (wholesale/direct). Placeholders required for actual Amazon & Shopify 1099-K forms — **Riz must pull them** (Amazon: Seller Central → Tax Document Library; Shopify: Finances → Documents).
- Line 1b returns & allowances: refunds (2024 Amazon −$22,872; Shopify returns ~$6,658; TikTok refunds flag — 1099-K is unadjusted/gross of refunds).
- New deduction lines: platform selling/FBA fees, deducted ad spend (Amazon ads 2024 $12,728 / 2025 $28,980), TikTok fees (≈ 1099-K gross − TikTok-labeled bank deposits), Shopify processing (~3%).
- **Bottom line unchanged: 2024 SGM −$14,903; 2025 SPLT $6,927 (est. tax $2,067); 2025 SGM −$4,778.**
- Each v2 packet gets a GROSS_RECEIPTS_BASIS tab + rewritten Filing_Instructions bullet (replace the net-basis language); everything else in the packets carries forward unchanged.

---

## 4. v12 WORKBOOK SPEC (edit v11 via openpyxl; save as SPLT_INC_Financial_Reconstruction_v12.xlsx)

Tabs to modify/add:
1. **Key_Findings** — wipe and rewrite as clean final positions anchored to: on-air claims, as-filed returns, current locked facts. No interim numbers.
2. **Revenue_by_Channel** — platform actuals for 2024/2025/2026 (Section 2 above); fix the previously-swapped channel labels.
3. **Revenue_GMV_vs_Net** — the four-line bridge for 2024 (List $1,032,079 → discounts −$280,188 → GMV $751,891 → net $560,938) and 2025 equivalent (GMV $489,477 → net $332,015).
4. **OnAir_Claims_Reconciliation** — 2024: $895,754.12 = deposits, itemized. 2025: $499K vs $489K GMV, within 2%.
5. **Fee assumptions** wherever referenced — Amazon 35%/49% (2024/2025), TikTok 44%, Shopify 3%.
6. **NEW: Tax_Filing_Basis_1099K** — the Section 3 analysis + consistency requirement across both years.
7. **NEW: Channel_Monthly_Actuals_2024** — the monthly table above.
8. **PL_Monthly_2024** — leave numbers as-is; relabel the note (the monthly proxy used was actually Shopify monthly, not Amazon).

Conventions (xlsx skill — READ /mnt/skills/public/xlsx/SKILL.md first): formulas not hardcoded totals; blue inputs / black formulas; $#,##0 with parentheses negatives; zero formula errors; run recalc + verify before presenting.

**Data-room hygiene (tell Riz to do, not Claude):** remove v3–v11 (superseded $836K-GMV era) from any shared data room; rename the two cross-labeled Drive files — "Amazon-Gross sales over time - 2024" (id 1r4d0NUllJEsygzJl1IdTGw9RAaDJvC45) is actually SHOPIFY data; "Shopify-SalesDashboard-4-23-26" (id 1ha4N0TNgc0nMfQe8SqrmYR1W8hjbzDr2) is actually AMAZON.

---

## 5. FILE INVENTORY (Google Drive — download fresh via download_file_content; the new container starts empty)

| File | fileId |
|---|---|
| Root project folder | 1WBAv3U9NFEIPyQoH3zP7wdPWEC8rtpLe |
| Claude Artifacts folder | 189hJGlyu8quBZMwcQzLd4pinPxQINETo |
| **SPLT_INC_Financial_Reconstruction_v11.xlsx** (base for v12; 67,643 bytes, ~24 tabs) | 1QvUpDQa19rz0nBeYPTePBQaWMaNIonEO |
| **SGM_2024_1120S_Amendment_Packet_FINAL.xlsx** (base for 2024 v2) | 1ruQ-P6D3qkWx5YbUd4gsNvQS62ovgvWq |
| **SPLT_SGM_2025_Tax_Amendment_Packet.xlsx** (base for 2025 v2) | 17tf7y3t5oOa7b1jg8MZn-zxmXx3WiNkX |
| CPA_Amendment_Cover_Letter.docx | 1n5Swu_jx4jvooibHoaYnZ3zL45x7FKad |
| SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx | 1Nl33fDCoDWmVrGM_bjP6Z7zq9V8hqC-_ |
| SGM_2024_Deposit_Classification_Schedule_v4.xlsx | 1qFtraGT92AkyWhpisXCETf8KYXsCBILz |
| TikTok 1099-K folders (9 monthly detail CSVs) | 1BboVwQBvJBBSKAsj3RkGM7qPhrKb4RwK / 17mX6-AlLGrf_MHrDxAT2WJnRYw21GoYX |

**Container bridge method (proven this session):** direct curl of Drive URLs FAILS (auth wall). Working path: `Google Drive:download_file_content` returns base64 → write the base64 string into the container via create_file/heredoc → `base64 -d` → edit with openpyxl → save → present_files → Riz uploads to Drive himself. All source CSVs (TikTok/Amazon/Shopify/ad spend) were user-uploaded and are gone with the old container — **not needed again; every derived number is in Section 2.**

---

## 6. CURRENT PACKET CONTENTS (key figures, so re-reading is optional)

**2024 packet (SGM 1120-S amendment, EIN 83-3077502, box H(4)):** Line 1a $418,990→$560,938; COGS $270,032→$393,532 ($455,932 purchases − $62,400 ending inv = 6,000 units @ $10.40, photo count 12/24/24); loss −$33,351→−$14,903; rents 22,500→30,241; advertising 6,901→6,368; line 20 other deductions $107,380 HOLD (bank rebuild $107,983). Mold reclass: $8,733.33 (12/13/24, Fed#02537) CONFIRMED → reclassify + Sec 179 (Purchases→$447,198.77); $8,733.00 (9/10/24, Fed#04831) AMBIGUOUS — do NOT reclassify until Kangdao confirms. Debits reconcile within $10.45 across $888,555.

**2025 packet:** SPLT 1120-X: gross receipts $369,981→$279,815 (strip $90,166 equity/Kickstarter/founder loans/mold pass-through); COGS $123,043 (11,244 units @ $10.82 + $1,432 B2B); ending inv 3,756 units = $40,624; Chase card (...3247) recovery $95,691 (card $113,499 − $17,809 non-Splitflask Meta); OpEx bank $54,155; taxable income $6,927, est. tax $2,067; $12,883 draw = shareholder-loan repayment (ending +$25,287 owed to Riz). SGM: income $130,976→$52,200; COGS $21,632 (2,080 units @ $10.40); OpEx ~$35,346 (ESTIMATE — needs 12-mo debit rebuild); ordinary income −$6,899→−$4,778; ending inv 3,920 units = $40,768; Atlantic Access 1,400 units = EU consignment. 15 CPA (TJ) action items incl. #6 verify card-Meta vs bank-Meta not double-billed.

---

## 7. FIRST MOVES FOR THE NEW SESSION

1. Read /mnt/skills/public/xlsx/SKILL.md.
2. Download the three base xlsx files from Drive (IDs above) → decode into container.
3. Build v12 per Section 4; build both packet v2s per Section 3. Run recalc, verify zero errors.
4. present_files all three. Riz uploads to Drive.

## 8. OPEN ITEMS CARRIED FORWARD (not part of this build)

- Riz to pull actual Amazon + Shopify 1099-K forms (2024 & 2025) — fills packet placeholders.
- Facebook ads additive-vs-overlapping (bank Meta vs card Meta) — determines SPLT breakeven vs ~$101K profitable; CPA item #6.
- Patent valuation: stays $100K conservative (open question: $100K vs $2M).
- Contractor Agreement $3,500/mo validation vs actual SGM transfers; Chukwuezugo promissory note drafting.
- Vehicle Use Agreement date corrections (SGM paid 8/12/25 pre-effective-date; gaps Oct/Nov 2025, Jan/Apr 2026).
- Kangdao confirmation on the ambiguous 9/10/24 $8,733.00 wire (mold vs product).
- Dec 9–31, 2025 Chase card tail (~$3–6K) from Jan-2026 statement; Feb Sydney trip substantiation.
- User style: sparring partner, direct answers first, pressure-test after, no gating behind questions, fast execution once direction is set.
