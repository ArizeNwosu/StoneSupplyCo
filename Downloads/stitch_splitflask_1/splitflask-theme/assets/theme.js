/* Splitflask Theme JS
 * Handles: nav toggle, sticky header, bundle picker, gallery, cart AJAX,
 *          filter chips, FAQ search, scroll animations
 */

(function () {
  'use strict';

  /* ─── Utilities ─── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  const cartDebug = window.location.search.includes('cartDebug=1');

  function logCartDebug(label, payload) {
    if (!cartDebug) return;
    console.groupCollapsed(`[cart-debug] ${label}`);
    console.log(payload);
    console.groupEnd();
  }

  /* ─── Mobile Nav Toggle ─── */
  function initNav() {
    const btn = $('#nav-menu-btn');
    const drawer = $('#mobile-nav');
    const closeBtn = $('#mobile-nav-close');
    if (!btn || !drawer) return;

    btn.addEventListener('click', () => {
      const open = drawer.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('overflow-hidden', !open);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!drawer.classList.contains('hidden') &&
          !drawer.contains(e.target) &&
          !btn.contains(e.target)) {
        drawer.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
      }
    });
  }

  /* ─── Sticky Header Border on Scroll ─── */
  function initStickyHeader() {
    const header = $('header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('shadow-sm', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── PDP Gallery: Thumbnail Switcher ─── */
  function initGallery() {
    const mainMedia = $('#pdp-main-media');
    if (!mainMedia) return;

    function getMainImage() {
      return mainMedia.querySelector('#main-product-image');
    }

    function renderMainMediaFromButton(button) {
      if (!button) return;
      const mediaType = button.dataset.mediaType || 'image';
      const imageUrl = button.dataset.imageUrl || '';
      const imageSrcset = button.dataset.imageSrcset || '';
      const alt = button.dataset.alt || '';
      const videoSrc = button.dataset.videoSrc || '';

      if (mediaType === 'video' && videoSrc) {
        mainMedia.classList.remove('is-zoomed');
        mainMedia.classList.add('has-video');
        mainMedia.innerHTML = `<video class="w-full h-full object-cover" controls autoplay loop muted playsinline preload="metadata"><source src="${videoSrc}" type="video/mp4"></video>`;
        return;
      }

      mainMedia.classList.remove('has-video');
      mainMedia.innerHTML = `<img src="${imageUrl}" ${imageSrcset ? `srcset="${imageSrcset}"` : ''} alt="${alt.replace(/"/g, '&quot;')}" class="w-full h-full object-cover transition-transform duration-300 ease-out" id="main-product-image" width="900" height="1125" loading="eager" fetchpriority="high">`;
    }

    function setActive(buttons, activeBtn, activeClasses) {
      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', 'false');
        activeClasses.forEach((name) => button.classList.remove(name));
      });
      activeBtn.setAttribute('aria-pressed', 'true');
      activeClasses.forEach((name) => activeBtn.classList.add(name));
    }

    const thumbnailButtons = $$('.thumbnail-btn');
    thumbnailButtons.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        renderMainMediaFromButton(btn);
        const mainImg = getMainImage();
        if (mainImg) mainImg.dataset.manualThumbnail = 'true';
        if (mainMedia) {
          mainMedia.classList.remove('is-zoomed');
          mainMedia.style.removeProperty('--zoom-origin-x');
          mainMedia.style.removeProperty('--zoom-origin-y');
        }

        setActive(thumbnailButtons, btn, ['border-primary', 'shadow-primary/20']);
      });
    });

    const swatchButtons = $$('.color-swatch-btn');
    const swatchLabel = $('#selected-color-label');
    swatchButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const currentMainImg = getMainImage();
        if (currentMainImg) {
          const src = btn.dataset.imageUrl;
          const srcset = btn.dataset.imageSrcset;
          if (src) currentMainImg.src = src;
          if (srcset) currentMainImg.srcset = srcset;
          currentMainImg.alt = btn.dataset.imageAlt || btn.dataset.colorLabel || '';
          currentMainImg.dataset.manualThumbnail = 'false';
        }

        if (swatchLabel) swatchLabel.textContent = btn.dataset.colorLabel || '';
        swatchButtons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        setActive(swatchButtons, btn, ['border-primary']);
      });
    });

    if (mainMedia) {
      const resetZoom = () => {
        mainMedia.classList.remove('is-zoomed');
        mainMedia.style.removeProperty('--zoom-origin-x');
        mainMedia.style.removeProperty('--zoom-origin-y');
      };

      mainMedia.addEventListener('click', () => {
        if (mainMedia.classList.contains('has-video')) return;
        mainMedia.classList.toggle('is-zoomed');
      });

      mainMedia.addEventListener('mouseleave', resetZoom);

      mainMedia.addEventListener('mousemove', (event) => {
        if (mainMedia.classList.contains('has-video')) return;
        const rect = mainMedia.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        mainMedia.style.setProperty('--zoom-origin-x', `${Math.max(0, Math.min(100, x))}%`);
        mainMedia.style.setProperty('--zoom-origin-y', `${Math.max(0, Math.min(100, y))}%`);
      });
    }
  }

  /* ─── PDP Bundle Picker ─── */
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
      const img = document.createElement('img');
      img.src = imageUrl;
      if (imageSrcset) img.srcset = imageSrcset;
      img.alt = imageAlt || '';
      img.className = 'w-full h-full object-cover transition-transform duration-300 ease-out';
      img.id = 'main-product-image';
      img.width = 900;
      img.height = 1125;
      img.loading = 'eager';
      img.fetchPriority = 'high';
      mainMedia.innerHTML = '';
      mainMedia.appendChild(img);
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
      // Single label reference used for all status writes in this function
      const label = atcButton?.querySelector('span');
      const originalLabel = label?.textContent;

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
          if (label) {
            label.textContent = `Color "${optionValue}" not available`;
            setTimeout(() => { if (label) label.textContent = originalLabel; }, 4000);
          }
          console.error(`[Splitflask] Could not resolve variant for color "${optionValue}"`);
          return false;
        }

        // Each row is one slot; multiplying by packQty scales across ordered packs.
        // e.g. packQty=2, same color in both rows → variantCounts[vid] = 4 (correct)
        variantCounts[vid] = (variantCounts[vid] || 0) + packQty;
      }

      const items = Object.entries(variantCounts).map(([id, quantity]) => ({
        id: parseInt(id, 10) || id,
        quantity,
      }));
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

  function initPdpHeroCountdown() {
    const timers = $$('[data-pdp-countdown]');
    if (!timers.length) return;

    timers.forEach((timer) => {
      const durationSeconds = Math.max(0, parseInt(timer.dataset.durationSeconds || '0', 10) || 0);
      if (!durationSeconds) return;

      const hoursEl = $('[data-pdp-countdown-hours]', timer);
      const minutesEl = $('[data-pdp-countdown-minutes]', timer);
      const secondsEl = $('[data-pdp-countdown-seconds]', timer);
      const endTime = Date.now() + (durationSeconds * 1000);

      function pad(value) {
        return String(value).padStart(2, '0');
      }

      function tick() {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minutesEl) minutesEl.textContent = pad(minutes);
        if (secondsEl) secondsEl.textContent = pad(seconds);

        if (remaining > 0) {
          window.setTimeout(tick, 1000);
        }
      }

      tick();
    });
  }

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
      const autoFreebieItems = items.filter((item) => getAutoFreebieMatch(item, configuredFreebies));
      const paidItems = items.filter((item) => !getAutoFreebieMatch(item, configuredFreebies));

      if (!paidItems.length) {
        for (const item of autoFreebieItems) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: item.key, quantity: 0 }),
          });
        }
        return autoFreebieItems.length ? fetchCartState() : cart;
      }

      const itemsToAdd = configuredFreebies.filter((freebie) => {
        return !autoFreebieItems.some((item) => Number(item.variant_id) === Number(freebie.variantId));
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

      for (const item of autoFreebieItems) {
        if (Number(item.quantity) !== 1) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: item.key, quantity: 1 }),
          });
          return fetchCartState();
        }
      }

      return cart;
    }

    // Qty buttons — use item key, not line number
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

    // Remove buttons — use item key
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
        if (finalCart.item_count === 0) {
          window.location.reload();
          return;
        }
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

  function getCartSummaryFromRows() {
    const linePrices = $$('.cart-line-price');
    const subtotalCents = linePrices.reduce((sum, linePrice) => {
      const normalized = String(linePrice.textContent || '').replace(/[^0-9.]/g, '');
      const amount = parseFloat(normalized);
      return sum + (Number.isFinite(amount) ? Math.round(amount * 100) : 0);
    }, 0);

    return {
      subtotalCents,
      totalCents: subtotalCents,
    };
  }

  function updateCartTotals(cart) {
    const summary = getCartSummaryFromRows();
    const subtotalCents = summary.subtotalCents;
    const totalCents = summary.totalCents;
    logCartDebug('update totals from visible rows', {
      subtotalCents,
      totalCents,
      rowPrices: $$('.cart-line-price').map((el) => el.textContent),
      itemCount: cart?.item_count,
      apiSubtotal: cart?.items_subtotal_price,
      apiTotal: cart?.total_price,
    });
    const subtotal = formatMoney(subtotalCents);
    const total = formatMoney(totalCents);
    const freeShippingThreshold = 5000;
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalCents);
    const shippingProgress = Math.min(100, Math.round((subtotalCents / freeShippingThreshold) * 100));
    const subtotalEl = $('#cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = subtotal;
    $$('#cart-total, #cart-total-mobile').forEach((el) => {
      if (el) el.textContent = total;
    });

    const shippingStatus = $('#cart-shipping-status');
    if (shippingStatus) {
      shippingStatus.textContent = subtotalCents >= freeShippingThreshold ? 'Free' : 'Calculated at checkout';
    }

    const freeShippingMessage = $('#free-shipping-message');
    if (freeShippingMessage) {
      freeShippingMessage.textContent = subtotalCents >= freeShippingThreshold
        ? 'You unlocked free shipping.'
        : `Add ${formatMoney(remainingForFreeShipping)} more to unlock free shipping.`;
    }

    const freeShippingProgressEl = $('#free-shipping-progress');
    if (freeShippingProgressEl) {
      freeShippingProgressEl.style.width = `${shippingProgress}%`;
    }

    const freeShippingPercent = $('#free-shipping-percent');
    if (freeShippingPercent) {
      freeShippingPercent.textContent = String(shippingProgress);
    }

    const freeShippingProgressIcon = $('#free-shipping-progress-icon');
    if (freeShippingProgressIcon) {
      freeShippingProgressIcon.style.left = `clamp(12px, ${shippingProgress}%, calc(100% - 12px))`;
    }

    updateHeaderCartBadge(cart.item_count);
  }

  function formatMoney(cents) {
    const normalized = Number(cents);
    if (!Number.isFinite(normalized)) return '$0.00';
    return '$' + (normalized / 100).toFixed(2);
  }

  function updateHeaderCartBadge(itemCount) {
    const cartLink = $('a[aria-label^="Cart"]');
    if (!cartLink) return;
    const count = Math.max(0, Number(itemCount) || 0);
    cartLink.setAttribute('aria-label', `Cart (${count} items)`);

    let badge = cartLink.querySelector('.cart-count-badge');
    if (count <= 0) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-count-badge absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none';
      cartLink.appendChild(badge);
    }
    badge.textContent = String(count);
  }

  function animateShippingProgressOnLoad() {
    const progressEl = $('#free-shipping-progress');
    if (!progressEl) return;
    const target = Math.max(0, Math.min(100, parseInt(progressEl.dataset.progressTarget || '0', 10) || 0));
    const iconEl = $('#free-shipping-progress-icon');
    const percentEl = $('#free-shipping-percent');

    requestAnimationFrame(() => {
      progressEl.style.width = `${target}%`;
      if (iconEl) iconEl.style.left = `clamp(12px, ${target}%, calc(100% - 12px))`;
      if (percentEl) percentEl.textContent = String(target);
    });
  }

  /* ─── Collection Filter Chips ─── */
  function initFilterChips() {
    const chips = $$('.filter-chip');
    const grid = $('#collection-grid');
    if (!chips.length || !grid) return;

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.remove('bg-primary', 'text-on-primary');
          c.classList.add('bg-surface-container-high', 'text-on-surface');
        });
        chip.classList.add('bg-primary', 'text-on-primary');
        chip.classList.remove('bg-surface-container-high', 'text-on-surface');

        const filter = chip.dataset.filter;
        $$('[data-tags]', grid).forEach((card) => {
          if (!filter) {
            card.style.display = '';
          } else {
            const tags = (card.dataset.tags || '').split(',').map((t) => t.trim());
            card.style.display = tags.includes(filter) ? '' : 'none';
          }
        });
      });
    });
  }

  /* ─── FAQ Search ─── */
  function initFaqSearch() {
    const input = $('#faq-search');
    const content = $('#faq-content');
    if (!input || !content) return;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      $$('.faq-item', content).forEach((item) => {
        const q = item.querySelector('summary')?.textContent?.toLowerCase() || '';
        const a = item.querySelector('div')?.textContent?.toLowerCase() || '';
        item.style.display = (!query || q.includes(query) || a.includes(query)) ? '' : 'none';
      });
    });
  }

  /* ─── Mobile Sticky Bar: Show/Hide on Scroll ─── */
  function initMobileStickyBar() {
    const bars = $$('[data-mobile-sticky-bar]');
    if (!bars.length) return;

    bars.forEach((bar) => {
      const triggerSelector = bar.dataset.stickyTrigger;
      const trigger = triggerSelector ? document.querySelector(triggerSelector) : null;

      if (trigger && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          const entry = entries[0];
          bar.style.transform = entry.isIntersecting ? 'translateY(100%)' : 'translateY(0)';
        }, {
          threshold: 0.15
        });
        observer.observe(trigger);
        return;
      }

      const onScroll = () => {
        bar.style.transform = window.scrollY > 200 ? 'translateY(0)' : 'translateY(100%)';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    });
  }

  /* ─── Global Lazy Media + Deferred Section Painting ─── */
  function initLazyMedia() {
    const main = $('#main-content');
    if (!main) return;

    $$('img', main).forEach((img, index) => {
      if (!img.hasAttribute('loading') && index > 0) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (!img.hasAttribute('fetchpriority') && img.getAttribute('loading') === 'lazy') {
        img.setAttribute('fetchpriority', 'low');
      }
    });

    $$('iframe', main).forEach((iframe) => {
      if (!iframe.hasAttribute('loading')) iframe.setAttribute('loading', 'lazy');
    });

    $$('video', main).forEach((video) => {
      if (!video.hasAttribute('preload')) video.setAttribute('preload', 'metadata');
    });

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '200px 0px' });

    $$('[data-lazy-section], #main-content > section, #main-content > div.shopify-section').forEach((section, index) => {
      if (index === 0) {
        section.classList.add('is-visible');
        return;
      }
      section.classList.add('is-lazy-section');
      observer.observe(section);
    });
  }

  /* ─── Video Modal (built on demand, no DOM on page load) ─── */
  function initVideoModal() {
    let activeModal = null;

    function parseVideoUrl(url) {
      const ytShort = url.match(/youtu\.be\/([^?&]+)/);
      const ytWatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&]+)/);
      const ytEmbed = url.match(/youtube\.com\/embed\/([^?&]+)/);
      const ytId    = (ytShort || ytWatch || ytEmbed || [])[1];
      if (ytId) return { type: 'youtube', id: ytId };

      const vimeo = url.match(/vimeo\.com\/(\d+)/);
      if (vimeo) return { type: 'vimeo', id: vimeo[1] };

      if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'file', url };

      return { type: 'iframe', url };
    }

    function buildEmbed(parsed) {
      if (parsed.type === 'youtube') {
        const src = `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&modestbranding=1`;
        return `<iframe src="${src}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>`;
      }
      if (parsed.type === 'vimeo') {
        const src = `https://player.vimeo.com/video/${parsed.id}?autoplay=1&color=d66a1f&title=0&byline=0`;
        return `<iframe src="${src}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe>`;
      }
      if (parsed.type === 'file') {
        return `<video src="${parsed.url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" controls autoplay playsinline></video>`;
      }
      return `<iframe src="${parsed.url}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>`;
    }

    function openModal(url, captionText) {
      const parsed = parseVideoUrl(url);

      // Build modal HTML
      const wrapper = document.createElement('div');
      wrapper.id = 'video-modal';
      wrapper.setAttribute('role', 'dialog');
      wrapper.setAttribute('aria-modal', 'true');
      wrapper.setAttribute('aria-label', 'Product video');
      wrapper.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity 250ms ease;';

      wrapper.innerHTML = `
        <div id="vm-backdrop" style="position:absolute;inset:0;background:rgba(13,15,16,0.85);backdrop-filter:blur(4px);"></div>
        <div id="vm-panel" style="position:relative;z-index:1;width:100%;max-width:56rem;background:#fff;border-radius:1.5rem;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);transform:translateY(12px);transition:transform 250ms ease;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:1px solid rgba(172,173,175,0.2);">
            <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;color:#2d2f31;">See How It Works</span>
            <button id="vm-close" aria-label="Close video" style="display:flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:9999px;border:none;background:transparent;cursor:pointer;color:#5a5c5e;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" style="width:1.25rem;height:1.25rem;fill:currentColor;"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
            </button>
          </div>
          <div style="position:relative;width:100%;padding-bottom:56.25%;background:#0c0e10;">
            ${buildEmbed(parsed)}
          </div>
          ${captionText ? `<div style="padding:0.75rem 1.5rem;font-size:0.875rem;color:#5a5c5e;border-top:1px solid rgba(172,173,175,0.2);">${captionText}</div>` : ''}
        </div>
      `;

      document.body.appendChild(wrapper);
      document.body.style.overflow = 'hidden';
      activeModal = wrapper;

      // Trigger transition on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wrapper.style.opacity = '1';
          const panel = wrapper.querySelector('#vm-panel');
          if (panel) panel.style.transform = 'translateY(0)';
        });
      });

      wrapper.querySelector('#vm-close').addEventListener('click', closeModal);
      wrapper.querySelector('#vm-backdrop').addEventListener('click', closeModal);
      wrapper.querySelector('#vm-close').focus();
    }

    function closeModal() {
      if (!activeModal) return;
      const panel = activeModal.querySelector('#vm-panel');
      activeModal.style.opacity = '0';
      if (panel) panel.style.transform = 'translateY(12px)';
      document.body.style.overflow = '';
      setTimeout(() => {
        if (activeModal && activeModal.parentNode) {
          activeModal.parentNode.removeChild(activeModal);
        }
        activeModal = null;
      }, 260);
    }

    // Open on any [data-video-modal] click
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-video-modal]');
      if (!trigger) return;
      e.preventDefault();
      const url = trigger.dataset.videoModal;
      const cap = trigger.dataset.videoCaption || '';
      if (url) openModal(url, cap);
    });

    // Esc key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModal) closeModal();
    });
  }

  /* ─── Predictive Search Overlay (built on demand, no DOM on page load) ─── */
  function initSearch() {
    const btn = $('#search-btn');
    if (!btn) return;

    let overlay = null;
    let debounceTimer = null;

    function buildOverlay() {
      const el = document.createElement('div');
      el.id = 'search-overlay';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'Search');
      el.style.cssText = [
        'position:fixed;inset:0;z-index:99998;',
        'display:flex;flex-direction:column;align-items:center;',
        'padding-top:5rem;',
        'opacity:0;transition:opacity 200ms ease;',
      ].join('');

      el.innerHTML = `
        <div id="so-backdrop" style="position:absolute;inset:0;background:rgba(13,15,16,0.6);backdrop-filter:blur(4px);"></div>
        <div id="so-panel" style="
          position:relative;z-index:1;width:100%;max-width:40rem;margin:0 1rem;
          background:#fff;border-radius:1rem;overflow:hidden;
          box-shadow:0 20px 50px rgba(0,0,0,0.3);
          transform:translateY(-8px);transition:transform 200ms ease;
        ">
          <!-- Input row -->
          <div style="display:flex;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid rgba(172,173,175,0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" style="width:1.25rem;height:1.25rem;fill:#757779;flex-shrink:0;margin-right:0.75rem;">
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
            </svg>
            <input
              id="so-input"
              type="search"
              placeholder="Search products…"
              autocomplete="off"
              aria-label="Search products"
              style="
                flex:1;border:none;outline:none;font-size:1rem;
                font-family:'Manrope',sans-serif;color:#2d2f31;
                background:transparent;
              "
            />
            <button id="so-close" aria-label="Close search" style="
              display:flex;align-items:center;justify-content:center;
              width:2rem;height:2rem;border-radius:9999px;border:none;
              background:transparent;cursor:pointer;color:#5a5c5e;flex-shrink:0;margin-left:0.5rem;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" style="width:1.25rem;height:1.25rem;fill:currentColor;">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
          <!-- Results -->
          <div id="so-results" style="max-height:60vh;overflow-y:auto;"></div>
        </div>
      `;

      document.body.appendChild(el);
      document.body.style.overflow = 'hidden';
      btn.setAttribute('aria-expanded', 'true');
      overlay = el;

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.querySelector('#so-panel').style.transform = 'translateY(0)';
        });
      });

      // Focus input
      setTimeout(() => el.querySelector('#so-input').focus(), 50);

      // Events
      el.querySelector('#so-close').addEventListener('click', closeSearch);
      el.querySelector('#so-backdrop').addEventListener('click', closeSearch);

      el.querySelector('#so-input').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchResults(e.target.value.trim()), 220);
      });

      el.querySelector('#so-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = el.querySelector('#so-input').value.trim();
          if (q) window.location.href = '/search?q=' + encodeURIComponent(q) + '&type=product';
        }
      });
    }

    function closeSearch() {
      if (!overlay) return;
      overlay.style.opacity = '0';
      overlay.querySelector('#so-panel').style.transform = 'translateY(-8px)';
      document.body.style.overflow = '';
      btn.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
      }, 210);
    }

    async function fetchResults(query) {
      const resultsEl = overlay && overlay.querySelector('#so-results');
      if (!resultsEl) return;

      if (!query) {
        resultsEl.innerHTML = '';
        return;
      }

      // Loading state
      resultsEl.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#757779;font-family:Manrope,sans-serif;font-size:0.875rem;">Searching…</div>';

      try {
        const res = await fetch(
          '/search/suggest.json?q=' + encodeURIComponent(query) +
          '&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=hide',
          { headers: { 'Content-Type': 'application/json' } }
        );
        const data = await res.json();
        const products = data?.resources?.results?.products || [];
        renderResults(products, query, resultsEl);
      } catch {
        resultsEl.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#757779;font-family:Manrope,sans-serif;font-size:0.875rem;">Something went wrong. Please try again.</div>';
      }
    }

    function renderResults(products, query, container) {
      if (!products.length) {
        container.innerHTML = `
          <div style="padding:2rem;text-align:center;color:#757779;font-family:Manrope,sans-serif;font-size:0.875rem;">
            No results for "<strong style="color:#2d2f31;">${escapeHtml(query)}</strong>"
          </div>`;
        return;
      }

      const items = products.map((p) => {
        const img = p.featured_image?.url
          ? `<img src="${p.featured_image.url}&width=80" alt="${escapeHtml(p.featured_image.alt || p.title)}" style="width:3.5rem;height:3.5rem;object-fit:cover;border-radius:0.5rem;flex-shrink:0;">`
          : `<div style="width:3.5rem;height:3.5rem;border-radius:0.5rem;background:#e7e8eb;flex-shrink:0;"></div>`;

        const price = p.price ? formatMoney(p.price) : '';
        const comparePrice = p.compare_at_price && p.compare_at_price > p.price
          ? `<s style="color:#acadaf;font-size:0.75rem;margin-left:0.25rem;">${formatMoney(p.compare_at_price)}</s>`
          : '';

        return `
          <a href="${p.url}" style="
            display:flex;align-items:center;gap:0.875rem;
            padding:0.875rem 1rem;border-bottom:1px solid rgba(172,173,175,0.15);
            text-decoration:none;color:inherit;transition:background 150ms;
          " onmouseover="this.style.background='#f0f0f3'" onmouseout="this.style.background=''">
            ${img}
            <div style="flex:1;min-width:0;">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:0.9375rem;color:#2d2f31;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.title)}</div>
              ${p.vendor ? `<div style="font-family:Manrope,sans-serif;font-size:0.75rem;color:#757779;margin-top:0.125rem;">${escapeHtml(p.vendor)}</div>` : ''}
            </div>
            <div style="font-family:Manrope,sans-serif;font-weight:700;font-size:0.9375rem;color:#d66a1f;white-space:nowrap;">
              ${price}${comparePrice}
            </div>
          </a>`;
      }).join('');

      const viewAll = `
        <a href="/search?q=${encodeURIComponent(query)}&type=product" style="
          display:block;padding:0.875rem 1rem;text-align:center;
          font-family:Manrope,sans-serif;font-weight:700;font-size:0.8125rem;
          letter-spacing:0.05em;text-transform:uppercase;color:#d66a1f;
          text-decoration:none;border-top:1px solid rgba(172,173,175,0.15);
          transition:background 150ms;
        " onmouseover="this.style.background='#f0f0f3'" onmouseout="this.style.background=''">
          View all results →
        </a>`;

      container.innerHTML = items + viewAll;
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    btn.addEventListener('click', () => {
      if (!overlay) buildOverlay();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay) closeSearch();
    });
  }

  /* ─── Init on DOMContentLoaded ─── */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initStickyHeader();
    initGallery();
    initBundlePicker();
    initPdpHeroCountdown();
    initCart();
    initFilterChips();
    initFaqSearch();
    initMobileStickyBar();
    initVideoModal();
    initSearch();
    initLazyMedia();
    animateShippingProgressOnLoad();
  });
})();
