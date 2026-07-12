# V11 TRIAGE INVENTORY
**Prepared:** 2026-07-11  
**Scope:** Read-only audit of `/Users/riz/Downloads/Splitflask-Financials/v11/` against locked truth in `CLAUDE.md`  
**Rule:** Nothing enters new work on V11 authority. V11 tells us WHERE to look; CLAUDE.md tells us WHAT IS TRUE.

---

## FILES INVENTORIED

### XLSX files (18 total)
1. `SPLT_INC_Financial_Reconstruction_v11.xlsx` — 24-tab main workbook (primary audit target)
2. `SPLT_INC_Financial_Reconstruction_v10.xlsx` — prior version
3. `SPLT_INC_Financial_Reconstruction_v2.xlsx` through `v9.xlsx` — earlier versions (v5 missing)
4. `Entity_Arrangement_Model.xlsx` — entity structure / deal architecture (original)
5. `Entity_Arrangement_Model_v2.xlsx` — entity structure with Path A vs B decision (Path_A_vs_B_Decision tab added)
6. `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx` — net-deposits filing instrument for SGM 2024
7. `SGM_2024_Amendment_Model.xlsx` — gross-up vs net floor model
8. `SGM_2024_Deposit_Classification_Schedule.xlsx` through `_v4.xlsx` — deposit detail (v1–v4 iterations)
9. `SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx` — full debit classification (12 months)
10. `SPLT_SGM_2025_Tax_Amendment_Packet.xlsx` — early 2025 amendment packet for both entities

### DOCX files (15 total)
1. `Financial_Clarification_Memo_2024_Revenue.docx` / `_v2.docx` / `_v3.docx`
2. `CPA_Amendment_Cover_Letter.docx`
3. `Contractor_Services_Agreement_SPLT_SGM.docx` / `_v2.docx`
4. `Intercompany_Settlement_Memo_2025_SPLT_SGM.docx`
5. `Kickstarter_Proceeds_Assignment_Cyberbrands_SPLT.docx`
6. `Mold_Services_Invoice_Completion_Chukwuezugo.docx`
7. `Patent_Product_License_SPLT_to_SGM.docx`
8. `Promissory_Note_Chukwuezugo_SocialGear.docx`
9. `SBA_Consent_Request_Letter_TEMPLATE.docx`
10. `Vehicle_Use_Reimbursement_Agreement_Cyberbrands_SPLT.docx`
11. `Warehouse_Rental_Agreement_SPLT.docx`
12. `Asset_Reversion_Forward_Commitment_SGM_SPLT.docx`

---

## CATEGORY A — SUPERSEDED AND WRONG

Figures V11 carries that have since been traced to source and disproven.

