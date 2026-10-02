# Landing Page 10x Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/demos` landing page from a demo gallery into a high-converting hybrid marketing page with metric-driven hero, auto-playing Swift Hockey animation, social proof, before/after comparison, and upgraded merchant-focused content.

**Architecture:** Single-page redesign — restructure `DemoShowcase.tsx` into 7 distinct sections, create a new `HeroGameLoop` component for the auto-playing Swift Hockey animation, and extend `demoShowcase.css` with styles for all new sections. No routing, API, or backend changes.

**Tech Stack:** React 19, TypeScript, CSS (custom properties + keyframe animations), existing `sg-*` design system

**Spec:** `docs/superpowers/specs/2026-09-30-landing-page-redesign.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/HeroGameLoop.tsx` | Self-contained Swift Hockey auto-playing animation in a phone frame |
| Create | `src/components/heroGameLoop.css` | Keyframe animations + phone frame + rink layout for the hero loop |
| Modify | `src/views/DemoShowcase.tsx` | Restructure into 7 sections: hero, social proof, demos, before/after, how-it-works, differentiators, CTA |
| Modify | `src/views/demoShowcase.css` | Add styles for new sections (social proof bar, before/after, how-it-works, differentiators, hero layout) + responsive rules |

**Untouched files:** `demoShowcaseBrand.css`, `showcase.ts`, `demo-player.html`, `DemoPlayer` component (internal to DemoShowcase — kept as-is), `DemoArtwork` component (kept as-is).

---

### Task 1: Create HeroGameLoop Component

**Files:**
- Create: `src/components/HeroGameLoop.tsx`
- Create: `src/components/heroGameLoop.css`

- [ ] **Step 1: Create `src/components/heroGameLoop.css` with all keyframe animations and layout**

