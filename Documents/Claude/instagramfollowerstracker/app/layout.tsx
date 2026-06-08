import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://instagramfollowerstracker.com'),
  title: {
    default: 'Instagram Followers Tracker - Free Online Growth & Unfollow Tracking',
    template: '%s | Instagram Followers Tracker',
  },
  description:
    'Track public Instagram follower counts, growth history, and export-based unfollow reports without sharing your Instagram password.',
  keywords: [
    'instagram followers tracker',
    'ig follower tracker',
    'instagram follow tracker',
    'unfollow tracker',
    'instagram unfollow tracker free',
    'instagram follower tracker online free',
    'instagram follower tracker without login',
    'instagram growth tracker',
    'instagram follower count tracker',
    'track instagram follower growth',
    'instagram tracking tools',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Instagram Followers Tracker',
    title: 'Instagram Followers Tracker - Free Online Growth & Unfollow Tracking',
    description:
      'Track public Instagram follower counts, growth history, and export-based unfollow reports without sharing your password.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Followers Tracker',
    description: 'Track public Instagram follower counts, growth history, and safe unfollow reports.',
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