| Item | V11 Value | Current / True Value | Source That Disproved It | Recommendation |
|---|---|---|---|---|
| **2024 GMV** (`Revenue_GMV_vs_Net` tab) | $836,483 | **$751,891** | Platform-documented channel build: Amazon $321,251 + Shopify $188,569 + TikTok $155,295 + Wholesale $86,776. $836K implies ~$275K fees vs real ~$191K. | DELETE. Replace with $751,891 locked figure everywhere. Do NOT add a returns line to reach $836K — returns already inside GMV. |
| **2025 GMV estimate** (`Revenue_GMV_vs_Net` tab) | $467,313 | **$513,987** (Layer 1 bottom-up) | TikTok 2025 was MISSING from V11 entirely. Layer 1 added $24,510 gross TikTok + other sources. V11 used estimated channel mix (50/28/14/8), not penny-tied. | DELETE. Use $513,987 Layer 1 lock. |
| **Amazon US 2024 revenue** (`Revenue_by_Channel` tab) | $305,065.90 (gross sales export) | **$344,035.75** (1099-K locked) / **$321,251.25** (net of refunds, GMV basis) | Layer 0 1099-K source lock. V11 used gross-sales export, not the 1099-K. | DELETE. Use locked 1099-K $344,035.75 for tax / $321,251.25 for GMV. |
| **Shopify 2024 revenue derived as residual** (`Revenue_by_Channel`) | $113,924.10 (tax revenue minus Amazon = residual) | **$164,613.99** (1099-K locked; Shopify Splitflask store corrected form) | Layer 0 1099-K source lock. V11 used the ceiling-inference method explicitly. | DELETE. Use 1099-K $164,613.99 (corrected form). |
| **TikTok 2025 — MISSING** (`Revenue_by_Channel`) | Blank / "Pre-2026 TikTok deposits visible but not separately quantified" | **~$24,510 gross / ~$1,792 net payout** (Q1+Q2 2025) | TikTok Seller Center financial-summary screenshots (Layer 0/1). 2026 TikTok data ($599.52) was labeled as "Dec 2025–Mar 2026" in V11 — that $599.52 is actually Q1 2026. | ADD $24,510 gross TikTok 2025 to any revenue schedule. Corroborate: 2026 TikTok Q1 = $599.52 (separate, correctly excluded from 2025). |
| **SGM 2024 filed P&L carried as correct** (`PL_Annual_TaxBasis`, `SUPPL_SocialGear_2025_PL`) | SGM 2024: revenue $418,990, COGS $270,032, net loss −$33,351 | **Amended: revenue $521,762 (gross-up) or $560,938 (net-deposits model), COGS ~$386,799, loss −$182,779 to −$213,417 depending on model** | Bank reconciliation, 1099-K source lock, fee substantiation (Layers 3–6). The $270K COGS was owner's flawed figure; real bank-reconstructed COGS $386,799. | Replaced by `deliverables/SGM_2024_Amendment_Packet.xlsx`. V11's `PL_Annual_TaxBasis` SGM 2024 figures are STALE. |
| **SPLT 2025 as-filed figures carried forward** (`PL_Annual_TaxBasis`) | SPLT 2025: revenue $369,981, expenses $360,130, net income $9,850 | **Amended: revenue $456,722 (gross), net income ~$56,373 C-corp taxable; C-corp tax ~$11,838** | Full bank classification + Chase card + Kickstarter recognition + fee substantiation (Layers 8–12, Assembly 4D). Filed = raw bank-feed identity. | STALE. Replaced by `deliverables/SPLT_2025_Amendment_Packet.xlsx`. |
| **SGM 2025 filed = $130,976 revenue, −$32,900 loss** (`PL_Annual_TaxBasis`, `SGM_2025_Sales_Reconstruction`) | SGM 2025: revenue $130,976 (raw bank deposits), loss −$32,900 | **Amended: real gross receipts $55,484; loss ≈ −$2,592** | Layer 7 classification footed SGM 2025. Filed was pure bank-feed identity including $57,317 owner loans as revenue. Nominee treatment resolves Amazon $224,789 to SPLT. | STALE. Replaced by `deliverables/SGM_2025_Amendment_Packet.xlsx`. |
| **$148,164 SGM→SPLT "operating transfer"** (referenced in `Intercompany_RelatedParty`, `Key_Findings`) | $1,600 direct SPLT→SGM transfers in 2025 (V11 states this); separately the $148,164 figure appeared in Layer 10 of the thread as a supposed SGM→SPLT transfer | **PHANTOM — never existed.** SGM 2025 has ZERO debits >$10K. No such transfer in any bank statement. Amazon paid SPLT directly; the $148K was a reconciliation plug from a wrong intermediate ($224,281 vs actual $107,803 Amazon SPLT deposits). | Owner caught it; traced to bank. Layer 10 phantom voided. | VOID entirely. Remove any balance-sheet entry (SGM receivable / SPLT payable) derived from this figure. |
| **SPLT Shopify Capital $4,238** (carried in debt schedule / amendment packet) | SPLT INC had a $4,238 Shopify Capital advance | **DOES NOT EXIST.** The only Shopify Capital agreement is SGM-signed / CB-funded. The $4,238 in SPLT bank breaks down as: Santander billpay $2,770 (SGM SBA payments, balance-sheet), Affirm/Shop Pay $901 (deductible), Shopify fees $566 (deductible). | Owner confirmed; SPLT Shopify Capital voided. | Remove from SPLT debt schedule and any amendment. Reclassify the 3 component items correctly. |
| **Tumbler unit cost $41.04** (used in `SPLT_2025_Final_PL` for COGS — 13,000 units × $10.82 landed is CORRECT but an earlier version used $41.04) | V11 `SPLT_2025_Final_PL` tab uses $10.82/unit ($9.60 + $1.22 freight), which is CORRECT | **$41.04 = CYBERBACKPACK unit cost — NEVER applied to tumblers in V11 correctly** BUT was mis-applied in intercompany passes for Atlantic Access consigned inventory valuation ($57,400 = 1,400 × $41.04 was WRONG) | CLAUDE.md: tumblers = $9.60 ex-factory. $41.04 is Cyberbackpack. | CONFIRMED CONTAMINATION in any pass that valued Atlantic Access consigned units at $41.04. True SGM consigned inventory value = 1,400 × $9.60 = $13,440 + allocated landed cost. The $57,400 figure is wrong everywhere it appears. |
| **2026 H1 GMV = ~$430K** (referenced in GMV_2026_YTD.md, now corrected) | $430K (stale estimate, not in V11 workbook but in a deliverable memo) | **$106,411 confirmed core** (Amazon $81,157 + Shopify net + TikTok ~$1,798). Annualized ~$184–213K. | Amazon authoritative settlement; Shopify monthly export; TikTok statements. Deliverable-B session used correct $106K. | $430K is RETRACTED everywhere including any deal memos. Use $106,411 sourced core. |
| **SGM 2024 deductions base ~$720,056** (Layer 3 pre-reconciliation figure, referenced in early sessions) | ~$720,056 (unverified, pre-parser-fix) | **$614,321 corrected** (77 debit rows fixed; ~$1.37M phantom inflation removed). Then further corrected: −$23,676 AmEx (non-deductible), +$720 legitimate AmEx charges → base **~$591,365**. | Parser bug systemic fix: 77 rows corrected across 11 months of SGM 2024. All 12 months now foot. | Superseded by footed classification. ~$720K figure must not appear in any deliverable. |
| **SGM 2024 net loss presented in V11 packet as −$14,903** (`SGM_2024_1120S_Amendment_Packet_FINAL.xlsx`) | −$14,903 (net-deposits model, filed in July 2026 per V11 notes) | **−$182,779 to −$213,417** depending on freight split and model choice (CLAUDE.md ASSEMBLY 1 final: −$213,417 on gross-up model) | Fee substantiation, intercompany recon, COGS correction, coherence audit. The −$14,903 is the net-deposits filing model; −$213,417 is the fully-sourced gross-up model. TJ must choose. | FLAG FOR TJ: two competing models exist (`SGM_2024_1120S_Amendment_Packet_FINAL.xlsx` = net-deposits −$14,903 vs `deliverables/SGM_2024_Amendment_Packet.xlsx` = gross-up −$213,417). Do NOT use −$14,903 as the final figure without TJ deciding which model files. |
| **SPLT 2025 taxable income = $6,927** (`SPLT_SGM_2025_Tax_Amendment_Packet.xlsx`) | SPLT 2025 net = $6,926.85 (early pass, pre-Chase classification) | **+$56,373 C-corp taxable income; tax ~$11,838** | Assembly 4D: Chase card classified, Kickstarter recognized as C-corp income, personal items excluded, Foremost Insurance reclassified IN. | STALE. The $6,927 figure in `SPLT_SGM_2025_Tax_Amendment_Packet.xlsx` predates the Chase card classification and Kickstarter recognition. Do not use. |
| **SGM 2025 loss = −$4,778** (`SPLT_SGM_2025_Tax_Amendment_Packet.xlsx`) | SGM 2025 ordinary income: −$4,778 | **−$2,592** (CLAUDE.md final, post-international ads adjustment and opex cleanup) | Layer 12 + Assembly 3B itemized opex cleanup. | STALE figure. Use −$2,592 from Assembly 3B. |
| **Cyberbrands 2025 not included in `SPLT_SGM_2025_Tax_Amendment_Packet.xlsx`** | CB 2025 absent from early 2025 packet | **CB 2025 amended: −$16,470 loss** | Layer 9 + Assembly 5 (last packet built). | The v11-era 2025 packet covers only SPLT + SGM. CB 2025 = `deliverables/CB_2025_Amendment_Packet.xlsx`. |
| **Gross margin tab uses Materials & Supplies as COGS proxy** (`Gross_Margin`) | 2024: $150,577 / 2025 SPLT: $105,778 (Materials & Supplies only, not actual COGS) | 2024 actual COGS (bank-reconstructed): **$386,799**; 2025 SPLT COGS (13,000 units × $10.82): **$142,035** | Footed bank classification; Kangdao invoice; unit flow reconciliation. | Tab format is useful but ALL figures are wrong. Must be rebuilt with real COGS. |
| **SGM 2025 intercompany value transfer to SPLT = $5,550** (`Intercompany_RelatedParty`) | $5,550 ($1,600 direct + $3,705 Amex payments + $245 IRS payment) | SPLT→SGM $1,600 is correct (2 transfers: $1,300 + $300). The $3,705 Amex + $245 IRS components = SPLT paid SGM obligations — **intercompany value transfer**, NOT the $148K phantom | Bank-verified line-by-line in Layer 7/8. | The $5,550 cross-entity characterization is DIRECTIONALLY CORRECT for the real $1,600+$3,705+$245 transfers. The $148,164 phantom is separate and void. Keep the $5,550 narrative for the Settlement Memo (it's accurate). |
| **SPLT 2025 true operating income = $102,531 at 36.6% margin** (`SPLT_2025_Debit_Classification`) | Operating income $102,531 (36.6% margin) on corrected revenue $279,815 | **Final taxable income +$56,373** (after platform fees, Chase card expenses, Kickstarter recognition, additional deductions confirmed). The $102K was a cash-flow measure pre-platform-fees and pre-Chase; NOT the tax figure. | Layer 11 fee substantiation + Assembly 4D Chase classification. | The $102K figure is a PARTIAL P&L (bank-side only). It was a useful intermediate but is not the tax verdict. |

---

## CATEGORY B — IN V11, ABSENT FROM NEW WORK, UNVERIFIED

Items the old session computed that the new project never revisited. Flag: UNVERIFIED. Do NOT import.

| Item | V11 Claim | What Source Would Verify | Priority | Recommendation |
|---|---|---|---|---|
| **SGM 2024 expense detail: SAAS/software $61,180** (`SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx`, `Monthly_Detail_AllCategories`) | $61,180 in dues, subscriptions, software for SGM 2024 — largest single category after COGS and OWNER | Each debit line: Shopify plan, Veeqo, Klaviyo, etc. — traced from bank. The file shows month-by-month breakdown. All 12 months classified and reconciled. | HIGH | This is a large deduction. The v11 packet shows it totals in the reconciled bank classification. Cross-check: does the new `deliverables/SGM_2024_Amendment_Packet.xlsx` include this? If not, it may be missing ~$61K of real deductions. |
| **SGM 2024 commissions/outside PR $10,638** (`SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx`) | $10,638 in commissions and outside PR for SGM 2024, bank-traced | Debit classification detail | MEDIUM | Verify this is in the new SGM 2024 packet's deduction schedule. |
| **SGM 2024 rent detail $30,241** (`SGM_2024_1120S_Amendment_Packet_FINAL.xlsx` shows $30,241 amended vs $22,500 filed) | $30,241 warehouse rent (Della Moda, Chamasmani, Royceton storage) — $7,741 MORE than filed | Bank wires to landlords month-by-month | MEDIUM | The $30,241 is sourced from the bank. Confirm whether the Assembly 1 packet (`deliverables/`) uses this or a different rent figure. |
| **Forecast_24_36mo tab (V11)** — 36-month cash flow forecast anchored to 2026 YTD actuals | Starting avg monthly inflow $14,745 / outflow $16,395; overdrawn at month-start; raise = the runway | 2026 Jan–May bank statements (already confirmed in CF_Monthly_2026YTD_SPLT) | LOW | Structure useful for investor presentation. Formulas are blank (compute but values $0). Inflow/outflow starting assumptions are BANK-CONFIRMED from the CF tab. But the model is forward-looking — review for any deal presentation where runway narrative matters. |
| **AR_AP_Aging tab** | No trade A/R, no trade A/P; Kickstarter deferred $54,683; founder loan $25,287; family loan $4,000 (SGM); Chase $22,060; these are the AP-like balances | Reconciliation to signed loan agreement + bank statements | MEDIUM | The structure is correct and the items are real. But the Kickstarter $54,682.90 (partially fulfilled) vs $45,574.12 (YTD 2026 after partial fulfillment) — confirm the fulfillment amount and whether remaining obligation is disclosed correctly in the Assembly deliverables. |
| **SGM_2024_Deposit_Classification_Schedule_v4.xlsx — `NonRevenue_Itemization` tab** | 906-line deposit detail with every non-revenue item identified ($269,467.48 total: founder loans $214,479, Cyberbrands IC $40,147, Parafin $5,300, refunds $9,540, interest $1) | Already verified by Layer 3 bank classification | LOW | Confirmed from CLAUDE.md. This tab is detailed and bank-sourced. Not used in any Assembly workbook directly but backs the $895,754.12 deposit total. Keep as source-document backup. |
| **Entity_Arrangement_Model_v2.xlsx — Path A vs B analysis** | PATH A (SPLT owns everything, SBA consent needed) vs PATH B (SGM retains assets, no consent letter but supply dependency disclosed) | Deal counsel + SBA loan authorization (already in data room) | HIGH | This is a DEAL STRUCTURE decision that was researched in V11 but may not have been resolved. CLAUDE.md notes SBA covenant issues but does not state a final Path A vs B decision. Owner / deal counsel should confirm which path was chosen and whether the SBA consent letter was obtained or whether the distribution-of-assets covenant (§7(M)) issue was addressed. |
| **Entity_Arrangement_Model_v2.xlsx — SGM_Debt_Service_Model** | SGM 36-month debt service model: contractor fee $3,500/mo + channel gross profit + FMV note → funds SBA $2,018 + Amex $1,235 + operating overhead | Actual signed contractor agreement rate + actual channel revenue | MEDIUM | The contractor agreement was drafted at $3,500/mo but V11 noted the bank feed only shows $1,600/year. The model is useful for structuring but the $3,500/mo rate may not be papered. Verify what rate was actually agreed in the signed CSA v2. |
| **Entity_Arrangement_Model_v2.xlsx — Proposal_Terms tab** | Deal terms / cap table (contents not fully read) | Deal term sheet, cap table | HIGH | Not read in detail. Contains deal proposal terms. Owner should confirm these are consistent with the on-air deal and any subsequent negotiation. Do NOT use as definitive deal terms without owner confirmation. |
| **Chukwuezugo $3,266.67 wire — treatment** (`Revenue_by_Channel` and `Intercompany_RelatedParty`) | V11 states this is "related-party REVENUE, not a loan" — purchase of SPLT product/services. Says "FINAL per management" = mold pass-through ($9,800 total in 3 installments of $3,266.67). Installments 2 and 3 not confirmed routed to SPLT. | Bank statements for installments 2 and 3; invoice / mold completion acknowledgment | MEDIUM | CLAUDE.md notes $25K mold payment was a LOAN repayment (later corrected). V11 frames this as 3 equal $3,266.67 mold-service installments with the mold owned by Chukwuezugo. Confirm: did installments 2 and 3 land in SPLT bank? Is this inside the filed SPLT revenue? Is this consistent with the `Mold_Services_Invoice_Completion_Chukwuezugo.docx`? |
| **Munro & Associates wire $11,079.16** (`SGM_2024_Deposit_Classification_Schedule_v4.xlsx`, Amendment_Decision tab) | Classified as "PENDING — consulting or SGM product" — management to classify | Owner identifies the payer and purpose | HIGH | This $11K was explicitly left unresolved in V11. It either adds to SGM revenue or stays as a consulting item excluded from Splitflask GMV. A $11K item left PENDING may affect whether the 2024 amendment is complete. Owner must classify this before SGM 2024 amendment files. |
| **Amazon SG 2025 ($855.13) and Amazon AU 2025 (A$2,369.15 → $1,528.34)** | V11 `Revenue_by_Channel` confirms these as new channels discovered in diligence. USD amounts stated. | Amazon SG/AU dashboards (platform-documented per V11) | LOW | CLAUDE.md confirms these are already IN 2025 GMV $513,987. Verify they were NOT counted via Shopify Global-e (potential double-count). V11 notes they are distinct. Confirmed CLEAN by CLAUDE.md B2 true-up. |
| **Patent Product License SPLT to SGM** (`Patent_Product_License_SPLT_to_SGM.docx`) | Draft license from SPLT (IP holder) to SGM (legacy channel operator) — one of the Path A structural documents | Signed executed copy; legal review | MEDIUM | Existence of this draft suggests Path A was being pursued. Need to know if it was signed and whether it affects the Kendra diligence (licensing arrangement between the investee and the management entity is a related-party disclosure item). |
| **2026 cash position details** (`CF_Monthly_2026YTD_SPLT`, `Forecast_24_36mo`) | Jan–May 2026 confirmed. Account overdrawn June 30 at −$52.89. Chase June statement shows $6,214.22 deposits vs $16,451 prior avg. | Chase Feb–Jun 2026 statements (confirmed added to folder) + SPLT Jun 2026 statement (confirmed added) | MEDIUM | V11 captured Jan–May. CLAUDE.md confirms Jun 2026 statement was added. Verify the June 2026 data has been indexed and that the CF_Monthly_2026YTD_SPLT tab was updated with June actuals. If not, Jun 2026 cash flow is unrecorded. |
| **SGM 2024 Expense Reconstruction total deductible $599,524** (`SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx`, `Deductible_PL_TaxLines`) | Total deductible $599,524 = COGS $455,932 + all other categories | All 12 months classified, monthly ties to statements within $402 (0.045%) per README | HIGH | This is a footed, sourced expense reconstruction. The Assembly 1 SGM 2024 packet uses different figures (COGS $386,799 post-inventory-adjustment, not $455,932 gross). The $599,524 total in this file uses $455,932 COGS (no ending inventory subtracted). This is NOT a conflict — it's the BEFORE-inventory-adjustment figure. The Assembly 1 COGS $386,799 = $455,932 purchases − ~$68K-ish ending inventory allocation. Confirm the bridge: $455,932 − ending inventory (6,000 units × landed cost) = Assembly 1 COGS. |

---

## CATEGORY C — IN V11, ABSENT FROM NEW WORK, LIKELY USEFUL (structure worth not rebuilding)

Tabs or schedules that are structurally valuable even if figures need re-derivation.

| Item | What It Is | Why Useful | Must Re-Derive Before Use |
|---|---|---|---|
| **`OnAir_Claims_Reconciliation` tab** | Tracks every on-air claim with columns: claim verbatim / category / figure stated / verified actual / source / gap explanation. 7 rows started; most are blank or stub. | The structure matches the due-diligence need exactly — Kendra's team will ask claim-by-claim. A clean version of this tab IS the deal-prep tool. | All "Verified actual" cells need updating to locked figures. 2024 revenue row uses $560,938 net-deposits basis + deposit explanation (partially correct but the GMV waterfall should be added). Most rows are blank stubs. |
| **`Forecast_24_36mo` tab** | 36-month cash-flow forecast with editable assumption cells (inflow/outflow growth rates, starting balances). Blue cells = inputs. Monthly model through M36. Committed fixed obligations broken out. | Investor-ready forecast model. Structure handles runway narrative, committed obligations, and Shark Tank timing risk. Formulas in place. | All value cells are $0 / blank — formulas return $0, likely because referenced cells have no values. Starting assumptions ($14,745 inflow, $16,395 outflow) are stated in the tab but not pulling into the model. Must populate with current actuals and formula-check before use. Also update cash-on-hand to current position (account was overdrawn Jun 30; deal may have since been funded — confirm). |
| **`AR_AP_Aging` tab** | Lists all AP-like obligations with 4 balance-sheet dates (12/31/23, 12/31/24, 12/31/25, 5/31/26). Kickstarter deferred revenue, founder loan, family loan, card debt. | Clean balance-sheet disclosure format. Itemization matches what due diligence will ask for. | All figures need updating to Assembly-final numbers: Kickstarter fulfillment obligation (amount remaining post-Atlantic-Access-sales); founder loan balance (per Revolving Loan Agreement); Atlantic Access agency inventory (1,400 units, mostly SPLT on consignment — not on this tab yet). |
| **`Debt_Schedule` tab** | Lists all obligations: founder revolving loan $13,879, Chase $22,055.63, Santander vehicle lease (Cyberbrands), family loan $4,000 (SGM). Clear entity-by-entity attribution. | Lender/diligence checklist format. SBA EIDL is the conspicuous gap. | **Add SBA EIDL**: $404,200 @ 3.75%, $2,018/mo, matures 5/18/2050, UCC lien on SGM assets, personal guarantee Riz only. This is the largest liability and is ABSENT from the V11 Debt_Schedule. Also add the $17,818.73 CB receivable / SPLT payable (intercompany from 2025 FB ads paid by SPLT Chase for CB). |
| **`Bank_Stmt_Index` tab** | Statement coverage tracker: entity / account / period / status. Shows SPLT Feb–Dec 2025 + Jan–Jun 2026 as confirmed. | Standard lender/diligence deliverable. Already structured for the "6-12 months of bank statements" request. | Update: (1) Add Chase ···3247 2025 statements (classified in Layer 8 but not on this index). (2) Add CB 2025 statements (added by owner, need verification per CLAUDE.md). (3) Confirm SGM 2025 full-year set is on file (Bank_Stmt_Index shows "Partially on file"). (4) Add Chase Feb–Jun 2026 statements (CLAUDE.md confirms added). |
| **`Intercompany_RelatedParty` tab** | Complete 2025 SPLT→SGM transfers ($1,600 direct + $3,705 Amex + $245 IRS = $5,550 total), Cyberbrands→SPLT Kickstarter flows, warehouse rent clarification. | The disclosure format is exactly what due diligence will request for related-party transactions. | Update for 2024 intercompany: SGM→CB transfers (the $15,067 freight reimbursements, $2,559.41 ads, $6,000 mgmt, $2,000 patent share, the $8,135.50 receivable). The tab only covers 2025. Also add the SPLT→CB $17,818.73 FB ads intercompany. |
| **`CF_Monthly_2024_SocialGear` tab** | 12-month cash flow for SGM 2024: opening balance, deposits, withdrawals, ending balance, source statement cited. All 12 months confirmed from WF statements, ties to $895,754.12 total deposits. | Bank-confirmed cash flow — lenders ask for this. The format is correct and all 12 months are sourced. | Opening/ending balances all confirmed. The footnote correctly distinguishes raw bank deposits from tax revenue. This tab can be used AS-IS for deal-data-room disclosure with the caveat footnote. No material figures need updating. |
| **`CF_Monthly_2025_SPLT` tab** | 12-month cash flow for SPLT 2025: Feb–Dec (account opened 1/28/25; no Jan statement). All months bank-confirmed. Ending cash $9,850.39 ties to filed tax balance. | Same as 2024 cash flow above — lender checklist item. | USABLE AS-IS for disclosure. Correctly flags Jan as "n/a" (account didn't exist). Add the June 2026 month to `CF_Monthly_2026YTD_SPLT` (currently Jan–May only). |
| **`CF_Monthly_2026YTD_SPLT` tab** | 2026 YTD Jan–May cash flow. Overdrawn Jun 30 (−$52.89) noted in Forecast tab but Jun not yet in this tab. | Current-period cash flow for the raise / diligence narrative. | Add June 2026: deposits $6,214.22, withdrawals $9,838.97 (per Key_Findings note), ending −$52.89. |
| **`SGM_2024_Deposit_Classification_Schedule_v4.xlsx` — `Deposit_Detail_All` and `Channel_Subtotals` tabs** | 906-line deposit detail with channel-level subtotals (Amazon $223,514, Shopify $137,757, TikTok $62,241, ESP $57,600, etc.) | The channel_subtotals breakdown is a useful cross-reference against GMV by channel. It maps bank deposits to channels — different from GMV (platform-documented) but a useful triangulation. | The figures are NET of platform fees (bank deposits, not gross). Do not present as GMV. Use as cross-check only. The ESP $57,600 wholesale component here is the Bank deposit version of what's $57,600 in GMV too — they match (wholesale was paid direct, no fee netting). |
| **`CPA_Amendment_Cover_Letter.docx`** | Cover letter template for the SGM 2024 amendment, explaining the deposit-basis methodology, the two-denominator, and the Cyberbrands exclusion rationale. | A CPA cover letter framing for a voluntary amendment that the new packets may not have independently drafted. | Check: does `deliverables/SGM_2024_Cover_Memo.md` cover the same ground? If the cover letter goes to TJ, confirm it references the correct figures from Assembly 1 (−$213,417 gross-up model, not the −$14,903 net-deposits model in `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx`). |
| **`Financial_Clarification_Memo_2024_Revenue_v3.docx`** | The investor-facing memo explaining the $895K on-air figure (=total deposits) vs amended SGM revenue $560,938 and YoY comparison. V3 issued after the 2024 amendment was filed. | A pre-drafted investor communication. The format and framing are structurally correct (deposits ≠ revenue explanation). | Figures need checking against locked truth: (a) 2024 on-air deposit reconciliation is correct at $895,754; (b) the YoY comparison in V3 may use $560,938 vs $500,957 combined 2025 — but combined 2025 gross receipts is now different from the tax-amendment final figures. Rebuild the comparison from Assembly-final numbers. |
| **`SBA_Consent_Request_Letter_TEMPLATE.docx`** | Template for requesting SBA prior written consent for asset transfers (per the "Limits on Distribution of Assets" covenant in the EIDL). | Required if Path A is chosen and any SGM assets move to SPLT. | Blank template. Owner / deal counsel must determine: (a) was the $148,164 Amazon payment-routing decision already a covenant issue (answer: NO — Amazon paid SPLT directly, not a distribution from SGM per CLAUDE.md); (b) are any other assets (molds, inventory) moving from SGM to SPLT? If yes, this letter is needed. |
| **`Promissory_Note_Chukwuezugo_SocialGear.docx`** | Family loan promissory note: $29,000 lent, $25,000 repaid 12/26/24, $4,000 balance, 10% interest, no payment schedule. Executed July 2026. | Required paper for the $4,000 SGM balance-sheet liability and the deductible interest on SGM. | 10% interest on $29,000 → SGM should have ~$2,750 in deductible interest (estimate; compute from note terms + dates). Confirm the Assembly SGM 2024 packet includes this or flags it for TJ. Also confirm SGM issued 1099-INT to Chukwuezugo. |

---

## CATEGORY D — CONFIRMED

V11 got it right; new work independently reproduced the same conclusion.

| Item | V11 Value | CLAUDE.md Confirmation |
|---|---|---|
| **2024 total bank deposits = $895,754.12** | $895,754.12 (906 deposit lines, all 12 months, penny-perfect) | Layer 3: "Deposits tie PENNY-PERFECT to $895,754.12." CONFIRMED. |
| **SPLT WF account opened 1/28/25, no January statement exists** | Account opened 1/28/25; first statement = Feb 2025 (covers 1/28–2/28); no January-only statement | Layer 2: "SPLT 0423 account opened Jan 28, 2025 with $0." CONFIRMED. |
| **On-air $895K = total deposits, not tax revenue** | Stated explicitly; reconciliation memo drafted | CLAUDE.md: "2024 on-air claim attaches at total deposits tier." CONFIRMED. |
| **SBA EIDL: SGM borrower, Arize personal guarantor, $404,200 @ 3.75%, $2,018/mo, matures 2050, UCC lien** | `Debt_Schedule` tab + `Key_Findings` (sourced from Loan Authorization) | CLAUDE.md layer on SBA: all terms confirmed penny-exact. CONFIRMED. |
| **Kickstarter $54,386 went into SPLT, product = Splitflask tumbler, 11 deposits** | `Intercompany_RelatedParty`: "~$54,386 Kickstarter proceeds routed via Cyberbrands → SPLT" | CLAUDE.md: "Kickstarter 2025 = ~$54,386 into SPLT (11 deposits)." CONFIRMED. |
| **Chukwuezugo $3,266.67 wire (4/2/25) is related-party** | Flagged in `Revenue_by_Channel` as "Needs invoice on file; confirm included in tax revenue" | CLAUDE.md: flags as related-party; invoice documentation required. CONFIRMED FLAG. |
| **International distribution wires (Everything Kitchen AU $1,529.83; Waen JP $1,742.31; Citiesocial TW $1,029.58 + $1,974.31; Kuwait NBK $1,410.21)** | All individually identified in `Revenue_by_Channel` with bank-wire references | CLAUDE.md Layer 1 GMV build includes all these. CONFIRMED — these are real additive intl revenue lines. |
| **Best Buy and Walmart via Mirakl — live Dec 2025, nascent** | `Revenue_by_Channel`: Best Buy $549.89 / Walmart $561.22 combined 2025 | CLAUDE.md: "$1,111 Best Buy/Walmart." CONFIRMED directionally (small rounding diff). |
| **Chase Sapphire Reserve ···3247 is SPLT's business card, $22,055.63 balance** | `Credit_Cards` tab + `Debt_Schedule` | CLAUDE.md: "SPLT 2025 +$56,373" computation includes Chase card classification. CONFIRMED entity attribution. |
| **Amex Platinum = Social Gear (SGM) obligation, NOT SPLT** | `Credit_Cards`: "NOT a SPLT liability" | CLAUDE.md: "AmEx is SGM's obligation (excluded from SPLT)." CONFIRMED. |
| **Personal WF 7282 excluded from business reconstruction** | Not indexed in Bank_Stmt_Index | CLAUDE.md Layer 2: "Personal WF 7282 — OUT of the business reconstruction (user decision)." CONFIRMED. |
| **Patent: US 12,577,032 B2 granted March 2026; assigned to SPLT** | `Balance_Sheet`: "Patent Portfolio…patent assigned to SPLT INC 1/24/25" | CLAUDE.md: "Patent 12,577,032 B2 GRANTED March 2026." CONFIRMED. |
| **Warehouse rent $2,500/mo paid directly to landlord (Della Moda / Kamyar Chamasmani); SPLT is direct lessee, NOT via Cyberbrands sublease** | `Intercompany_RelatedParty`: "CORRECTED: SPLT INC rents DIRECTLY from the landlord(s)" | CLAUDE.md: "Royceton $1,300 = inventory pallet storage at COMMERCIAL property (RENT, deductible)." Warehouse rent confirmed. |
| **Revolving Loan Agreement: advances $66,587, repayments $52,708, balance $13,879 as of 6/30/2026; 12/31/25 balance $25,287; 5% simple interest only from 6/30/2026** | `Key_Findings`, `Debt_Schedule` | CLAUDE.md: "Revolving Loan Agreement: balance $13,879 (advances $66,587 − repayments $52,708). 5% simple, ONLY from 6/30/2026 → SPLT 2025 interest = $0." CONFIRMED. |
| **SPLT 2025 unit flow: 15,000 imported, 11,244 sold, 3,756 ending (includes ~1,400 Atlantic Access consigned)** | `SPLT_2025_Final_PL`: "15,000 purchased 2025, 0 beginning, 2,000 ending" (DISCREPANCY: V11 says 2,000 ending, CLAUDE.md says 3,756 ending) | See CONFLICT table below — this is NOT fully confirmed. 2,000 vs 3,756 ending is a real discrepancy. |
| **SGM 2024 freight: 9 confirmed wires totaling $89,120.50** | `SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx` shows freight totals from bank | CLAUDE.md: "SGM gross $89,120.50 = 9 wires exact." CONFIRMED. |
| **$18,766.58 CB cash withdrawal = shareholder loan repayment (Arize lent Dec 2023, CB repaid Feb 2024)** | Not fully resolved in V11 (was flagged as "red flag — purpose unknown") | CLAUDE.md: "RESOLVED — shareholder loan round-trip." Doc = Cyberbrands-2023-Dec statement. |
| **Shopify Capital: signed by SGM (account holder), finance charge $5,330, principal $41,000, term ~303 days Aug 2023** | V11 had this misattributed to CB at various points | CLAUDE.md final: "CB_2024_Txns bank descriptors: 'Shopify Capital ACH Debit — SOCIAL GEAR MEDIA.' Legal borrower is SGM." Confirmed SGM. $5,330 finance charge deductible to SGM ($2,408 in 2023, $2,922 in 2024). |

---

## EXPLICIT CONFLICTS: V11 FIGURE vs CURRENT LOCKED FIGURE

| Figure | V11 Says | Current Lock | Settlement |
|---|---|---|---|
| 2024 GMV | $836,483 | $751,891 | CLAUDE.md WINS — locked from platform docs |
| 2025 GMV | $467,313 | $513,987 | CLAUDE.md WINS — TikTok $24,510 was missing in V11 |
| Amazon US 2024 | $305,066 (gross sales export) | $344,036 (1099-K) / $321,251 (net) | CLAUDE.md WINS — 1099-K is source-locked |
| SGM 2024 net | −$14,903 (net-deposits model, filed) | −$213,417 (gross-up model, Assembly 1) | **TJ MUST CHOOSE** — two valid models, different figures. Neither "wins" without TJ's filing decision. |
| SPLT 2025 COGS | $142,035 (13,000 units × $10.82, V11 Final_PL tab) | V11 is CONSISTENT with locked unit cost but SPLT_SGM_2025_Tax_Amendment_Packet uses $123,043 (different unit count — 11,244 vs 13,000) | **CONFLICT.** V11 Final_PL: 15,000 − 2,000 ending = 13,000 sold × $10.82 = $142,035. The early 2025 Amendment Packet uses 11,244 sold. Assembly 4D uses a different unit count. Verify the locked unit count and derive COGS consistently. |
| SPLT 2025 ending inventory | 2,000 units (V11 `SPLT_2025_Final_PL`) | 3,756 units (CLAUDE.md Layer 8 / Assembly 4D: 15,000 − 11,244 = 3,756) | **CONFLICT.** V11 says 2,000 ending; CLAUDE.md says 3,756. The 3,756 includes ~1,400 Atlantic Access consigned units. Owner confirmed 1,400 consigned units ARE inside the 3,756. V11's 2,000 may reflect a different count (perhaps excluding the 1,400 as "not on hand"). Reconcile unit flow and balance sheet inventory value before filing. |
| SPLT 2025 taxable income | $6,927 (early amendment packet) | ~$56,373 (Assembly 4D) | CLAUDE.md WINS — Assembly 4D included Chase card classification and Kickstarter income. |
| SGM 2025 gross receipts | $130,976 (V11 — raw bank feed) | $55,484 (CLAUDE.md — non-revenue stripped, nominee resolved) | CLAUDE.md WINS — Layer 7 footed classification. |
| CB 2025 status | Not in V11 at all | −$16,470 loss (Assembly 5) | CLAUDE.md WINS — Layer 9 footed classification. |
| Cyberbrands 2024 revenue | V11 `Key_Findings` says ~$112–115K "own account revenue" and acknowledges Schedule C $139,613. Some of V11's earlier tabs treat CB revenue as commingled with SGM. | CB 2024 revenue locked **$107,112.61** (post-BNPL correction) | CLAUDE.md WINS — BNPL double-count confirmed and removed. |
| SGM 2024 COGS | V11 `SGM_2024_Expense_Reconstruction_CPA_Packet.xlsx`: $455,932 gross factory wires (no inventory deduction). V11 `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx`: $393,532 (purchases $455,932 − inventory $62,400 = 6,000 units × $10.40 per photo). Assembly 1 (`deliverables/`): $386,799. | **$386,799** (Assembly 1, locked) | CLAUDE.md WINS. The $393,532 in the v11 packet uses $10.40/unit ending inventory; the $386,799 uses a slightly different per-unit figure or count. Use Assembly 1 packet figure. |

---

## UNRUN PASSES / UNPROCESSED REPORTS

| Item | Status | What's Needed |
|---|---|---|
| **SGM 2025 full-year bank statement set** — V11's Bank_Stmt_Index says "Partially on file" | UNRESOLVED in V11. Layer 7 (CLAUDE.md) ran and footed, but this was after V11 was built. | Confirm SGM 2025 all 12 months are on file and indexed. Layer 7 footed, so the classification is done — but the index should reflect it. |
| **CB 2025 bank statement index entry** — Not in Bank_Stmt_Index tab | UNRESOLVED in V11. CB 2025 statements were added by owner (CLAUDE.md Layer 2) but never indexed in V11. | Add CB 2025 WF statements to Bank_Stmt_Index. Layer 9 classified them (all 12 months foot) but V11 didn't capture this. |
| **Chase Feb–Jun 2026 statements** — Not in Bank_Stmt_Index | UNRESOLVED in V11. CLAUDE.md confirms added by user. | Add to index. The CF_Monthly_2026YTD_SPLT covers Jan–May; June must be added. |
| **June 2026 SPLT statement** — Added per CLAUDE.md but not yet reflected in CF_Monthly_2026YTD_SPLT (tab shows only Jan–May) | UNRESOLVED in V11. | Add June 2026 row to CF_Monthly_2026YTD_SPLT: deposits $6,214.22, withdrawals $9,838.97, ending −$52.89. |
| **`Forecast_24_36mo` tab formula population** — All value cells are $0 / blank; formulas not populating | UNRESOLVED / BROKEN in V11. | Either fix the tab's formula references or rebuild the cash flow model from scratch in V12. |
| **`OnAir_Claims_Reconciliation` tab** — Only 2 rows have data; 5 are blank stubs (deal terms, margins, distribution, patent, financial position) | PARTIALLY DONE in V11. The structure is there; the content is missing. | Populate every row with the verified figures from CLAUDE.md and Assembly deliverables before any diligence call. |
| **`Balance_Sheet_YearEnd` — Inventory and equity lines** | Inventory = "management estimate $95,400" (not footed). Equity = not computed. | Replace inventory with unit-count-based figure (3,756 ending SPLT units × $10.82 landed = $40,624; plus Atlantic Access disclosure; plus SGM 1,400 units × $9.60 + landed = $13,440). Compute equity = assets − liabilities. |
| **`GL_TB_Reconstructed` — TB check should be $0; equity is "plug"** | Equity is a balancing plug; TB CHECK row is blank. | Populate TB CHECK row. This is useful only if the balance sheet figures are sourced — see above. |
| **Munro & Associates $11,079.16 — classification PENDING since V11** | Explicitly "PENDING" in V11's Amendment_Decision tab | Owner must classify: consulting (not SGM Splitflask → excluded from GMV) or SGM Splitflask product revenue → included. Affects 2024 SGM amendment. |
| **Path A vs B deal structure decision** | V11 analyzed both; no final decision recorded | Owner + deal counsel must confirm which path was chosen and whether any SBA consent letter was requested/obtained. |
| **`Gross_Margin` tab — all calculation cells blank** | The tab has the structure but Gross Profit and GM% rows show None/blank | Rebuild with real COGS figures from Assembly packets. Quick win for investor presentation. |

---

## OTHER FILES — TRIAGE

### DOCX Files

| File | Category | Assessment |
|---|---|---|
| `Financial_Clarification_Memo_2024_Revenue_v3.docx` | C — Structure useful | V3 is the most current. Framing of deposits vs revenue is correct. YoY figures need updating to Assembly-final. Do NOT lead with this for Kendra — the audience-split rule applies (tax narrative excluded from investor package). |
| `Financial_Clarification_Memo_2024_Revenue.docx` / `_v2.docx` | A — Superseded | Earlier versions. Use V3 only. |
| `CPA_Amendment_Cover_Letter.docx` | C — Structure useful | Template for CPA covering the 2024 amendment rationale. Must be updated to reference the correct model (which of the two SGM 2024 models — TJ decides first). |
| `Contractor_Services_Agreement_SPLT_SGM_v2.docx` | C — Useful with care | V11 Key_Findings notes the SPLT→SGM $3,500/mo rate does NOT match the $1,600/year actual bank feed. The rate in the CSA must be adjusted to match reality or the forward-only agreement starts with a contradicted rate. Confirm the v2 CSA rate and whether it was signed. |
| `Contractor_Services_Agreement_SPLT_SGM.docx` | A — Superseded | Use v2 only. |
| `Intercompany_Settlement_Memo_2025_SPLT_SGM.docx` | C — Useful | Documents the $5,550 value transfer. Confirm it cites the correct itemization ($1,600 direct + $3,705 Amex + $245 IRS). |
| `Kickstarter_Proceeds_Assignment_Cyberbrands_SPLT.docx` | D — Confirmed useful | Required paper: Kickstarter campaign under Cyberbrands, funds belong to SPLT. Executed July 2026 per Key_Findings. KEEP — needed for any audit or diligence question on Kickstarter. |
| `Mold_Services_Invoice_Completion_Chukwuezugo.docx` | B — Unverified | Covers the $9,800 mold pass-through (3 × $3,266.67). Confirm installments 2 and 3 are documented and that the SPLT filed treatment is correct. |
| `Promissory_Note_Chukwuezugo_SocialGear.docx` | D — Confirmed | $29,000 loan, $25,000 repaid, $4,000 balance, 10% interest. Executed July 2026. SGM obligation. Interest (~$2,750) is deductible to SGM. 1099-INT obligation. |
| `SBA_Consent_Request_Letter_TEMPLATE.docx` | B — Unverified / Conditional | Only needed if Path A chosen and collateral moves from SGM to SPLT. Owner / deal counsel must determine if any transfers triggered the covenant (separate from the phantom $148K transfer which didn't occur). |
| `Vehicle_Use_Reimbursement_Agreement_Cyberbrands_SPLT.docx` | D — Confirmed useful | Required paper for Santander lease (Cyberbrands lessee / SPLT user-payer). Executed July 2026. |
| `Warehouse_Rental_Agreement_SPLT.docx` | D — Confirmed useful | SPLT direct-to-landlord warehouse rental agreement. Executed July 2026. |
| `Patent_Product_License_SPLT_to_SGM.docx` | B — Unverified / Conditional | Part of Path A structure — licenses the patent from SPLT (IP holder) to SGM (legacy channel operator). If Path A was chosen and this is signed, it's a related-party disclosure for diligence. If not signed, it's a draft only. |
| `Asset_Reversion_Forward_Commitment_SGM_SPLT.docx` | B — Unverified | Unclear from filename what this commits to. Related to the Path A asset-transfer framework. Must be reviewed by deal counsel before any asset moves. |

### Earlier XLSX versions (v2 through v10)

| File | Category | Assessment |
|---|---|---|
| `SPLT_INC_Financial_Reconstruction_v2.xlsx` through `v10.xlsx` | A — All superseded | These are intermediate working versions. V11 is the most current in this folder. All are superseded by `deliverables/` Assembly packets. Do NOT reference. Safe to archive but do not delete (audit trail). |
| `SGM_2024_Deposit_Classification_Schedule.xlsx` (v1) through `_v2.xlsx` and `_v3.xlsx` | A — Superseded by v4 | v4 is the final version with management attributions (7/3/26). Earlier versions show intermediate classifications. |
| `SGM_2024_Amendment_Model.xlsx` | B — Partially useful | Contains the gross-up vs net-floor modeling framework (`Amendment_Model` tab) and the `Tax_Impact_Estimate` tab (quantifies the cost of amending at different fee-rate assumptions). The $141,948 net-floor underreporting figure is SUPERSEDED (Assembly 1 uses the gross-up model), but the gross-up → fee → net framework is structurally correct. The `SGM_2024_Restatement` tab's channel breakdown ($223,514 Amazon + $137,757 Shopify + $62,241 TikTok + etc.) is SUPERSEDED by the 1099-K locks and channel builds. |

---

## RECOMMENDED ACTION LIST

Owner to approve line-by-line before acting.

**MANDATORY BEFORE ANY DILIGENCE:**

1. **Resolve the SGM 2024 filing model conflict.** TJ must choose between: (a) the net-deposits model in `SGM_2024_1120S_Amendment_Packet_FINAL.xlsx` (revenue $560,938, loss −$14,903, already "filed" per V11 notes) vs (b) the gross-up model in `deliverables/SGM_2024_Amendment_Packet.xlsx` (revenue $521,762, loss −$213,417). If the net-deposits return was actually filed in July 2026, note this in CLAUDE.md and document which packet governs going forward. Do NOT let two different "final" SGM 2024 numbers circulate.

2. **Confirm Munro & Associates $11,079.16 classification.** This is explicitly "PENDING" from V11 and was not resolved in later CLAUDE.md sessions. Ask owner: consulting (excluded from SGM) or SGM Splitflask product? Resolve before SGM 2024 is finalized.

3. **Resolve SPLT 2025 unit-count conflict.** V11 Final_PL says 2,000 ending units; CLAUDE.md says 3,756 (which includes 1,400 Atlantic Access consigned). The balance sheet inventory value and COGS depend on this. Pick one consistent number and document it. Also reconcile: V11's 13,000 units sold vs the early 2025 packet's 11,244 units sold.

4. **Populate `OnAir_Claims_Reconciliation` tab** with all verified figures from Assembly packets. This is the #1 tool for Shark Tank diligence prep and is currently mostly blank stubs.

5. **Add SBA EIDL to `Debt_Schedule`** ($404,200 @ 3.75%, $2,018/mo, UCC lien, personal guarantee Riz). This is the largest company-adjacent liability and is ABSENT from the V11 debt schedule.

6. **Confirm which entity-year returns have actually been filed.** V11 states SGM 2024 was amended and filed July 2026. CLAUDE.md refers to Assembly packets as deliverables to TJ. Determine: (a) which returns are actually filed/amended, (b) which are still in-process. Record the actual filing status in CLAUDE.md for each entity-year.

**HIGH VALUE (do before diligence, can do in next session):**

7. **Add June 2026 to `CF_Monthly_2026YTD_SPLT` tab**: deposits $6,214.22, withdrawals $9,838.97, ending −$52.89 overdrawn. Current tab only has Jan–May.

8. **Fix `Forecast_24_36mo` formula references** or rebuild the cash flow model. All forecast cells currently show $0 due to broken formula references. This tab is the runway narrative tool and is nonfunctional.

9. **Rebuild `Gross_Margin` tab** with real COGS: SGM 2024 = $386,799; SPLT 2025 = $142,035; CB 2024 = $24,254. The current tab uses Materials & Supplies proxy (~$150K), which drastically understates cost.

10. **Update `Balance_Sheet_YearEnd`** with Assembly-final figures: SPLT ending inventory = 3,756 units × $10.82 = $40,624; add Atlantic Access disclosure line; add SGM 1,400 consigned units at cost; add SBA EIDL on SGM balance sheet; populate equity line.

11. **Confirm the Contractor Services Agreement v2 rate** ($3,500/mo vs actual $1,600/year bank transfers). If the CSA was signed at $3,500/mo and the bank shows $1,600, there is a contradiction to address before diligence sees the statements.

12. **Index newly added bank statements** (CB 2025, Chase Feb–Jun 2026, SPLT Jun 2026) into the `Bank_Stmt_Index` tab. Currently the index does not reflect these.

**LOW PRIORITY / ARCHIVE:**

13. Archive v2–v10 SPLT workbooks and v1–v3 SGM deposit schedules. These are intermediate working files only — no deliverable should reference them.

14. Confirm `Financial_Clarification_Memo_2024_Revenue_v3.docx` YoY figures are updated to Assembly-final numbers before sending to any investor.

15. Confirm deal counsel has reviewed `Asset_Reversion_Forward_Commitment_SGM_SPLT.docx` and `Patent_Product_License_SPLT_to_SGM.docx` in the context of the SBA covenant and the Path A vs B decision.

---

*Report covers all 33 files in `/v11/`. No existing file was modified. Report written to `v11/V11_TRIAGE_INVENTORY.md` only.*
