import type { Metadata } from "next";
import Link from "next/link";
import { TradeApplicationForm } from "./TradeApplicationForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName, siteUrl } from "@/lib/siteConfig";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Trade & Professional Portal",
  description:
    "Stone Supply Co works with designers, contractors, fabricators, and builders across Los Angeles. Apply for a trade account to access preferred pricing and priority service.",
  alternates: { canonical: `${siteUrl}/trade` },
  openGraph: {
    title: `Trade & Professional Portal | ${siteName}`,
    description:
      "Apply for a trade account at Stone Supply Co — Northridge, Los Angeles. Preferred pricing for interior designers, contractors, and fabricators.",
  },
};

const TRADE_BENEFITS = [
  {
    title: "Early access",
    body: "Let us know what you're sourcing and we'll reach out when matching slabs arrive — before they go to the general floor.",
  },
  {
    title: "Preferred pricing",
    body: "Volume and repeat-purchase pricing available for qualifying trade accounts. Discuss terms with Ali directly.",
  },
  {
    title: "Project support",
    body: "Bring your spec sheet. We'll pull slabs that match your project and work with you while you confirm details with your client.",
  },
  {
    title: "Direct contact",
    body: "Trade inquiries go to Ali directly. Expect a prompt response — typically the same business day.",
  },
];

export default function TradePage() {
  return (
    <>
      <Header solid />
      <main>
        {/* Hero */}
        <div
          style={{
            padding: "calc(var(--header-height) + clamp(4rem, 7vw, 7rem)) var(--gutter) clamp(3rem, 5vw, 5rem)",
            background: "var(--color-warm)",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <nav className="breadcrumb breadcrumb-ink" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden>›</span>
            <span className="breadcrumb-current">Trade portal</span>
          </nav>

          <h1
            style={{
              maxWidth: "14ch",
              margin: "1.5rem 0 0",
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(3.5rem, 7vw, 7.5rem)",
              fontWeight: 400,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
            }}
          >
            Built for the professionals who build.
          </h1>
          <p style={{ maxWidth: "38rem", margin: "1.5rem 0 0", color: "var(--color-stone-dark)", fontSize: "1rem", lineHeight: 1.7 }}>
            Stone Supply Co has worked with interior designers, general contractors, kitchen
            and bath remodelers, and fabricators across Los Angeles since day one. Apply
            below to set up a trade account.
          </p>
        </div>

        {/* Benefits */}
        <section
          style={{
            padding: "clamp(4rem, 7vw, 7rem) var(--gutter)",
            background: "var(--color-paper)",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))",
              gap: "2rem",
            }}
          >
            {TRADE_BENEFITS.map(({ title, body }) => (
              <article key={title}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1.5rem, 2.2vw, 2.2rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {title}
                </h3>
                <p style={{ margin: "0.75rem 0 0", color: "#5c5851", fontSize: "0.92rem", lineHeight: 1.7 }}>
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Application form */}
        <section
          style={{
            padding: "clamp(4rem, 7vw, 7rem) var(--gutter)",
            background: "var(--color-white)",
          }}
        >
          <div style={{ maxWidth: "52rem" }}>
            <p className="eyebrow" style={{ color: "var(--color-bronze-ink)", marginBottom: "0.5rem" }}>
              Apply for a trade account
            </p>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 3.5vw, 3.5rem)",
                fontWeight: 400,
                letterSpacing: "-0.035em",
              }}
            >
              Tell us about your work
            </h2>
            <p style={{ margin: "0 0 2.5rem", color: "var(--color-stone-dark)", fontSize: "0.9rem" }}>
              Prefer to talk first?{" "}
              <a href={`tel:${business.phone.e164}`} style={{ color: "inherit", textDecoration: "underline" }}>
                Call {business.phone.display}
              </a>{" "}
              and ask for Ali.
            </p>
            <TradeApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
