import type { Metadata } from "next";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteName } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Project | ${siteName}`,
  robots: { index: false },
};

export default function ProjectDetailPage() {
  return (
    <>
      <Header solid />
      <main>
        <ProjectDetailClient />
      </main>
      <Footer />
    </>
  );
}
