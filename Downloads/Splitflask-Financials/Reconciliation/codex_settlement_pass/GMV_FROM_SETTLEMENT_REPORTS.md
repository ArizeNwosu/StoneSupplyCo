# GMV From Settlement Reports

Basis used everywhere: GMV = net merchandise sales, after seller-funded discounts and returns, before fees, shipping, and tax. 1099-Ks are corroboration only.

FX sources: IRS yearly average exchange rates for 2024/2025; Federal Reserve/FRED daily averages for 2026-H1. IRS says foreign currency to USD is converted by dividing by the listed annual average rate. Fed G.5/H.10 series are daily noon buying rates; I averaged Jan 1-Jun 30, 2026 business-day observations.

Rates used:

| Currency | 2024 | 2025 | 2026-H1 |
|---|---:|---:|---:|
| CAD per USD | 1.370 | 1.398 | 1.3775887 |
| MXN per USD | 18.330 | 19.212 | 17.4703944 |
| GBP per USD | n/a | 0.759 | n/a |
| AUD per USD or USD/AUD | n/a | 1.551 AUD/USD | 0.702961 USD/AUD |
| SGD per USD | n/a | 1.307 | 1.2775371 |

## Table 1 - File Inventory, Actual Content

No byte-identical duplicates were found by MD5 across the folder. Several files overlap or contain subset data and were excluded from summing as noted.

| File | Actual channel | Actual date range from data | Measures | Mislabeled / duplicate / use |
|---|---|---:|---|---|
| Splitflask-AMA 2024Jan1-2024Apr23CustomUnifiedTransaction.csv | Amazon US settlement | 2024-01-27 to 2024-04-22 | signed product sales, promo rebates, fees, tax, shipping | Overlaps full 2024 file; excluded from summing |
| Splitflask-AMA 2024Jan1-2024Dec31CustomUnifiedTransaction.csv | Amazon US settlement | 2024-01-27 to 2024-12-31 | signed product sales + promo rebates | Used, rows 10-7881 |
| Splitflask-AMA 2025Jan1-2025Dec31CustomUnifiedTransaction.csv | Amazon US settlement | 2025-01-01 to 2025-12-31 | signed product sales + promo rebates | Used, rows 11-6906 |
| Splitflask-AMA 2026Jan1-2026Jun30CustomUnifiedTransaction.csv | Amazon US settlement | 2026-01-01 to 2026-06-30 | signed product sales + promo rebates | Used, rows 11-2519 |
| Amazon/Canada-Total-settlement-Transactions until 2024-12-31.csv | Amazon Canada settlement | 2024-07-04 to 2026-05-07 | CAD product charges + promo rebates | Filename wrong: not through 2024 only; used split by date |
| Amazon/Mexico-Total-Settlement-Transactions until 12_31_2024.csv | Amazon Mexico settlement | 2024-07-02 to 2026-07-02 | MXN product charges + promo rebates | Filename wrong: runs into 2026; used only through 2026-06-30 |
| Amazon/Amazon-2024-Canada-SalesDashboard-7-12-26.csv | Amazon Canada dashboard | 2024-07-13 to 2024-12-31 | ordered product sales | Dashboard corroboration only |
| Amazon/Amazon-2025-Canada-SalesDashboard-7-12-26 (1).csv | Amazon Canada dashboard | 2024-07-14 to 2025-12-31 | ordered product sales | Filename misleading: spans 18 months; not summed |
| Amazon/Amazon-2026-SalesDashboard-7-11-26.csv | Amazon US dashboard | 2026-01-01 to 2026-06-30 | ordered product sales | Dashboard only; settlement file used instead |
| Amazon/Mexico-2025-sales-SalesDashboard-7-12-26.csv | Amazon Mexico dashboard | 2025-01-01 to 2025-12-31 | MXN ordered product sales | Dashboard only; settlement file used instead |
| Amazon/Mexico-2026-SalesDashboard-7-12-26.csv | Amazon Mexico dashboard | 2026-01-01 to 2026-07-12 | MXN ordered product sales | Includes July; not H1-only; settlement used instead |
| Splitflask-Amazon-Mexico-SalesDashboard-7-06-26.csv | Amazon Mexico dashboard | 2025-01-01 to 2026-01-01 | MXN ordered product sales | Mixed 2025 + one 2026 day; not used |
| Amazon/Australia-2025-SalesDashboard-13-07-26.csv | Amazon Australia dashboard | 2025-01-01 to 2025-12-31 | AUD ordered product sales | Used only as estimated/dashboard, not settlement |
| Amazon/Australia-2026-SalesDashboard-13-07-26 (1).csv | Amazon Australia dashboard | 2025-01-01 to 2026-06-30 | AUD ordered product sales | Filename misleading: includes 2025; used as estimated/dashboard split by date |
| Splitflask-Amazon-Singapore-SalesDashboard-07-07-26 (1).csv | Amazon Singapore dashboard | 2025-01-01 to 2026-01-01 | SGD ordered product sales | Used only as estimated/dashboard; 2026 row is zero |
| Shopify-Splitflask-Net/Gross sales by product variant sku - 2024 | Shopify | no date column; export title says 2024-01-01 to 2024-12-31 | net/gross sales by SKU | Used; blank SKU treated as tumblers |
| Shopify-Splitflask-Net/Gross sales by product variant sku - 2025 | Shopify | no date column; export title says 2025-01-01 to 2025-12-31 | net/gross sales by SKU | Used; blank SKU treated as tumblers |
| Shopify-Splitflask-Accessories-Net/Gross sales by product variant sku - 2025 | Shopify accessories | no date column; export title says 2025 | subset SKU totals | Excluded; contained in main 2025 Shopify SKU files |
| Splitflask-Shopify-Total sales breakdown - 2024/2025/2026 | Shopify | monthly rows match titles | gross, discounts, returns, net, shipping, taxes | 2026 used because no 2026 SKU export exists; 2024/2025 corroboration only |
| Splitflask-tiktok-1099k_*_2024_2,5,6,7,8,9,10,11,12_detail.csv | TikTok detail | Feb and May-Dec 2024 | SKU subtotal before discount, seller discount, shipping | Used for 2024 floor; Jan/Mar/Apr missing |
| 2024-Splitflask-Tiktok-income_*.xlsx | TikTok settlement reports | periods cover 2024-01-07 to 2024-12-31 | report summaries; order sheet only 5 rows | Checked, not used for 2024 because prompt specified monthly detail CSVs and missing months floor |
| 2025-Splitflask-Tiktok-income_*.xlsx | TikTok report summaries | 2025-01-01 to 2025-12-31 | report net sales, gross sales/refunds, seller discounts/refunds | Used; order-detail sheets appear truncated to five rows |
| TikTok-Splitflask/Splitflask-Tiktok/Tiktok 2025/2026 Sales PDFs | TikTok screenshots/PDF images | not text-readable | image-only sales pages | Not computable as settlement data without OCR or source export |
| Knocking Inc. Payout *.xlsx | Knocking | 2024-05-29 to 2025-01-28 by order date | All Orders product sales/refunds/total sales | Used by order date, not payout date |
| walmart-2024-Overview (1).csv | Walmart | 2024-09-10 to 2024-12-30 | explicit GMV column | Used |
| walmart-2025-Overview.csv | Walmart | 2025-01-03 to 2025-12-31 | explicit GMV column | Used |
| Best-Buy-orders.csv | Best Buy | 2025-12-01 to 2026-04-03 | unit price, quantity, commission | Used unit price x qty; commission ignored |
| Atlantic-access-Invoice INV-8707.pdf | Atlantic Access | Feb-Aug 2025 reference | GBP sell-through lines and fees | Used sales less returns only; invoice-sourced estimate |
| Invoice INV-9143.pdf | Atlantic Access | Sep-Nov 2025 reference | GBP sell-through lines and fees | Used sales less returns only; invoice-sourced estimate |
| Invoice Dec25 Splitflask.pdf | Atlantic Access | Dec 2025 reference | GBP sell-through lines and fees | Used sales less returns only; invoice-sourced estimate |
| Cyberbackpack/Cyberbrands files, Cyberbrands 1099-K, ads, bank statements | Cyberbrands/Cyberbackpack | various | different product/account | Hard excluded |
| Amazon ad spend, Meta ad invoices, bank statements, tax returns, loans, credit cards | non-GMV | various | fees, deposits, tax, debt, spend | Excluded from GMV basis |

