import type { Metadata } from "next";
import { StoneFinderClient } from "./StoneFinderClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "AI Stone Finder — Find Your Perfect Slab",
  description:
    "Describe your project and our AI matches you with the right stone from live inventory. Northridge, Los Angeles.",
  openGraph: {
    title: `AI Stone Finder | ${siteName}`,
    description:
      "Tell us about your space and get personalized stone recommendations from our inventory in seconds.",
  },
};

export default function StoneFinderPage() {
  return (
    <>
      <Header solid />
      <main className="stone-finder-page">
        <div className="stone-finder-hero">
          <p className="eyebrow" style={{ color: "var(--color-stone-dark)" }}>
            AI Stone Finder
          </p>
          <h1>
            Find your
            <br />
            <em style={{ fontStyle: "italic" }}>perfect stone</em>
          </h1>
          <p>
            Describe your project in plain language or use the detailed form.
            Our AI matches you with slabs from our live inventory and explains
            exactly why each one fits your space.
          </p>
        </div>

        <StoneFinderClient />
      </main>
      <Footer />
    </>
  );
}
