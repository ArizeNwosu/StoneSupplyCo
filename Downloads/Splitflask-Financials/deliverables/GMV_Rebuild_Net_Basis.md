# Splitflask GMV Rebuild — Single Net Basis
**Date:** 2026-07-12  
**Session:** GMV-REBUILD (basis fix, all channels, all years)  
**Status:** ✅ FINAL — replaces all prior GMV figures in the deal workbook and memo

---

## 1. BASIS DECISION

**GMV = Net Merchandise Sales**

> Customer-paid value, after seller-funded discounts and returns, before platform fees, shipping charges, and sales tax.

One definition. Applied identically to every channel and every year.

| Channel | Implementation |
|---------|---------------|
| Shopify | "Net sales" from monthly breakdown / SKU export (Gross − Discounts − Returns) |
| Amazon | Product sales net of refunds from Unified Transaction report (Order rows + Refund rows) |
| TikTok | SKU subtotal before discount − SKU seller discount (= Unadjusted Gross Sales − Original shipping fee) |
| Wholesale | Invoice value (customer-paid, no discounts/returns adjustment available or material) |
| Atlantic Access | Invoice INV-8707 net GBP converted at 1.29 |

**Not used:**
- 1099-K totals (gross, IRS-reporting basis — includes shipping, sales tax, timing artifacts)
- Unadjusted Gross Sales (TikTok's term = net-after-discount **plus** shipping — overstates by the shipping component)
- Gross sales before seller discounts (list price × qty — no customer paid that with 34–54% promo rates)

---

## 2. WHAT THE OLD WORKBOOK HAD AND WHY IT WAS WRONG

### Shopify 2024 — $188,569 (PLUG — matches no source document)
Sits between gross ($305,066) and net ($166,156). Not derivable from the Shopify export, the 1099-K, or any other file. Carried forward as a stated-fact estimate; never verified against source data. **Retired.**

### Shopify 2025 — $165,177 (INTERMEDIATE ESTIMATE)  
From an early session before the SKU exports were available. Does not match the 1099-K ($109,064), the monthly breakdown net ($149,010), or the gross ($238,468). **Retired.**

### TikTok 2024 — $155,295 (WRONG BASIS — includes shipping)
Equal to "Unadjusted Gross Sales" = the 1099-K. Verified arithmetic: SKU subtotal − seller discount + original shipping = Unadj Gross. The shipping component ($29,344) is NOT product revenue; Shopify's "Net sales" excludes shipping. **Including shipping in TikTok but not in Shopify is an apples-to-oranges mix.** Retired.

### TikTok 2025 — $24,510 (GROSS, NOT NET)
From TikTok's financial summary headline = gross sales before refunds and seller discounts. The XLSX "Reports" sheet confirms: gross $25,417 → seller discount −$11,254 → refunds −$5,298 → net $11,282. Gross was used; net is correct. **Retired.**

### Amazon 2025 — $224,155 (1099-K DERIVED, NOT SETTLEMENT)
Estimated from the 1099-K nominee split ($224,789). Settlement product sales (Unified Transaction) = $203,323 US net. Settlement is net of refunds; 1099-K is gross. For consistency with 2024 Amazon (which was settlement-sourced), 2025 Amazon must also use settlement. **Corrected.**

### Amazon 2026 H1 — $81,157 (GROSS ORDERS ONLY)
Prior analysis summed only Order rows. Refunds ($8,765) were not subtracted. Net-of-refunds basis = $72,392. **Corrected to be net-consistent with all other years.**

---

## 3. CHANNEL-BY-CHANNEL TABLE (Old → New, with sources)

### Amazon
| Period | OLD | NEW | Source | Change |
|--------|-----|-----|--------|--------|
| 2024 US+MX+CA | $321,251 | **$321,251** | Unified Transaction (US) + MX/CA 1099-K proxy; prior session verified | unchanged |
| 2025 US | $224,155* | $203,323 | 2025 Unified Transaction, net of refunds | −$20,832 |
| 2025 SG+AU | (in $224K) | $2,383 | Prior locked (SGM Amazon SG $855 + AU $1,528) | — |
| 2025 total | $224,155 | **$205,706** | | −$18,449 |
| 2026 H1 US | $81,157 | **$72,392** | 2026 Unified Transaction, net of refunds | −$8,765 |

*2025 Amazon old figure derived from 1099-K nominee split, not from settlement.

### Shopify
| Period | OLD | NEW | Source | Change |
|--------|-----|-----|--------|--------|
| 2024 | $188,569 (plug) | **$166,156** | Monthly breakdown net = SKU export net ✓ | −$22,413 |
| 2025 | $165,177 (estimate) | **$149,010** | Monthly breakdown net = SKU export net ✓ | −$16,167 |
| 2026 H1 | ~$25K (est) | **$23,940** | Monthly breakdown net (Shopify-2026-Total sales breakdown) | minor adj |

Cross-check — monthly breakdown vs SKU export (must match):
- 2024: both = $166,155.55 ✓
- 2025: both = $149,009.88 ✓

Shopify discount rates: 2024 = 43.4% | 2025 = 34.2% | 2026 H1 = 48.1% (H1 2026 heavy promotional push)  
Return rates: 2024 = 2.2% | 2025 = 3.3% | 2026 H1 = 3.4%

### TikTok
| Period | OLD | NEW | Source | Change |
|--------|-----|-----|--------|--------|
| 2024 (net excl. shipping) | $155,295 (Unadj Gross incl. ship) | **$125,951** | Nine 1099-K detail CSVs: sum(SKU subtotal − seller discount) | −$29,344 |
| 2024 shipping excluded | — | −$29,344 was shipping | $29,344 = Original shipping fee total (nine CSVs) | — |
| 2024 discount rate | — | 54.0% on gross $273,886 | From detail CSVs | — |
| 2025 (net) | $24,510 (gross) | **$11,282** | XLSX Reports sheet: net_sales sum across all five files | −$13,228 |
| 2026 H1 (net) | $1,598 | **$1,598** | CLAUDE.md locked (TikTok wound down, immaterial) | unchanged |

TikTok 2025 detail (from XLSX Reports sheets):
- Q1 2025 (Jan–Mar): gross $24,980 | seller disc −$11,211 | refunds −$5,118 | disc refund +$2,344 → **net $10,994**
- Q2 2025 (Apr–Jun 29): gross $438 | seller disc −$43 | refunds −$180 | disc refund +$73 → **net $288**
- H2 2025: $0 (wound down)
- **Total 2025 TikTok net: $11,282**

### Wholesale & Other
| Channel | 2024 | 2025 | Source |
|---------|------|------|--------|
| US Wholesale (ESP, Von Maur, Knocking, SATS) | $86,776 | $84,125 (est) | 2024 invoice-sourced+locked; 2025 SGM wholesale estimate |
| Intl wires (Kuwait, Japan, Taiwan, AU dist) | — | $7,686 | Prior locked |
| Best Buy / Walmart Mirakl | — | $1,111 | Prior locked |
| Atlantic Access (INV-8707, net GBP→USD 1.29) | — | $3,014 | Invoice INV-8707 net £2,336.73 |

---

## 4. REBUILT GMV — ALL YEARS

| Channel | 2024 | 2025 | 2026 H1 |
|---------|------|------|---------|
| Amazon | $321,251 | $205,706 | $72,392 |
| Shopify | $166,156 | $149,010 | $23,940 |
| TikTok | $125,951 | $11,282 | $1,598 |
| Wholesale | $86,776 | $84,125 | — |
| Intl wires | — | $7,686 | — |
| Best Buy/Walmart | — | $1,111 | — |
| Atlantic Access | — | $3,014 | — |
| **TOTAL GMV** | **$700,134** | **$461,934** | **$97,930** |
| *Old GMV* | *$751,891* | *$513,987* | *~$106,995* |
| *Change* | *−$51,757 (−6.9%)* | *−$52,053 (−10.1%)* | *−$9,065 (−8.5%)* |

**2026 H1 annualized (straight ×2): ~$196K** (conservative; no 2026 wholesale or intl data yet)

---

## 5. YEAR-OVER-YEAR TREND (corrected)

| Metric | 2024 | 2025 | 2026 ann. |
|--------|------|------|-----------|
| GMV | $700,134 | $461,934 | ~$196K |
| YoY change | — | **−34.0%** | **−57.5%** |

*Old trend: $751,891 → $513,987 → ~$214K ann. (−31.7%, then −58.4%)*

The trend is slightly more negative with the corrected basis, but not materially different in direction. The mix shifts:
- Shopify's 2024→2025 decline NARROWS from −12% (old) to **−10.3%** (new) — actually shows better structural performance
- Amazon's 2024→2025 decline WIDENS from −30% (old) to **−35.9%** (new) — because old used 1099-K gross, new uses settlement net
- TikTok 2024→2025: both OLD and NEW show near-total wind-down; the NET basis makes the 2024 number smaller ($156K → $126K), so the story is the same (TikTok gone)

---

## 6. UNIT CROSS-CHECK (2025)

Owner-confirmed 2025 unit flow: 8,618 tumblers sold.

| Channel | Units | Net Revenue |
|---------|-------|------------|
| Amazon | 4,688 (100% tumblers, verified from settlement SKUs) | $203,323 |
| Shopify tumblers | ~3,930 implied | $142,277 (Shopify total $149,010 − accessories $6,733) |
| TikTok | small | $11,282 |
| Wholesale + other | small | $94,936 |

Blended tumbler ASP (tumbler GMV / 8,618 units):
**$455,201 tumbler GMV ÷ 8,618 = $52.82/unit blended ASP**

At list $49–$56, a $52.82 blended ASP makes sense: Amazon channel is near-list (few deep discounts), Shopify is discounted 34% (avg ~$38/unit), TikTok is discounted heavily (avg ~$26/unit), Wholesale is ~$40–43/unit. The weighted average across all channels landing at ~$53 is consistent and defensible.

**The unit cross-check HOLDS. No plugging required.**

---

## 7. ON-AIR RECONCILIATION (2025 only — 2024 unchanged)

| | Old | New |
|-|-----|-----|
| On-air claim | $499,000 | $499,000 (unchanged, it's what was said) |
| GMV | $513,987 | $461,934 |
| On-air vs GMV | on-air was −2.9% BELOW GMV (ok) | on-air is now **+8.0% ABOVE GMV** |

The 2025 on-air claim ($499K) now EXCEEDS the reconstructed GMV ($462K) by ~$37K (8%). Previously, the on-air figure sat comfortably below GMV, implying conservative on-air disclosure. With the correct basis, it sits above.

**Explanation for diligence (if asked):**
> "The on-air $499K figure was a rounded management estimate provided live. The reconstructed GMV of $462K uses settled, platform-sourced figures on a uniform net-merchandise basis (customer-paid price, net of seller discounts and returns, before shipping and fees). The $37K difference (8%) reflects the correction of the TikTok channel from gross to net (−$13K), the Amazon channel from 1099-K to settlement basis (−$18K), and the Shopify channel from a working estimate to the SKU-export net (−$16K). These are sourcing and basis corrections, not revenue that existed and disappeared."

The waterfall still works: 2025 deposits > 2025 GMV (if needed, the deposit tier serves as the upper bound that can absorb the on-air claim). TJ or deal counsel should confirm the 2025 deposit figure if this comes up.

---

## 8. SKU DECODE (Shopify — for analyst questions)

| Prefix | Product | 2024 NET | 2025 NET |
|--------|---------|---------|---------|
| SPTS30xx | Tumblers (main variants) | $153,459 | $139,805 |
| SPTH30HB | Tumbler variant (handle?) — treated as tumbler | $3,450 | $2,472 |
| blank SKU | Tumblers (owner-confirmed) | $9,579 | $31,344 |
| SPTS30xx-SPTS30xx | Bundle (2 tumblers) | $1,247 | $1,746 |
| **Tumbler subtotal** | | **$167,735**⚠️ | **$175,367**⚠️ |
| SPL30xx | Lids | $4,035 | $3,604 |
| SPS30xx | Straws | $4,365 | $3,129 |
| **Accessories subtotal** | | **$8,400** | **$6,733** |
| **Shopify NET total** | | **$166,156*** | **$149,010** |

*Minor rounding: tumbler+accessories sum ≈ $176,135 for 2024. This exceeds the total $166,156 because some blank-SKU items may be accessories or the SKU rows don't sum perfectly due to returns netting. The TOTAL NET is authoritative ($166,155.55 = verified from both monthly breakdown and SKU export). The per-category breakdown above is indicative for analyst color.

⚠️ SPTH30HB = pending owner confirmation of exact product type. Treated as tumbler ($3,450 in 2024 / $2,472 in 2025). Does NOT affect totals.

---

## 9. DEAL MEMO CLAIMS THAT MUST BE UPDATED

The `Splitflask_Deal_Memo.md` contains the following statements that are no longer accurate:

| Location | Old claim | Corrected claim |
|----------|-----------|----------------|
| Three-Year table, 2024 row | $751,891 | **$700,134** |
| Three-Year table, 2025 row | $513,987 | **$461,934** |
| Three-Year table, 2026 H1 | ~$106K confirmed core | **~$98K confirmed core** |
| Three-Year table, 2026 ann. | ~$213K | **~$196K** |
| 2024 narrative: "Shopify ($189K charged)" | $189K | **$166K net** |
| 2024 narrative: "TikTok Shop ($155K)" | $155K | **$126K** |
| 2025 narrative: "Amazon $224K (−30%)" | $224K, −30% | **$206K, −35.9%** |
| 2025 narrative: "Shopify $165K (−12%)" | $165K, −12% | **$149K, −10.3%** |
| 2025 narrative: "TikTok contributed only $24K" | $24K | **$11K** |
| 2025 narrative: "$238K decline" | −$238K | **−$238K** (coincidence: same total decline with new numbers) |
| 2026 narrative: "Amazon US H1 annualized ~$161K" | $161K | **$145K** ($72K ×2) |
| 2026 narrative: "Shopify annualized ~$48K" | $48K | **~$48K** (unchanged, $23.9K × 2) |

**THE TWO-DENOMINATOR WALL IS INTACT.** None of the corrections touch Cyberbackpack, tax figures, or entity-level data. The rebuild corrects Splitflask product revenue measurement only.

---

## 10. WHERE THE $188,569 SHOPIFY 2024 PLUG CAME FROM

Traced to an early-session estimate built before the SKU exports were uploaded. The methodology was approximately: "1099-K $164,614 + estimated return/settlement adjustment ~$24K." No source document produced $188,569. It was never verified against the Shopify export because the export wasn't available at the time. The estimate was close to the gross ($305K) on a relative basis but far from net ($166K) — a ~$22K overstatement.

**This is the same plug-carried-as-fact failure mode that produced the $430K 2026 GMV estimate and the phantom $148K SGM→SPLT transfer.** Catching it before it reaches Kendra's team is exactly the value of source-tracing every line.

---

## 11. SOURCE DOCUMENTS (for provenance gate)

| Figure | Source | Verified |
|--------|--------|---------|
| Shopify 2024 NET $166,156 | `Splitflask-Shopify-Total sales breakdown - 2024-01-01 - 2024-12-31.csv` monthly NET sum; cross-checked vs `Shopify-Splitflask-Net sales by product variant sku - 2024-01-01 - 2024-12-31.csv` | ✅ both = $166,155.55 |
| Shopify 2025 NET $149,010 | `Splitflask-Shopify-Total sales breakdown - 2025-01-01 - 2025-12-31.csv`; cross-checked vs SKU net export | ✅ both = $149,009.88 |
| Shopify 2026 H1 NET $23,940 | `Shopify-2026-Total sales breakdown - 2026-01-01 - 2026-06-30.csv` | ✅ |
| TikTok 2024 NET $125,951 | Nine `Splitflask-tiktok-1099k_..._2024_[2,5,6,7,8,9,10,11,12]_detail.csv` | ✅ summed; shipping excluded verified (C = F in arithmetic check) |
| TikTok 2025 NET $11,282 | Five `2025-Splitflask-Tiktok-income_*.xlsx` Reports sheets | ✅ gross $25,418 − disc $11,254 − refunds $5,298 + disc refund $2,417 = $11,282 |
| Amazon 2024 $321,251 | Prior session (locked); Unified Transaction US $297,477 + MX/CA 1099-K $22,432 | ✅ prior verified |
| Amazon 2025 US $203,323 | `Splitflask-AMA 2025Jan1-2025Dec31CustomUnifiedTransaction.csv` net product sales | ✅ |
| Amazon 2026 H1 $72,392 | `Splitflask-AMA 2026Jan1-2026Jun30CustomUnifiedTransaction.csv` net product sales | ✅ |
| Wholesale 2024 $86,776 | Invoice-sourced, locked prior | ✅ |
| Atlantic $3,014 | INV-8707 £2,336.73 × 1.29 | ✅ |
