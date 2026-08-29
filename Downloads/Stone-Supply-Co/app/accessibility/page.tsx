import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealController } from "@/components/RevealController";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Accessibility statement for the Stone Supply Co. website.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <>
      <RevealController />
      <Header solid />
      <main id="main-content" className="legal-page">
        <div className="legal-hero">
          <p className="eyebrow">Site information</p>
          <h1>Accessibility</h1>
          <p>Last updated August 28, 2026</p>
        </div>
        <div className="legal-content">
          <section>
            <h2>Our aim</h2>
            <p>
              This website is designed toward WCAG 2.2 AA practices, including
              semantic structure, keyboard access, visible focus states,
              readable contrast, descriptive image text, and reduced-motion
              support.
            </p>
          </section>
          <section>
            <h2>Visiting the yard</h2>
            <p>
              The Google Business Profile lists a wheelchair-accessible
              entrance and wheelchair-accessible parking lot. For current
              access details or assistance before visiting, call{" "}
              <a href={business.phone.href}>{business.phone.display}</a>.
            </p>
          </section>
          <section>
            <h2>Feedback</h2>
            <p>
              If any part of the site is difficult to use, please contact Stone
              Supply Co. by phone so the information can be provided another
              way and the issue can be addressed.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
