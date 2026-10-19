import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealController } from "@/components/RevealController";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for the Stone Supply Co. website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <RevealController />
      <Header solid />
      <main id="main-content" className="legal-page">
        <div className="legal-hero">
          <p className="eyebrow">Site information</p>
          <h1>Privacy</h1>
          <p>Last updated August 29, 2026</p>
        </div>
        <div className="legal-content">
          <section>
            <h2>What this site collects</h2>
            <p>
              This site includes optional contact and inquiry forms where you
              may provide your name, email address, and phone number. Submitting
              a form sends that information to Stone Supply Co. so we can
              respond to your request. We do not use that information for
              marketing unrelated to your inquiry, and we do not sell it to
              third parties.
            </p>
            <p>
              This site does not include user accounts, advertising trackers, or
              a third-party analytics service. It includes an analytics-neutral
              event hook so call, directions, inventory, and social actions can
              be measured later if Stone Supply Co. chooses to add an analytics
              provider.
            </p>
          </section>
          <section>
            <h2>California residents (CCPA)</h2>
            <p>
              California residents may request to know what personal information
              we have collected, ask us to delete it, or opt out of any future
              sale of that information (we do not currently sell personal
              information). To make a request, call or email us using the
              contact information below.
            </p>
          </section>
          <section>
            <h2>External services</h2>
            <p>
              Links to Google Maps, Instagram, and The Stone Index take you to
              those services, where their own privacy policies apply. The
              embedded Google Map is not loaded until you choose to load it.
            </p>
          </section>
          <section>
            <h2>Questions</h2>
            <p>
              For questions about this site, your data, or the business, call{" "}
              <a href={business.phone.href}>{business.phone.display}</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
