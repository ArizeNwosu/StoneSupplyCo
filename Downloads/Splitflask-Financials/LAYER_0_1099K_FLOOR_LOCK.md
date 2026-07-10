# LAYER 0 — 1099-K Floor Lock (Source Truth)

Fresh CLI session. Empty context. Everything you need is in this prompt plus the two files
already in the project root (read them FIRST — see step 0). Your job is ONE thing: read the
actual 1099-K forms and lock the gross-receipts floor figures into the ledger, verified to
source. Do NOT classify bank statements, do NOT de-duplicate the file pile, do NOT split
revenue by product. When done, STOP and report.

## Environment (confirmed by setup — do not re-derive)
- Project root: `/Users/riz/Downloads/Splitflask-Financials`
- No xlsx skill installed. Use **openpyxl directly** via python3 (v3.1.5 installed). Edit
  `ledger.xlsx` IN PLACE on disk — write-path is confirmed clean.
- The ledger has 7 tabs: Figures, Sources, ChangeLog, OpenItems, Intercompany, EntityMap.
- All source files are local. Drive is archival — do NOT reach out to it.
- git is initialized. Commit at the end.

## Step 0 — Orient (required before any work)
1. Read `CLAUDE.md` in the project root. The **two-denominator rule** governs this project:
   Splitflask GMV (tumbler only, the deal) vs. total gross receipts (all products, tax). This
   session works the TAX denominator only.
2. Read `HANDOFF.md`.
3. Open `ledger.xlsx` and read the `Sources` tab so you know which files are the 1099-K PDFs
   and the TikTok CSVs, and their current (messy) status — the Amazon 1099-Ks are currently
   registered as BOTH staged and missing pending verification. You will clean that up.

## Step 1 — Read every 1099-K source and establish the truth per form
Locate and read each 1099-K PDF and the TikTok monthly detail CSVs. Known to be present:
- Amazon: `2024-1099K.pdf` (×3 copies) and `Amazon-Cyberbrands-2024-1099K-2.pdf`
- Shopify: `2024-Shopify-1099K.pdf`, `2025-Shopify-1099K.pdf`, `Shopify-SGM-1099-K.pdf`
- TikTok: nine monthly 1099-K detail CSVs (2024)
- (Read what's ACTUALLY there — this list may be incomplete or mislabeled. Trust the files.)

For EACH form, extract and record:
- Platform (Amazon / Shopify / TikTok), and which account/store if distinguishable
- Tax year
- **Recipient TIN** — this maps to entity: 83-3077502 = SGM · 33-3094308 = SPLT ·
  …7466 = Cyberbrands LLC · …7639 = Personal (Arizechukwu)
- **Box 1a gross amount** (and note if state/monthly boxes matter)
- The exact source pointer (filename, page/box) for `source_ref`

Resolve these specific ambiguities by READING (do not assume):
- Are the three `2024-1099K.pdf` Amazon copies identical duplicates of ONE form, or different
  accounts? Confirm by TIN + account number on each. Mark the canonical one.
- Is `Amazon-Cyberbrands-2024-1099K-2.pdf` a genuinely SEPARATE second Amazon account on the
  Cyberbrands TIN? Confirm.
- For each Shopify form, which store and which TIN (SGM vs Personal vs other)?
- TikTok: reconcile the nine CSVs to a single 2024 gross figure. History expects
  $155,294.96 reconciling to the penny — VERIFY; report the actual sum and any variance.

## Step 2 — Lock the floors into the `Figures` tab (TAX denominator, product-agnostic)
For each (TIN, platform, year), add a row:
- `key`: stable, e.g. `sgm.2024.1099k.amazon_us`, `cyberbrands.2024.1099k.amazon`,
  `personal.2024.1099k.shopify`, `sgm.2024.1099k.tiktok`, etc.
- `basis`: `gross` (always — these are gross receipts)
- `status`: `locked` ONLY IF you have a real `source_id` in Sources pointing at the actual
  PDF/CSV. No source, no lock.
- `source_id` / `source_ref`: the specific form and box/page.
Then add AGGREGATE rows per TIN per year (e.g. `sgm.2024.1099k_floor`) and a
`total.2024.1099k_filed` row summing all TINs.

**Verify against expected values from CLAUDE.md/history, do NOT force to them:**
- SGM …7502 2024 floor expected ≈ $604,025.98 (Amazon US 344,035.75 + CA 11,870.02 +
  MX 10,561.67 + TikTok 155,294.96 + Shopify "Cyberbrands store" 82,263.58)
- Cyberbrands …7466 2024 ≈ $22,414.83 (2nd Amazon acct)
- Personal …7639 2024 Shopify ≈ $164,613.99
- Total 2024 filed ≈ $791,054.80
- 2025: SGM …7502 Amazon ≈ $240,009.89; SPLT …4308 Shopify ≈ $109,063.96
If a form's actual Box 1a differs from the expected value, LOCK THE ACTUAL and record the
variance in `ChangeLog` (or notes) with the expected vs actual. The form is truth; the
history figure is a prior estimate.

## Step 3 — Do NOT split by product; leave a marker instead
The 1099-K is per-TIN, not per-product, so it CANNOT tell you Splitflask vs Cyberbackpack.
Do not attempt that split here. Instead, add/refresh an `OpenItems` row:
- item: "Split each 1099-K channel into Splitflask vs Cyberbackpack using SKU/sales data —
  required for the DEAL (Splitflask GMV) denominator; the ~$103K Cyberbackpack bridge must be
  grounded in actual sales, not estimate."
- category: `investigate`; blocks: Splitflask GMV figures.

## Step 4 — Clean up the Sources tab for the 1099-K files only
Resolve the "both staged and missing" Amazon state: set the real files to `staged`, mark
duplicate copies clearly (e.g. note "duplicate of <canonical>" — do NOT delete files), and
remove the stale `missing` placeholders for anything now confirmed present. Do NOT touch the
90-file bank-statement de-dup — that is a separate later pass.

## Step 5 — Commit
`git add -A && git commit` with a clear message (e.g. "Layer 0: lock 2024/2025 1099-K floors
from source forms"). Confirm success.

## REPORT BACK (then STOP)
1. A clean table: per TIN, per year, per platform — the LOCKED Box 1a, its source file, and
   whether it MATCHED or VARIED from the expected value (with the variance if any).
2. The Amazon resolution: how many distinct Amazon 1099-Ks actually exist, on which TINs, and
   which files were duplicates.
3. The TikTok CSV reconciliation result (actual sum vs the $155,294.96 expectation).
4. The aggregate floors and total filed, per year, as locked.
5. Any form whose TIN, year, or amount did NOT match expectations — flag loudly.
6. Confirmation nothing was split by product and the OpenItems marker was added.

Do NOT classify bank statements, do NOT de-dupe the bank PDFs, do NOT build the product split.
Those are later layers.
