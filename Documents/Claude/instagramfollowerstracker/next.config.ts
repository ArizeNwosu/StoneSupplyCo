import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent.**.fbcdn.net' },
    ],
  },
  // Prevent Playwright and heavy server packages from being bundled client-side
  serverExternalPackages: ['playwright', 'playwright-core'],
};

export default nextConfig;
