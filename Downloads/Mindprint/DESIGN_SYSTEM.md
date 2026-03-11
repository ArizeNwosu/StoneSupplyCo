# Mindprint Design System

Mindprint is a premium proof-of-work brand. The product should feel like a verified portfolio artifact, not a productivity tool or recorder UI.

## Brand Intent

Core promise:
`Show how the work was actually made.`

Emotional goals:
- Credible
- Calm
- Premium
- Human
- Immediate

The first impression should communicate three things within 3 seconds:
- This is a replay of real work.
- It is verified human authorship.
- I want to send one myself.

## Design Principles

- Proof before features
- Editorial before dashboard
- Human-first, AI-secondary
- The work is the hero
- Metadata builds trust, not clutter
- Motion clarifies state

## Tokens

### Color

```css
:root {
  --bg-0: #0b0c0f;
  --bg-1: #111318;
  --bg-2: #171a21;

  --surface-0: rgba(19, 22, 28, 0.72);
  --surface-1: rgba(24, 28, 36, 0.86);
  --surface-2: #1c212b;

  --text-0: #f3efe8;
  --text-1: #d8d2c8;
  --text-2: #9ca3b2;
  --text-3: #697181;

  --brand: #6d7cff;
  --brand-strong: #8b74ff;
  --brand-soft: rgba(109, 124, 255, 0.16);

  --success: #46d39a;
  --warning: #ffad5c;
  --danger: #ff6b78;
  --pause: #9c77ff;

  --border-0: rgba(255,255,255,0.06);
  --border-1: rgba(255,255,255,0.10);

  --shadow-0: 0 12px 40px rgba(0,0,0,0.24);
  --shadow-1: 0 24px 80px rgba(0,0,0,0.38);
}
```

Usage:
- `--brand`: main action, progress, focus, brand accent
- `--pause`: thinking pause markers and contemplative states
- `--success`: AI switch / external tool handoff
- `--warning`: paste/incorporation moments
- `--danger`: major revision / overwrite moments

### Typography

Primary:
- `Space Grotesk` for brand and UI

Monospace:
- `IBM Plex Mono` for timing and proof metadata

Scale:

```css
:root {
  --fs-hero: clamp(40px, 6vw, 76px);
  --fs-h1: 32px;
  --fs-h2: 24px;
  --fs-h3: 18px;
  --fs-body: 15px;
  --fs-small: 13px;
  --fs-micro: 11px;
}
```

Rules:
- Headlines are expressive and sparse
- Body copy is compact
- Mono only for evidence values

### Spacing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Radius

```css
:root {
  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-pill: 999px;
}
```

### Motion

```css
:root {
  --motion-fast: 160ms ease;
  --motion-base: 220ms ease;
  --motion-slow: 320ms ease;
}
```

Motion rules:
- No bounce
- No decorative parallax
- Fade, slide, scale, reveal only when functional

## Materials

Mindprint uses one consistent material language:
- Deep neutral backgrounds
- Frosted translucent overlays
- Thin borders
- Soft edge glow
- Heavy but diffused shadows

Use this consistently for:
- replay controls
- authorship badge
- toasts
- nav bars
- certificate surfaces
- extension popup cards

## Shared Components

### 1. Top Bar

Purpose:
Persistent brand and replay context.

Contents:
- Left: Mindprint wordmark
- Center: creator name, replay label, date, duration pill
- Right: share action

Specs:
- Height: `48px`
- Background: translucent dark
- Border-bottom: `1px solid var(--border-0)`

### 2. Proof Chip

Purpose:
Portable trust metadata.

Examples:
- `Verified Replay`
- `14 revisions`
- `16m session`
- `Captured live`
- `Moderate AI collaboration`

Specs:
- Pill radius
- Small type
- Tight padding
- Can be neutral or semantic

### 3. Human Authorship Badge

Compact state:
`✓ Human Authored 94`

Expanded state:
- Session duration
- Active writing time
- Revision count
- AI collaboration level
- Confidence score

Rules:
- Always visible in replay viewer
- Present on replay cards and profiles
- Never feel like compliance UI

### 4. Replay Card

Purpose:
Homepage, gallery, creator profile, case studies.

Contents:
- Thumbnail still
- Creator
- Replay title
- Proof chips
- Human score
- CTA: `Watch replay`

Card feel:
- cinematic still frame
- premium spacing
- minimal copy

### 5. Certificate Card

Purpose:
Reusable proof summary surface.

Use in:
- replay viewer
- landing page
- creator profile
- extension completion state

### 6. Floating Player Controls

Contents:
- Play/pause button
- Scrubber
- Event markers
- Timecode
- Speed controls

Rules:
- Frosted dark surface
- Must not cover more than 15% of stage
- Hide after inactivity during playback

### 7. Recorder Card

Purpose:
Extension popup main state.

