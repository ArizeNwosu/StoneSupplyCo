import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { business } from "@/data/business";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${business.name} | Stone Slabs in Northridge, Los Angeles`,
    template: `%s | ${business.name}`,
  },
  description:
    "Explore full quartz and natural stone slabs at Stone Supply Co. in Northridge. View current inventory, finishes, location details, and plan your visit.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: business.name,
    title: `${business.name} | Full Slabs in Northridge`,
    description:
      "Natural stone and quartz for designers, builders, fabricators, and homeowners in Los Angeles and the San Fernando Valley.",
    images: [
      {
        url: "https://lh3.googleusercontent.com/geougc/AF1QipPLU8GvDPSzzMTtWJ3FGrw8QPnpLaN62TOzrfke=h1400-no",
        width: 1200,
        height: 1200,
        alt: "Backlit natural stone slab at Stone Supply Co.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.name} | Full Slabs in Northridge`,
    description:
      "See current full-slab inventory and plan a visit to the Northridge yard.",
    images: [
      "https://lh3.googleusercontent.com/geougc/AF1QipPLU8GvDPSzzMTtWJ3FGrw8QPnpLaN62TOzrfke=h1400-no",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171815",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
