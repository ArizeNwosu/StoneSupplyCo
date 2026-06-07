import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://instagramfollowerstracker.com'),
  title: {
    default: 'Instagram Followers Tracker - Track Public Account Growth',
    template: '%s | Instagram Followers Tracker',
  },
  description:
    'Track public Instagram follower counts for competitors, creators, brands, clients, and campaign targets. See growth history, daily changes, and trends.',
  keywords: [
    'instagram followers tracker',
    'ig follower tracker',
    'instagram follow tracker',
    'unfollow tracker',
    'instagram growth tracker',
    'instagram follower count tracker',
    'track instagram follower growth',
    'instagram tracking tools',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Instagram Followers Tracker',
    title: 'Instagram Followers Tracker - Track Public Account Growth',
    description:
      'Track public Instagram follower counts for competitors, creators, brands, clients, and campaign targets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Followers Tracker',
    description: 'Track public Instagram follower counts and growth history.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-full bg-white text-slate-950 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
