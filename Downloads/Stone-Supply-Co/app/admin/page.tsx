import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";
import { siteName } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Admin | ${siteName}`,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
