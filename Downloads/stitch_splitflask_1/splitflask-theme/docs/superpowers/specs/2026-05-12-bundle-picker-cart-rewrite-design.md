# Bundle Picker + Cart Rewrite — Design Spec
**Date:** 2026-05-12
**Status:** Approved

---

## Problem

Three bugs in the current PDP bundle picker and cart module:

1. **Per-item color pickers don't render** when a 2+ pack bundle is selected. Root cause: `renderInlineBundleBuilder` bails out when `swatchButtons.length === 0`. Those buttons come from the DOM swatch group, which is hidden for multi-packs. The per-item row builder depends entirely on cloning those hidden DOM elements.

2. **Cart qty + button sets quantity to 0.** Root cause: the freebie logic (`ensureCartFreebies`) can insert a freebie line item between the cart change and the UI update. `updateCartUI(cart, line, qty)` then reads `cart.items[line - 1]` which is the freebie (qty=1 or 0), not the item the user changed.

3. **Cart delete does not persist.** Root cause: after removal, `syncCartRows` re-numbers `data-line` attributes on remaining rows. Any in-flight or re-triggered operation uses a stale line number and can update or revive the wrong item.

---

## Scope

**Files changed:**
- `assets/theme.js` — replace `initBundlePicker()` and `initCart()` entirely
- `sections/cart-main.liquid` — add `data-key="{{ item.key }}"` to the cart row element

**Files unchanged:**
- `sections/pdp-hero-2.liquid` — no changes
- All other sections, snippets, templates

---

## Architecture

Two independent modules with no shared state.

```
initBundlePicker()                 initCart()
├── reads variant JSON             ├── reads data-key from row DOM
├── builds colorSwatches array     ├── qty btn → /cart/change.js (by key)
├── card click → activateCard      └── remove btn → /cart/change.js (key, qty=0)
├── row swatch click → selection
└── form submit → addToCart
```

---

## Module 1: PDP Bundle Picker

### Data initialization (once on load)

| Variable | Source | Description |
|---|---|---|
| `allVariants` | `#pdp-variant-data` JSON | All product variants |
| `colorPos` | `data-swatch-option-position` | Which option axis (1–3) is color |
| `bundlePos` | `data-bundle-option-position` | Which option axis (1–3) is bundle size (0 = single-option product) |
| `colorSwatches` | Derived from `allVariants` | Array of `{label, optionValue, color, imageUrl}` — one per unique color value |
| `cards` | `.bundle-card` elements | All bundle option cards |
| `globalSwatches` | `.color-swatch-btn` elements | The static swatch group for 1-pack |

`colorSwatches` is built from the variant JSON, **not** from DOM buttons. This means per-item rows render correctly regardless of the DOM swatch group's visibility.

Color swatch metadata is assembled as follows:
- `optionValue` — the unique color option value (e.g. `"Orange"`)
- `label` — same as optionValue unless a matching `.color-swatch-btn` has a `data-color-label` that differs
- `color` — from matching `.color-swatch-btn[data-option-value]`'s CSS background, or a fallback heuristic based on the color name
- `imageUrl` / `imageSrcset` — from matching `.color-swatch-btn` if present

### `findSingleUnitVariant(colorValue)`

Resolves the single-unit variant ID for a given color option value.

1. Get the single-unit card (bundleCount = 1) → read `card.dataset.optionValue` as `singleBundleValue`
2. Filter `allVariants` where `variant["option" + colorPos]` matches `colorValue` (case-insensitive trim)
3. If `bundlePos > 0`: also filter where `variant["option" + bundlePos]` matches `singleBundleValue`
4. Return: first available variant → first match → `null`

Special case: if the row's swatch button has a non-empty `data-variant-id`, use that ID directly and skip the option-matching logic entirely.

### `activateCard(card)`

Called when a bundle card is clicked.

1. Remove `.selected` from all cards; add to `card`
2. Check `bundleCount = parseInt(card.dataset.bundleCount)`
3. If `bundleCount >= 2`:
   - Hide global swatch group (`#pdp-swatch-group`)
   - Show `.bundle-card-config` inside `card`; call `renderRows(card)`
   - Hide `.bundle-card-config` inside all other cards
4. If `bundleCount === 1`:
   - Show global swatch group
   - Hide all `.bundle-card-config` sections
5. Reset `packQty` input to `1`
6. Update price display and qty note

### `renderRows(card)`

Builds the per-item color picker UI inside `.bundle-card-config`.

```
bundleCount = card.dataset.bundleCount
activeSwatch = currently active global swatch option value

Clear .bundle-card-config innerHTML
Inject container HTML with "Choose colors" header + "Make all same" button + rows div

For i = 1..bundleCount:
  Create row div: label "Splitflask {i}"
  For each swatch in colorSwatches:
    Create button with data-option-value, data-variant-id, data-image-url
    isActive = (i === 1 && swatch.optionValue === activeSwatch) || (i > 1 && swatch is first)
    Set aria-pressed accordingly; add border-primary if active
    On click: deactivate all buttons in this row, activate clicked button
  Append row to rows div

Attach "Make all same" handler:
  Read row 1's active selection
  Apply that selection to all other rows
```

Only one button per row can have `aria-pressed="true"` at any time.

