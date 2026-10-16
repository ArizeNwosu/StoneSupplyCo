import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SharedVisualizerClient } from "./SharedVisualizerClient";

export const metadata: Metadata = {
  title: "Shared Stone Visualization",
  description:
    "See how natural stone looks in a real kitchen or bathroom — visualized with AI by Stone Supply Co.",
  robots: { index: false, follow: false },
};

export default async function SharedVisualizerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <Header solid />
      <main>
        <Suspense>
          <SharedVisualizerClient token={token} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
