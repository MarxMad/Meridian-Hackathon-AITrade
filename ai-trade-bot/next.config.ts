import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
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
