# Bundle Picker + Cart Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix per-item color picker rendering for multi-pack bundles, cart qty increase, and cart delete persistence.

**Architecture:** Replace `initBundlePicker()` (builds color pickers from variant JSON instead of hidden DOM buttons) and `initCart()` (uses Shopify item `key` instead of stale line numbers). Add `data-key="{{ item.key }}"` to the cart row element in liquid.

**Tech Stack:** Vanilla JS (ES2020), Shopify Liquid, Shopify AJAX Cart API (`/cart/change.js`, `/cart/add.js`)

**Spec:** `docs/superpowers/specs/2026-05-12-bundle-picker-cart-rewrite-design.md`

---

## File Map

| File | Change |
|---|---|
| `sections/cart-main.liquid` | Add `data-key="{{ item.key }}"` to cart row div (line 74) |
| `assets/theme.js` | Replace `syncCartRows()` (line 1382), `initCart()` (line 1413), `updateCartUI()` (line 1614) with new implementations. Replace `initBundlePicker()` (line 168) entirely. |

---

## Task 1: Add `data-key` to cart row in liquid

**Files:**
- Modify: `sections/cart-main.liquid:74`

- [ ] **Step 1.1: Add the data-key attribute**

Open `sections/cart-main.liquid`. Find line 74 — the opening div of the cart item row. It currently reads:

```liquid
<div class="bg-surface-container-lowest rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] md:grid-cols-[12rem_minmax(0,1fr)] gap-5 md:gap-6 p-5 md:p-6 border border-surface-container-high/60 items-start cart-item-row" id="cart-item-{{ item.key | replace: ':', '-' }}" data-line="{{ forloop.index }}">
```

Replace it with:

```liquid
<div class="bg-surface-container-lowest rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] md:grid-cols-[12rem_minmax(0,1fr)] gap-5 md:gap-6 p-5 md:p-6 border border-surface-container-high/60 items-start cart-item-row" id="cart-item-{{ item.key | replace: ':', '-' }}" data-line="{{ forloop.index }}" data-key="{{ item.key }}">
```

- [ ] **Step 1.2: Push the liquid file**

```bash
shopify theme push --store=e028f0.myshopify.com --theme=185049088280 --allow-live --only sections/cart-main.liquid
```

- [ ] **Step 1.3: Verify in browser**

Open the cart page. Open DevTools → Elements. Find any `.cart-item-row` div. Confirm it has a `data-key` attribute with a value like `40934561390776:abc12345`.

- [ ] **Step 1.4: Commit**

```bash
git add sections/cart-main.liquid
git commit -m "feat: add data-key to cart row for key-based cart operations"
```

---

## Task 2: Rewrite `initCart()` — replace with key-based handlers

**Files:**
- Modify: `assets/theme.js` — replace lines 1381–1638 (from the `/* ─── AJAX Cart */` comment through the closing brace of `updateCartUI`)

**Context:** The old `initCart` uses line numbers (`data-line`) to identify items. After a removal, line numbers renumber and the next operation hits the wrong item. The old `updateCartUI` and `syncCartRows` functions are also removed — they are no longer needed.

- [ ] **Step 2.1: Replace the cart block in theme.js**

Find the following text (starts at line 1381 in `assets/theme.js`):

```javascript
  /* ─── AJAX Cart: Quantity +/- and Remove ─── */
  function syncCartRows(cart) {
```

Everything from that comment through the closing brace of `updateCartUI` (ends just before `function getCartSummaryFromRows`) must be replaced with the new `initCart`:

