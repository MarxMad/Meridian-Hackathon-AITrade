import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimized for Vercel deployment
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Remove turbo config for Vercel compatibility
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  env: {
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  }
};

export default nextConfig;
