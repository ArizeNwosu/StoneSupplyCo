import type { Metadata } from "next";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Project",
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
