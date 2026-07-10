# Path B — SGM 2024 Fee Substantiation Session Report
**Date:** 2026-07-09  
**Scope:** Steps 1–3 only. Step 4 (neutrality proof) BLOCKED — no balance-reconciliation commit found in git log.

---

## Dependency Gate Result

`git log` shows no "SGM 2024 balance reconciliation" commit. Most recent is `109f7f5` (PDF parser artifact guard). **Steps 1–3 executed. Step 4 NOT computed — do not build on classified deduction totals until all 12 SGM 2024 months foot to their closing balances.**

---

## SGM 2024 As-Filed Position (Source: `SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf`)

| Line | Description | As Filed |
|------|-------------|----------|
| 1a | Gross receipts or sales | $418,990 |
| 2 | COGS (Form 1125-A) | $270,032 |
| 3 | Gross profit | $148,958 |
| 8 | Salaries and wages | $36,000 |
| 11 | Rents | $22,500 |
| 13 | Interest | $9,528 |
| 16 | Advertising | $6,901 |
| 20 | Other deductions | $107,380 |
| 21 | Total deductions | $182,309 |
| 22 | Ordinary business income (loss) | **-$33,351** |

**As-filed basis = NET DEPOSITS method.** Filed gross receipts ($418,990) ≈ total SGM platform deposits ($223,514 Amazon + $62,241 TikTok + $139,500 Shopify → ~$425K). Filed net-of-fees without 1099-K gross-up.

**Underreporting gap:**
- SGM TIN total 1099-K floor: $604,026 (Amazon US $344,036 + MX $10,562 + CA $11,870 + TikTok $155,295 + Cyberbrands Shopify $82,264)
- Splitflask-only SGM 1099-K: $521,762 (excl. Cyberbackpack $82,264)
- Gap vs total SGM 1099-K: **$185,036**
- Gap vs Splitflask-only 1099-K: **$102,772**

Amendment must gross up at least to the 1099-K floor, with offsetting fee/return deductions to achieve income neutrality. Cyberbrands Shopify ($82,264) is on SGM TIN and must be addressed (either include on SGM with Cyberbackpack expenses, or route to Cyberbrands entity — TJ call).

---

## Step 1 — Platform Fee Substantiation (Kill the Plug)

### Amazon
**Source:** `Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv`  
Covers US account only (SGM TIN, Amazon Payments, 5,836 transactions).

| Fee Category | Stated Amount | % of US 1099-K ($344,036) |
|-------------|--------------|--------------------------|
| Referral fees (net of refund credits) | -$32,863 | 9.6% |
| FBA fulfillment (net) | -$19,144 | 5.6% |
| **Core selling fees (referral + FBA)** | **-$52,007** | **15.1%** |
| Subscription / per-item fees | -$13,184 | 3.8% |
| FBA inventory / storage | -$4,855 | 1.4% |
| Amazon shipping services | -$8,956 | 2.6% |
| Gross product orders | $320,427 | — |
| Returns / refunds | -$22,838 | 6.6% of 1099-K |
| Net product sales | $297,589 | — |
| Net payout (US only) | $197,458 | — |

**PLUG vs REAL comparison:**
- SGM bank deposits (all Amazon accounts, 2024): $223,514
- Total Amazon 1099-K (US+MX+CA): $366,467
- **Plug "fees":** $142,953 = **39.0% plug** (CLAUDE.md stated 38.5% — confirmed)
- **Real core fees (referral+FBA):** $52,007 = **15.1% of US 1099-K**

**Why plug overstates:** The deposit-gap plug conflates (a) real platform fees ~15%, (b) returns ($22,838 = 6.6%) which are not fees, (c) FBA inventory/service costs (~5.2%), and (d) timing differences between MX/CA accounts.

**MX and CA accounts:** Settlement CSVs not separately available in local files. MX ($10,562) and CA ($11,870) settlements likely have similar ~15% referral+FBA rates; their net payouts (est. $9K + $10K) both deposit to the same SGM account. TJ should request Amazon Seller Central settlement reports for MX and CA accounts separately.

---

### TikTok
**Source:** 9 monthly 1099-K detail CSVs (2024_2, 2024_5–2024_12)  
**Note:** 2024 TikTok P&L/settlement PDFs (`Splitflask-Tiktok-Sales(Jan-Mar).pdf`, `Splitflask-Tiktok-Sales(Apr-June).pdf`) are **image-only PDFs — zero extractable text/data.** No 2024 fee breakdown available from local files.