```css
/* ── Phone frame ── */
.hero-phone{width:180px;flex:none;background:#111;border-radius:24px;padding:8px;border:2px solid #2a2a2a;box-shadow:0 20px 60px #0004;position:relative}
.hero-phone::before{content:'';position:absolute;top:6px;left:50%;transform:translateX(-50%);width:40px;height:5px;background:#222;border-radius:3px;z-index:2}
.hero-phone__screen{background:#10151b;border-radius:16px;aspect-ratio:9/17;overflow:hidden;position:relative}

/* ── Rink layout ── */
.hero-rink{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}

/* ── Net ── */
.hero-net{width:52%;aspect-ratio:1.6/1;border:2px solid #ffffff30;border-bottom:none;border-radius:8px 8px 0 0;position:relative;margin-bottom:4%}
.hero-net::before{content:'';position:absolute;inset:2px;background:repeating-linear-gradient(90deg,transparent,transparent 5px,#ffffff12 5px,#ffffff12 6px),repeating-linear-gradient(0deg,transparent,transparent 5px,#ffffff12 5px,#ffffff12 6px)}

/* ── Targets ── */
.hero-targets{position:absolute;inset:0}.hero-target{position:absolute;width:14%;aspect-ratio:1;border-radius:50%;border:2px solid #ffffff20;display:grid;place-items:center}
.hero-target--tl{top:24%;left:16%}.hero-target--tr{top:24%;right:16%}.hero-target--bl{bottom:28%;left:14%}.hero-target--br{bottom:28%;right:14%}
.hero-target__ring{width:60%;height:60%;border-radius:50%;background:#ffffff10}

/* ── Puck ── */
.hero-puck{position:absolute;width:8%;aspect-ratio:1;background:#1a1a1a;border:1px solid #444;border-radius:50%;bottom:18%;left:50%;transform:translate(-50%,0);z-index:1}

/* ── Result overlay ── */
.hero-result{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;opacity:0;pointer-events:none}
.hero-result__time{font:700 11px/1 Impact,'Arial Narrow',sans-serif;color:#a3dcef;letter-spacing:.04em}
.hero-result__goal{font:italic 700 28px/1 Impact,'Arial Narrow',sans-serif;color:#32d96a;text-shadow:0 0 12px #0a7d3480;margin-top:4px}
.hero-result__reward{font:800 9px/1.4 Inter,sans-serif;color:#ff343a;margin-top:6px;letter-spacing:.06em}

/* ── Headline overlay ── */
.hero-headline{position:absolute;top:8%;left:0;right:0;text-align:center;z-index:2;opacity:1}
.hero-headline__title{font:800 10px/1.2 Inter,sans-serif;color:#fff;letter-spacing:-.02em;margin:0}
.hero-headline__sub{font:800 6px/1.6 Inter,sans-serif;color:#cbd1d9;letter-spacing:.1em;text-transform:uppercase;margin:3px 0 0}

/* ── CTA at bottom ── */
.hero-minicta{position:absolute;bottom:6%;left:12%;right:12%;background:#ec1923;color:white;border-radius:4px;padding:6px 0;text-align:center;font:800 7px/1 Inter,sans-serif;letter-spacing:.08em;z-index:2}

/* ── Animation states ── */
/* The entire loop is 4.5s. We use animation-delay to stagger elements. */
.hero-rink--animated .hero-target--tr{animation:hero-light 4.5s ease infinite}
.hero-rink--animated .hero-puck{animation:hero-shoot 4.5s ease infinite}
.hero-rink--animated .hero-result{animation:hero-reveal 4.5s ease infinite}
.hero-rink--animated .hero-headline{animation:hero-headline-fade 4.5s ease infinite}
.hero-rink--animated .hero-minicta{animation:hero-cta-fade 4.5s ease infinite}

/* Target lights up at 1s, dims at 1.8s */
@keyframes hero-light{
  0%,20%{border-color:#ffffff20;box-shadow:none}
  22%,38%{border-color:#a3dcef;box-shadow:0 0 14px #a3dcef80,inset 0 0 8px #a3dcef40}
  40%,100%{border-color:#ffffff20;box-shadow:none}
}
@keyframes hero-light-ring{
  0%,20%{background:#ffffff10}
  22%,38%{background:#a3dcef60}
  40%,100%{background:#ffffff10}
}

/* Puck fires from center to top-right corner at 1.3s–1.8s */
@keyframes hero-shoot{
  0%,28%{bottom:18%;left:50%;transform:translate(-50%,0);opacity:1}
  36%,42%{bottom:68%;left:76%;transform:translate(-50%,0) scale(0.5);opacity:1}
  44%{opacity:0}
  90%{opacity:0}
  100%{bottom:18%;left:50%;transform:translate(-50%,0);opacity:1}
}

/* Result fades in at 1.8s, holds, fades out at 3.5s */
@keyframes hero-reveal{
  0%,38%{opacity:0}
  44%,72%{opacity:1}
  82%,100%{opacity:0}
}

/* Headline visible at start, fades when result shows, returns */
@keyframes hero-headline-fade{
  0%,20%{opacity:1}
  22%,78%{opacity:0}
  88%,100%{opacity:1}
}

/* CTA fades with headline */
@keyframes hero-cta-fade{
  0%,20%{opacity:1}
  22%,78%{opacity:0}
  88%,100%{opacity:1}
}

/* Ring follows the target light */
.hero-rink--animated .hero-target--tr .hero-target__ring{animation:hero-light-ring 4.5s ease infinite}

/* ── Reduced motion: show static result ── */
@media(prefers-reduced-motion:reduce){
  .hero-rink--animated .hero-target--tr,.hero-rink--animated .hero-puck,.hero-rink--animated .hero-result,.hero-rink--animated .hero-headline,.hero-rink--animated .hero-minicta{animation:none!important}
  .hero-rink--animated .hero-result{opacity:1}
  .hero-rink--animated .hero-headline{opacity:0}
  .hero-rink--animated .hero-puck{opacity:0}
}

/* ── Mobile ── */
@media(max-width:640px){.hero-phone{width:140px}}
```

- [ ] **Step 2: Create `src/components/HeroGameLoop.tsx`**

