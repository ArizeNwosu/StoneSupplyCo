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
    const cards = $$('.bundle-card');
    const qtyInput = $('#product-quantity');
    const qtySummary = $('#bundle-quantity-summary');
    const unitSummary = $('#bundle-unit-summary');
    const swatchButtons = $$('.color-swatch-btn');
    const variantInput = $('#selected-variant-id');
    const variantDataEl = $('#pdp-variant-data');
    const swatchLabel = $('#selected-color-label');
    const mainMedia = $('#pdp-main-media');
    const atcButton = $('#product-form button[type="submit"]');
    const root = $('#product-form');
    const stickyPriceEl = $('[data-mobile-sticky-price]');
    const swatchGroup = $('#pdp-swatch-group')
      || $('#selected-color-label')?.closest('.mb-5')
      || swatchButtons[0]?.closest('.mb-5')
      || swatchButtons[0]?.parentElement?.closest('div');
    const quantityControl = $('#pdp-quantity-control')
      || qtyInput?.closest('.inline-flex')
      || qtyInput?.parentElement;
    let quantityNote = $('#pdp-bundle-quantity-note');
    let hiddenQuantityBuilder = null;

    if (!cards.length && !qtyInput && !swatchButtons.length) return;
    if (root) {
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowX = 'hidden';
    }

    let variantData = null;
    try {
      variantData = variantDataEl ? JSON.parse(variantDataEl.textContent) : null;
    } catch (err) {
      console.error('Variant data parse failed:', err);
    }
    const bundleOptionPosition = parseInt(variantDataEl?.dataset.bundleOptionPosition || '0', 10) || 0;
    const swatchOptionPosition = parseInt(variantDataEl?.dataset.swatchOptionPosition || '0', 10) || 0;
    const bundleProductDataCache = new WeakMap();

    function getVariantOptionValue(variant, position) {
      if (!variant || !position) return '';
      return String(variant[`option${position}`] || '').trim();
    }

    function normalizeBundleValue(value) {
      return String(value || '').trim().toLowerCase();
    }

    function bundleValueMatches(value, targets) {
      const normalized = normalizeBundleValue(value);
      if (!normalized || !targets.length) return false;
      return targets.some((target) => {
        return normalized === target || normalized.includes(target) || target.includes(normalized);
      });
    }

    function getSelectedCard() {
      return $('.bundle-card.selected') || cards.find((card) => {
        const radio = card.querySelector('input[type="radio"]');
        return radio && radio.checked;
      }) || cards[0] || null;
    }

    function getSelectedSwatch() {
      return swatchButtons.find((button) => button.getAttribute('aria-pressed') === 'true') || swatchButtons[0] || null;
    }

    function getSelectedBundleCount() {
      return Math.max(1, parseInt(getSelectedCard()?.dataset.bundleCount || '1', 10) || 1);
    }

    function getSelectedBundleVariantId(card) {
      const targetCard = card || getSelectedCard();
      if (!targetCard) return '';
      const radio = targetCard.querySelector('input[name="bundle_selection"]');
      return (radio?.value || targetCard.dataset.variantId || '').trim();
    }

    function getBundleProductData(card) {
      if (!card) return null;
      if (bundleProductDataCache.has(card)) return bundleProductDataCache.get(card);

      let productData = null;
      const dataEl = card.querySelector('[data-bundle-product-data]');
      if (dataEl?.textContent?.trim()) {
        try {
          const parsed = JSON.parse(dataEl.textContent);
          if (parsed?.variants?.length) productData = parsed;
        } catch (err) {
          console.error('[Splitflask] Bundle product data parse failed:', err);
        }
      }

      bundleProductDataCache.set(card, productData);
      return productData;
    }

    function getDirectBundleVariantId(card) {
      const targetCard = card || getSelectedCard();
      const configuredId = getSelectedBundleVariantId(targetCard);
      if (!configuredId) return '';

      const bundleProduct = getBundleProductData(targetCard);
      if (bundleProduct?.id && String(bundleProduct.id) === String(configuredId)) return '';
      if (bundleProduct?.variants?.some((variant) => String(variant.id) === String(configuredId))) return configuredId;

      // A product handle means the saved ID is a legacy product ID, not something
      // safe to POST to /cart/add.js directly.
      if (targetCard?.dataset.productHandle) return '';
      return configuredId;
    }

    function getBundleProductVariant(card) {
      const targetCard = card || getSelectedCard();
      const bundleProduct = getBundleProductData(targetCard);
      if (!bundleProduct?.variants?.length) return null;

      const configuredId = getSelectedBundleVariantId(targetCard);
      const configuredVariant = configuredId
        ? bundleProduct.variants.find((variant) => String(variant.id) === String(configuredId))
        : null;
      const selection = getPrimaryBundleSelection(targetCard) || getSwatchMeta(getSelectedSwatch());
      const targets = [selection?.optionValue, selection?.colorLabel]
        .map(normalizeBundleValue)
        .filter(Boolean);
      const matches = targets.length
        ? bundleProduct.variants.filter((variant) => {
          return [variant.option1, variant.option2, variant.option3, variant.title].some((value) => {
            return bundleValueMatches(value, targets);
          });
        })
        : [];
      const matchedVariant = matches.find((variant) => variant.available) || matches[0];
      const fallbackVariant = bundleProduct.variants.find((variant) => variant.available) || bundleProduct.variants[0] || null;
      const variant = matchedVariant || configuredVariant || fallbackVariant;

      if (!variant) return null;
      return {
        ...variant,
        productId: bundleProduct.id,
        productHandle: bundleProduct.handle,
        productTitle: bundleProduct.title,
      };
    }

    function getBundleAddQuantity(card, bundleVariant, packQuantity, bundleCount) {
      const normalizedPackQuantity = Math.max(1, packQuantity || 1);
      const normalizedBundleCount = Math.max(1, bundleCount || 1);
      const displayedPriceCents = parseMoneyString(card?.dataset.price);
      const variantPriceCents = Number(bundleVariant?.priceCents || 0);

      if (normalizedBundleCount > 1 && displayedPriceCents > 0 && variantPriceCents > 0) {
        const inferredUnits = Math.max(1, Math.round(displayedPriceCents / variantPriceCents));
        const inferredTotal = inferredUnits * variantPriceCents;
        if (inferredUnits > 1 && Math.abs(inferredTotal - displayedPriceCents) <= 2) {
          return inferredUnits * normalizedPackQuantity;
        }
      }

      return normalizedPackQuantity;
    }

    function getBundleTiers() {
      return cards
        .map((card) => ({
          variantId: card.dataset.variantId || '',
          bundleCount: Math.max(1, parseInt(card.dataset.bundleCount || '1', 10) || 1),
          priceCents: parseMoneyString(card.dataset.price),
        }))
        .filter((tier) => tier.variantId && tier.bundleCount > 0 && tier.priceCents >= 0)
        .sort((a, b) => {
          if (b.bundleCount !== a.bundleCount) return b.bundleCount - a.bundleCount;
          return a.priceCents - b.priceCents;
        });
    }

    function buildBundleTierItems(totalUnits) {
      const tiers = getBundleTiers();
      if (!tiers.length) return [];

      let remaining = Math.max(1, totalUnits);
      const items = [];

      tiers.forEach((tier) => {
        if (remaining < tier.bundleCount) return;
        const quantity = Math.floor(remaining / tier.bundleCount);
        if (!quantity) return;
        items.push({ id: tier.variantId, quantity });
        remaining -= quantity * tier.bundleCount;
      });

      if (remaining > 0) {
        const singleTier = tiers.find((tier) => tier.bundleCount === 1);
        if (singleTier) {
          const existing = items.find((item) => String(item.id) === String(singleTier.variantId));
          if (existing) existing.quantity += remaining;
          else items.push({ id: singleTier.variantId, quantity: remaining });
          remaining = 0;
        }
      }

      return items;
    }

    function getBundleTierTotalCents(totalUnits) {
      const tiers = getBundleTiers();
      if (!tiers.length) return 0;
      const items = buildBundleTierItems(totalUnits);
      return items.reduce((sum, item) => {
        const tier = tiers.find((entry) => String(entry.variantId) === String(item.id));
        if (!tier) return sum;
        return sum + (tier.priceCents * item.quantity);
      }, 0);
    }

    function hasVisibleBundleCards() {
      return cards.some((card) => !!(card.offsetParent || card.getClientRects().length));
    }

    function getSingleUnitCard() {
      return cards.find((card) => {
        return Math.max(1, parseInt(card.dataset.bundleCount || '1', 10) || 1) === 1;
      }) || null;
    }

    function isBundleBuilderActive() {
      // Active whenever a multi-unit card is selected — regardless of whether a
      // dedicated bundle product variant ID is configured.  addBundleItemsToCart()
      // falls back to adding N × resolved color variant when no valid variant ID exists.
      return getSelectedBundleCount() > 1 && !!getSelectedCard();
    }

    function isHiddenQuantityBuilderActive() {
      if (hasVisibleBundleCards()) return false;
      if (!qtyInput || !swatchButtons.length) return false;
      const quantity = Math.max(1, parseInt(qtyInput.value || '1', 10) || 1);
      return quantity > 1
        && !!hiddenQuantityBuilder
        && !!$('[data-hidden-quantity-builder-row]', hiddenQuantityBuilder);
    }

    function getSwatchMeta(button) {
      if (!button) return null;
      const colorDot = button.querySelector('span');
      return {
        variantId: button.dataset.variantId || '',
        optionValue: button.dataset.optionValue || '',
        colorLabel: button.dataset.colorLabel || '',
        imageUrl: button.dataset.imageUrl || '',
        imageSrcset: button.dataset.imageSrcset || '',
        imageAlt: button.dataset.imageAlt || '',
        swatchColor: colorDot?.style?.background || '#d66a1f',
      };
    }

    function getBundleRowSelections() {
      const selectedCard = getSelectedCard();
      const configRoot = selectedCard ? $('.bundle-card-config', selectedCard) : null;
      if (!configRoot) return [];
      return $$('.bundle-item-color-row', configRoot).map((row) => {
        // Prefer explicitly active button; fall back to first available button in the row.
        const activeButton = $('[data-bundle-item-swatch][aria-pressed="true"]', row)
          || $('[data-bundle-item-swatch]', row);
        const selection = getSwatchMeta(activeButton);
        if (!selection) return null;
        selection.variantSource = row.dataset.variantSource || 'selected';
        return selection;
      }).filter(Boolean);
    }

    function getHiddenQuantitySelections() {
      if (!hiddenQuantityBuilder) return [];
      return $$('[data-hidden-quantity-builder-row]', hiddenQuantityBuilder).map((row) => {
        const activeButton = $('[data-hidden-quantity-swatch][aria-pressed="true"]', row);
        const selection = getSwatchMeta(activeButton);
        if (!selection) return null;
        selection.variantSource = 'single';
        return selection;
      }).filter(Boolean);
    }

    function updateBundleSelectionSummary() {
      const selectedCard = getSelectedCard();
      const summaryEl = selectedCard ? $('.bundle-selection-summary', selectedCard) : null;
      if (!summaryEl) return;
      const selections = getBundleRowSelections().map((selection) => selection.colorLabel).filter(Boolean);
      if (!selections.length || getSelectedBundleCount() <= 1) {
        summaryEl.classList.add('hidden');
        summaryEl.textContent = '';
        return;
      }
      summaryEl.textContent = `${selections.length} selected: ${selections.join(', ')}`;
      summaryEl.classList.remove('hidden');
    }

    function getPrimaryBundleSelection(card) {
      const targetCard = card || getSelectedCard();
      const firstRowSelection = targetCard
        ? getSwatchMeta($('[data-bundle-item-swatch][aria-pressed="true"]', targetCard))
        : null;
      return firstRowSelection || getSwatchMeta(getSelectedSwatch());
    }

    function setImage(imageUrl, imageSrcset, imageAlt) {
      if (!mainMedia || !imageUrl) return;
      mainMedia.classList.remove('has-video');
      mainMedia.innerHTML = `<img src="${imageUrl}" ${imageSrcset ? `srcset="${imageSrcset}"` : ''} alt="${(imageAlt || '').replace(/"/g, '&quot;')}" class="w-full h-full object-cover transition-transform duration-300 ease-out" id="main-product-image" width="900" height="1125" loading="eager" fetchpriority="high">`;
    }

    function setPrice(price, comparePrice) {
      const priceEl = $('#bundle-price');
      const comparePriceEl = $('#bundle-compare-price');
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
      if (!stickyPriceEl) return;
      stickyPriceEl.textContent = formatMoney(totalCents);
    }

    function parseMoneyString(value) {
      const normalized = String(value || '').replace(/[^0-9.]/g, '');
      const amount = parseFloat(normalized);
      return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
    }

    function setAtcAvailability(available) {
      if (!atcButton) return;
      atcButton.disabled = available === false;
      atcButton.classList.toggle('opacity-60', available === false);
      atcButton.classList.toggle('cursor-not-allowed', available === false);
    }

    function findMatchingVariant(bundleCard, swatchButton) {
      if (!variantData || !variantData.variants || !variantData.variants.length) return null;

      const bundleValue = bundleCard?.dataset.optionValue?.trim();
      const swatchValue = swatchButton?.dataset.optionValue?.trim();
      const bundleDirectId = bundleCard?.dataset.variantId;
      const swatchDirectId = swatchButton?.dataset.variantId;
      const bundleDirectVariant = bundleDirectId
        ? variantData.variants.find((variant) => String(variant.id) === String(bundleDirectId))
        : null;
      const swatchDirectVariant = swatchDirectId
        ? variantData.variants.find((variant) => String(variant.id) === String(swatchDirectId))
        : null;
      const resolvedBundleValue = bundleValue || getVariantOptionValue(bundleDirectVariant, bundleOptionPosition);
      const resolvedSwatchValue = swatchValue || getVariantOptionValue(swatchDirectVariant, swatchOptionPosition);

      if (bundleOptionPosition || swatchOptionPosition) {
        const exactMatches = variantData.variants.filter((variant) => {
          const matchesBundle = !resolvedBundleValue || !bundleOptionPosition || getVariantOptionValue(variant, bundleOptionPosition) === resolvedBundleValue;
          const matchesSwatch = !resolvedSwatchValue || !swatchOptionPosition || getVariantOptionValue(variant, swatchOptionPosition) === resolvedSwatchValue;
          return matchesBundle && matchesSwatch;
        });

        if (exactMatches.length) {
          return exactMatches.find((variant) => variant.available) || exactMatches[0];
        }
      }

      const matches = variantData.variants.filter((variant) => {
        const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
        const matchesBundle = !bundleValue || options.includes(bundleValue);
        const matchesSwatch = !swatchValue || options.includes(swatchValue);
        return matchesBundle && matchesSwatch;
      });

      if (matches.length) {
        return matches.find((variant) => variant.available) || matches[0];
      }

      if (swatchDirectId) {
        return variantData.variants.find((variant) => String(variant.id) === String(swatchDirectId)) || null;
      }

      if (bundleDirectId) {
        return variantData.variants.find((variant) => String(variant.id) === String(bundleDirectId)) || null;
      }

      return variantData.variants.find((variant) => variant.available) || variantData.variants[0] || null;
    }

    function syncResolvedVariant() {
      const selectedCard = getSelectedCard();
      const bundleCount = Math.max(1, parseInt(selectedCard?.dataset.bundleCount || '1', 10) || 1);

      if (bundleCount > 1) {
        const bundleProductVariant = getBundleProductVariant(selectedCard);
        if (bundleProductVariant) {
          if (variantInput) {
            variantInput.value = bundleProductVariant.id;
          }
          setAtcAvailability(bundleProductVariant.available);
          return;
        }

        if (selectedCard?.dataset.productHandle) {
          setAtcAvailability(false);
          console.error(
            `[Splitflask] Bundle product "${selectedCard.dataset.productHandle}" was not rendered. ` +
            'Check that it is active and published to the Online Store sales channel.'
          );
          return;
        }
      }

      const directBundleVariantId = bundleCount > 1 ? getDirectBundleVariantId(selectedCard) : '';
      if (directBundleVariantId) {
        if (variantInput) {
          variantInput.value = directBundleVariantId;
        }
        setAtcAvailability(true);
        return;
      }
      const selectedSwatch = getSelectedSwatch();
      const matchedVariant = findMatchingVariant(selectedCard, selectedSwatch);

      if (!matchedVariant) return;

      if (variantInput) {
        variantInput.value = matchedVariant.id;
      }
      setAtcAvailability(matchedVariant.available);

      if (selectedSwatch && swatchLabel) {
        swatchLabel.textContent = selectedSwatch.dataset.colorLabel || '';
      }

      const liveMainImage = mainMedia ? mainMedia.querySelector('#main-product-image') : null;
      const shouldSyncMainImage = !liveMainImage || liveMainImage.dataset.manualThumbnail !== 'true';

      if (shouldSyncMainImage && matchedVariant.imageUrl) {
        setImage(matchedVariant.imageUrl, matchedVariant.imageSrcset, matchedVariant.imageAlt);
      } else if (shouldSyncMainImage && selectedSwatch?.dataset.imageUrl) {
        setImage(selectedSwatch.dataset.imageUrl, selectedSwatch.dataset.imageSrcset, selectedSwatch.dataset.imageAlt);
      }
    }

    function setSwatchActive(button) {
      swatchButtons.forEach((swatch) => swatch.setAttribute('aria-pressed', 'false'));
      if (button) button.setAttribute('aria-pressed', 'true');
    }

    function getActiveVariant() {
      const selectedCard = getSelectedCard();
      const selectedSwatch = getSelectedSwatch();
      return findMatchingVariant(selectedCard, selectedSwatch);
    }

    function renderInlineBundleBuilder(card) {
      const configRoot = $('.bundle-card-config', card);
      if (!configRoot) return null;

      const bundleCount = Math.max(1, parseInt(card.dataset.bundleCount || '1', 10) || 1);
      const packQuantity = Math.max(1, parseInt(qtyInput?.value || '1', 10) || 1);
      const totalUnits = Math.max(bundleCount, bundleCount * packQuantity);
      const previousSelections = card.classList.contains('selected') ? getBundleRowSelections() : [];
      const activeSwatch = getSwatchMeta(getSelectedSwatch());
      const bundleProduct = getBundleProductData(card);
      const usesBundleProduct = !!bundleProduct?.variants?.length;
      const rowCount = bundleCount;

      if (bundleCount <= 1 || !swatchButtons.length) {
        configRoot.classList.add('hidden');
        configRoot.innerHTML = '';
        return configRoot;
      }

      configRoot.classList.remove('hidden');
      configRoot.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Choose colors</p>
              <p class="mt-1 text-[12px] sm:text-sm text-on-surface-variant leading-5">Pick one color for each Splitflask in your ${card.dataset.bundleTitle || 'bundle'}.</p>
            </div>
            <button
              type="button"
              class="bundle-apply-color-all shrink-0 inline-flex items-center justify-center rounded-full border border-outline/20 bg-primary/5 px-3 py-2 text-[11px] sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
              Make all same
            </button>
          </div>
          <p class="bundle-selection-summary hidden rounded-full bg-primary/5 px-3 py-2 text-[11px] sm:text-sm font-semibold text-on-surface"></p>
          <div class="bundle-color-rows space-y-3"></div>
        </div>
      `;

      const rowsRoot = $('.bundle-color-rows', configRoot);
      const applyAllButton = $('.bundle-apply-color-all', configRoot);

      for (let index = 0; index < rowCount; index += 1) {
        if (!usesBundleProduct && index === bundleCount && totalUnits > bundleCount) {
          const extraHeader = document.createElement('div');
          extraHeader.className = 'rounded-[1rem] border border-dashed border-outline-variant/20 bg-primary/[0.04] px-4 py-3';
          extraHeader.innerHTML = `
            <p class="text-xs font-bold uppercase tracking-widest text-primary">Additional Splitflasks</p>
            <p class="mt-1 text-[12px] sm:text-sm text-on-surface-variant leading-5">Choose colors for the ${totalUnits - bundleCount} extra unit${totalUnits - bundleCount === 1 ? '' : 's'} beyond your ${card.dataset.bundleTitle || 'bundle'}.</p>
          `;
          rowsRoot.appendChild(extraHeader);
        }

        const row = document.createElement('div');
        row.className = 'bundle-item-color-row rounded-[1rem] border border-outline-variant/15 bg-surface-container-lowest p-3';
        row.dataset.itemIndex = String(index);
        row.dataset.variantSource = index < bundleCount ? 'selected' : 'single';

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3 mb-2';
        header.innerHTML = `<span class="text-[12px] sm:text-sm font-bold text-on-surface">${index < bundleCount ? `Splitflask ${index + 1}` : `Additional unit ${index - bundleCount + 1}`}</span><span class="text-[11px] sm:text-xs uppercase tracking-widest text-on-surface-variant">Select color</span>`;
        row.appendChild(header);

        const swatchRail = document.createElement('div');
        swatchRail.className = 'flex flex-wrap gap-2';
        const presetSelection = previousSelections[index] || activeSwatch;
        let rowActivated = false;

        swatchButtons.forEach((sourceButton) => {
          const meta = getSwatchMeta(sourceButton);
          const button = document.createElement('button');

          // Determine if this swatch should be the active one for this row.
          // Only ever activate ONE button per row — the first match wins.
          let isActive = false;
          if (!rowActivated && presetSelection) {
            if (presetSelection.variantId && meta.variantId) {
              isActive = String(presetSelection.variantId) === String(meta.variantId);
            } else if (presetSelection.optionValue && meta.optionValue) {
              isActive = presetSelection.optionValue === meta.optionValue;
            } else {
              // Neither has a meaningful ID — default to first swatch in row.
              isActive = true;
            }
          }
          if (isActive) rowActivated = true;

          button.type = 'button';
          button.className = 'inline-flex items-center gap-2 rounded-full border border-outline/20 bg-white px-3 py-2 text-[11px] sm:text-sm font-semibold text-on-surface transition-all hover:border-primary/60 min-h-[40px]';
          button.dataset.bundleItemSwatch = 'true';
          button.dataset.variantId = meta.variantId;
          button.dataset.optionValue = meta.optionValue;
          button.dataset.colorLabel = meta.colorLabel;
          button.dataset.imageUrl = meta.imageUrl;
          button.dataset.imageSrcset = meta.imageSrcset;
          button.dataset.imageAlt = meta.imageAlt;
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          button.innerHTML = `<span class="w-5 h-5 rounded-full border border-outline/20 shadow-sm shrink-0" style="background: ${meta.swatchColor};"></span><span>${meta.colorLabel}</span>`;
          if (isActive) button.classList.add('border-primary');

          button.addEventListener('click', () => {
            $$('[data-bundle-item-swatch]', row).forEach((swatch) => {
              swatch.setAttribute('aria-pressed', 'false');
              swatch.classList.remove('border-primary');
            });
            button.setAttribute('aria-pressed', 'true');
            button.classList.add('border-primary');
            updateBundleSelectionSummary();
            syncResolvedVariant();
            updateDisplayedBundlePrice(card);
            if (meta.imageUrl) {
              setImage(meta.imageUrl, meta.imageSrcset, meta.imageAlt || meta.colorLabel);
            }
          });

          swatchRail.appendChild(button);
        });

        row.appendChild(swatchRail);
        rowsRoot.appendChild(row);
      }

      if (applyAllButton) {
        applyAllButton.addEventListener('click', () => {
          const activeMeta = getPrimaryBundleSelection(card);
          if (!activeMeta) return;
          $$('.bundle-item-color-row', configRoot).forEach((row) => {
            const matchingButton = $$('[data-bundle-item-swatch]', row).find((button) => {
              return String(button.dataset.variantId || '') === String(activeMeta.variantId || '')
                || button.dataset.optionValue === activeMeta.optionValue;
            });
            if (!matchingButton) return;
            $$('[data-bundle-item-swatch]', row).forEach((button) => {
              button.setAttribute('aria-pressed', 'false');
              button.classList.remove('border-primary');
            });
            matchingButton.setAttribute('aria-pressed', 'true');
            matchingButton.classList.add('border-primary');
          });
          applyAllButton.textContent = 'Applied';
          window.setTimeout(() => {
            applyAllButton.textContent = 'Make all same';
          }, 1200);
          updateBundleSelectionSummary();
        });
      }

      return configRoot;
    }

    function renderHiddenQuantityBuilder() {
      if (hasVisibleBundleCards() || !qtyInput || !swatchButtons.length) {
        if (hiddenQuantityBuilder) hiddenQuantityBuilder.remove();
        hiddenQuantityBuilder = null;
        return;
      }

      const quantity = Math.max(1, parseInt(qtyInput.value || '1', 10) || 1);
      if (quantity <= 1) {
        if (hiddenQuantityBuilder) hiddenQuantityBuilder.remove();
        hiddenQuantityBuilder = null;
        return;
      }

      if (!hiddenQuantityBuilder) {
        hiddenQuantityBuilder = document.createElement('div');
        hiddenQuantityBuilder.className = 'mb-5 md:mb-6';
        hiddenQuantityBuilder.id = 'pdp-hidden-quantity-builder';
        const anchor = swatchGroup || quantityControl?.parentElement || qtyInput?.closest('#pdp-quantity-section');
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(hiddenQuantityBuilder, anchor.nextSibling);
        } else if (root) {
          root.insertBefore(hiddenQuantityBuilder, root.querySelector('button[type="submit"]'));
        }
      }

      const previousSelections = getHiddenQuantitySelections();
      const activeSwatch = getSwatchMeta(getSelectedSwatch());

      hiddenQuantityBuilder.innerHTML = `
        <div class="space-y-3 rounded-[1.1rem] border border-outline-variant/15 bg-surface-container-lowest p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Choose colors for each cup</p>
              <p class="mt-1 text-[12px] sm:text-sm text-on-surface-variant leading-5">Quantity is ${quantity}. Pick a color for each Splitflask below.</p>
            </div>
            <button
              type="button"
              class="hidden-quantity-apply-all shrink-0 inline-flex items-center justify-center rounded-full border border-outline/20 bg-primary/5 px-3 py-2 text-[11px] sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
              Make all same
            </button>
          </div>
          <p class="hidden-quantity-summary hidden rounded-full bg-primary/5 px-3 py-2 text-[11px] sm:text-sm font-semibold text-on-surface"></p>
          <div class="hidden-quantity-rows space-y-3"></div>
        </div>
      `;

      const rowsRoot = $('.hidden-quantity-rows', hiddenQuantityBuilder);
      const summaryEl = $('.hidden-quantity-summary', hiddenQuantityBuilder);
      const applyAllButton = $('.hidden-quantity-apply-all', hiddenQuantityBuilder);

      function updateHiddenQuantitySummary() {
        if (!summaryEl) return;
        const selections = getHiddenQuantitySelections().map((selection) => selection.colorLabel).filter(Boolean);
        if (!selections.length) {
          summaryEl.classList.add('hidden');
          summaryEl.textContent = '';
          return;
        }
        summaryEl.textContent = `${selections.length} selected: ${selections.join(', ')}`;
        summaryEl.classList.remove('hidden');
      }

      for (let index = 0; index < quantity; index += 1) {
        const row = document.createElement('div');
        row.className = 'rounded-[1rem] border border-outline-variant/15 bg-white p-3';
        row.dataset.hiddenQuantityBuilderRow = 'true';
        row.dataset.itemIndex = String(index);

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3 mb-2';
        header.innerHTML = `<span class="text-[12px] sm:text-sm font-bold text-on-surface">Splitflask ${index + 1}</span><span class="text-[11px] sm:text-xs uppercase tracking-widest text-on-surface-variant">Select color</span>`;
        row.appendChild(header);

        const swatchRail = document.createElement('div');
        swatchRail.className = 'flex flex-wrap gap-2';
        const presetSelection = previousSelections[index] || activeSwatch;

        swatchButtons.forEach((sourceButton) => {
          const meta = getSwatchMeta(sourceButton);
          const button = document.createElement('button');
          const isActive = !!presetSelection && (
            (presetSelection.variantId && meta.variantId && String(presetSelection.variantId) === String(meta.variantId)) ||
            (!presetSelection.variantId && presetSelection.optionValue === meta.optionValue)
          );

          button.type = 'button';
          button.className = 'inline-flex items-center gap-2 rounded-full border border-outline/20 bg-white px-3 py-2 text-[11px] sm:text-sm font-semibold text-on-surface transition-all hover:border-primary/60 min-h-[40px]';
          button.dataset.hiddenQuantitySwatch = 'true';
          button.dataset.variantId = meta.variantId;
          button.dataset.optionValue = meta.optionValue;
          button.dataset.colorLabel = meta.colorLabel;
          button.dataset.imageUrl = meta.imageUrl;
          button.dataset.imageSrcset = meta.imageSrcset;
          button.dataset.imageAlt = meta.imageAlt;
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          button.innerHTML = `<span class="w-5 h-5 rounded-full border border-outline/20 shadow-sm shrink-0" style="background: ${meta.swatchColor};"></span><span>${meta.colorLabel}</span>`;
          if (isActive) button.classList.add('border-primary');

          button.addEventListener('click', () => {
            $$('[data-hidden-quantity-swatch]', row).forEach((swatch) => {
              swatch.setAttribute('aria-pressed', 'false');
              swatch.classList.remove('border-primary');
            });
            button.setAttribute('aria-pressed', 'true');
            button.classList.add('border-primary');
            updateHiddenQuantitySummary();
            if (meta.imageUrl) {
              setImage(meta.imageUrl, meta.imageSrcset, meta.imageAlt || meta.colorLabel);
            }
          });

          swatchRail.appendChild(button);
        });

        row.appendChild(swatchRail);
        rowsRoot.appendChild(row);
      }

      if (applyAllButton) {
        applyAllButton.addEventListener('click', () => {
          const activeMeta = getSwatchMeta(getSelectedSwatch());
          if (!activeMeta) return;
          $$('[data-hidden-quantity-builder-row]', hiddenQuantityBuilder).forEach((row) => {
            const matchingButton = $$('[data-hidden-quantity-swatch]', row).find((button) => {
              return String(button.dataset.variantId || '') === String(activeMeta.variantId || '')
                || button.dataset.optionValue === activeMeta.optionValue;
            });
            if (!matchingButton) return;
            $$('[data-hidden-quantity-swatch]', row).forEach((button) => {
              button.setAttribute('aria-pressed', 'false');
              button.classList.remove('border-primary');
            });
            matchingButton.setAttribute('aria-pressed', 'true');
            matchingButton.classList.add('border-primary');
          });
          applyAllButton.textContent = 'Applied';
          window.setTimeout(() => {
            applyAllButton.textContent = 'Make all same';
          }, 1200);
          updateHiddenQuantitySummary();
        });
      }

      updateHiddenQuantitySummary();
    }

    function ensureQuantityNote() {
      if (quantityNote || !quantityControl) return;
      quantityNote = document.createElement('p');
      quantityNote.id = 'pdp-bundle-quantity-note';
      quantityNote.className = 'hidden text-[12px] sm:text-sm font-semibold text-on-surface-variant leading-5';
      quantityControl.parentNode?.appendChild(quantityNote);
    }

    function setBundleQuantityMode(bundleCount) {
      if (!qtyInput) return;
      ensureQuantityNote();
      if (bundleCount > 1) {
        if (swatchGroup) swatchGroup.classList.add('hidden');
        qtyInput.min = '1';
        qtyInput.readOnly = false;
        qtyInput.removeAttribute('aria-readonly');
        if (quantityControl) quantityControl.classList.remove('opacity-60');
        $$('.product-qty-btn').forEach((button) => {
          button.disabled = false;
          button.classList.remove('opacity-50', 'cursor-not-allowed');
        });
        if (quantityNote) {
          quantityNote.textContent = `Quantity is the number of bundle packs. Increase it if you want more than one ${bundleCount}-pack.`;
          quantityNote.classList.remove('hidden');
        }
      } else {
        if (swatchGroup) swatchGroup.classList.remove('hidden');
        qtyInput.min = '1';
        qtyInput.readOnly = false;
        qtyInput.removeAttribute('aria-readonly');
        if (quantityControl) quantityControl.classList.remove('opacity-60');
        $$('.product-qty-btn').forEach((button) => {
          button.disabled = false;
          button.classList.remove('opacity-50', 'cursor-not-allowed');
        });
        if (quantityNote) quantityNote.classList.add('hidden');
      }
    }

    function renderBundleColorBuilder() {
      cards.forEach((card) => {
        const configRoot = $('.bundle-card-config', card);
        if (!configRoot) return;
        if (card === getSelectedCard()) {
          renderInlineBundleBuilder(card);
        } else {
          configRoot.classList.add('hidden');
          configRoot.innerHTML = '';
        }
      });
      updateBundleSelectionSummary();
    }

    async function addBundleItemsToCart() {
      const selectedCard = getSelectedCard();
      const bundleCount = Math.max(1, parseInt(selectedCard?.dataset.bundleCount || '1', 10) || 1);
      const packQuantity = Math.max(1, parseInt(qtyInput?.value || '1', 10) || 1);

      // Resolve per-item color selections from the bundle color pickers.
      // Each row maps to one flask in the bundle. We group by variant ID so
      // two Orange picks become Orange×2 rather than two separate lines.
      const bundleRowSelections = getBundleRowSelections();
      const variantCounts = {};

      // When resolving individual flask variants we must match the single-unit
      // card's bundle option so we don't accidentally pick a 2-pack or 3-pack
      // variant when the product has a bundle-size option axis.
      const singleUnitCard = getSingleUnitCard();

      bundleRowSelections.slice(0, bundleCount).forEach((sel) => {
        // Use an explicit variantId if set; otherwise resolve from the product's
        // variant list by matching the swatch's option value (e.g. "Orange").
        let vid = String(sel.variantId || '');
        if (!vid) {
          const colorValue = sel.optionValue || sel.colorLabel || '';
          // Try exact match against single-unit card first (filters out multi-pack variants).
          const resolved = findMatchingVariant(singleUnitCard, {
            dataset: { variantId: '', optionValue: colorValue },
          }) || findMatchingVariant(null, {
            dataset: { variantId: '', optionValue: colorValue },
          });
          vid = String(resolved?.id || '');
        }
        if (vid) variantCounts[vid] = (variantCounts[vid] || 0) + packQuantity;
      });

      let finalItems = Object.entries(variantCounts).map(([id, qty]) => ({
        id: parseInt(id, 10) || id,
        quantity: qty,
      }));

      // Fallback: nothing resolved from per-item pickers — use the globally
      // selected swatch and add bundleCount × packQuantity of that one variant.
      if (!finalItems.length) {
        const resolvedVariant = findMatchingVariant(selectedCard, getSelectedSwatch());
        const resolvedId = resolvedVariant?.id
          || parseInt(variantInput?.value, 10)
          || variantInput?.value
          || '';
        if (!resolvedId) {
          console.error('[Splitflask] No variant resolved — cannot add to cart');
          return false;
        }
        finalItems = [{ id: resolvedId, quantity: bundleCount * packQuantity }];
      }

      console.log('[Splitflask] Bundle add request:', JSON.stringify({ items: finalItems }));
      let addedSuccessfully = false;

      const originalButtonText = atcButton?.querySelector('span')?.textContent;
      if (atcButton) {
        atcButton.disabled = true;
        atcButton.classList.add('opacity-60', 'cursor-not-allowed');
        const label = atcButton.querySelector('span');
        if (label) label.textContent = 'Adding...';
      }

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ items: finalItems }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          // Log the raw Shopify response separately so it's readable in DevTools
          console.error('[Splitflask] Bundle add 422 — Shopify response body:', errorText);
          let shopifyMessage = errorText;
          try {
            const parsed = JSON.parse(errorText);
            shopifyMessage = parsed.description || parsed.message || errorText;
          } catch (_) {}
          if (atcButton) {
            const label = atcButton.querySelector('span');
            if (label) {
              label.textContent = shopifyMessage || 'Add failed — see console';
              window.setTimeout(() => { label.textContent = originalButtonText || 'Add to Cart'; }, 4000);
            }
          }
          throw new Error(`Bundle add failed (${response.status}): ${errorText}`);
        }
        const cart = await fetch('/cart.js', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
        }).then((res) => res.json());
        updateHeaderCartBadge(cart.item_count);
        addedSuccessfully = true;
        window.location.href = '/cart';
        return true;
      } catch (error) {
        console.error('[Splitflask] Bundle add failed:', error.message || error);
        return false;
      } finally {
        if (atcButton) {
          atcButton.disabled = false;
          atcButton.classList.remove('opacity-60', 'cursor-not-allowed');
          const label = atcButton.querySelector('span');
          if (label && originalButtonText && addedSuccessfully) {
            window.setTimeout(() => {
              label.textContent = originalButtonText;
            }, 1800);
          }
        }
      }
    }

    async function addHiddenQuantityItemsToCart() {
      const rowSelections = getHiddenQuantitySelections();
      if (!rowSelections.length) return false;
      let addedSuccessfully = false;

      const groupedSelections = rowSelections.reduce((acc, selection) => {
        const resolvedVariant = findMatchingVariant(null, {
          dataset: {
            variantId: selection.variantId || '',
            optionValue: selection.optionValue || '',
          },
        });
        const key = String(resolvedVariant?.id || selection.variantId || selection.optionValue);
        if (!key) return acc;
        if (!acc[key]) {
          acc[key] = { id: resolvedVariant?.id || selection.variantId, quantity: 0 };
        }
        acc[key].quantity += 1;
        return acc;
      }, {});

      const items = Object.values(groupedSelections).filter((item) => item.id && item.quantity > 0);
      if (!items.length) return false;

      const originalButtonText = atcButton?.querySelector('span')?.textContent;
      if (atcButton) {
        atcButton.disabled = true;
        atcButton.classList.add('opacity-60', 'cursor-not-allowed');
        const label = atcButton.querySelector('span');
        if (label) label.textContent = 'Adding...';
      }

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ items }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Hidden quantity add failed (${response.status}): ${errorText}`);
        }
        const cart = await fetch('/cart.js', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
        }).then((res) => res.json());
        updateHeaderCartBadge(cart.item_count);
        addedSuccessfully = true;
        window.location.href = '/cart';
        return true;
      } catch (error) {
        console.error('Hidden quantity add failed:', error);
        return false;
      } finally {
        if (atcButton) {
          atcButton.disabled = false;
          atcButton.classList.remove('opacity-60', 'cursor-not-allowed');
          const label = atcButton.querySelector('span');
          if (label && originalButtonText) {
            if (addedSuccessfully) {
              window.setTimeout(() => {
                label.textContent = originalButtonText;
              }, 1800);
            } else {
              label.textContent = originalButtonText;
            }
          }
        }
      }
    }

    function updateDisplayedBundlePrice(card) {
      const selectedCard = card || getSelectedCard();
      const selectedPriceCents = parseMoneyString(selectedCard?.dataset.price);
      const selectedVariant = getActiveVariant();
      const quantity = Math.max(1, parseInt(qtyInput?.value || '1', 10) || 1);

      if (selectedPriceCents > 0) {
        setPrice(formatMoney(selectedPriceCents * quantity), null);
        setStickyPrice(selectedPriceCents * quantity);
        return;
      }

      if (selectedVariant?.priceCents) {
        const totalCents = Number(selectedVariant.priceCents) * Math.max(1, quantity);
        setPrice(formatMoney(totalCents), selectedVariant.comparePrice || null);
        setStickyPrice(totalCents);
      }
    }

    function updateBundleSummaries() {
      const selectedCard = getSelectedCard();
      const quantity = Math.max(1, parseInt(qtyInput?.value || '1', 10) || 1);

      if (qtyInput) {
        qtyInput.value = String(quantity);
      }

      if (qtySummary) {
        qtySummary.textContent = String(quantity);
      }
      if (unitSummary) {
        const bundleCount = Math.max(1, parseInt(selectedCard?.dataset.bundleCount || '1', 10) || 1);
        unitSummary.textContent = `${quantity} ${bundleCount}-pack${quantity === 1 ? '' : 's'} total`;
      }
    }

    function activateBundleCard(card) {
      if (!card) return;
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      cards.forEach((candidate) => {
        candidate.classList.remove('selected', 'border-primary', 'shadow-primary/20');
        candidate.setAttribute('aria-selected', 'false');
      });
      card.classList.add('selected', 'border-primary', 'shadow-primary/20');
      card.setAttribute('aria-selected', 'true');

      const bundleCount = Math.max(1, parseInt(card.dataset.bundleCount || '1', 10) || 1);
      if (qtyInput) {
        qtyInput.value = '1';
      }
      setBundleQuantityMode(bundleCount);
      updateBundleSummaries();
      renderBundleColorBuilder();
      syncResolvedVariant();
      updateDisplayedBundlePrice(card);
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        activateBundleCard(card);
      });

      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.addEventListener('change', () => {
          if (radio.checked) activateBundleCard(card);
        });
      }
    });

    swatchButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setSwatchActive(button);
        syncResolvedVariant();
        renderBundleColorBuilder();
        renderHiddenQuantityBuilder();
        updateDisplayedBundlePrice(getSelectedCard());
      });
    });

    if (qtyInput) {
      qtyInput.addEventListener('input', () => {
        const minimumQty = 1;
        const bundleCount = Math.max(1, parseInt(getSelectedCard()?.dataset.bundleCount || '1', 10) || 1);
        const normalized = Math.max(minimumQty, parseInt(qtyInput.value || String(minimumQty), 10) || minimumQty);
        qtyInput.value = String(normalized);
        setBundleQuantityMode(bundleCount);
        updateBundleSummaries();
        renderBundleColorBuilder();
        renderHiddenQuantityBuilder();
        updateDisplayedBundlePrice(getSelectedCard());
      });
    }

    $$('.product-qty-btn').forEach((button) => {
      button.addEventListener('click', () => {
        if (!qtyInput) return;
        const delta = parseInt(button.dataset.delta || '0', 10) || 0;
        const minimumQty = 1;
        const bundleCount = Math.max(1, parseInt(getSelectedCard()?.dataset.bundleCount || '1', 10) || 1);
        const nextValue = Math.max(minimumQty, (parseInt(qtyInput.value || String(minimumQty), 10) || minimumQty) + delta);
        qtyInput.value = String(nextValue);
        setBundleQuantityMode(bundleCount);
        updateBundleSummaries();
        renderBundleColorBuilder();
        renderHiddenQuantityBuilder();
        updateDisplayedBundlePrice(getSelectedCard());
      });
    });

    if (swatchButtons.length && variantData?.variants?.length && variantInput) {
      const currentVariant = variantData.variants.find((variant) => String(variant.id) === String(variantInput.value));
      if (currentVariant) {
        const matchingSwatch = swatchButtons.find((button) => {
          const directId = button.dataset.variantId;
          const optionValue = button.dataset.optionValue?.trim();
          if (directId) return String(directId) === String(currentVariant.id);
          return [currentVariant.option1, currentVariant.option2, currentVariant.option3].includes(optionValue);
        });
        if (matchingSwatch) setSwatchActive(matchingSwatch);
      }
    }

    // Diagnostic: warn if any bundle card's variant ID is not in this product's variants.
    // Product IDs are expected when a bundle product handle is configured.
    if (variantData?.variants?.length) {
      cards.forEach((card) => {
        const vid = card.dataset.variantId;
        const bundleCount = Math.max(1, parseInt(card.dataset.bundleCount || '1', 10) || 1);
        if (!vid || bundleCount <= 1) return;
        const bundleProduct = getBundleProductData(card);
        if (bundleProduct?.id && String(bundleProduct.id) === String(vid)) return;
        if (card.dataset.productHandle && !bundleProduct) {
          console.error(
            `[Splitflask] Bundle product "${card.dataset.productHandle}" was not rendered. ` +
            'Check that it is active and published to the Online Store sales channel.'
          );
          return;
        }
        const found = variantData.variants.some((v) => String(v.id) === String(vid));
        if (!found) {
          console.warn(
            `[Splitflask] Bundle "${card.dataset.bundleTitle || bundleCount + '-pack'}" variant ${vid}` +
            ' is not in this product\'s variant list. If this is a Shopify Bundles product, set its product handle too.'
          );
        }
      });
    }

    const selectedCard = getSelectedCard();
    if (selectedCard) {
      activateBundleCard(selectedCard);
    } else {
      setBundleQuantityMode(getSelectedBundleCount());
      updateBundleSummaries();
      syncResolvedVariant();
      renderBundleColorBuilder();
      renderHiddenQuantityBuilder();
      updateDisplayedBundlePrice(null);
    }

    if (root) {
      root.addEventListener('submit', async (event) => {
        if (isBundleBuilderActive()) {
          event.preventDefault();
          await addBundleItemsToCart();
          return;
        }
        if (isHiddenQuantityBuilderActive()) {
          event.preventDefault();
          await addHiddenQuantityItemsToCart();
        }
      });
    }
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
