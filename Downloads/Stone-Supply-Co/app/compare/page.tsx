import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "./CompareClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Compare Materials | ${siteName}`,
  description: "Side-by-side comparison of stone slabs. Compare specifications, finishes, and pricing.",
  robots: { index: false },
};

export default function ComparePage() {
  return (
    <>
      <Header solid />
      <main>
        <Suspense>
          <CompareClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