```tsx
import './heroGameLoop.css';

export function HeroGameLoop() {
  return (
    <div className="hero-phone" aria-hidden="true">
      <div className="hero-phone__screen">
        <div className="hero-rink hero-rink--animated">
          {/* Headline overlay */}
          <div className="hero-headline">
            <p className="hero-headline__title">THINK YOU'VE GOT A<br/><strong style={{color:'#f01923',fontSize:'13px'}}>QUICK RELEASE?</strong></p>
            <p className="hero-headline__sub">Hit the corner before the goalie reacts</p>
          </div>

          {/* Net */}
          <div className="hero-net" />

          {/* Four corner targets */}
          <div className="hero-targets">
            <div className="hero-target hero-target--tl"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--tr"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--bl"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--br"><span className="hero-target__ring" /></div>
          </div>

          {/* Puck */}
          <div className="hero-puck" />

          {/* Result overlay */}
          <div className="hero-result">
            <span className="hero-result__time">247 MS</span>
            <span className="hero-result__goal">GOAL!</span>
            <span className="hero-result__reward">YOU UNLOCKED 15% OFF</span>
          </div>

          {/* Mini CTA */}
          <div className="hero-minicta">TAKE THE SHOT</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify component renders in isolation**

Add a temporary import in `App.tsx` or open the dev server and navigate to check the component renders. Then remove the temporary import.

Run: `cd /Users/riz/Downloads/playable-commerce && npm run dev`

Visually verify the phone frame appears with the hockey rink and the animation loops every ~4.5 seconds. The sequence should be: headline visible → corner lights up → puck fires → "GOAL!" result → fade back to headline.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroGameLoop.tsx src/components/heroGameLoop.css
git commit -m "feat: add HeroGameLoop component with Swift Hockey auto-playing animation"
```

---

### Task 2: Restructure DemoShowcase.tsx — All 7 Sections

**Files:**
- Modify: `src/views/DemoShowcase.tsx`

This task replaces the `<main>` content of DemoShowcase with the new 7-section structure. The `DemoArtwork` and `DemoPlayer` components at the top of the file are untouched — only the default export `DemoShowcase` function changes.

- [ ] **Step 1: Replace the `DemoShowcase` component's return JSX**

Keep all imports, `DemoArtwork`, and `DemoPlayer` exactly as they are. Replace the `DemoShowcase` function body starting from its `return` statement. Add the `HeroGameLoop` import at the top with the other imports:

Add this import after the existing imports:
```tsx
import { HeroGameLoop } from '../components/HeroGameLoop';
```

Replace the entire `return <div className="sg-page">` through the closing `</div>` with:

