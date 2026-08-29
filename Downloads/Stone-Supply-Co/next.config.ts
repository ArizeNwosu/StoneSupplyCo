import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "xjrlmcqlaqnktllvvaci.supabase.co",
        pathname: "/storage/v1/object/public/listing-photos/**",
      },
      {
        protocol: "https",
        hostname: "fvaivbcprpyqrmjauoov.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
