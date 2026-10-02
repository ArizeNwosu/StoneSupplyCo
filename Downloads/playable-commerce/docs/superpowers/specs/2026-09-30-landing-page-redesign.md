# Landing Page 10x Redesign — PlayItAgain by Social Gear

**Date:** 2026-09-30
**Page:** `/demos` (DemoShowcase.tsx)
**Approach:** Hybrid — bold metric claim + animated game preview + playable demos

---

## Design Decisions

- **Branding:** PlayItAgain by Social Gear (unchanged)
- **Strategic direction:** Hybrid — lead with a compelling stat AND a visual game preview, then let visitors play the demos themselves
- **Hero game preview:** Swift Hockey, auto-playing CSS animation loop (~4-5 seconds), NOT a live playable embed
- **Existing design system:** Keep the current `--sg-*` CSS custom properties, Inter font, `#2856ee` blue, `#f8f7f3` cream paper background
- **Demo gallery:** Keep the existing 4-card grid and DemoPlayer modal — upgrade the surrounding context

---

## Page Structure (7 Sections)

### Section 1: Hero

**Layout:** Two-column on desktop. Left: copy + CTAs. Right: phone-frame mockup with Swift Hockey auto-playing loop.

**Left column:**
- Eyebrow kicker: `THE INTERACTIVE POPUP PLATFORM` (with blue status dot)
- Headline: Metric-driven, contrast-based. Example: `27% of visitors played the game. 3% clicked a normal popup.` — the 3% line in `--sg-blue` to emphasize the contrast
- Subline: `Turn your product's defining feature into a playable prize experience.`
- Two CTAs: Primary `Play the demos` (blue, scrolls to #demos), Secondary `Let's build yours` (outlined, mailto link)

**Right column:**
- Phone frame (dark border, rounded corners) containing the Swift Hockey hero animation
- The animation is a self-contained component (`HeroGameLoop`) built with CSS animations on real DOM elements (not a video/GIF)
- Loop sequence (~4-5s total): idle net + 4 corners → one corner lights up (randomized each loop) → puck fires toward it → save or goal animation → brief result flash → fade reset → repeat
- The animation should use Swift Hockey's brand colors (`#a3dcef` ice blue accent)
- On mobile: phone frame stacks below the headline, smaller

### Section 2: Social Proof Bar

**Layout:** Single horizontal row, 4 metrics, centered.

**Metrics (demo/sample data for MVP):**
- `847K+` games played
- `27.1%` avg play rate
- `$2.4M` attributed revenue
- `18.3%` lead capture rate

**Style:** Subtle background differentiation from hero (cream `--sg-paper`). Large bold numbers, small muted labels beneath. No icons — just clean typography.

### Section 3: Demo Gallery (upgraded)

**Keep:** The existing `sg-demo-grid` with 4 cards (Splitflask, Cyberbackpack, REEKON, Swift Hockey), the DemoPlayer modal with phone/wide toggle, restart, copy-link tools.

**Upgrade:**
- Section heading: `Pick your first challenge.` (keep current)
- Add a one-line intro above: `Four brands. Four product-specific games. All playable right now.`
- Keep the `sg-gallery-caption` disclaimer
- No structural changes to the cards or player — they already work well

### Section 4: Before / After

**Layout:** Two-column comparison on desktop, stacked on mobile.

**Left card ("BEFORE"):**
- Red accent label
- Visual representation of a generic spin-the-wheel popup (can be a simple CSS illustration — a circle divided into colored segments with a pointer)
- Stat: `~3% conversion`
- Copy: `Same wheel on every store. Visitors close on reflex.`

**Right card ("AFTER"):**
- Blue accent label (`--sg-blue`)
- Visual representation of a PlayItAgain experience (the CyberBackpack lock dials or Splitflask clock — a small CSS illustration)
- Stat: `27% play rate`
- Copy: `Built around YOUR product. Visitors lean in.`

**Section heading:** `Your current popup vs. a PlayItAgain experience.`

**Important:** The right card should have a subtle blue border or glow to draw the eye. The left card should feel slightly dull/muted.

### Section 5: How It Works (merchant-focused)

**Layout:** Section heading + 3-step horizontal grid.

**Heading:** `From your store URL to a live game in one conversation.`

**Steps:**
1. `Send us your URL` — `We analyze your product, brand, and what makes it playable.`
2. `Pick your game` — `We design 3 concepts specific to your product. You choose.`
3. `Go live` — `One script tag. Works with Klaviyo, Shopify, any stack.`

**Style:** Each step in its own card with a large blue step number (`01`, `02`, `03`), bold title, muted description. Monospace step numbers to match existing `sg-edition` treatment.

### Section 6: What Makes This Different

**Heading:** `Not a template. Not a wheel. Not a scratch card.`

**Layout:** 2x2 grid of feature cards.

**Cards:**
1. `Brand-native design` — `Matches your store's look, not a generic overlay.`
2. `Product-driven mechanic` — `The game IS your product's story.`
3. `Klaviyo-native` — `Triggers your existing forms — no new email tool.`
4. `Real analytics` — `Play rate, completion, revenue per impression.`

**Style:** Clean white cards on cream background. Bold title, muted description. No icons (keep it typographic like the rest of the page).

### Section 7: Final CTA

**Keep:** The existing `sg-contact` blue section with the Gamepad2 icon, email address, copy button, and mailto CTA.

**Update copy:**
- Heading: `What would your customers love to play?` (keep current)
- Body: `Send us your store URL. We'll show you what's playable about your product.`
- CTA button: `Let's build yours` (keep current)

---

## Hero Animation Component: `HeroGameLoop`

A self-contained React component that renders a CSS-animated Swift Hockey game loop inside a phone frame.

**Elements to render (all CSS/HTML, no canvas):**
- Hockey net (simple geometric shape — trapezoid or rectangle with net pattern)
- Four corner targets (top-left, top-right, bottom-left, bottom-right) — circles or squares
- A puck (small dark circle)
- A goalie indicator (optional simplified figure)
- Result text ("GOAL!" or reaction time)

**Animation sequence (CSS keyframes, ~4.5s per loop):**
1. `0s–1s`: Idle state. Net visible, four corner targets dimmed
2. `1s–1.3s`: One corner lights up (ice blue glow). Brief "ready" moment
3. `1.3s–1.8s`: Puck animates from center toward the lit corner
4. `1.8s–2.5s`: Goal celebration — corner flashes, "247ms" reaction time appears, brief flash effect
5. `2.5s–3.5s`: Result state — "GOAL!" text with reward teaser fades in
6. `3.5s–4.5s`: Fade out, reset to idle

**Implementation notes:**
- Use CSS `@keyframes` and `animation` properties, not JavaScript-driven animation
- Use `animation-iteration-count: infinite` for the loop
- Randomization of which corner lights up is NOT required — pick one corner (top-right is visually clearest) and always animate to it
- The component should respect `prefers-reduced-motion` — show a static frame (the "result" state) instead of animating
- The phone frame is purely decorative — dark rounded border with a subtle notch at top

**Sizing:**
- Desktop: ~160-180px wide phone frame, ~300-340px tall
- Mobile: ~140px wide, centered below headline

---

## Navigation Updates

Keep the existing `sg-nav` structure. Update nav links to:
- `The demos` → scrolls to `#demos`
- `How it works` → scrolls to `#how-it-works`
- `Let's build yours` → mailto CTA (keep current)

---

## Responsive Behavior

**Desktop (>1050px):** Two-column hero, horizontal social proof bar, 4-column demo grid, two-column before/after, 3-column how-it-works, 2x2 features grid.

**Tablet (641-1050px):** Hero stacks (copy above, phone frame below centered), 2-column demo grid, before/after stays side-by-side, how-it-works stacks to single column.

**Mobile (<640px):** Everything single-column. Phone frame smaller and centered. Social proof bar wraps to 2x2 grid. Before/after stacks vertically. Features stack to single column.

---

## What NOT to Change

- The DemoPlayer modal and its internals (iframe, phone/wide toggle, restart, copy-link, build CTA)
- The `showcase.ts` data file and demo definitions
- The `demo-player.html` standalone file
- The `demoShowcaseBrand.css` file (brand-specific card colors)
- The overall color palette (`--sg-paper`, `--sg-ink`, `--sg-blue`, `--sg-line`)
- The Inter font family

---

## Files to Create/Modify

1. **Modify:** `src/views/DemoShowcase.tsx` — restructure into 7 sections, add new content
2. **Modify:** `src/views/demoShowcase.css` — add styles for new sections (social proof bar, before/after, features grid, hero animation phone frame)
3. **Create:** `src/components/HeroGameLoop.tsx` — Swift Hockey auto-playing animation component
4. **Create:** `src/components/heroGameLoop.css` — keyframe animations for the hero loop

---

## Out of Scope

- No changes to the SaaS dashboard (`/` route)
- No changes to the app flow (create → analyze → concepts → editor)
- No new routes
- No backend/API changes
- No real analytics integration (metrics in social proof bar are static demo data)