```tsx
  return <div className="sg-page">
    <a href="#demos" className="sg-skip">Skip to playable demos</a>
    <header className="sg-nav sg-wrap"><a className="sg-brand" href="/demos" aria-label="PlayItAgain demo gallery"><span className="sg-brand-mark"><Gamepad2 size={22}/></span>PlayItAgain<span className="sg-brand-by">by Social Gear</span></a>
      <nav aria-label="Gallery navigation"><a href="#demos">The demos</a><a href="#how-it-works" className="sg-nav-secondary">How it works</a><a className="sg-nav-contact" href={showcaseContactLink()}>Let's build yours<ArrowUpRight size={16}/></a></nav></header>
    <main>
      {/* ── Section 1: Hero ── */}
      <section className="sg-hero sg-wrap">
        <div className="sg-hero-topline">
          <span className="sg-kicker"><span className="sg-status-dot"/>THE INTERACTIVE POPUP PLATFORM</span>
        </div>
        <div className="sg-hero-cols">
          <div className="sg-hero-copy">
            <h1>27% of visitors<br/>played the game.<br/><span>3% clicked a normal popup.</span></h1>
            <p className="sg-hero-sub">Turn your product's defining feature into a playable prize experience.</p>
            <div className="sg-hero-ctas">
              <a href="#demos" className="sg-button sg-button--blue">Play the demos<ArrowDown size={18}/></a>
              <a className="sg-button sg-button--outline" href={showcaseContactLink()}>Let's build yours<ArrowUpRight size={18}/></a>
            </div>
          </div>
          <HeroGameLoop/>
        </div>
      </section>

      {/* ── Section 2: Social Proof Bar ── */}
      <section className="sg-proof sg-wrap" aria-label="Performance metrics">
        <div className="sg-proof-grid">
          <div><strong>847K+</strong><span>games played</span></div>
          <div><strong>27.1%</strong><span>avg play rate</span></div>
          <div><strong>$2.4M</strong><span>attributed revenue</span></div>
          <div><strong>18.3%</strong><span>lead capture rate</span></div>
        </div>
      </section>

      {/* ── Section 3: Demo Gallery (upgraded) ── */}
      <section className="sg-gallery sg-wrap" id="demos" aria-labelledby="sg-gallery-title">
        <div className="sg-section-heading">
          <div>
            <p className="sg-gallery-intro">Four brands. Four product-specific games. All playable right now.</p>
            <h2 id="sg-gallery-title">Pick your first challenge.</h2>
          </div>
          <span>No signup needed to play<ArrowDown size={14}/></span>
        </div>
        <div className="sg-demo-grid">{showcaseDemos.map(demo=><article className={`sg-demo-card sg-demo-card--${demo.color}`} key={demo.id}>
          <button className="sg-demo-art" aria-label={`Play ${demo.brand} demo`} onClick={()=>open(demo.id)}><DemoArtwork id={demo.id}/><span className="sg-art-label"><span>{demo.number} / PLAYABLE</span><span className="sg-art-play"><Play size={19} fill="currentColor"/></span></span></button>
          <div className="sg-card-body"><div className="sg-card-title"><h3>{demo.brand}</h3><span>{demo.number}</span></div><p className="sg-card-mechanic">{demo.mechanic}</p><p>{demo.description}</p><button onClick={()=>open(demo.id)} className="sg-play-link">Play demo<ArrowUpRight size={19}/></button></div>
        </article>)}</div>
        <p className="sg-gallery-caption"><span className="sg-status-dot"/>These are playable demonstrations. Rewards and email capture are simulated; no purchase or signup is required.</p>
      </section>

      {/* ── Section 4: Before / After ── */}
      <section className="sg-compare sg-wrap" aria-labelledby="sg-compare-title">
        <h2 id="sg-compare-title">Your current popup vs. a PlayItAgain experience.</h2>
        <div className="sg-compare-grid">
          <article className="sg-compare-card sg-compare-card--before">
            <span className="sg-compare-label sg-compare-label--before">BEFORE</span>
            <div className="sg-compare-visual sg-compare-visual--before">
              {/* CSS spin-the-wheel illustration */}
              <div className="sg-wheel" aria-hidden="true">
                <div className="sg-wheel__segment sg-wheel__segment--1"/>
                <div className="sg-wheel__segment sg-wheel__segment--2"/>
                <div className="sg-wheel__segment sg-wheel__segment--3"/>
                <div className="sg-wheel__segment sg-wheel__segment--4"/>
                <div className="sg-wheel__pointer"/>
              </div>
            </div>
            <strong className="sg-compare-stat">~3% conversion</strong>
            <p>Same wheel on every store. Visitors close on reflex.</p>
          </article>
          <article className="sg-compare-card sg-compare-card--after">
            <span className="sg-compare-label sg-compare-label--after">AFTER</span>
            <div className="sg-compare-visual sg-compare-visual--after">
              {/* Mini lock dials illustration */}
              <div className="sg-minilock" aria-hidden="true">
                <span>3</span><span>1</span><span>4</span>
              </div>
            </div>
            <strong className="sg-compare-stat">27% play rate</strong>
            <p>Built around YOUR product. Visitors lean in.</p>
          </article>
        </div>
      </section>

      {/* ── Section 5: How It Works ── */}
      <section className="sg-process sg-wrap" id="how-it-works" aria-labelledby="sg-process-title">
        <h2 id="sg-process-title">From your store URL to a live game in one conversation.</h2>
        <div className="sg-process-grid">
          <article className="sg-process-step">
            <span className="sg-process-num">01</span>
            <h3>Send us your URL</h3>
            <p>We analyze your product, brand, and what makes it playable.</p>
          </article>
          <article className="sg-process-step">
            <span className="sg-process-num">02</span>
            <h3>Pick your game</h3>
            <p>We design 3 concepts specific to your product. You choose.</p>
          </article>
          <article className="sg-process-step">
            <span className="sg-process-num">03</span>
            <h3>Go live</h3>
            <p>One script tag. Works with Klaviyo, Shopify, any stack.</p>
          </article>
        </div>
      </section>

      {/* ── Section 6: What Makes This Different ── */}
      <section className="sg-diff sg-wrap" aria-labelledby="sg-diff-title">
        <h2 id="sg-diff-title">Not a template. Not a wheel. Not a scratch card.</h2>
        <div className="sg-diff-grid">
          <article className="sg-diff-card">
            <h3>Brand-native design</h3>
            <p>Matches your store's look, not a generic overlay.</p>
          </article>
          <article className="sg-diff-card">
            <h3>Product-driven mechanic</h3>
            <p>The game IS your product's story.</p>
          </article>
          <article className="sg-diff-card">
            <h3>Klaviyo-native</h3>
            <p>Triggers your existing forms — no new email tool.</p>
          </article>
          <article className="sg-diff-card">
            <h3>Real analytics</h3>
            <p>Play rate, completion, revenue per impression.</p>
          </article>
        </div>
      </section>

      {/* ── Section 7: Final CTA ── */}
      <section className="sg-contact sg-wrap" id="contact" aria-labelledby="sg-contact-title">
        <div>
          <span className="sg-kicker">YOUR BRAND COULD BE NEXT</span>
          <h2 id="sg-contact-title">What would your<br/>customers love to play?</h2>
          <p>Send us your store URL. We'll show you what's playable about your product.</p>
          <a className="sg-button sg-button--light" href={showcaseContactLink()}>Let's build yours<ArrowUpRight size={20}/></a>
        </div>
        <div className="sg-contact-side">
          <span className="sg-contact-symbol" aria-hidden="true"><Gamepad2/></span>
          <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={18}/>{CONTACT_EMAIL}</a>
          <button onClick={copyEmail}><Copy size={14}/><span role="status">{emailCopied?'Email copied':'Copy email address'}</span></button>
          <small>Contact opens your email app.</small>
        </div>
      </section>
    </main>
    <footer className="sg-footer sg-wrap"><span>PlayItAgain · by Social Gear</span><p>Brand-specific interactive demos. Sample offers are not redeemable.</p><a href="#demos">Back to the games<ArrowRight size={15}/></a></footer>
    {active&&<DemoPlayer key={active} id={active} onClose={closePlayer}/>}
  </div>;
```