| Metric | Amount |
|--------|--------|
| 1099-K gross (9 monthly CSVs, confirmed) | $155,294.96 |
| 2024 SGM bank deposits (classified) | $62,240.64 |
| Jan 2025 TikTok receipts to SGM (S122 check) | $1,499.25 |
| Total received (2024 + Jan timing) | $63,739.89 |
| Plug "fees" (1099-K minus 2024 deposits) | **$93,054 = 59.9%** |
| Corrected plug (incl. Jan timing) | **$91,555 = 59.0%** |

**TIMING CORRECTION — MATERIAL:** Prior session claimed "$24.7K timing gap" for Dec 2024 TikTok payouts landing in Jan 2025. **This is WRONG.** Jan 2025 SGM statement (S122) shows only **$1,499.25** in TikTok credits across 7 payments (Jan 3–10 only). No later TikTok entries appear in the statement. The $24.7K figure was an error in prior analysis — retract it.

**Q1 2025 fee structure (from merchant P&L xlsx files — closest proxy):** Referral ~3%, affiliate commission ~7%, TikTok Shop net shipping ~31% = ~41% comprehensive. The 2024 H2 period had heavier promo/flash-sale activity; actual 2024 rate may differ.

**Cannot substantiate 2024 TikTok fees from local files.** The ~59% implied gap includes real platform fees, TikTok-funded co-promo netting, and the minimal timing adjustment ($1,499). Without the actual 2024 settlement reconciliation report, the real fee breakdown cannot be determined.

**TJ/Riz action required:** Pull 2024 TikTok Shop Financial Summary from TikTok Seller Center → Finance → Financial Summary → select Full Year 2024 → export CSV/PDF. This report breaks out: Gross Sales, TikTok platform discounts (funded by TikTok), Seller discounts, Referral fees, Affiliate commissions, Shipping fees. This is the only document that can substantiate the 2024 TikTok fee deduction.

---

### Shopify (Splitflask Store — Personal TIN — see Step 3)
**Source:** `Splitflask-Shopify-Total sales breakdown - 2024-01-01 - 2024-12-31.csv`

| Metric | Amount |
|--------|--------|
| 1099-K (Personal TIN …7639) | $164,613.99 |
| Gross sales (list price) | $305,065.90 |
| Discounts | -$132,252.56 |
| Returns | -$6,657.79 |
| Net sales | $166,155.55 |
| Shipping charges | $15,756.01 |
| Consumer settled (net+ship) | **$181,911.56** |
| SGM deposits from Shopify 2024 | $139,500.24 |
| Real Shopify Payments fee (~2.9%) | ~$5,276 (est.) |
| **Real fee rate** | **~2.9%** |

**Plug vs real:**
- Plug "fees": $164,614 - $139,500 = **$25,114 = 15.3%** (CLAUDE.md stated 15.6%)
- **The $25,114 gap is NOT fees — it is entity routing + Shopify Capital repayment**, not Shopify Payments processing fees
- Real Shopify Payments fee: ~$5,276 (~2.9%)
- The remaining gap (~$19,838) = Shopify Capital advance repayment withheld from daily payouts (principal is non-deductible per owner decision; only interest is deductible)

---

## Step 2 — Year-End Timing Resolution

### Amazon Timing
**Jan 2025 Amazon credits to SGM (S122 statement):** $17,886  
- Amazon US: $4,846 (01/06) + $4,261 (01/14) + $2,340+$37 (01/18×2) + $2,542 (01/24) + $1,059 (01/30) = **$15,085**
- Amazon MX: $526 (01/06) + $185 (01/21) = **$711**
- Amazon CA: $885 (01/07) + $804 (01/22) = **$1,689**
- Total: $17,886

Amazon pays bi-weekly. The Jan 6 payment ($4,846 US) covers sales approximately Dec 23–Jan 5; roughly half is Dec 2024 earned. Exact allocation requires Amazon to identify settlement period covered by each payout ID.

**Cutoff election staged for TJ:**
- **Cash basis (simpler):** 2024 Amazon income = $223,514 calendar-year deposits. 2025 income includes all Jan–Dec 2025 deposits including the $17,886 above. No accrual needed.
- **Accrual basis (earned-in-period):** Add the Dec 2024 portion of Jan 2025 payouts (~$7–9K estimate for the Jan 6 settlement). Requires Amazon to confirm period-to-settlement mapping.
- S-corps can use cash basis; cash basis is clean and defensible here. Recommend cash basis for TJ review.

