import type { Metadata } from "next";
import { Suspense } from "react";
import { VisualizerClient } from "./VisualizerClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName, siteUrl } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Room Visualizer | ${siteName}`,
  description: "See how any stone slab looks in your space. Preview marble, quartzite, and granite in kitchen, bathroom, and living room settings.",
  alternates: { canonical: `${siteUrl}/visualizer` },
  openGraph: {
    title: `Room Visualizer | ${siteName}`,
    description: "Preview how natural stone slabs look in real room settings at Stone Supply Co.",
  },
};

export default function VisualizerPage() {
  return (
    <>
      <Header solid />
      <main>
        <Suspense>
          <VisualizerClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
