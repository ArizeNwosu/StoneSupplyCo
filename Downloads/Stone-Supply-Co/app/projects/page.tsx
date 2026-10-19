import type { Metadata } from "next";
import { ProjectsClient } from "./ProjectsClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Saved Projects",
  description: "Your saved stone material projects. Collect and compare slabs for your design projects.",
  alternates: { canonical: `${siteUrl}/projects` },
};

export default function ProjectsPage() {
  return (
    <>
      <Header solid />
      <main>
        <ProjectsClient />
      </main>
      <Footer />
    </>
  );
}
