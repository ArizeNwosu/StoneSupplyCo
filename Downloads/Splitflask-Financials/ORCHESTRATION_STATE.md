# ORCHESTRATION STATE — Splitflask DD (handoff for a fresh orchestration chat)

If this orchestration chat maxed out: read CLAUDE.md FIRST (it holds ALL financial truth — locked
figures, decisions, corrections, open items). THIS file holds only the PROCESS meta-state: which
prompts exist, which have run, what's blocked, and the next action. Say "continue orchestration."

## The architecture (how this project runs)
- CLI + local repo at `/Users/riz/Downloads/Splitflask-Financials`, under git. Filesystem = state;
  git history = changelog. Source docs local; Drive archival. openpyxl direct (NO xlsx skill in
  CLI). `ledger.xlsx` = single source of truth (tabs: Figures, Sources, ChangeLog, OpenItems,
  Intercompany, EntityMap, BankIndex). Edit in place.
- WORK MODEL: one layer per fresh CLI session; commit before closing; disk carries state. The
  orchestration chat (this one) cuts prompts, reads reports, and updates CLAUDE.md + this file.
- Prompts are delivered as .md files the user pastes into a fresh CLI session.
- TWO STANDING RULES in CLAUDE.md (never violate): (1) BALANCE RECONCILIATION — every statement
  must foot (open ± txns = close) before done; parser has a balance-as-amount bug. (2) V12
  PROVENANCE GATE — no figure enters V12 from an unfooted parse.

## Layers/prompts — status
- Setup — DONE (ledger built, sources indexed).
- Layer 0 (1099-K floor lock) — DONE. Floors locked, product-tagged, penny-matched.
- Layer 1 (2025 revenue finalization) — DONE. 2025 Splitflask GMV ~$514K; found SGM 2025
  underreporting (~$109K, TJ); Kickstarter deferred; bank-figures re-checked CLEAN (SPLT 2025
  three-way footed).
- Layer 2 (bank hygiene) — DONE. 85→65 canonical; entity map confirmed by account#; new personal
  WF 7282 found (EXCLUDED per user); coverage gaps mostly filled by user uploads.
- Layer 3 (SGM 2024 classification) — DONE, then RECONCILED. Reconciliation found SYSTEMIC parser
  bug (77 lines, ~$1.37M phantom removed); all 12 months foot; deduction base corrected
  $720K→$614,321; deposits still tie $895,754.12.
- RECON Layer 1 2025 bank figures — DONE, clean.
- SGM 2024 (Layer 5 + audit) — FAVORABLE, no double-count. ⚠️ OPEN: which of two filing models files
  (TJ); freight intercompany reconciliation (BLOCKS both entities).
- RECON AmEx 2024 — DONE. AmEx is PERSONAL; NOT the release valve — WORSENS SGM base ~$20-23K (the
  $23,676 SGM->AmEx payments reclassed non-deductible owner-draw). Revised SGM base ~$591,365.
- Cyberbrands 2024 classification — ✅ DONE (LAYER_4). Clean, all months foot. CB rev $116,561 (above
  floor). ⚠️ FREIGHT CONTRADICTION ($42,747 SGM vs ~$13-30K CB); BNPL double-count risk; $18,766 Feb
  cash withdrawal UNKNOWN (diligence flag, owner must explain).
- SGM 2024 coherence audit — ✅ DONE. No double-count (−$172,793 corrected). BUT surfaced TWO FILING
  MODELS (gross-up −$172,793 vs net-deposits packet −$14,903, ~$158K apart) — TJ must choose which
  files (matching-exposure cure vs simplicity). Freight missing + contested → loss is a RANGE.

## BLOCKED / waiting on USER (not on any prompt)
- [RESOLVED] TikTok 2024 fee substantiated → SGM 2024 favorable.
- [RESOLVED] SGM COGS: owner confirmed $387K reconstructed is correct ($270K was his earlier flawed
  input). REPLACE $270,032 with footed ~$387K in waterfall → amended loss ~−$173K. Even more favorable.
- **Card ···1400 (SGM)**: confirm if bank-debit (already in reconciled $6,368 ads) or separate
  credit card (incremental $5,145). Small.
- **TJ items** (staged, his calls): 2025 SGM underreporting amendment; Shopify entity routing
  (Option A recommended); Amazon cutoff election; EIDL principal/interest split; Shopify Capital
  principal non-deductible.