```javascript
  /* ─── AJAX Cart: Quantity +/- and Remove ─── */
  function initCart() {
    if (window.__splitflaskCartInitialized) return;
    window.__splitflaskCartInitialized = true;

    let cartBusy = false;
    const freebieRoot = $('[data-cart-freebies]');
    let isApplyingCartFreebies = false;

    function setCartBusy(busy) {
      cartBusy = busy;
      $$('.cart-remove-btn, .cart-qty-btn').forEach((b) => { b.disabled = busy; });
    }

    async function fetchCartState() {
      const response = await fetch('/cart.js', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const cart = await response.json();
      logCartDebug('fetch /cart.js', cart);
      return cart;
    }

    function getConfiguredCartFreebies() {
      if (!freebieRoot) return [];
      const freebies = [];
      const mysteryGiftEnabled = freebieRoot.dataset.freeMysteryGiftEnabled === 'true';
      const mysteryGiftVariantId = parseInt(freebieRoot.dataset.freeMysteryGiftVariantId || '0', 10);
      if (mysteryGiftEnabled && mysteryGiftVariantId) {
        freebies.push({ key: 'mystery_gift', variantId: mysteryGiftVariantId });
      }
      const hydrationGuideEnabled = freebieRoot.dataset.freeHydrationGuideEnabled === 'true';
      const hydrationGuideVariantId = parseInt(freebieRoot.dataset.freeHydrationGuideVariantId || '0', 10);
      if (hydrationGuideEnabled && hydrationGuideVariantId) {
        freebies.push({ key: 'hydration_guide', variantId: hydrationGuideVariantId });
      }
      return freebies;
    }

    function getAutoFreebieMatch(item, configuredFreebies) {
      if (!item) return null;
      const freebieKey = item.properties?._auto_freebie_key;
      return configuredFreebies.find((freebie) => {
        return freebieKey === freebie.key || Number(item.variant_id) === Number(freebie.variantId);
      }) || null;
    }

    async function ensureCartFreebies(cart) {
      const configuredFreebies = getConfiguredCartFreebies();
      if (!configuredFreebies.length) return cart;

      const items = Array.isArray(cart?.items) ? cart.items : [];
      const indexedItems = items.map((item, index) => ({ item, line: index + 1 }));
      const autoFreebieItems = indexedItems.filter(({ item }) => getAutoFreebieMatch(item, configuredFreebies));
      const paidItems = indexedItems.filter(({ item }) => !getAutoFreebieMatch(item, configuredFreebies));

      if (!paidItems.length) {
        for (const { line } of autoFreebieItems) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line, quantity: 0 }),
          });
        }
        return autoFreebieItems.length ? fetchCartState() : cart;
      }

      const itemsToAdd = configuredFreebies.filter((freebie) => {
        return !autoFreebieItems.some(({ item }) => Number(item.variant_id) === Number(freebie.variantId));
      });

      if (itemsToAdd.length) {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            items: itemsToAdd.map((freebie) => ({
              id: freebie.variantId,
              quantity: 1,
              properties: { _auto_freebie: 'true', _auto_freebie_key: freebie.key },
            })),
          }),
        });
        return fetchCartState();
      }

      for (const { item, line } of autoFreebieItems) {
        if (Number(item.quantity) !== 1) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line, quantity: 1 }),
          });
          return fetchCartState();
        }
      }

      return cart;
    }

    // Qty buttons — resolved by item key, immune to line renumbering
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.cart-qty-btn');
      if (!btn || cartBusy) return;

      const row = btn.closest('.cart-item-row');
      if (!row) return;
      const key = row.dataset.key;
      if (!key) return;

      const display = row.querySelector('.cart-qty-display');
      const currentQty = Math.max(0, parseInt(display?.textContent || '0', 10) || 0);
      const delta = parseInt(btn.dataset.delta || '0', 10) || 0;
      const newQty = Math.max(0, currentQty + delta);

      try {
        setCartBusy(true);
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, quantity: newQty }),
        });
        if (!res.ok) throw new Error(`Cart change failed: ${res.status}`);
        const cart = await res.json();
        logCartDebug(`change key ${key} -> qty ${newQty}`, cart);

        if (newQty === 0) {
          row.remove();
        } else {
          const updatedItem = Array.isArray(cart.items) ? cart.items.find((item) => item.key === key) : null;
          const actualQty = updatedItem ? updatedItem.quantity : newQty;
          if (display) display.textContent = String(actualQty);
          const linePrice = row.querySelector('.cart-line-price');
          if (linePrice && updatedItem) linePrice.textContent = formatMoney(Number(updatedItem.final_line_price) || 0);
        }

        let finalCart = cart;
        if (!isApplyingCartFreebies) {
          isApplyingCartFreebies = true;
          finalCart = await ensureCartFreebies(cart);
          isApplyingCartFreebies = false;
        }
        updateCartTotals(finalCart);
      } catch (err) {
        console.error('[Splitflask] Cart qty update failed:', err);
        isApplyingCartFreebies = false;
      } finally {
        setCartBusy(false);
      }
    });

    // Remove buttons — resolved by item key
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.cart-remove-btn');
      if (!btn || cartBusy) return;

      const row = btn.closest('.cart-item-row');
      if (!row) return;
      const key = row.dataset.key;
      if (!key) return;

      try {
        setCartBusy(true);
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, quantity: 0 }),
        });
        if (!res.ok) throw new Error(`Cart remove failed: ${res.status}`);
        const cart = await res.json();
        logCartDebug(`remove key ${key}`, cart);
        row.remove();

        let finalCart = cart;
        if (!isApplyingCartFreebies) {
          isApplyingCartFreebies = true;
          finalCart = await ensureCartFreebies(cart);
          isApplyingCartFreebies = false;
        }
        updateCartTotals(finalCart);
      } catch (err) {
        console.error('[Splitflask] Cart remove failed:', err);
        isApplyingCartFreebies = false;
      } finally {
        setCartBusy(false);
      }
    });

    // Initial freebie sync on cart page load
    if (freebieRoot) {
      fetchCartState()
        .then(async (cart) => {
          if (isApplyingCartFreebies) return;
          isApplyingCartFreebies = true;
          const nextCart = await ensureCartFreebies(cart);
          isApplyingCartFreebies = false;
          updateCartTotals(nextCart);
        })
        .catch((err) => {
          console.error('[Splitflask] Cart freebie sync failed:', err);
          isApplyingCartFreebies = false;
        });
    }
  }

```