- [ ] **Step 2: Verify the page renders without errors**

Run: `npm run dev`

Navigate to `http://localhost:5173/demos` (or whichever port Vite assigns). The page should render all 7 sections. Some will be unstyled (new CSS classes not yet added) but the structure and content should be visible.

- [ ] **Step 3: Commit**

```bash
git add src/views/DemoShowcase.tsx
git commit -m "feat: restructure DemoShowcase into 7-section landing page layout"
```

---

### Task 3: Add CSS for New Sections

**Files:**
- Modify: `src/views/demoShowcase.css`

Add all new styles for sections 1–6. The existing CSS stays intact — append new rules. The file is currently one long line per media query block, so add new rules at natural insertion points.

- [ ] **Step 1: Add styles for the new hero layout, social proof, before/after, how-it-works, differentiators, and outline button**

Append the following CSS at the end of line 1 (before the `.sg-player` block on line 2). These go in the main stylesheet, before any `@media` queries:

Add this new CSS block between the end of the existing base styles and before `.sg-player{`:

```css
/* ── Hero layout (two-column) ── */
.sg-hero-cols{display:flex;align-items:center;justify-content:space-between;gap:48px}.sg-hero-copy{flex:1;min-width:0}.sg-hero-copy h1{font-size:clamp(38px,5vw,72px);font-weight:650;line-height:1.1;letter-spacing:-.06em;margin:0 0 20px}.sg-hero-copy h1>span{color:var(--sg-blue)}.sg-hero-sub{font-size:15px;line-height:1.8;color:var(--sg-muted);margin:0 0 28px;max-width:480px}.sg-hero-ctas{display:flex;gap:12px;flex-wrap:wrap}.sg-button--outline{background:transparent;border:1px solid var(--sg-ink);color:var(--sg-ink)}.sg-button--outline:hover{background:var(--sg-ink);color:white}

/* ── Social Proof Bar ── */
.sg-proof{border-top:1px solid var(--sg-line);border-bottom:1px solid var(--sg-line);padding-block:32px}.sg-proof-grid{display:flex;justify-content:space-between;gap:24px;text-align:center}.sg-proof-grid>div{flex:1}.sg-proof-grid strong{display:block;font-size:clamp(24px,3vw,36px);font-weight:800;letter-spacing:-.04em;color:var(--sg-ink)}.sg-proof-grid span{font-size:11px;color:var(--sg-muted);margin-top:4px;display:block}

/* ── Gallery intro line ── */
.sg-gallery-intro{font-size:12px;color:var(--sg-muted);margin:0 0 6px;letter-spacing:.02em}

/* ── Before / After ── */
.sg-compare{padding-block:64px 70px;border-top:1px solid var(--sg-line)}.sg-compare>h2{font-size:clamp(22px,2.5vw,32px);font-weight:650;letter-spacing:-.04em;margin:0 0 28px}.sg-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.sg-compare-card{padding:28px;border-radius:12px;background:white;border:1px solid var(--sg-line)}.sg-compare-card--after{border-color:var(--sg-blue);box-shadow:0 0 0 1px var(--sg-blue),0 8px 30px #2856ee10}.sg-compare-label{font-size:10px;font-weight:750;letter-spacing:.12em;display:block;margin-bottom:16px}.sg-compare-label--before{color:#d44}.sg-compare-label--after{color:var(--sg-blue)}.sg-compare-visual{height:120px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:16px}.sg-compare-visual--before{background:#f5f5f2;border:1px dashed #d8d8d4}.sg-compare-visual--after{background:#0a0a14}.sg-compare-stat{display:block;font-size:18px;letter-spacing:-.02em;margin-bottom:8px}.sg-compare-card p{font-size:12px;line-height:1.7;color:var(--sg-muted);margin:0}

/* Spin-the-wheel illustration */
.sg-wheel{width:80px;height:80px;border-radius:50%;position:relative;overflow:hidden;border:2px solid #ccc;background:#e8e8e4}.sg-wheel__segment{position:absolute;width:50%;height:50%}.sg-wheel__segment--1{top:0;left:0;background:#d4d4d0}.sg-wheel__segment--2{top:0;right:0;background:#bbb}.sg-wheel__segment--3{bottom:0;left:0;background:#bbb}.sg-wheel__segment--4{bottom:0;right:0;background:#d4d4d0}.sg-wheel__pointer{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #888;z-index:1}

/* Mini lock dials illustration */
.sg-minilock{display:flex;gap:5px;padding:12px 10px 8px;background:linear-gradient(#232326,#080808);border:1px solid #444;border-radius:8px}.sg-minilock>span{display:block;padding:6px 10px;background:#050505;border:1px solid #555;border-radius:3px;font:700 22px/1 monospace;color:#eee}

/* ── How It Works / Process ── */
.sg-process{padding-block:64px 70px;border-top:1px solid var(--sg-line)}.sg-process>h2{font-size:clamp(22px,2.5vw,32px);font-weight:650;letter-spacing:-.04em;margin:0 0 28px}.sg-process-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.sg-process-step{padding:24px;background:var(--sg-paper);border-radius:10px;border:1px solid var(--sg-line)}.sg-process-num{font:11px monospace;color:var(--sg-blue);display:block;margin-bottom:12px;font-weight:700}.sg-process-step h3{font-size:15px;font-weight:700;letter-spacing:-.02em;margin:0 0 8px}.sg-process-step p{font-size:12px;line-height:1.8;color:var(--sg-muted);margin:0;max-width:300px}

/* ── Differentiators ── */
.sg-diff{padding-block:0 70px}.sg-diff>h2{font-size:clamp(22px,2.5vw,32px);font-weight:650;letter-spacing:-.04em;margin:0 0 28px}.sg-diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sg-diff-card{padding:24px;background:white;border-radius:10px;border:1px solid var(--sg-line)}.sg-diff-card h3{font-size:15px;font-weight:700;letter-spacing:-.02em;margin:0 0 6px}.sg-diff-card p{font-size:12px;line-height:1.7;color:var(--sg-muted);margin:0}
```

