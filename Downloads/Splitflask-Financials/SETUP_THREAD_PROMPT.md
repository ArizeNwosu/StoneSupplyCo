# SETUP THREAD — Splitflask DD Ledger Foundation

You are setting up the persistent foundation for a multi-session financial due-diligence
reconstruction. This is a fresh CLI session with an empty context. Everything you need is
in this prompt. Your job is ONE layer only: build the project scaffold and the canonical
ledger, inventory the source documents already sitting in this folder, and commit. Do NOT
classify transactions, pull anything from Drive, or lock figures — later sessions do that.
When you finish, STOP and report back.

## CONTEXT (background — do not act beyond the SCOPE section)

- Entity map:
  - SGM / Social Gear Media LLC — CA S-corp, EIN 83-3077502, Wells Fargo ending 8625
  - SPLT INC — C-corp formed Jan 2025, EIN 33-3094308, Wells Fargo ending 0423
  - Cyberbrands LLC — holding/related entity, EIN ending 7466; Schedule C business name on
    the personal 1040
- Financials are reconstructed from bank statements with NO accounting system. There is no
  pre-existing general ledger — building one from statements IS the downstream work. This
  setup session only builds the empty structure and inventories inputs.
- This ledger is the single source of truth for every downstream layer. It lives on disk,
  under git. The filesystem is the state; git history is the changelog. Source documents
  have already been copied into this folder manually — Drive is now archival only. Do NOT
  reach out to Drive.

## SCOPE (do exactly this, nothing more)

### 0. Detect environment (report findings, don't act on them)
- Check whether an `xlsx` skill/plugin is installed and available in this CLI. Report
  yes/no and, if yes, how it's invoked. (Setup does not need it — this is intel for later
  layers. If unavailable, just build the workbook with plain openpyxl.)
- Confirm you can create and edit an `.xlsx` file in place on local disk. Report yes/no.

### 1. Create the project scaffold and initialize git
- Establish this folder as the project root (it already contains the source files). Report
  the absolute path.
- `git init` if not already initialized. Add a `.gitignore` — your judgment on whether to
  exclude raw bank statements from git (e.g. a `sources/raw/` path) vs. committing
  everything to a private local repo. Report which you chose.
- Make a root commit.

### 2. Inventory the source documents already in this folder
- List every file currently in the folder (recurse into subfolders). Do NOT assume which
  files should be here — read what's actually present and register THAT.
- For each source document found, you'll create a row in the `Sources` tab (built in
  step 3). Classify each by `type`: `1099-K` / `bank-stmt` / `return` / `packet` /
  `workbook` / `lease` / `note` / `csv` / `other`, and by `entity` where determinable.
- Files known to be relevant (confirm which are present; note any absent — do NOT fabricate
  a row for a file that isn't there):
  - V11 investor workbook
  - 2024 CPA packet
  - 2025 CPA packet
  - Cover letter
  - Expense reconstruction packet
- Files that are EXPECTED TO BE MISSING (must be obtained in a later session — add a
  `Sources` row with `status = missing` as a placeholder reminder):
  - Actual Amazon 1099-K form(s) — note: a second Amazon account is issued to Cyberbrands
    LLC, routed to Schedule C
  - Actual Shopify 1099-K form
  - TikTok 1099-K monthly detail CSVs (nine files) — unless they're already in the folder,
    in which case register them as `staged`

### 3. Build the canonical ledger `ledger.xlsx` (six tabs)

Build with these exact tabs and column headers. Freeze and bold the header row. Keep it a
plain, auditable workbook — no charts, no styling beyond legibility.

**Tab `Figures`** — one row per canonical number (the queryable master table):
`key | label | value | entity | period | basis | status | source_id | source_ref | version | updated | notes`
- `key`: stable dot-namespaced id, e.g. `sgm.2024.1099k_floor`. Never changes once set.
- `basis`: `gross` / `net` / `n/a`. REQUIRED on every figure row — a figure without a
  stated basis is a landmine given the net-vs-gross exposure.
- `status`: `locked` / `provisional` / `disputed` / `open`. RULE: a figure may only reach
  `locked` if it has a real `source_id` pointing at a real row in `Sources`. Downstream
  layers build only on `locked` figures.
- `source_ref`: the specific pointer — page, cell, line, or exact dollar-string.
- Leave EMPTY except the header row. Do not populate figures.

**Tab `Sources`** — the document registry (also becomes the VDR index later):
`source_id | doc_name | type | entity | local_path | status | notes`
- `status`: `staged` (present in folder) / `missing` (expected but not present).
- Populate from the step-2 inventory: one row per file actually found (`staged`) plus
  placeholder rows for the expected-missing items.

**Tab `ChangeLog`** — every figure correction appends here:
`date | key | old_value | new_value | reason`
- Header row only.

**Tab `OpenItems`** — the triaged unresolved ledger:
`item | category | blocks | owner | age_opened | status | notes`
- `category`: `timing` (clears on its own) / `adjustment` (needs a correcting entry or
  reclass) / `investigate` (root cause unknown, must be run down).
- Seed these rows (`age_opened` = today; `status` = `open`; `owner` blank unless obvious):
  - "Kangdao ambiguous Sept 2024 wire" — `investigate`
  - "Facebook ad spend: additive vs overlapping across bank + card records" —
    `investigate`; notes: affects SPLT profitability, CPA action item
  - "Patent valuation range ($100K conservative vs ~$2M potential)" — `investigate`
  - "COGS + platform-fee substantiation totals — grossing up to 1099-K floors only holds
    taxable income near as-filed if these are substantiated" — `investigate`;
    blocks: net-revenue figures

**Tab `Intercompany`** — the SGM ↔ Cyberbrands reconciliation surface:
`txn_ref | paid_by | benefits | amount | third_party | landed_on | double_count_check | notes`
- Enforces the rule: freight and inventory transfers land on whichever entity PAID the
  third party, exactly once. `double_count_check` = `pass` / `fail` per line.
- Header row only. Populated by the cross-entity reconciliation pass later.

### 4. Create `HANDOFF.md`
Short orientation file every future session reads first. Include:
- One paragraph: what this project is, plus the discipline — disk-is-state, one-layer-per-
  session, commit-before-you-close, no `locked` figure without a `source_id`.
- The entity map (from CONTEXT).
- Layer sequence: Layer 0 (source truth + per-entity classification) -> Layer 1 (tax
  positions lock) -> Layer 2 (investor cascade) -> Layer 3 (24-tab V12 assembly).
- Current state line: "Setup complete. Nothing locked yet. Next: Layer 0 source-truth
  pull (Amazon/Shopify 1099-Ks still to be obtained)."

### 5. Commit
`git add -A && git commit` with a clear message. Confirm success.

## REPORT BACK (end your turn here — do not continue to any other layer)

1. Absolute folder path; confirm git initialized with commits.
2. **Skill detection**: is an `xlsx` skill installed in this CLI? If yes, how is it invoked?
3. **Write-path**: confirmed you can edit `ledger.xlsx` in place on disk? (Expected yes.)
4. Full inventory: every file found, its assigned `type`, and its `Sources` status
   (`staged` / `missing`). Flag any expected file that is absent.
5. Confirm the six tabs exist with correct headers and the seeded OpenItems rows.
6. Anything that surprised you or didn't match this prompt.

Then STOP. Do not pull 1099-Ks, do not classify anything, do not lock figures.