> The replacement ends after the closing `}` of `initCart`. The next line should be `function updateCartUI`. Delete `updateCartUI` entirely (lines 1614–1638 in the old file — from `function updateCartUI(cart, line, newQty) {` through its closing `}`).

- [ ] **Step 2.2: Verify no JS syntax errors**

```bash
node --check assets/theme.js
```

Expected: no output (clean parse). If you see a SyntaxError, fix the mismatched brace before continuing.

- [ ] **Step 2.3: Commit**

```bash
git add assets/theme.js
git commit -m "feat: rewrite initCart to use item key — fixes qty and remove bugs"
```

---

## Task 3: Rewrite `initBundlePicker()`

**Files:**
- Modify: `assets/theme.js` — replace the entire `initBundlePicker()` function (line 168 through its closing `}` at line 1343)

**Context:** The old function bails on multi-pack bundles when `swatchButtons.length === 0` (the DOM swatch group is hidden). The rewrite builds color data from the variant JSON directly.

- [ ] **Step 3.1: Replace `initBundlePicker` in theme.js**

Find the line `  function initBundlePicker() {` (line 168). Replace the entire function — everything from that line through the matching closing `  }` at line 1343 — with the following:

```javascript
  function initBundlePicker() {
    const cards = Array.from(document.querySelectorAll('.bundle-card'));
    const qtyInput = document.querySelector('#product-quantity');
    const variantInput = document.querySelector('#selected-variant-id');
    const variantDataEl = document.querySelector('#pdp-variant-data');
    const mainMedia = document.querySelector('#pdp-main-media');
    const atcButton = document.querySelector('#product-form button[type="submit"]');
    const root = document.querySelector('#product-form');
    const stickyPriceEl = document.querySelector('[data-mobile-sticky-price]');
    const swatchGroup = document.querySelector('#pdp-swatch-group');
    const swatchLabel = document.querySelector('#selected-color-label');
    const qtyNote = document.querySelector('#pdp-bundle-quantity-note');
    const globalSwatchBtns = Array.from(document.querySelectorAll('.color-swatch-btn'));

    if (!cards.length) return;

    // ── Variant data ──────────────────────────────────────────────────────────
    let allVariants = [];
    let colorPos = 0;
    let bundlePos = 0;
    try {
      const parsed = variantDataEl ? JSON.parse(variantDataEl.textContent) : null;
      if (parsed?.variants?.length) allVariants = parsed.variants;
      colorPos = parseInt(variantDataEl?.dataset.swatchOptionPosition || '0', 10) || 0;
      bundlePos = parseInt(variantDataEl?.dataset.bundleOptionPosition || '0', 10) || 0;
    } catch (err) {
      console.error('[Splitflask] Variant data parse failed:', err);
    }

    // ── Color swatch definitions ──────────────────────────────────────────────
    // Built from variant JSON + DOM swatch button metadata.
    // One entry per unique color option value. Independent of whether the DOM
    // swatch group is visible — so bundle rows always render correctly.
    function buildColorSwatches() {
      if (!colorPos || !allVariants.length) return [];
      const colorFallbacks = {
        black: '#1f2937', white: '#f5f5f4', orange: '#d66a1f', blue: '#2563eb',
        green: '#16a34a', red: '#dc2626', pink: '#ec4899', purple: '#9333ea',
        grey: '#6b7280', gray: '#6b7280', cream: '#e5d5b0', sand: '#e5d5b0',
      };
      const seen = new Set();
      return allVariants.reduce((acc, variant) => {
        const optionValue = String(variant[`option${colorPos}`] || '').trim();
        if (!optionValue || seen.has(optionValue)) return acc;
        seen.add(optionValue);

        const domBtn = globalSwatchBtns.find((btn) => {
          return (btn.dataset.optionValue || '').trim().toLowerCase() === optionValue.toLowerCase();
        });

        const dot = domBtn?.querySelector('span');
        let color = '#d66a1f';
        if (dot?.style?.background) {
          color = dot.style.background;
        } else {
          const lower = optionValue.toLowerCase();
          const match = Object.keys(colorFallbacks).find((k) => lower.includes(k));
          if (match) color = colorFallbacks[match];
        }

        acc.push({
          optionValue,
          label: domBtn?.dataset.colorLabel || optionValue,
          variantId: domBtn?.dataset.variantId || '',
          color,
          imageUrl: domBtn?.dataset.imageUrl || '',
          imageSrcset: domBtn?.dataset.imageSrcset || '',
          imageAlt: domBtn?.dataset.imageAlt || '',
        });
        return acc;
      }, []);
    }

    const colorSwatches = buildColorSwatches();

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getSelectedCard() {
      return cards.find((c) => c.classList.contains('selected')) || cards[0] || null;
    }

    function getBundleCount(card) {
      return Math.max(1, parseInt((card || getSelectedCard())?.dataset.bundleCount || '1', 10) || 1);
    }

    function getPackQty() {
      return Math.max(1, parseInt(qtyInput?.value || '1', 10) || 1);
    }

    function getSingleUnitCard() {
      return cards.find((c) => getBundleCount(c) === 1) || null;
    }

    function getActiveColorValue() {
      const active = globalSwatchBtns.find((b) => b.getAttribute('aria-pressed') === 'true');
      return (active?.dataset.optionValue || '').trim() || (colorSwatches[0]?.optionValue || '');
    }

    function parseMoneyString(value) {
      const normalized = String(value || '').replace(/[^0-9.]/g, '');
      const amount = parseFloat(normalized);
      return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
    }

    function setPrice(price, comparePrice) {
      const priceEl = document.querySelector('#bundle-price');
      const comparePriceEl = document.querySelector('#bundle-compare-price');
      if (priceEl && price) priceEl.textContent = price;
      if (comparePriceEl) {
        if (comparePrice) {
          comparePriceEl.textContent = comparePrice;
          comparePriceEl.classList.remove('hidden');
        } else {
          comparePriceEl.classList.add('hidden');
        }
      }
    }

    function setStickyPrice(totalCents) {
      if (stickyPriceEl) stickyPriceEl.textContent = formatMoney(totalCents);
    }

    function updatePrice(card) {
      const priceCents = parseMoneyString((card || getSelectedCard())?.dataset.price);
      if (!priceCents) return;
      const total = priceCents * getPackQty();
      setPrice(formatMoney(total), null);
      setStickyPrice(total);
    }

    function setImage(imageUrl, imageSrcset, imageAlt) {
      if (!mainMedia || !imageUrl) return;
      mainMedia.innerHTML = `<img src="${imageUrl}" ${imageSrcset ? `srcset="${imageSrcset}"` : ''} alt="${(imageAlt || '').replace(/"/g, '&quot;')}" class="w-full h-full object-cover transition-transform duration-300 ease-out" id="main-product-image" width="900" height="1125" loading="eager" fetchpriority="high">`;
    }

    function setAtcAvailability(available) {
      if (!atcButton) return;
      atcButton.disabled = !available;
      atcButton.classList.toggle('opacity-60', !available);
      atcButton.classList.toggle('cursor-not-allowed', !available);
    }

    // ── Variant resolver ──────────────────────────────────────────────────────
    // Finds the single-unit variant matching a given color option value.
    // Narrows by bundle option if the product has one (bundlePos > 0).
    function findSingleUnitVariant(colorValue) {
      if (!colorPos || !allVariants.length || !colorValue) return null;
      const normalizedColor = colorValue.trim().toLowerCase();
      const singleCard = getSingleUnitCard();
      const singleBundleValue = (singleCard?.dataset.optionValue || '').trim();

      let matches = allVariants.filter((v) => {
        return String(v[`option${colorPos}`] || '').trim().toLowerCase() === normalizedColor;
      });

      if (bundlePos > 0 && singleBundleValue) {
        const narrowed = matches.filter((v) => {
          return String(v[`option${bundlePos}`] || '').trim().toLowerCase() === singleBundleValue.toLowerCase();
        });
        if (narrowed.length) matches = narrowed;
      }

      return matches.find((v) => v.available) || matches[0] || null;
    }

    // ── Per-item color row renderer ───────────────────────────────────────────
    // Renders N color picker rows inside .bundle-card-config for the given card.
    // Row 1 defaults to the currently selected global color.
    // Rows 2..N default to the first swatch in colorSwatches.
    function renderRows(card) {
      const configRoot = card.querySelector('.bundle-card-config');
      if (!configRoot) return;

      const bundleCount = getBundleCount(card);
      if (bundleCount <= 1 || !colorSwatches.length) {
        configRoot.classList.add('hidden');
        configRoot.innerHTML = '';
        return;
      }

      const activeSwatch = getActiveColorValue();
      configRoot.classList.remove('hidden');
      configRoot.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Choose colors</p>
              <p class="mt-1 text-[12px] sm:text-sm text-on-surface-variant leading-5">Pick one color for each Splitflask in your ${card.dataset.bundleTitle || 'bundle'}.</p>
            </div>
            <button type="button" class="bundle-apply-all shrink-0 inline-flex items-center justify-center rounded-full border border-outline/20 bg-primary/5 px-3 py-2 text-[11px] sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/10">Make all same</button>
          </div>
          <div class="bundle-color-rows space-y-3"></div>
        </div>
      `;

      const rowsRoot = configRoot.querySelector('.bundle-color-rows');
      const applyAllBtn = configRoot.querySelector('.bundle-apply-all');

      for (let i = 0; i < bundleCount; i += 1) {
        const row = document.createElement('div');
        row.className = 'bundle-item-row rounded-[1rem] border border-outline-variant/15 bg-surface-container-lowest p-3';
        row.dataset.itemIndex = String(i);

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3 mb-2';
        header.innerHTML = `<span class="text-[12px] sm:text-sm font-bold text-on-surface">Splitflask ${i + 1}</span><span class="text-[11px] sm:text-xs uppercase tracking-widest text-on-surface-variant">Select color</span>`;
        row.appendChild(header);

        const rail = document.createElement('div');
        rail.className = 'flex flex-wrap gap-2';

        colorSwatches.forEach((swatch, swatchIndex) => {
          const isActive = i === 0
            ? swatch.optionValue.toLowerCase() === activeSwatch.toLowerCase()
            : swatchIndex === 0;

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] sm:text-sm font-semibold text-on-surface bg-white transition-all hover:border-primary/60 min-h-[40px] ${isActive ? 'border-primary' : 'border-outline/20'}`;
          btn.dataset.optionValue = swatch.optionValue;
          btn.dataset.variantId = swatch.variantId;
          btn.dataset.imageUrl = swatch.imageUrl;
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          btn.innerHTML = `<span class="w-5 h-5 rounded-full border border-outline/20 shadow-sm shrink-0" style="background:${swatch.color};"></span><span>${swatch.label}</span>`;

          btn.addEventListener('click', () => {
            Array.from(rail.querySelectorAll('button')).forEach((b) => {
              b.setAttribute('aria-pressed', 'false');
              b.classList.remove('border-primary');
              b.classList.add('border-outline/20');
            });
            btn.setAttribute('aria-pressed', 'true');
            btn.classList.add('border-primary');
            btn.classList.remove('border-outline/20');
            if (swatch.imageUrl) setImage(swatch.imageUrl, swatch.imageSrcset, swatch.imageAlt || swatch.label);
          });

          rail.appendChild(btn);
        });

        row.appendChild(rail);
        rowsRoot.appendChild(row);
      }

      applyAllBtn?.addEventListener('click', () => {
        const row0 = rowsRoot.querySelector('.bundle-item-row');
        const activeBtn0 = row0?.querySelector('[aria-pressed="true"]');
        if (!activeBtn0) return;
        const targetValue = activeBtn0.dataset.optionValue;

        Array.from(rowsRoot.querySelectorAll('.bundle-item-row')).forEach((r) => {
          Array.from(r.querySelectorAll('button')).forEach((b) => {
            const isMatch = b.dataset.optionValue === targetValue;
            b.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
            b.classList.toggle('border-primary', isMatch);
            b.classList.toggle('border-outline/20', !isMatch);
          });
        });

        applyAllBtn.textContent = 'Applied!';
        setTimeout(() => { applyAllBtn.textContent = 'Make all same'; }, 1200);
      });
    }

    // ── Card activation ───────────────────────────────────────────────────────
    function activateCard(card) {
      if (!card) return;

      cards.forEach((c) => {
        c.classList.remove('selected', 'border-primary', 'shadow-primary/20');
        c.setAttribute('aria-selected', 'false');
      });
      card.classList.add('selected', 'border-primary', 'shadow-primary/20');
      card.setAttribute('aria-selected', 'true');

      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const bundleCount = getBundleCount(card);

      if (swatchGroup) swatchGroup.classList.toggle('hidden', bundleCount > 1);

      cards.forEach((c) => {
        const configRoot = c.querySelector('.bundle-card-config');
        if (!configRoot) return;
        if (c === card && bundleCount > 1) {
          renderRows(card);
        } else {
          configRoot.classList.add('hidden');
          configRoot.innerHTML = '';
        }
      });

      if (qtyInput) qtyInput.value = '1';

      if (qtyNote) {
        if (bundleCount > 1) {
          qtyNote.textContent = `Quantity is the number of ${bundleCount}-packs. Increase it to order multiple bundles.`;
          qtyNote.classList.remove('hidden');
        } else {
          qtyNote.classList.add('hidden');
        }
      }

      if (bundleCount === 1) {
        const resolved = findSingleUnitVariant(getActiveColorValue());
        if (variantInput && resolved) variantInput.value = resolved.id;
        setAtcAvailability(resolved?.available !== false);
      } else {
        setAtcAvailability(true);
      }

      updatePrice(card);
    }

    // ── Add to cart ───────────────────────────────────────────────────────────
    // Collects one color selection per row, resolves to single-unit variant IDs,
    // groups by variant (so two Orange picks → Orange×2), multiplies by packQty,
    // then POSTs to /cart/add.js. Redirects to /cart on success.
    async function addToCart() {
      const card = getSelectedCard();
      const configRoot = card?.querySelector('.bundle-card-config');
      const rows = configRoot ? Array.from(configRoot.querySelectorAll('.bundle-item-row')) : [];

      if (!rows.length) return false;

      const packQty = getPackQty();
      const variantCounts = {};

      for (const row of rows) {
        const activeBtn = row.querySelector('[aria-pressed="true"]');
        const optionValue = activeBtn?.dataset.optionValue || '';
        const directVid = activeBtn?.dataset.variantId || '';

        let vid;
        if (directVid) {
          vid = directVid;
        } else {
          const resolved = findSingleUnitVariant(optionValue);
          vid = resolved ? String(resolved.id) : '';
        }

        if (!vid) {
          const label = atcButton?.querySelector('span');
          const original = label?.textContent;
          if (label) {
            label.textContent = `Color "${optionValue}" not available`;
            setTimeout(() => { if (label) label.textContent = original; }, 4000);
          }
          console.error(`[Splitflask] Could not resolve variant for color "${optionValue}"`);
          return false;
        }

        variantCounts[vid] = (variantCounts[vid] || 0) + packQty;
      }

      const items = Object.entries(variantCounts).map(([id, quantity]) => ({
        id: parseInt(id, 10) || id,
        quantity,
      }));

      const label = atcButton?.querySelector('span');
      const originalLabel = label?.textContent;
      if (atcButton) {
        atcButton.disabled = true;
        atcButton.classList.add('opacity-60', 'cursor-not-allowed');
        if (label) label.textContent = 'Adding...';
      }

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          let shopifyMessage = errorText;
          try {
            const parsed = JSON.parse(errorText);
            shopifyMessage = parsed.description || parsed.message || errorText;
          } catch (_) {}
          if (label) {
            label.textContent = shopifyMessage || 'Add failed — see console';
            setTimeout(() => { if (label && originalLabel) label.textContent = originalLabel; }, 4000);
          }
          console.error('[Splitflask] Bundle add failed:', errorText);
          return false;
        }

        const cartRes = await fetch('/cart.js', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const cart = await cartRes.json();
        updateHeaderCartBadge(cart.item_count);
        window.location.href = '/cart';
        return true;
      } catch (err) {
        console.error('[Splitflask] Bundle add failed:', err);
        return false;
      } finally {
        if (atcButton) {
          atcButton.disabled = false;
          atcButton.classList.remove('opacity-60', 'cursor-not-allowed');
        }
      }
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    cards.forEach((card) => {
      card.addEventListener('click', () => activateCard(card));
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.addEventListener('change', () => { if (radio.checked) activateCard(card); });
    });

    globalSwatchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        globalSwatchBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        if (swatchLabel) swatchLabel.textContent = btn.dataset.colorLabel || '';
        if (btn.dataset.imageUrl) setImage(btn.dataset.imageUrl, btn.dataset.imageSrcset, btn.dataset.imageAlt);

        if (getBundleCount(getSelectedCard()) === 1) {
          const resolved = findSingleUnitVariant(btn.dataset.optionValue || '');
          if (variantInput && resolved) variantInput.value = resolved.id;
          setAtcAvailability(resolved?.available !== false);
        }

        updatePrice(getSelectedCard());
      });
    });

    Array.from(document.querySelectorAll('.product-qty-btn')).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!qtyInput) return;
        const delta = parseInt(btn.dataset.delta || '0', 10) || 0;
        qtyInput.value = String(Math.max(1, (parseInt(qtyInput.value || '1', 10) || 1) + delta));
        updatePrice(getSelectedCard());
      });
    });

    if (qtyInput) {
      qtyInput.addEventListener('input', () => {
        qtyInput.value = String(Math.max(1, parseInt(qtyInput.value || '1', 10) || 1));
        updatePrice(getSelectedCard());
      });
    }

    if (root) {
      root.addEventListener('submit', async (e) => {
        if (getBundleCount(getSelectedCard()) >= 2) {
          e.preventDefault();
          await addToCart();
        }
      });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    const checkedRadio = root?.querySelector('input[name="bundle_selection"]:checked');
    const defaultCard = checkedRadio?.closest('.bundle-card') || cards[0] || null;
    if (defaultCard) activateCard(defaultCard);
  }
