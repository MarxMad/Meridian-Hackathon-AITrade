import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Forzar SSR para todas las páginas, evitar static generation
  output: 'standalone',
  // Deshabilitar completamente la pre-generación estática
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: false,
  // Configuraciones adicionales para evitar static generation
  experimental: {
    dynamicIO: true,
  },
  // Deshabilitar optimizaciones que pueden causar problemas
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  env: {
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  }
};

export default nextConfig;