Contents:
- Current state: idle / recording / processing
- Page or session title
- Record control
- Live chips
- Certificate preview after completion

## Event Language

Standardize event colors and labels across product surfaces.

### Thinking Pause
- Color: `--pause`
- Label: `4.2s thinking pause`
- Meaning: reflection, drafting, reconsideration

### AI Switch
- Color: `--success`
- Label: `Switched to ChatGPT`
- Meaning: tool consultation, not authorship loss

### AI Paste
- Color: `--warning`
- Label: `AI content incorporated - 71% rewritten`
- Meaning: AI-assisted input with human editing

### Major Revision
- Color: `--danger`
- Label: `Rewrote this section`
- Meaning: active authorship and revision depth

## Replay Viewer Wireframe

### Layout

1. Top bar
- Fixed
- 48px tall

2. Replay stage
- Fills viewport between top bar and footer
- rrweb content edge-to-edge
- No card framing around the replay itself

3. Floating controls
- Bottom center of replay stage
- Frosted glass
- Hide after 3 seconds during playback

4. Footer
- Fixed
- 40px tall
- Left: `Created with Mindprint · mindprint.pro`
- Right: `Record your own thinking →`

### Replay Cover State

Before playback:
- Show creator, title, date, duration, human authored score
- CTA: `Play replay`
- Fade into live replay on play

This should exist even when the replay immediately autoloads.

### Viewer Behavior

- Poll `replayer.getCurrentTime()` every 100ms
- Seeking pauses then jumps to target
- Speed updates through `setConfig({ speed })`
- Custom controls stay outside iframe
- Toasts never stack
- Maximum one toast visible at a time

## Landing Page Wireframe

### Section Order

1. Hero
- Headline: proof of work angle
- One primary CTA
- One featured replay card or embedded replay

2. Featured Replay
- Large replay module
- Human Authorship badge visible
- Proof chips under title

3. Why It Matters
- Short blocks for freelancers, students, professionals, candidates

4. Replay Gallery
- 3-6 replay cards
- Different domains and outcomes

5. Certificate Section
- Explain what Mindprint verifies
- Show certificate card

6. CTA
- `Record your own thinking`

### Homepage Messaging

Preferred copy direction:
- `Proof of work, not just a finished file.`
- `Show how it was built.`
- `Verified human authorship.`
- `Replay the real process.`

Avoid:
- feature grids as the primary opening
- generic SaaS copy
- “AI productivity” framing

## Extension Popup Structure

### Idle

- Mindprint wordmark
- Short one-line explanation
- Session title or current page
- Primary record button
- Secondary note: what will be captured

### Recording

- Live recording state with pulse
- Timer in mono
- Current page/domain
- Live proof chips:
  - `Captured live`
  - `Writing session`
  - `AI tool detected` if applicable
- Stop button

### Completed

- Session title
- Duration
- Replay link action
- Human Authorship preview
- `Open replay`
- `Copy link`

### Popup Design Rules

- One primary action per state
- No dense settings surface in the main popup
- Settings move to secondary view if needed
- Same colors and typography as viewer/site

## Component Inventory

Build these as reusable primitives:

- `Wordmark`
- `TopBar`
- `ProofChip`
- `MetricMono`
- `AuthorshipBadge`
- `CertificateCard`
- `ReplayCard`
- `ReplayCover`
- `FloatingControls`
- `ToastNotice`
- `RecorderCard`
- `PrimaryButton`
- `GhostButton`

## CSS Foundation File Shape

Recommended split if you later modularize:

1. `tokens.css`
- colors
- spacing
- radius
- motion
- shadows
- typography vars

2. `base.css`
- reset
- html/body
- typography defaults

3. `components.css`
- chips
- buttons
- cards
- badge
- controls

4. `surfaces.css`
- top bar
- footer
- glass panels
- overlays

## Implementation Priorities

### Phase 1

- Finalize tokens
- Unify viewer with this system
- Redesign extension popup with same tokens and components

### Phase 2

- Build landing page around replay cards and certificate surfaces
- Add replay cover state
- Add reusable proof chips and authorship badge

### Phase 3

- Creator profile / portfolio pages
- Replay gallery
- Case-study pages using same proof surfaces

## Immediate UI Changes Recommended

### Viewer

- Add replay cover state before play
- Promote creator/title context more clearly
- Make badge expansion feel like a real certificate
- Ensure stage framing feels gallery-like

### Landing Page

- Lead with a featured replay, not feature tiles
- Show actual proof chips and certificate surfaces
- Make “watch a replay” the primary interaction

### Extension

- Simplify main popup to a single recording card
- Use same badge and chips
- Show stronger completion state after recording stops

## Success Criteria

The system is working if:
- The replay viewer feels like a premium artifact
- The website feels like a gallery of proof, not a marketing page
- The extension feels like the capture instrument for the same brand
- Users immediately understand authorship, process, and credibility

