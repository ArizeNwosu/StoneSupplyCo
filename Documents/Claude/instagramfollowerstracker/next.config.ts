import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  // Prevent Playwright and heavy server packages from being bundled client-side
  serverExternalPackages: ['playwright', 'playwright-core'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.instagramfollowerstracker.com' }],
        destination: 'https://instagramfollowerstracker.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
