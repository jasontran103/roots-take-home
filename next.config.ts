import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_API_SECRET_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_SECRET_KEY,
  },
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
  // Disable React strict mode for development need to change tis for production
  reactStrictMode: false,
  // Enable experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
};

export default nextConfig;