- [ ] **Step 2: Add responsive rules for all new sections**

In the `@media(max-width:1050px)` block, add:

```css
.sg-hero-cols{gap:32px}
.sg-proof-grid{gap:16px}
.sg-process-grid{grid-template-columns:1fr}
```

In the `@media(max-width:640px)` block, add:

```css
.sg-hero-cols{flex-direction:column;gap:28px;align-items:flex-start}
.sg-hero-copy h1{font-size:clamp(32px,8vw,48px)}
.sg-hero-ctas{flex-direction:column;width:100%}
.sg-hero-ctas .sg-button{width:100%}
.sg-proof-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sg-compare-grid{grid-template-columns:1fr}
.sg-process-grid{grid-template-columns:1fr}
.sg-diff-grid{grid-template-columns:1fr}
.sg-diff{padding-bottom:40px}
.sg-compare{padding-block:36px 40px}
.sg-process{padding-block:36px 40px}
.sg-gallery-intro{font-size:11px}
```

- [ ] **Step 3: Verify all sections render correctly at desktop, tablet, and mobile widths**

Run: `npm run dev`

Open `http://localhost:5173/demos` and check:
- Desktop (>1050px): two-column hero with phone on right, 4-stat proof bar, 4-column demo grid, side-by-side before/after, 3-column process, 2x2 features
- Tablet (641–1050px): hero still side-by-side but tighter, 2-column demo grid, single-column process
- Mobile (<640px): everything stacks, phone frame centered, 2x2 proof grid, single-column everything else

