# SPLT 2025 — Unit Flow Rebuild
**Date:** 2026-07-12 | **Supersedes:** Atlantic_Access_Reconciliation.md unit counts + landed cost

Owner corrections applied. All prior figures using 15,000 units are RETIRED.

---

## JOB 1 — Unit Flow & Landed Cost

### Unit Flow (corrected)

| | Was (wrong) | Now (owner-stated) |
|---|---|---|
| Units ordered | 15,000 | **11,000** |
| Units sold (direct) | 11,244 | **8,618** |
| Atlantic Access (shipped) | 1,400 | **1,152** |
| US warehouse | ~2,356 | **1,230** |

**Flow check:** 8,618 + 1,152 + 1,230 = **11,000** ✓ CLOSES

### Landed Cost

| Component | Total | Per unit (÷11,000) | Source |
|---|---|---|---|
| Factory (Kangdao/Dongguan) | $103,463.00 | $9.406 | SPLT WF ···0423, footed |
| Freight (Guangzhou Zunhuang + other) | $18,235.00 | $1.658 | SPLT WF ···0423, footed |
| **Landed (US warehouse)** | **$121,698.00** | **$11.063** | |

**Prior figure: $8.113/unit (÷15,000) — RETIRED.** Correct denominator = 11,000 ordered.

⚠️ Freight verification: $18,235 is the amount PAID per the footed SPLT WF bank. The payment covers this shipment of 11,000 units — no separate freight invoice contradicts it. Per-unit landed = $11.063.

### COGS & Income (Cash Method) — UNCHANGED

Cash method deducts what was PAID, not what was sold:
- Factory + freight paid 2025 = **$121,698** → deduction UNCHANGED
- **SPLT 2025 amended income: UNCHANGED at +$53,817**
- **C-corp tax: UNCHANGED at ~$11,302**

The unit count correction has zero income effect under cash method.

### If TJ Chooses Inventory Method — UNFAVORABLE

| | Old (15K units) | New (11K units) |
|---|---|---|
| Units sold | 11,244 | 8,618 |
| Unit cost | $8.113 | $11.063 |
| COGS | $91,248 | $95,345 |
| Ending inv asset | $30,472 | $26,353 |
| Income vs cash method | — | +$26,353 MORE (worse) |

**Inventory method → SPLT income ~+$80,170** vs cash method +$53,817. Cash method is better for owner and consistent with filed basis. TJ should confirm keeping cash.

---

## JOB 1B — Balance Sheet (Ending Inventory)

| Location | Units | Cost/unit | Value |
|---|---|---|---|
| US warehouse | 1,230 | $11.063 | **$13,608** |
| Atlantic Access (consignment) | ~1,089 | $11.063 | **$12,048** |
| **Total SPLT ending inventory** | **~2,319** | | **$25,656** |

Prior: 3,693 × $8.113 = $29,950 — **REPLACED**

Atlantic breakdown: 1,152 shipped − ~63 sold-through (INV-8707 estimate) = ~1,089 remaining.

Title retained by SPLT per Agency Contract Cl. 3.4.

---

## JOB 1C — Atlantic Access Updates

| Item | Was | Now |
|---|---|---|
| Units shipped | 1,400 | **1,152** |
| Units sold-through (~) | ~63 | ~63 (INV-8707 GBP amounts unchanged) |
| Units remaining | ~1,337 | **~1,089** |
| Inventory value | $10,847 | **$12,048** |
| $1,769 payable to Atlantic | UNCHANGED | UNCHANGED (invoice in GBP, not unit-count driven) |
| $3,014 GMV addition | UNCHANGED | UNCHANGED |

---

## JOB 2 — Kickstarter Obligation

**Cash received 2025:** $54,386.08 (11 deposits, SPLT WF ···0423, footed)

### Tax (Cash Basis) — INCOME. NO DEFERRAL.