## Table 2 - GMV by Channel and Year

| Channel | 2024 GMV | 2025 GMV | 2026-H1 GMV | Source / trace | FX / flags |
|---|---:|---:|---:|---|---|
| Amazon US | $291,751.03 | $200,879.21 | $71,817.29 | CustomUnifiedTransaction rows listed in Table 1 | Settlement-sourced |
| Amazon Canada | $9,264.61 | $10,112.25 | $0.00 | Canada settlement rows 23-598 split by date | CAD rates above |
| Amazon Mexico | $9,603.86 | $3,959.78 | $1,438.01 | Mexico settlement rows 4-409 split by date | MXN rates above |
| Shopify | $166,155.55 | $149,009.88 | $23,939.89 | 2024/2025 SKU net files; 2026 total sales breakdown rows 2-7 | 2026 not SKU-level |
| TikTok | $125,951.46 | $11,282.21 | MISSING | 2024 detail CSV rows; 2025 XLSX Reports rows | 2024 is floor; 2026 source missing/unreadable |
| Knocking | $18,135.00 | $11,997.00 | $0.00 | All Orders sheets, by Created At Est | Settlement/order-sourced |
| Walmart | $2,272.58 | $5,594.40 | $0.00 | Overview GMV column | Settlement/dashboard export sourced |
| Best Buy | $0.00 | $649.87 | $449.91 | Best-Buy-orders.csv rows 2-23 | Order-line sourced |
| Atlantic Access | $0.00 | $12,438.42 | $0.00 | Invoice PDF sell-through lines only | Estimated/invoice-sourced, GBP 0.759 |
| Amazon Australia dashboard | $0.00 | $3,055.00 | $942.70 | SalesDashboard daily rows | Estimated/dashboard, not settlement |
| Amazon Singapore dashboard | $0.00 | $654.27 | $0.00 | SalesDashboard daily rows | Estimated/dashboard, not settlement |
| Total, settlement/order only | $623,134.09 | $393,484.59 | $97,645.10 | excludes estimated dashboard/invoice rows |  |
| Total, including flagged estimates | $623,134.09 | $409,632.28 | $98,587.79 | includes Atlantic + AU/SG dashboards |  |

