# Lock Challenge Popup — Design Spec
**Date:** 2026-09-11  
**Status:** Approved

---

## Overview

Integrate the existing React lock challenge prototype (`cyberbackpack-lock-challenge/`) into the Shopify theme as a fully configurable section. The popup presents a 3-page gamified experience that funnels visitors into a Klaviyo email capture. All copy, timing, combo, and reward text are editable in the Shopify theme editor without touching code.

Additionally, fix critical LCP performance issues and make targeted CRO improvements based on current analytics (LCP P75 at 12,378ms, 63% desktop traffic).

---

## Popup Flow

```
[Page 1: Start] → [Page 2: Lock Combo] → [Page 3A: Granted] or [Page 3B: Denied]
                                                      ↓                    ↓
                                              [Klaviyo popup opens via _klOnsite]
```

### Page 1 — Start (intro)
- Lock icon, heading (2 editable lines), challenge description, timer badge, START CTA button
- Exact design from `CyberPopup.tsx` `IntroView`

### Page 2 — Lock Combo (game)
- Countdown timer (configurable seconds), 3 scroll-wheel digit inputs, UNLOCK button
- Timer hits zero → auto-submits (same as pressing UNLOCK)
- Exact design from `GameView` + `CyberLock` + `CountdownTimer` + `NumberWheel`
- On UNLOCK: compare current digit values to `config.winCombo`
  - Match → transition to `granted` state
  - No match → transition to `checking` (shake animation, scan line) → `denied`

### Page 3A — Granted (win)
- New state `granted`: green "ACCESS GRANTED" heading, win reward text (e.g. "20% OFF!")
- Claim button → triggers Klaviyo popup, closes lock popup
- Follows same animation pattern as `DeniedView` but green palette

### Page 3B — Denied (lose)
- Existing `DeniedView`: red "ACCESS DENIED" with shield alert + shake animation
- Auto-transitions after 1,200ms to `reward` state
- `reward` state shows consolation reward text (e.g. "FREE SHIPPING!") + claim button
- Claim button → triggers Klaviyo popup, closes lock popup

### Klaviyo Integration
On claim (both win and lose paths):
```js
if (window._klOnsite) {
  window._klOnsite.push(['openForm', config.klaviyoFormId]);
}
// then close the lock popup
```
Lock popup closes first; Klaviyo popup opens on top.

---

## Architecture

### Build Pipeline

Update `cyberbackpack-lock-challenge/vite.config.ts`:
- Output format: `iife` (Immediately Invoked Function Expression)
- Output dir: `../assets/`
- Output filenames: `lock-challenge.js`, `lock-challenge.css`
- One `npm run build` inside the lock-challenge folder keeps the theme assets in sync

### New Section: `sections/lock-challenge-popup.liquid`

Replaces the current generic `popup.liquid` for the lock challenge use case. Structure:

```liquid
{% if section.settings.enable %}
<script>
  window.CYBERLOCK_CONFIG = {
    delay: {{ section.settings.apparition_delay }},
    showOnce: {{ section.settings.show_only_once }},
    homeOnly: {{ section.settings.show_only_on_index }},
    visitorsOnly: {{ section.settings.show_only_for_visitors }},
    currentPage: '{{ request.page_type }}',
    isLoggedIn: {{ customer != blank }},
    winCombo: ['{{ section.settings.combo_d1 }}','{{ section.settings.combo_d2 }}','{{ section.settings.combo_d3 }}'],
    timerSeconds: {{ section.settings.timer_seconds }},
    headingLine1: '{{ section.settings.heading_line1 | escape }}',
    headingLine2: '{{ section.settings.heading_line2 | escape }}',
    challengeText: '{{ section.settings.challenge_text | escape }}',
    winRewardText: '{{ section.settings.win_reward_text | escape }}',
    loseRewardText: '{{ section.settings.lose_reward_text | escape }}',
    ctaStart: '{{ section.settings.cta_start | escape }}',
    ctaClaim: '{{ section.settings.cta_claim | escape }}',
    klaviyoFormId: '{{ section.settings.klaviyo_form_id | escape }}'
  };
</script>
<div id="cyberlock-root"></div>
<link rel="stylesheet" href="{{ 'lock-challenge.css' | asset_url }}">
<script src="{{ 'lock-challenge.js' | asset_url }}" defer></script>
{% endif %}
```

### Theme Editor Schema (full)