```

- [ ] **Step 3.2: Verify no JS syntax errors**

```bash
node --check assets/theme.js
```

Expected: no output. Fix any SyntaxError before continuing.

- [ ] **Step 3.3: Commit**

```bash
git add assets/theme.js
git commit -m "feat: rewrite initBundlePicker — per-item color rows from variant JSON"
```

---

## Task 4: Push and verify

- [ ] **Step 4.1: Push both changed files**

```bash
shopify theme push --store=e028f0.myshopify.com --theme=185049088280 --allow-live --only assets/theme.js sections/cart-main.liquid
```

- [ ] **Step 4.2: Verify bundle color pickers — 2-pack**

1. Open the PDP page.
2. Click the 2-pack bundle card.
3. Confirm the `.bundle-card-config` section expands inside the card showing **two labeled rows** ("Splitflask 1", "Splitflask 2"), each with all color swatches.
4. Row 1 should default to the globally selected color. Row 2 should default to the first swatch.
5. Click a different color on Row 2. Confirm only that row's selection changes.

- [ ] **Step 4.3: Verify bundle color pickers — 3-pack and 4-pack**

Repeat for the 3-pack (3 rows) and 4-pack (4 rows). Confirm the "Make all same" button copies Row 1's selection to all rows.

- [ ] **Step 4.4: Verify Add to Cart**

1. Select the 2-pack, pick Orange for Row 1 and Black for Row 2.
2. Click "Add to Cart".
3. On the cart page, confirm **two line items**: 1× Orange and 1× Black single-unit variants.
4. Open the browser console. Confirm no `[Splitflask] Could not resolve variant` errors. If you see that error, open DevTools → Network → find the `/cart/add.js` request and check the `items` array in the request body — confirm the IDs are valid numeric Shopify variant IDs.

- [ ] **Step 4.5: Verify cart qty increase**

1. On the cart page, press + on any line item.
2. Confirm the quantity display increases by 1.
3. Refresh the page. Confirm the increased quantity is still there.

- [ ] **Step 4.6: Verify cart remove**

1. On the cart page, click "Remove" on a line item.
2. Confirm the row disappears immediately and does not reappear.
3. Refresh the page. Confirm the item is gone.
4. Repeat with multiple items: remove item 1, confirm item 2 is still there with correct qty.

- [ ] **Step 4.7: Verify 1-pack still works**

1. Select the 1-pack bundle card. Confirm global swatch group is visible (not hidden).
2. Select a color. Click "Add to Cart".
3. Confirm 1× of that color variant is added to cart.

---

## Troubleshooting

**Bundle rows don't appear after selecting 2-pack:**
- Open DevTools → Console. Look for `[Splitflask] Variant data parse failed` or any JS error.
- Check `colorSwatches` is non-empty: in the console run `document.querySelector('#pdp-variant-data').dataset` — confirm `swatchOptionPosition` is not `"0"`.
- If `swatchOptionPosition` is `"0"`, the product has only one option (no color axis). In that case the color picker won't appear — the product variant setup needs to be checked in Shopify admin.

**"Color not available" error on Add to Cart:**
- Open DevTools → Console. The error log includes the color value that couldn't be resolved.
- The color value from the swatch button (`data-option-value`) must exactly match a product option value. Check in Shopify admin → Products → Variants that the option values match (case-sensitive after trim).
- Workaround: set explicit `data-variant-id` on each color_swatch block in the theme customizer pointing to the single-unit variant ID.

**Cart qty goes to wrong value:**
- Check `data-key` is present on `.cart-item-row`. If missing, Task 1 (liquid push) may not have completed.
- Check the `/cart/change.js` response in DevTools → Network. The response `items` array should contain the updated item with the new quantity.

**Remove re-appears after page refresh:**
- If the row is removed from DOM but reappears on refresh, it means the server-side remove succeeded but a page reload re-renders the item from Shopify's cart. This would indicate the `/cart/change.js` request failed silently — check the Network tab for the request status.
