import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Describe your project",
    body: "Tell us about your space — the style, existing colors, and what you're building.",
  },
  {
    num: "02",
    title: "Get matched instantly",
    body: "Our AI scores every slab in inventory for visual harmony and practical fit.",
  },
  {
    num: "03",
    title: "See your slabs",
    body: "Receive 3–6 curated recommendations with design explanations, then visit the yard.",
  },
];

export function AiFinderCTA() {
  return (
    <section className="ai-finder-cta">
      <div className="ai-finder-cta-inner">
        <div className="ai-finder-cta-copy">
          <p className="eyebrow" style={{ color: "var(--color-bronze-light)" }}>
            AI Stone Finder
          </p>
          <h2>
            Find your perfect
            <em>stone</em>
          </h2>
          <p>
            Not sure where to start? Describe your project and let our AI match
            you with the right stone from our live inventory. It takes two
            minutes and works like talking to a knowledgeable friend — not a
            search engine.
          </p>
          <div className="ai-finder-actions">
            <Link href="/stone-finder" className="button button-light">
              Start the finder
            </Link>
            <Link
              href="/materials"
              className="text-link text-link-on-dark"
            >
              Browse all slabs
            </Link>
          </div>
        </div>

        <div className="ai-finder-steps">
          {steps.map(({ num, title, body }) => (
            <div key={num} className="ai-finder-step">
              <span className="ai-finder-step-num">{num}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