### TikTok Timing — CORRECTED
**Jan 2025 TikTok credits to SGM:** $1,499.25 (7 entries, Jan 3–10 only)

This is the Dec 2024 earned / Jan 2025 paid amount. It is **not $24,700** as previously estimated. The prior $24.7K claim is retracted.

**Corrected position:**
- Cash basis 2024 TikTok income: $62,241
- If accrual adjustment: +$1,499 for Dec earned / Jan paid = $63,740 accrual basis
- Difference is immaterial ($1,499); cash basis recommended

---

## Step 3 — Shopify Entity Routing (Splitflask Store, 2024)

**Facts:**
| Item | Value |
|------|-------|
| 1099-K TIN | Personal (…7639) |
| 1099-K amount | $164,613.99 |
| Account ID | pa_28592734488 |
| Form type | CORRECTED (corrected box checked) |
| 2025 TIN | SPLT (…4308) — TIN changed Jan 2025 |
| Consumer settled | $181,912 |
| SGM bank deposits from Shopify | $139,500 |
| Real Shopify Payments fee (est.) | ~$5,276 (~2.9%) |
| Shopify Capital repayment est. | ~$37,136 (withheld from payouts) |

**Entity routing options for TJ:**

**Option A — Personal Schedule C (matches 1099-K TIN):**
- Include $164,614 as gross receipts on Riz/Cheryl 2024 Personal Schedule C
- Deduct: Shopify Payments fee ~$5,276; Shopify Capital interest (not principal)
- SGM's receipt of $139,500 in Shopify deposits = treated as Riz contributing personal revenue to the S-corp (shareholder contribution / basis increase), not SGM revenue
- IRS matching: clean — 1099-K TIN matches filer
- Requires: Personal 1040 Schedule C amendment (Cyberbrands already has a Schedule C — Splitflask store would be a separate activity, or consolidated depending on TJ/Nnamdi structure)

**Option B — SGM 1120-S (matches economic activity):**
- Include $164,614 in SGM gross receipts (or consumer-paid basis $181,912)
- Personal return needs a reconciliation note: "1099-K pa_28592734488 ($164,614) reported on related S-corp SGM EIN 83-3077502; not duplicate income"
- Creates a paper trail burden; IRS may issue CP2000 on the personal return until reconciled
- Less clean for IRS matching; higher audit risk

**Recommendation to stage for TJ:** Option A is more defensible because it follows the TIN. The 2025 pattern (Shopify moved to SPLT TIN) confirms the established practice is to file on the entity whose TIN is on the form. However, if TJ and Nnamdi jointly decide Option B, they must attach a reconciliation statement to the Personal 1040.

---

## Step 4 — Income-Neutrality Proof

**BLOCKED.** No "SGM 2024 balance reconciliation" commit in git history. The classified deduction totals (~$720K base) from Layer 3 have NOT been balance-reconciled (see CLAUDE.md STANDING RULE). Computing neutrality on unreconciled totals would be unreliable.

**What is staged for when reconciliation is done:**

Amended SGM gross receipts (minimum): $521,762 (Splitflask-SGM 1099-K floor)  
As-filed gross receipts: $418,990  
Gross-up needed: +$102,772  

To prove neutrality, the following must be substantiated:
1. Amazon referral+FBA fees: **$52,007 sourced** (from settlement CSV — DONE in this session)
2. Amazon returns: **$22,838 sourced** (from settlement CSV — DONE)
3. Amazon other fees (service, inventory, shipping): **~$26,996 estimated** — need confirmation from MX/CA settlement reports and verification against classified transactions
4. TikTok fees 2024: **UNKNOWN** — requires 2024 TikTok Financial Summary report (TJ action)
5. Shopify Payments fees: **~$5,276 estimated** — well-supported
6. Cyberbackpack treatment on SGM: **TJ decision required** (include Cyberbrands Shopify $82,264 in SGM gross receipts → also need Cyberbackpack COGS/fees on SGM, or route to Cyberbrands entity)

