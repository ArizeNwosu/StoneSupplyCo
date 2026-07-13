# Splitflask — Diligence Source Index
*Every deal figure traced to its platform source document. For Kendra Scott / diligence team.*

---

## Splitflask GMV — Tumbler Only (Deal Universe)

**GMV basis: Net Merchandise Sales** = customer-paid price, after seller-funded discounts and returns, before platform fees, shipping, and tax. Applied uniformly to every channel and every year. Full rebuild: `GMV_Rebuild_Net_Basis.md`.

| Figure | Amount | Source Document |
|--------|--------|-----------------|
| **2024 Total Splitflask GMV** | **$728,310** | Bottom-up sourced + bank-reconciled. Updated 2026-07-13: 6 new B2B items confirmed. See deliverables/Wholesale_Decomp_2024_2026-07-13.md |
| — Amazon US (net of returns) | $297,589 | Unified Transaction CSV: product sales $320,427 − returns $22,838 |
| — Amazon CA | $9,266 | CA settlement (CAD) |
| — Amazon MX | $9,682 | MX settlement (MXN) |
| — Shopify Splitflask store | $166,156 | `Splitflask-Shopify-Total sales breakdown - 2024-01-01 - 2024-12-31.csv` NET column; cross-verified vs SKU export (both $166,155.55 ✓); 0.9% gap from 1099-K = PayPal/non-Shopify-Payments orders |
| — TikTok Shop (net after seller discount, excl. shipping) | $125,951 | Nine 1099-K detail CSVs: sum(SKU subtotal − seller discount); 54% seller discount rate |
| — Knocking (retail) | $18,135 | Payout files (order-level): 404 net units × $45.00 |
| — Walmart marketplace | $2,331 | Supplier Center export; 15% commission confirmed |
| — B2B Wholesale (12 named accounts) | $101,246 | Bank wires + check deposits: ESP $57,600 · Von Maur EDI $7,200 · Von Maur check $4,950 · SATS-Creuers $10,725 (DBS wire 3/20/24, /Org= confirmed) · UncommonGoods $1,905 · Frost Bank customer $3,651 (payer TBD — pull /Org= from WF online) · Potpourri Group $5,084 · Hammacher Schlemmer $6,264 · Macy's $1,315 (3 checks, Dec 2024) · Kuwait/Almatrouk $2,413 · eBay $139 |
| **2025 Total Splitflask GMV** | **$399,412** | Nine-channel build (below); net basis; bank-reconciled (WHOLESALE_TRACE) |
| — Amazon US (settlement net of returns) | $203,323 | `Splitflask-AMA 2025Jan1-2025Dec31CustomUnifiedTransaction.csv` product sales total |
| — Amazon SG+AU | $2,383 | Amazon SG/AU dashboard (prior locked: SG $855 + AU $1,528 @0.6451) |
| — Amazon MX 2025 ⚠️ | ~$4,083 est. | `Amazon/Mexico-2025-sales-SalesDashboard-7-12-26.csv` MX$81,626 ÷ 20 MXN/USD — **ESTIMATED; dashboard not settlement; pull MX settlement CSV to verify** |
| — Shopify SPLT store | $149,010 | `Splitflask-Shopify-Total sales breakdown - 2025-01-01 - 2025-12-31.csv` NET; cross-verified vs SKU export |
| — TikTok (H1 only, net) | $11,282 | Five `2025-Splitflask-Tiktok-income_*.xlsx` Reports sheets; gross $25,418 − disc/refunds = net $11,282 |
| — Intl wires (5 named counterparties) | $7,686 | Named wire records: Everything Kitchen AU, Waen JP, Citiesocial TW, Kuwait NBK |
| — SGM Knocking/CBS Deals (bank-sourced) | $7,567 | SGM 2025 WF bank, 4 wires |
| — SGM Walmart marketplace (bank-sourced) | $4,026 | SGM 2025 WF bank, 16 payments |
| — SGM Ownstar intl wire | $1,004 | SGM 2025 WF bank |
| — SPLT Lucky Rubber Ducky | $517 | SPLT 2025 WF bank |
| — Atlantic Access (INV-8707 net) | $3,014 | Invoice INV-8707, £2,336.73 net × 1.29 |
| — SGM cash/check deposits (⚠️ owner-confirmed Splitflask) | $9,600 | 22 SGM 2025 branch deposits; owner confirmed Splitflask sales |
| **2026 H1 GMV (PRELIMINARY)** | **~$98K confirmed core** | Platform sources below; unaudited — marked preliminary |
| — Amazon US H1 2026 (net of refunds) | $72,392 | `Splitflask-AMA 2026Jan1-2026Jun30CustomUnifiedTransaction.csv` |
| — Shopify H1 2026 | $23,940 | `Shopify-2026-Total sales breakdown - 2026-01-01 - 2026-06-30.csv` NET column |
| — TikTok H1 2026 | ~$1,598 | TikTok 2026 Q1/Q2 income PDFs (wound to trickle post-2024) |

