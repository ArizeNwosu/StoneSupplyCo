import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealController } from "@/components/RevealController";
import { business } from "@/data/business";
import { siteUrl } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the Stone Supply Co. website.",
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsPage() {
  return (
    <>
      <RevealController />
      <Header solid />
      <main id="main-content" className="legal-page">
        <div className="legal-hero">
          <p className="eyebrow">Site information</p>
          <h1>Terms of Use</h1>
          <p>Last updated August 29, 2026</p>
        </div>
        <div className="legal-content">
          <section>
            <h2>About this site</h2>
            <p>
              This website is operated by Stone Supply Co Inc (&ldquo;Stone Supply Co&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;) and provides information about our slab inventory,
              pricing, and contact options. It is intended for informational
              purposes and does not constitute a binding purchase agreement.
            </p>
          </section>

          <section>
            <h2>Pricing and availability</h2>
            <p>
              All prices shown on this site are <strong>asking prices</strong> and
              are subject to change without notice. Final pricing, availability,
              and quantity must be confirmed with Stone Supply Co. directly —
              either by calling the yard or visiting in person — before any
              purchase is made. Displayed quantities reflect the most recently
              updated information and may not reflect real-time stock.
            </p>
            <p>
              Stone Supply Co. does not process payments through this website.
              All transactions are completed in person at our Northridge yard.
            </p>
          </section>

          <section>
            <h2>Inquiries and lead forms</h2>
            <p>
              By submitting a contact form, trade application, or stone finder
              inquiry on this site, you are requesting that Stone Supply Co.
              contact you about your material interest. Submission of a form
              does not constitute a purchase order, reservation, or commitment
              by either party. No materials are held or reserved as a result of
              an online inquiry alone.
            </p>
          </section>

          <section>
            <h2>AI-assisted recommendations</h2>
            <p>
              The Stone Finder and Visualizer tools use AI assistance to suggest
              materials based on your inputs. These suggestions are for
              reference only and do not guarantee the suitability, availability,
              or pricing of any specific slab. Always confirm with us before
              making a decision.
            </p>
          </section>

          <section>
            <h2>Accuracy of information</h2>
            <p>
              We make reasonable efforts to keep inventory, pricing, and
              business information accurate. However, we do not warrant that
              all content on this site is complete, current, or error-free.
              Material colors, patterns, and veining vary naturally from slab
              to slab — photographs are representative and may differ from the
              specific piece you select.
            </p>
          </section>

          <section>
            <h2>External links</h2>
            <p>
              This site links to third-party services including Google Maps,
              Instagram, and The Stone Index. We are not responsible for the
              content, accuracy, or practices of those services.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about these terms or a specific purchase? Call us at{" "}
              <a href={business.phone.href}>{business.phone.display}</a> or
              visit the yard at {business.address.formatted}.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