**Preliminary neutrality assessment (cannot finalize):** Amazon sourced fees+returns alone ($52,007 + $22,838 + $27,000 = ~$101,845) nearly cover the Splitflask-only gap ($102,772). This is a positive sign — the amendment MAY be income-neutral or close to it even before TikTok and Shopify fees are counted. However, if Cyberbackpack ($82,264) is added to SGM gross receipts, the gap rises to $185,036 and TikTok fees become critical.

---

## TJ Decisions Staged

| # | Decision | Facts | Impact |
|---|----------|-------|--------|
| 1 | **Shopify entity routing** — Personal Schedule C or SGM 1120-S? | 1099-K on Personal TIN; deposits in SGM; ~$5K real fees; ~$37K Capital repayment | Affects which return reports $164,614; if Option A, reduces SGM gross-up to $102,772 (no Shopify on SGM) |
| 2 | **Cyberbrands Shopify ($82,264) on SGM 1120-S** — include in SGM amendment or route to Cyberbrands? | On SGM TIN; Cyberbackpack product; Cyberbrands entity operated it | If included, SGM gap = $185,036 and Cyberbrands amendment must deduct the corresponding revenue |
| 3 | **TikTok 2024 fee substantiation** — pull the 2024 Financial Summary from Seller Center | 2024 P&L PDFs are image-only; no fee data extractable locally | This is the GATING item for TikTok deduction claim; without it, TikTok deduction is unsubstantiated |
| 4 | **Cutoff election — cash vs accrual** | Cash: use calendar-year deposits; Accrual: add Dec-earned Jan-paid amounts (~$1.5K TikTok, ~$5-8K Amazon) | Immaterial difference for TikTok; modest for Amazon; cash basis simpler and defensible |
| 5 | **Shopify Capital deductibility** | $37,136 withheld from Shopify payouts = principal repayment (non-deductible per owner decision); interest portion deductible | Already owner-decided: principal excluded; need Shopify Capital statement to pull the interest component |
| 6 | **Amazon MX + CA fee confirmation** | US settlement CSV available; MX and CA not separately available | Request from Amazon Seller Central; similar rate expected (~15% referral+FBA) |
| 7 | **Balance reconciliation (prerequisite)** | 12 SGM 2024 months must foot to closing balances before classified totals are trusted | Next session before neutrality can be proved |

---

## Fee Summary Table — Plug vs Real

| Platform | 1099-K Gross | Plug "Fees" | Plug Rate | Real Fees (Stated) | Real Rate | Source |
|----------|-------------|-------------|-----------|-------------------|-----------|--------|
| Amazon US | $344,036 | $142,953 (on total $366K) | 39.0% | $52,007 (ref+FBA) | 15.1% | Settlement CSV |
| TikTok | $155,295 | $93,054 | 59.9% | UNKNOWN | ~41-59%? | Image PDF only |
| Shopify (Personal TIN) | $164,614 | $25,114 | 15.3% | ~$5,276 | ~2.9% | Sales breakdown CSV |

**Key finding:** Amazon and Shopify plugs were materially overstated. TikTok plug cannot be corrected without the 2024 Financial Summary report. The 2024 TikTok 59% implied rate likely includes heavy co-funded promotions that don't function as ordinary deductible fees — this must be resolved before any deduction is claimed.

---

## Files Consulted This Session

| File | Purpose |
|------|---------|
| `Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv` | Amazon US 2024 actual fees |
| `Splitflask-1099k_7495370463474518494_2024_*_detail.csv` (×9) | TikTok 2024 gross verification |
| `merchant_statement_profit_loss_7659948521974482702.xlsx` | TikTok Q1 2025 P&L structure (not 2024) |
| `merchant_statement_profit_loss_7659948521974499086.xlsx` | TikTok Q1 2025 P&L duplicate |
| `Splitflask-Tiktok-Sales(Jan-Mar).pdf` | IMAGE ONLY — no data extracted |
| `Splitflask-Tiktok-Sales(Apr-June).pdf` | IMAGE ONLY — no data extracted |
| `Splitflask-Shopify-Total sales breakdown - 2024-01-01 - 2024-12-31.csv` | Shopify consumer-paid totals |
| `SGM 013125 WellsFargo (2).pdf` (S122) | Jan 2025 timing check |
| `SOCIAL GEAR MEDIA LLC 2024 Form 1120-S (2).pdf` | As-filed SGM position |
| `ledger.xlsx` → `SGM_2024_Txns` | Platform deposit totals from classified data |