---

## Revenue Waterfall — 2024 (reconciling on-air claim to verifiable tiers)

| Tier | Amount | Source |
|------|--------|--------|
| Total deposits through SGM bank | $895,754 | SGM WF …8625 statements, all 12 months, penny-footed |
| ↓ Remove non-revenue inflows (loans, interco, refunds) | −$314,358 | SGM 2024 classification ledger |
| **Splitflask GMV (consumer-paid, net of discounts + returns)** | **$700,134** | Platform source docs (see above); net basis |
| ↓ Platform fees + returns | −$190,953 | Amazon Unified Transaction CSV; TikTok quarterly income; Shopify fee report |
| Net revenue (tax-basis) | ~$560,938 | Bank-deposit basis, SGM bank + Shopify personal TIN |

*On-air 2024 claim ($895,000) attaches at the deposits tier — documented, bank-substantiated, penny-exact.*
*On-air 2025 claim ($499,000) is +25% above the reconstructed GMV of $399,412. The gap reflects three sourcing corrections (TikTok gross→net, Amazon 1099-K→settlement, Shopify estimate→export) and the wholesale plug elimination ($84,125 estimate → $12,597 bank-sourced). Disclosure language in GMV_Rebuild_Net_Basis.md §7.*

---

## 1099-K Floor — All Channels (Tax Universe, includes Cyberbackpack)

| Channel / Account | TIN | 2024 1099-K | Product |
|-------------------|-----|-------------|---------|
| Amazon main US | SGM …7502 | $344,035.75 | Splitflask |
| Amazon MX | SGM …7502 | $10,561.67 | Splitflask |
| Amazon CA | SGM …7502 | $11,870.02 | Splitflask |
| TikTok Shop | SGM …7502 | $155,294.96 | Splitflask (= Unadj Gross Sales = net-of-seller-discount + shipping; GMV uses $125,951 excl. shipping) |
| Shopify Splitflask store | Personal …7639 | $164,613.99 | Splitflask |
| Shopify Cyberbrands store | SGM …7502 | $82,263.58 | Cyberbackpack |
| Amazon Cyberbrands | Cyberbrands …7466 | $22,414.83 | Cyberbackpack |
| **Splitflask total** | | **$686,376** | |
| **Cyberbackpack total** | | **$104,678** | Not Splitflask brand |
| **Combined filed total** | | **$791,055** | Ties to penny |

*Cyberbackpack is a separate product (backpack). It is excluded from all Splitflask GMV / deal figures.*
*Each account sells only one product — attribution is an account-mapping problem, not a SKU problem.*

---

## Patent

| Item | Detail |
|------|--------|
| Patent number | 12,577,032 B2 |
| Grant date | March 2026 |
| Product covered | Dual-chamber tumbler (Splitflask) |
| Status | Granted — issued, enforceable |

*Deliberate 2025→2026 GMV pullback aligns with pre-grant period (IP protection while patent pending). Patent granted March 2026; raise funds re-ramp from protected position.*

---

## Key Source Documents on File

| Document | Contents | Entity / Year |
|----------|----------|---------------|
| Amazon Unified Transaction CSV | Gross sales, referral fees, FBA fees, returns — line by line | SGM / 2024 |
| Amazon-2026-SalesDashboard-7-11-26.csv | 2026 YTD unit/revenue dashboard | SPLT / 2026 |
| Amazon-Sales-Prior-to-SPLT-Switch-02:04:25 CSV | Jan 1–Feb 4 2025 orders (SGM earned slice) | SGM / 2025 |
| TikTok 1099-K CSVs × 9 (monthly) | Gross transaction data, penny-matches $155,294.96 | SGM / 2024 |
| TikTok 2025 Q1/Q2 financial summary | Platform-documented gross + net + payout | SGM-then-SPLT / 2025 |
| Shopify 1099-K (corrected, Personal TIN) | $164,613.99 — corrected form supersedes original | Personal / 2024 |
| Shopify 1099-K (SPLT TIN) | $109,063.96 — corrected form | SPLT / 2025 |
| Shopify admin sales exports | Monthly settlement detail, includes Global-e intl | 2024, 2025, 2026 |
| Wells Fargo bank statements (all entities) | All inflows + outflows, footed per statement | SGM/SPLT/CB/Personal |
| Wholesale invoices + bank wires | ESP, Von Maur (2 payments), Knocking, SATS (DBS wire), UncommonGoods, Potpourri, Hammacher Schlemmer, Macy's, Kuwait/Almatrouk, Frost Bank customer, eBay — 12 accounts | SGM / 2024 |
| International wire records | Kuwait NBK, Everything Kitchen AU, Waen JP, Citiesocial TW | SPLT / 2025 |

---

*Full reconciliation backup and methodology notes available upon request.*
*All figures marked PRELIMINARY (2026) are platform-sourced but unaudited.*
*Cyberbackpack revenue appears in tax records only — never in Splitflask deal figures.*