### `addToCart()`

Called when the form submits and `bundleCount >= 2`.

```
bundleCount = selected card's bundleCount
packQty = parseInt(qtyInput.value)

selections = for each row: read aria-pressed="true" button's data-option-value

variantCounts = {}
For each selection:
  vid = findSingleUnitVariant(selection.optionValue)?.id
  if !vid → show error "Color not available", abort
  variantCounts[vid] = (variantCounts[vid] || 0) + packQty

items = Object.entries(variantCounts).map([id, qty] → {id: parseInt(id), quantity: qty})

POST /cart/add.js { items }
  on success → window.location.href = '/cart'
  on failure → show Shopify error message in ATC button for 4s, re-enable button
```

### Price display

`updatePrice(card)`:
- `priceCents = parseMoneyString(card.dataset.price)` — the configured bundle price string (e.g. `"$84.95"`)
- `packQty = parseInt(qtyInput.value)`
- `setPrice(formatMoney(priceCents * packQty))`
- `setStickyPrice(priceCents * packQty)`

### Edge cases

| Scenario | Behaviour |
|---|---|
| All same color selected | Single line item added (e.g. Orange × 2) |
| `findSingleUnitVariant` returns null | Error shown in ATC button, no cart add |
| 1-pack card selected | Form submits normally (no JS intercept) |
| `packQty` = 2, bundleCount = 2 | Items get ×2 multiplier (e.g. Orange×2, Black×2) |
| Swatch has explicit `data-variant-id` | Used directly, skips option matching |

---

## Module 2: Cart

### Liquid change (`cart-main.liquid`)

Add `data-key="{{ item.key }}"` to the cart row element (line 74):

```liquid
<div class="... cart-item-row"
     id="cart-item-{{ item.key | replace: ':', '-' }}"
     data-line="{{ forloop.index }}"
     data-key="{{ item.key }}">
```

`item.key` is Shopify's stable per-item identifier (format: `{variantId}:{token}`). It does not change when other items are removed, unlike line numbers.

### `initCart()`

State:
- `cartBusy` — boolean, prevents concurrent operations
- `isApplyingCartFreebies` — boolean, prevents freebie re-entrancy

`setCartBusy(busy)`:
- Sets `cartBusy`
- Disables/enables all `.cart-qty-btn` and `.cart-remove-btn` in the document

### Qty button handler

Delegated on `document`, handles `.cart-qty-btn` clicks.

```
if cartBusy → return
btn = e.target.closest('.cart-qty-btn')
row = btn.closest('.cart-item-row')
key = row.dataset.key
currentQty = parseInt(row.querySelector('.cart-qty-display').textContent)
delta = parseInt(btn.dataset.delta)
newQty = Math.max(0, currentQty + delta)

setCartBusy(true)
try:
  res = await POST /cart/change.js { key, quantity: newQty }
  cart = await res.json()
  if newQty === 0:
    row.remove()
  else:
    updatedItem = cart.items.find(item => item.key === key)
    row.querySelector('.cart-qty-display').textContent = updatedItem.quantity
    row.querySelector('.cart-line-price').textContent = formatMoney(updatedItem.final_line_price)
  run ensureCartFreebies(cart)
  syncCartTotals(cart)
catch: log error
finally: setCartBusy(false)
```

### Remove button handler

Delegated on `document`, handles `.cart-remove-btn` clicks.

```
if cartBusy → return
btn = e.target.closest('.cart-remove-btn')
row = btn.closest('.cart-item-row')
key = row.dataset.key

setCartBusy(true)
try:
  res = await POST /cart/change.js { key, quantity: 0 }
  cart = await res.json()
  row.remove()   ← remove immediately on success
  run ensureCartFreebies(cart)
  syncCartTotals(cart)
catch: log error (row stays in DOM if request failed)
finally: setCartBusy(false)
```

### No line-number renumbering

`syncCartRows` (the function that re-stamps `data-line` on all rows after a change) is **removed**. Since we use `data-key` for all operations, line numbers are never read after page load. Remaining `data-line` attributes from the liquid render are harmless.

### Freebie logic

`ensureCartFreebies` is kept unchanged. It runs after each cart operation completes and uses the fresh cart state from `/cart/change.js`'s response. It does not affect the qty/remove UI updates, which happen before it runs.

### Edge cases

| Scenario | Behaviour |
|---|---|
| Two operations fired simultaneously | Second is blocked by `cartBusy`, returns immediately |
| `/cart/change.js` returns non-ok | Error logged, row not removed, busy released |
| Remove fails | Row stays in DOM |
| Freebie item in cart | Has `data-key` like any other item; qty/remove work identically |

---

## Implementation order

1. Add `data-key` attribute to `sections/cart-main.liquid`
2. Rewrite `initCart()` in `assets/theme.js`
3. Rewrite `initBundlePicker()` in `assets/theme.js`
4. Push both files: `shopify theme push --only sections/cart-main.liquid assets/theme.js`
5. Test: select each bundle tier, pick different colors, add to cart, verify qty +/-, verify remove

---

## Out of scope

- Shopify automatic discount setup (separate admin task)
- Any changes to `pdp-hero-2.liquid`
- Cart page redesign
- Any features beyond variant selection, qty, and remove