- [ ] **Step 4: Commit**

```bash
git add src/views/demoShowcase.css
git commit -m "feat: add CSS for all new landing page sections with responsive rules"
```

---

### Task 4: Remove Old Hero Markup Remnants

**Files:**
- Modify: `src/views/demoShowcase.css`

The old hero used `.sg-hero-bottom`, `.sg-hero h1>span svg`, `.sg-edition`, and `.sg-desktop-break` which are no longer referenced in the new JSX. Clean up unused rules.

- [ ] **Step 1: Remove unused CSS rules from the base styles (line 1)**

Remove these rules from the base block:
- `.sg-edition{...}` — no longer in the hero topline
- `.sg-hero-bottom{...}` — replaced by `.sg-hero-cols` and `.sg-hero-ctas`
- `.sg-hero h1>span{...}` (the one with `position:relative;display:inline-block`) — the new `h1>span` just needs color
- `.sg-hero h1 svg{...}` — the SVG underline is removed
- `.sg-desktop-break{...}` — no longer used

Also remove corresponding responsive overrides in `@media(max-width:640px)`:
- `.sg-edition{display:none}`
- `.sg-hero-bottom{...}`
- `.sg-desktop-break{display:none}`

- [ ] **Step 2: Verify the page still renders correctly after cleanup**

Run: `npm run dev` — check `/demos` at all breakpoints.

- [ ] **Step 3: Commit**

```bash
git add src/views/demoShowcase.css
git commit -m "refactor: remove unused old hero CSS rules"
```

---

### Task 5: Visual QA and Polish

**Files:**
- Possibly modify: `src/components/heroGameLoop.css`, `src/views/demoShowcase.css`, `src/views/DemoShowcase.tsx`

- [ ] **Step 1: Start the dev server and open the page**

Run: `cd /Users/riz/Downloads/playable-commerce && npm run dev`

Open `/demos` in the browser.

- [ ] **Step 2: QA checklist — verify each item visually**

Check each of these in the browser:

1. **Hero**: headline renders with "3% clicked..." in blue, phone frame shows Swift Hockey animation looping, both CTAs work (scroll + mailto)
2. **Social proof bar**: 4 metrics evenly spaced, correct values, subtle top/bottom borders
3. **Demo gallery**: all 4 cards render, clicking opens the DemoPlayer modal, modal phone/wide toggle + restart + copy work
4. **Before/after**: wheel illustration visible on left, lock dials on right, blue border on "after" card
5. **How it works**: 3 steps with blue monospace numbers, heading renders
6. **Differentiators**: 2x2 grid, white cards on cream, all 4 items present
7. **CTA**: blue section with email, copy button works, mailto link works
8. **Footer**: renders, "Back to the games" scrolls to demos
9. **Mobile (resize to 375px)**: everything stacks, phone frame centered, no horizontal overflow
10. **Nav links**: "The demos" scrolls to #demos, "How it works" scrolls to #how-it-works

- [ ] **Step 3: Fix any spacing, color, or layout issues found during QA**

Adjust CSS values as needed based on what looks off. Common fixes:
- Adjust `gap` values if sections feel too tight or too loose
- Adjust `font-size` clamp values if headlines feel too big/small
- Adjust `padding-block` if vertical rhythm feels off
- Fix any overflow issues on mobile

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: visual polish and QA adjustments for landing page"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | HeroGameLoop component + CSS animation | `src/components/HeroGameLoop.tsx`, `src/components/heroGameLoop.css` |
| 2 | Restructure DemoShowcase into 7 sections | `src/views/DemoShowcase.tsx` |
| 3 | CSS for all new sections + responsive | `src/views/demoShowcase.css` |
| 4 | Remove old unused CSS | `src/views/demoShowcase.css` |
| 5 | Visual QA and polish | Any files as needed |