## Table 3 - 1099-K Corroboration

| Channel/year | 1099-K | Computed GMV compared | Difference | Explanation |
|---|---:|---:|---:|---|
| Amazon 2024 US+CA+MX | $366,467.44 | $310,619.50 | +$55,847.94 | 1099-K includes tax/shipping/gross payment volume; GMV excludes them and uses settlement merchandise net of discounts/returns |
| Amazon 2025 US only | $240,009.89 | $200,879.21 | +$39,130.68 | 1099-K includes tax/shipping/gross payment volume; CA/MX 2025 1099s not found |
| Shopify 2024 | $164,613.99 | $166,155.55 | -$1,541.56 | Shopify 1099-K covers Shopify Payments only, while computed Shopify net sales can include PayPal/Affirm/Klarna or other tenders |
| Shopify 2025 | $109,063.96 | $149,009.88 | -$39,945.92 | 1099-K is processor-scoped, not all-channel GMV; it misses non-Shopify-Payments tenders |
| TikTok 2024 | $155,294.96 | $125,951.46 | +$29,343.50 | 1099-K includes shipping/tax and all available reportable payments; computed 2024 GMV is a floor because Jan/Mar/Apr detail CSVs are missing |
| TikTok 2025/2026 | not found | $11,282.21 / MISSING | n/a | no 1099-K in supplied files |

## Table 4 - Gross vs Net / Discount and Return Effect

| Channel | Year | Gross basis | GMV/net | Gross-to-net reduction |
|---|---:|---:|---:|---:|
| Amazon US | 2024 | $297,476.56 | $291,751.03 | 1.9% |
| Amazon US | 2025 | $203,322.68 | $200,879.21 | 1.2% |
| Amazon US | 2026-H1 | $72,392.21 | $71,817.29 | 0.8% |
| Shopify | 2024 | $305,065.90 | $166,155.55 | 45.5% |
| Shopify | 2025 | $238,467.80 | $149,009.88 | 37.5% |
| Shopify | 2026-H1 | $49,327.68 | $23,939.89 | 51.5% |
| TikTok | 2024 floor | $273,886.23 | $125,951.46 | 54.0% |
| TikTok | 2025 | $20,119.19 | $11,282.21 | 43.9% |
| Knocking | 2024 | $18,765.00 | $18,135.00 | 3.4% |
| Knocking | 2025 | $12,356.91 | $11,997.00 | 2.9% |
| Walmart | 2024 | $2,380.53 auth sales | $2,272.58 | 4.5% |
| Walmart | 2025 | $6,043.95 auth sales | $5,594.40 | 7.4% |
| Best Buy | 2025 | $649.87 | $649.87 | 0.0% |
| Best Buy | 2026-H1 | $449.91 | $449.91 | 0.0% |
| Atlantic Access | 2025 | $13,311.88 | $12,438.42 | 6.6% |

## Table 5 - Gaps and Pull List

| Gap | Needed report | Where / why |
|---|---|---|
| TikTok 2024 Jan, Mar, Apr detail CSVs missing | `*_2024_1_detail.csv`, `*_2024_3_detail.csv`, `*_2024_4_detail.csv` | TikTok 1099-K monthly detail export; current 2024 is a floor |
| TikTok 2026 settlement/order export missing | 2026 Jan-Jun XLSX/CSV with SKU subtotal and seller discount columns | Supplied 2026 PDFs are image-only and not settlement-readable |
| Shopify 2026 SKU-level net/gross export missing | Net/Gross sales by product variant SKU, 2026-01-01 to 2026-06-30 | Used monthly total sales breakdown instead; not SKU-level |
| Amazon Canada post-2026-05-07 settlement missing | Canada settlement transactions through 2026-06-30 | Current CA settlement stops at 2026-05-07 |
| Amazon Australia/Singapore settlement missing | Settlement transaction exports, not dashboards | AU/SG included only as flagged dashboard estimates |
| Amazon Canada/Mexico 2025 1099-Ks missing | 2025 CA and MX 1099-K PDFs | Only US Amazon 2025 1099-K found |
| Atlantic Access platform settlement detail missing | Amazon Europe + Shopify EU order/sell-through reports | Current Atlantic amount is invoice-sourced sell-through, not platform settlement |
| Kickstarter bookings | Kickstarter export if any exists | No Kickstarter file found in supplied folder |

## Key Exclusions

Cyberbackpack/Cyberbrands Amazon, Shopify, Facebook ads, bank statements, tax returns, loans, ad spend, and bank deposits were excluded. Bank deposits were not used because they are fee-net and do not represent GMV.
