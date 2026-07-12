# Bank Deposit Reconciliation

Scope: SGM 2024, SGM 2025, SPLT 2025. Bank deposits are Wells Fargo statement credits; revenue excludes owner/intercompany transfers, Atlantic/loan funding, Shopify Capital/financing, and refund credits. Classifications use `ledger.xlsx` `*_Txns` categories where date/amount matched; PDFs remain the amount tie-out source.

## Parser Tie-Out
- Statements parsed: 36; statement Deposits/Credits tie-out variances: 0.

## Deposit Totals by Classification
| Entity-year | Classification | Total |
|---|---:|---:|
| SGM 2024 | AMAZON | $223,514.28 |
| SGM 2024 | OWNER LOAN / TRANSFER | $287,958.84 |
| SGM 2024 | REFUND | $1,640.84 |
| SGM 2024 | SHOPIFY | $139,500.24 |
| SGM 2024 | TIKTOK | $62,240.64 |
| SGM 2024 | WHOLESALE/B2B | $156,141.19 |
| SGM 2024 | ⚠️ UNATTRIBUTED | $24,758.09 |
| SGM 2025 | AMAZON | $19,333.76 |
| SGM 2025 | OWNER LOAN / TRANSFER | $68,467.62 |
| SGM 2025 | REFUND | $2,911.79 |
| SGM 2025 | SHOPIFY | $9,163.19 |
| SGM 2025 | TIKTOK | $1,884.85 |
| SGM 2025 | WALMART | $4,025.83 |
| SGM 2025 | WHOLESALE/B2B | $15,554.70 |
| SGM 2025 | ⚠️ UNATTRIBUTED | $9,634.49 |
| SPLT 2025 | AMAZON | $106,102.81 |
| SPLT 2025 | KICKSTARTER | $54,386.08 |
| SPLT 2025 | OWNER LOAN / TRANSFER | $81,203.67 |
| SPLT 2025 | REFUND | $6.62 |
| SPLT 2025 | SHOPIFY | $90,858.56 |
| SPLT 2025 | TIKTOK | $3,465.09 |
| SPLT 2025 | WHOLESALE/B2B | $33,958.04 |

## Revenue Cash Totals
| Entity-year | Revenue cash | Non-revenue credits listed separately |
|---|---:|---:|
| SGM 2024 | $606,154.44 | $289,599.68 |
| SGM 2025 | $59,596.82 | $71,379.41 |
| SPLT 2025 | $288,770.58 | $81,210.29 |

## Revenue by Channel
| Entity-year | Amazon | Shopify | TikTok | Walmart | Wholesale/B2B | Kickstarter | Unattributed revenue cash |
|---|---:|---:|---:|---:|---:|---:|---:|
| SGM 2024 | $223,514.28 | $139,500.24 | $62,240.64 | $0.00 | $156,141.19 | $0.00 | $24,758.09 |
| SGM 2025 | $19,333.76 | $9,163.19 | $1,884.85 | $4,025.83 | $15,554.70 | $0.00 | $9,634.49 |
| SPLT 2025 | $106,102.81 | $90,858.56 | $3,465.09 | $0.00 | $33,958.04 | $54,386.08 | $0.00 |

## Waterfalls
| Entity-year | Channel GMV | Fees | Refunds/chargebacks | Timing | Expected deposits | Actual revenue deposits | Unexplained variance |
|---|---:|---:|---:|---:|---:|---:|---:|
| SGM 2024 | $700,134.00 | ($184,371.00) | ($0.00) | $0.00 | $515,763.00 | $606,154.44 | $90,391.44 |
| SGM 2025 | $84,125.00 | ($31,925.00) | ($0.00) | $0.00 | $52,200.00 | $59,596.82 | $7,396.82 |
| SPLT 2025 | $305,687.00 | ($25,872.00) | ($0.00) | $0.00 | $279,815.00 | $288,770.58 | $8,955.58 |

Fee/refund source note: fee lines use source-locked figures carried in CLAUDE.md / `Splitflask_Deal_Workbook.xlsx` / `Reconciliation_Backup.xlsx` from Amazon, Shopify, and TikTok settlement exports. They are not computed as GMV minus bank deposits. Refund/timing lines remain open where the settlement export was not line-matched in this run.

## Diligence Answers
- GMV channels with no cash found: none in the bank data. Amazon, Shopify, TikTok, Walmart, wholesale/B2B, and Kickstarter all show bank cash where applicable.
- Cash with no channel: see `⚠️ UNATTRIBUTED` above. These are not allocated or plugged.
- 2025 GMV caution: Kickstarter cash exists in SPLT but was an open item in CLAUDE.md; if not already in GMV, 2025 Splitflask GMV is understated.

## SGM 2025 Splitflask Cash Still Flowing to SGM
| Channel | Amount | Dates |
|---|---:|---|
| AMAZON | $19,333.76 | 2025-01-06 to 2025-12-29 |
| SHOPIFY | $9,163.19 | 2025-01-02 to 2025-02-04 |
| TIKTOK | $1,884.85 | 2025-01-03 to 2025-04-23 |
| WALMART | $4,025.83 | 2025-01-14 to 2025-12-30 |
| WHOLESALE/B2B | $15,554.70 | 2025-01-02 to 2025-11-14 |

## SGM 2025 Branch Cash/Check Deposits
- Count 22; total $9,599.89. Statement detail only says branch/eDeposit/mobile/ATM check deposit, date/time/location or ref where available; no payer ID.

## SGM 2024 Product Attribution
| Product bucket | Cash deposits |
|---|---:|
| Cyberbackpack | $609.03 |
| Splitflask | $291,924.36 |
| Splitflask/Cyberbackpack ambiguous | $223,514.28 |
| Unattributed | $90,106.77 |
| TOTAL NOT PRODUCT-ALLOCATED | $313,621.05 |

## Cash With No Channel
- SGM 2024: $24,758.09.
- SGM 2025: $9,634.49.
- SPLT 2025: $0.00.

## Balance Sheet Proxy from Revenue Cash Only
This is not GAAP; it is cash received as revenue, ignoring interbank transfers and other non-revenue deposits.
| Entity-year | Cash revenue asset | Revenue/equity proxy |
|---|---:|---:|
| SGM 2024 | $606,154.44 | $606,154.44 |
| SGM 2025 | $59,596.82 | $59,596.82 |
| SPLT 2025 | $288,770.58 | $288,770.58 |

## GMV Survival
- Yes as a cash-existence test: no GMV channel appears fictional. Not a forced close: the waterfalls remain variance-positive after sourced fees, so the open item is allocation/timing/refund matching, plus whether 2025 Kickstarter should increase GMV.