Under cash-basis C-corp (SPLT's filed basis), advance payments are taxed **when received**. Cash landed in 2025 → 2025 income. There is no § 451 deferral election on cash basis.

**Why Form 3115 would likely backfire:** Switching to accrual defers ~$54K income BUT eliminates cash-basis COGS treatment on $121,698 paid (the full factory + freight). Net effect could easily raise total tax — TJ must model both before even considering it.

**Current treatment: $54,386 income in 2025. Stands.**

### Balance Sheet — Deferred Delivery Obligation

~800 backers await product. Units do NOT yet exist (11,000 ordered fully accounted for in the flow above).

| Item | Amount | Notes |
|---|---|---|
| Future units to produce | ~800 | At next factory run |
| Cost to fulfill | ~$8,851 | 800 × $11.063/unit landed |
| Fulfillment revenue already recognized | $54,386 | Cash-basis income 2025 |
| COGS timing | Future (year of production + shipment) | |

**Disclosure for diligence:** "SPLT received $54,386 from Kickstarter backers in 2025 for ~800 units not yet fulfilled. Units will be produced in the next factory run. Cost to fulfill ~$8,851. Recognized as income on cash basis per C-corp filing. Fulfillment obligation disclosed on balance sheet."

### GMV Decision

Kickstarter = pre-orders, product NOT shipped → currently **EXCLUDED** from $513,987/$517,001 GMV. This is correct. Label explicitly in the deal workbook: "Kickstarter bookings $54,386 excluded — product not shipped as of 12/31/25."

---

## JOB 3 — Accessories (~1,000 units, Shopify only)

**Amazon 2025:** Verified from SKU/description data — all 4,688 units sold are 30oz dual-chamber Splitflask tumblers. **Zero accessories on Amazon.**

**Shopify 2025:** Monthly aggregate only (no product-level CSV available).
- Gross sales: $238,468
- Discounts: $(81,556)
- Returns: $(7,901)
- Net sales: $149,010
- Shipping: $11,575
- **Total sales: $165,177**

Accessories are embedded in this Shopify total. Cannot quantify precisely without a product-level Shopify export (Products > Export by product).

### GMV Treatment — Owner Decision Required

| Scenario | 2025 GMV | Notes |
|---|---|---|
| Accessories IN (Splitflask-branded) | $517,001 (current) | Already in Shopify $165,177 |
| Accessories OUT (non-tumbler) | $517,001 − ~$21,026 = **~$495,975** | Need product-level Shopify report to confirm |

**⚠️ Owner to decide and state explicitly in deal workbook.** Unlike Cyberbackpack (definitively OUT — different product, different entity), accessories are Splitflask-branded. The decision is whether the deal asset is "Splitflask tumbler only" or "Splitflask brand including accessories."

---

## JOB 4 — GMV Bridge

**Does 7,618 tumblers × $49–56 reconcile to $517,001?**

7,618 = 8,618 owner-stated − ~1,000 accessories (if excluded from tumbler count)

| Component | Amount | Notes |
|---|---|---|
| 7,618 tumblers @ $52 blended | $396,136 | SPLT direct channels (Amazon + Shopify tumblers + TikTok) |
| SGM wholesale | $84,125 | 2024 carryover inventory; separate entity |
| Intl/misc (SG, AU, Kuwait, wire) | $12,700 | SPLT channels |
| Atlantic sell-through | $3,014 | INV-8707, GBP converted |
| **Subtotal (excl accessories)** | **$495,975** | |
| Accessories (implied) | **~$21,026** | $517,001 − $495,975; Shopify only |
| **Total** | **$517,001** | ✓ |

**Caveat:** The $52 blended ASP covers Amazon + Shopify net + TikTok. Shopify has heavy discounting (34% off gross → avg net ~$42/unit at list $56). Blended $52 is approximate. The bridge is conceptually consistent — gap is the accessory pool.

⚠️ If 8,618 already includes wholesale units, the bridge shifts. The SGM wholesale ($84,125 from 2024 carryover) should NOT be double-counted. Confirm: are the 8,618 SPLT-direct retail only, or do they include wholesale?

---

## Summary — What Moved

| Figure | Was | Now |
|---|---|---|
| Landed cost/unit | $8.113 | **$11.063** |
| Ending inventory total | $29,950 (3,693 units) | **$25,656 (2,319 units)** |
| Atlantic units remaining | ~1,337 | **~1,089** |
| Atlantic inventory value | $10,847 | **$12,048** |
| Kickstarter fulfillment cost | not stated | **~$8,851** |
| SPLT 2025 income | +$53,817 | **+$53,817 UNCHANGED** |
| SPLT 2025 C-corp tax | ~$11,302 | **~$11,302 UNCHANGED** |

**Nothing moves in the tax packet.** Balance sheet and disclosure items move.

---

## Owner Actions

1. **Accessories decision**: in or out of deal GMV? Pull product-level Shopify export (Sales > Products) to quantify the ~$21,026 implied accessory revenue precisely.
2. **Kickstarter disclosure**: confirm the "excluded from GMV" treatment is labeled in the deal workbook.
3. **Confirm 8,618 scope**: is this SPLT-direct retail only (excluding SGM wholesale units), or does it include wholesale? Affects the bridge.
4. **Atlantic Agency Agreement**: get the executed/signed copy on file for diligence (current copy has blank signature blocks).