## NEXT ACTIONS (in order)
1. Cut & run Cyberbrands 2024 classification (next prompt). Must CONSUME intercompany hand-offs:
   freight $42,747 (CB's Cyberbackpack portion), ad ···5130 $7,873 (CB deduction), CB→SGM
   transfers already in Intercompany tab.
2. When AmEx report lands: fold non-ad deductions into SGM 2024 base; record in CLAUDE.md.
3. When user exports TikTok 2024 summary: substantiate TikTok fee → run Path B Step 4 neutrality
   recompute (recon commit already exists, so only TikTok was blocking).
4. IN PROGRESS: 2025 entity classifications. DOC_LOAN_AND_RECEIVABLE pass ready (loan round-trip +
   $8,135.50 receivable). LAYER_7 SGM 2025 classification CUT + ready (resolves ~$109K underreporting).
   SGM 2025 DONE. ✅ Amazon $220K RESOLVED = SPLT revenue (account moved to SPLT, TIN lagged =
   NOMINEE income). SGM 2025 real rev ~$40K (NOT $280K) + nominee pass-through of $240K 1099-K.
   ✅ Amazon split LOCKED (order-date dashboard): SGM keeps $15,220.80 (Jan1-Feb4); SPLT gets
   $224,789.09 (Feb5-Dec31, nominee). SGM 2025 real rev ≈$55,484.
   RUN SERIAL (not parallel — 2025 keeps surfacing surprises; watch one at a time): SPLT 2025 (LAYER_8)
   FIRST → shared ledger tab SPLT_2025_Txns, commit master. THEN CB 2025 (LAYER_9) → reads SPLT's
   committed intercompany legs, shared ledger tab CB_2025_Txns. No separate files/branches/merge.
   ✅ ALL CLASSIFICATION COMPLETE (both years, all entities). SGM2024/CB2024/SGM2025/SPLT2025/CB2025 all
   classified + footed. CB 2025: rev ~$107,876 vs filed $95,558 (~$12K underreport, needs gross-up); CB
   least plug-exposed. REMAINING: (1) ✅ 2025 interco recon DONE (nominee counted once; $148K SGM→SPLT transfer = TJ loan-vs-capital);
   (2) ✅ FEE-SUBSTANTIATION DONE — all 2025 entities FAVORABLE (SPLT +$185K→−$127,235; SGM/CB loss/breakeven).
   ⚠️ coherence-check SPLT 25% Amazon fee before final lock; (3) ✅ SGM 2025 recompute + SPLT fee-check DONE. SPLT loss −$130,700 (fee was understated, now stated).
   SGM 2025 final ~$55K + nominee. ALL ANALYSIS COMPLETE — every entity-year favorable & substantiated.
   (4) ASSEMBLY: [A] Tax packets — ✅ SGM 2024 BUILT (−$213,417 final; template set) → ✅ SGM 2024 FINAL (−$213,417). CB 2024 FINAL — clean deductions ~$79,598 (net ~+$27,514). ⚠️ CB filing
   discovery: ORIGINAL return over-deducted ~$104K (unsubstantiated) — real exposure on the FILED return;
   amendment corrects it; aggregate still net-loss across entities (TJ handle deliberately). → ✅ SGM 2025 FINAL (−$11,915). ✅ SPLT 2025 LOCKED = +$56,561 (C-corp tax ~$11,878 @ 21% — the ONE place real tax owed; doesn't net vs SGM
   losses). Slightly lower once Shopify Capital interest extracted (TJ). C-corp may owe
   tax separately (TJ). NEW: SPLT paid $17,819 of CB's FB ads → CB 2025 packet ADDS it. → ✅ ALL 5 TAX PACKETS DONE (SGM24 −$213,417 | CB24 +$27,514 | SGM25 −$11,915 | SPLT25 +$56,561 |
   CB25 −$16,470). Only real tax = SPLT C-corp ~$11,878. Deliverable (A) complete.
   REMAINING: (B) investor/deal workbook — 3-YEAR (2024+2025 locked GMV + 2026 YTD-thru-Jun30). 2026 GMV light pass DONE: 2024 $751,891 | 2025 $513,987 | 2026 H1 ~$430K (2025=transition, 2026
   re-accelerating post-Shark-Tank). ⚠️ run-rate must be CONSERVATIVE (Shark Tank spike ≠ sustainable;
   don't annualize peak). → ✅ DELIVERABLE B COMPLETE: deal workbook + memo on VERIFIED GMV (2024 $751,891 | 2025 $513,987 | 2026
   H1 $106,411, annualized ~$184-213K). Intl true-up confirmed no hidden volume; 2026 is a real decline
   (TikTok→0, Shopify -71%, Amazon -28%). Honest narrative: proven product, founder-DTC maxed, Kendra
   distribution = the growth thesis. Two-denominator wall held. → ✅ COMPLETE. (A) 5 tax packets (B) deal workbook+memo (C1) 41-item CPA decision list (C2) reconciliation
   backup w/ corrections log. FINAL SEQUENCE: (1) READ_FILED_RETURNS_METHOD (method per entity from filed
   1120-S/1120 + as-filed baselines + audience-split the backup) → (2) PACKAGE_TWO_FOLDERS (handoff/CPA_TJ
   + handoff/Kendra_Diligence, wall GREP-verified). Then owner/TJ actions only (Augusta 14-day property
   total; method keep-or-change/Form 3115; nominee 1099; Amazon corrected 1099-K; Shopify Capital agreement). (C) reconciliation
   backup; + standing TJ decision list. [B] Investor/deal workbook (GMV waterfall,
   tumbler-only, separate file); [C] Reconciliation backup. Provenance gate enforced; corrections applied
   at assembly (SGM2024 COGS $387K, freight $65,918 Path-b, fees); two-denominator kept structural.
5. Intercompany reconciliation — ✅ DONE (LAYER_6). 2024 CLOSED. SGM's $42,747 freight was a
   misclass (real $15,067); SGM loss single number −$200,474 (inv) / −$258,074 (cash), both
   favorable. CB rev $107,112.61. 30 interco lines, 0 FAIL. Both 2024 returns mutually consistent.
6. Then V12 assembly + CPA packets (apply footed/sourced figures; provenance gate enforced).
   DECISION: do NOT build V12 until ALL 2025 classifications + 2025 intercompany are done. V12 is the
   convergence point, assembled once at the end. Order: SGM2025 → SPLT2025 → CB2025 → 2025 interco → V12.

## SEQUENCING PRINCIPLES (learned this session)
- Verify from source, never infer from ceilings/plugs (the fee "plugs" hid the real answer).
- Two denominators ALWAYS: Splitflask GMV (tumbler, deal) vs total gross receipts (all products,
  tax). Cyberbackpack ≠ Splitflask.
- One entity-year per session. Commit before close. Foot every statement.
- Don't let small tails (e.g. $13K ad spend) block big work — run unblocked layers in parallel.