| Setting | Type | ID | Default |
|---|---|---|---|
| Enable | checkbox | `enable` | false |
| Delay until popup appears | range 0–30s | `apparition_delay` | 5 |
| Show only on home page | checkbox | `show_only_on_index` | true |
| Disable for logged-in customers | checkbox | `show_only_for_visitors` | true |
| Show once to visitors | checkbox | `show_only_once` | true |
| **— Lock Challenge —** | header | | |
| Winning combo digit 1 | select 0–9 | `combo_d1` | 3 |
| Winning combo digit 2 | select 0–9 | `combo_d2` | 1 |
| Winning combo digit 3 | select 0–9 | `combo_d3` | 4 |
| Timer duration | range 5–30s | `timer_seconds` | 10 |
| **— Copy —** | header | | |
| Heading line 1 | text | `heading_line1` | "BREAK INTO" |
| Heading line 2 | text | `heading_line2` | "THE BACKPACK" |
| Challenge description | text | `challenge_text` | "Think you can crack our TSA combination lock?" |
| Win reward text | text | `win_reward_text` | "FREE SHIPPING!" |
| Lose reward text | text | `lose_reward_text` | "FREE SHIPPING!" |
| Start CTA | text | `cta_start` | "START MISSION" |
| Claim CTA | text | `cta_claim` | "CLAIM FREE SHIPPING" |
| **— Klaviyo —** | header | | |
| Klaviyo Form ID | text | `klaviyo_form_id` | "" |

---

## React App Changes

All changes are inside `cyberbackpack-lock-challenge/src/`:

### `types.ts`
- Add `granted`, remove `claim` from `GameState` union: `'intro' | 'playing' | 'checking' | 'granted' | 'denied' | 'reward'`
- Add `CyberlockConfig` interface matching all `window.CYBERLOCK_CONFIG` fields

### `main.tsx` (new entry point logic)
- Read `window.CYBERLOCK_CONFIG` and merge with defaults
- Check `config.homeOnly && config.currentPage !== 'index'` → abort if true
- Check `config.visitorsOnly && config.isLoggedIn` → abort if true
- Check `config.showOnce && localStorage.getItem('cyberlock_shown')` → abort if true
- After delay: open popup, set `localStorage.setItem('cyberlock_shown', '1')`
- Mount React app on `#cyberlock-root`

### `CyberLock.tsx`
- Expose current digit values via a ref or callback (`onValuesChange`)
- Each `NumberWheel` tracks its current visible digit

### `NumberWheel.tsx`
- Add `onValueChange: (digit: number) => void` prop
- Calculate current digit from `scrollTop` on `onScroll` event and call back

### `CyberPopup.tsx`
- Import config from a `useConfig()` hook that reads `window.CYBERLOCK_CONFIG`
- Replace all hardcoded strings with config values
- Add `winCombo` check in `handleUnlock()`: compare digits to `config.winCombo` → route to `granted` or `denied`
- Add `GrantedView` component (green palette, "ACCESS GRANTED", win reward text)
- Update `handleClaim()`: call `_klOnsite`, then call `onClose()`
- `timerSeconds` passed as prop to `CountdownTimer`

### `CountdownTimer.tsx`
- Accept `initialSeconds: number` prop (default 10) instead of hardcoded `10000`

---

## CRO & Performance Fixes

### `layout/theme.liquid`
1. **Remove duplicate `<title>` tag** — there are two title tags; remove the second one (line 22)
2. **LCP image** — in `sections/header-slider.liquid` (or whichever section renders the hero), find the first image and add `fetchpriority="high"` and remove `loading="lazy"`
3. **Render-blocking stylesheet** — `scrolling.scss.css` is loaded as a blocking `<link>`. Change to `media="print" onload="this.media='all'"` pattern to defer it

### `sections/lock-challenge-popup.liquid`
- JS loads with `defer` — zero impact on LCP
- CSS loaded in section (below fold, non-blocking for initial render)

### CRO notes
- 63% desktop traffic: popup 420px max-width is already optimal for desktop
- Show-once via localStorage prevents annoyance and repeat abandonment
- Both win and lose paths route to Klaviyo — maximises capture regardless of outcome
- Winning combo creates genuine replay engagement (users try again if they fail)

---

## Files Created / Modified

| Action | File |
|---|---|
| **Create** | `sections/lock-challenge-popup.liquid` |
| **Modify** | `cyberbackpack-lock-challenge/vite.config.ts` |
| **Modify** | `cyberbackpack-lock-challenge/src/types.ts` |
| **Modify** | `cyberbackpack-lock-challenge/src/main.tsx` |
| **Modify** | `cyberbackpack-lock-challenge/src/components/CyberPopup.tsx` |
| **Modify** | `cyberbackpack-lock-challenge/src/components/CyberLock.tsx` |
| **Modify** | `cyberbackpack-lock-challenge/src/components/NumberWheel.tsx` |
| **Modify** | `cyberbackpack-lock-challenge/src/components/CountdownTimer.tsx` |
| **Create** | `assets/lock-challenge.js` (build output) |
| **Create** | `assets/lock-challenge.css` (build output) |
| **Modify** | `layout/theme.liquid` (remove duplicate title, defer stylesheet) |
| **Modify** | `sections/header-slider.liquid` or equivalent (LCP image fix) |

---

## Out of Scope

- Redesigning the lock UI — must be an exact visual clone of the existing prototype
- Changing the Klaviyo form itself
- Any other popup sections (`popup.liquid`, `popup2.liquid`) — left untouched
