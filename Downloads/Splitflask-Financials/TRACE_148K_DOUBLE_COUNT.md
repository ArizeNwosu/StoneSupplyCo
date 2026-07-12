# TRACE: $148,164 SGM→SPLT — Double-Count Check
**Session date:** 2026-07-11  
**Question:** Is the $148,164 SGM→SPLT the same money as the $224,789 Amazon nominee? Double-count risk?

---

## Job 1 — Amazon deposits: month-by-month bank landing

| Month | → SGM bank (…8625) | → SPLT bank (…0423) |
|---|---|---|
| Jan | $17,886.10 | — |
| Feb | $181.69 | $8,444.13 |
| Mar | $0.10 | $11,636.56 |
| Apr | $473.22 | $6,172.60 |
| May | $165.63 | $6,769.83 |
| Jun | $257.53 | $4,759.07 |
| Jul | — | $227.45 |
| Aug | — | $4,531.66 |
| Sep | $0.24 | $6,116.14 |
| Oct | $186.30 | $5,248.63 |
| Nov | $131.22 | $9,117.73 |
| Dec | $51.73 | $44,779.01 |
| **TOTAL** | **$19,333.76** | **$107,802.81** |

**Payout-bank switch:** SGM received Amazon through early Feb; SPLT received from Feb 5 onwards.  
Switch date confirmed: Amazon changed disbursement to SPLT WF …0423 when SPLT was formed Jan 28, 2025.  
SGM bank retained: $19,334 (Jan + trace Feb). SPLT bank received: $107,803 (Feb–Dec net disbursements).

**Prior session claimed SPLT bank received $224,281.65 — this is WRONG.**  
Actual SPLT bank Amazon by descriptor = $107,802.81. The prior "$224,281.65" figure was a calculation error in an earlier session and was never a real bank balance.

---

## Job 2 — What composed the $148,164 "leaving SGM"?

**There is no $148,164 transfer in either bank.**

- SGM 2025 debits > $10,000: **ZERO** — no large SGM outgoing transfers exist at all.
- SPLT 2025 credits > $10,000: Only $20,000 (owner loan, branch deposit, Mar) and $49,562.44 (Kickstarter, Apr). Neither originates from SGM.
- SGM→SPLT cash transfers in ledger (Layer 10): **$0 in, $1,600 out** (SPLT paid SGM $1,300 + $300).

**The $148,164 is a PHANTOM — a derived number from a prior session with no bank transaction behind it.**

Best reconstruction of its origin: a prior analytical session computed a reconciliation plug between the (wrong) claim of "$224,281.65 Amazon in SPLT bank" and the Amazon already attributed by the nominee mechanism. That plug was labeled an "SGM→SPLT operating transfer" and carried forward as a balance-sheet item requiring a TJ loan-vs-capital decision. The underlying number was never verified against actual bank transactions.

---

## Job 3 — Double-count verdict

| Flow | Amount | Type | Double-count risk? |
|---|---|---|---|
| Amazon 1099-K gross (SGM TIN) | $240,009.89 | Tax reporting | Nominee procedure handles this |
| SGM nominees out to SPLT | $224,789.09 | Tax reporting only — NO cash | None — reporting reassignment |
| SPLT reports Amazon nominee income | $224,789.09 | SPLT 1120 Line 1 | Counted ONCE (nominee-in) |
| Amazon cash → SGM bank | $19,334 | Real cash, SGM keeps $15,221 (order basis) | Attributed to SGM only |
| Amazon cash → SPLT bank | $107,803 | Real cash | This IS the cash receipt of nominee income (net of fees) — NOT a separate income item |
| $148,164 SGM→SPLT | — | **DOES NOT EXIST** | Phantom — remove from both balance sheets |

**No double-count on P&L.** The SPLT amendment correctly reports:
- Amazon nominee gross $224,789 as SPLT income (Line 1)
- Amazon fees $77,433 as SPLT deduction
- Net = ~$147,356 (cash basis approximation; the $107,803 actually landing in bank = this net minus reserves/returns/timing)

The bank deposits ($107,803) are NOT separately counted as income — they are the cash receipt of the nominee income already on the tax return. No double-entry.

---

## Corrected treatment

**Remove the $148,164 from both entities' balance sheets.**

There is no intercompany receivable on SGM or payable on SPLT for $148,164. The prior "TJ loan-vs-capital decision" on this amount is moot — there is no transaction to classify.

**What actually happened (clean picture):**
- Amazon routed gross sales receipts, deducted its fees, then paid SPLT bank directly from Feb 5 onward.
- SGM received Jan/early-Feb Amazon net ($19,334 in bank; $15,221 on order-date basis).
- No operating cash moved from SGM to SPLT. Amazon paid SPLT itself.
- The only SPLT→SGM cash is $1,600 (already in Interco tab, PASS).

**Effect on entity figures:** No change to P&L. Balance-sheet phantom item removed.

---

## SBA covenant

**NOT implicated.** The SBA "Limits on Distribution of Assets" covenant prohibits SGM from distributing assets to affiliated entities without SBA consent. Since SGM never transferred $148,164 to SPLT (Amazon paid SPLT directly), no covenant breach exists. The Amazon cash flow is Amazon→SPLT, not SGM→SPLT.

---

## Open item that still needs resolution

The implied Amazon fee rate from bank data is ~47% ($112,873 gap on $240,010 gross). This is higher than the 2024 actual (~15% referral + FBA). The SPLT packet uses a stated fee of $77,433 (26.7% from Seller Central S339), which would imply net SPLT disbursements of ~$147,356 — but the bank shows only $107,803. The ~$39,553 residual gap is likely Amazon reserves held back + returns clawbacks + timing. This does NOT affect P&L (fees are stated from settlement) but should be noted for TJ's balance sheet.

**⚠️ Action for TJ:** Pull Amazon 2025 Seller Central settlement report to confirm:
1. Total fees on SPLT-period activity ($77,433 stated, or $60,101 from coherence check — confirm which)
2. Amazon reserve balance as of 12/31/2025 (explains bank gap)
3. Return clawbacks (reduce gross income)

---

## Files affected

- `deliverables/SPLT_2025_Amendment_Packet.xlsx` — Tab 6_Nominee_Interco: remove the $148,164 SGM→SPLT line (or mark VOID — does not exist).
- `deliverables/SGM_2025_Amendment_Packet.xlsx` — Tab 6_Nominee_Interco: remove the $148,164 balance-sheet entry.
- `ledger.xlsx` — Intercompany tab: the $148,164 entry is currently absent (correctly — it was never classified in the bank transaction tabs). No ledger change needed.
- `deliverables/CPA_Decision_List.md` — Remove the loan-vs-capital TJ decision on $148,164 (decision is moot; item removed).
