import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://instagramfollowerstracker.com'),
  title: {
    default: 'Instagram Followers Tracker — Track Any Account Free',
    template: '%s | Instagram Followers Tracker',
  },
  description:
    'Track Instagram follower counts for any public account. See growth history, daily changes, and trends. The best free Instagram followers tracker — no login required for public pages.',
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
    title: 'Instagram Followers Tracker — Track Any Account Free',
    description:
      'Track Instagram follower counts for any public account. See growth history and daily changes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Followers Tracker',
    description: 'Track Instagram follower counts for any public account.',
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
        className={`${inter.className} bg-white text-gray-900 antialiased min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}
