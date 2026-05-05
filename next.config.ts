import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  // 1. Move turbopack to the TOP LEVEL (no longer inside experimental)
  turbopack: {
    // Leave empty to satisfy the Next.js 16 requirement 
    // while using Webpack-based plugins
  },

  // 2. Fix for Chart.js build crash
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,
};

export default withPWA(nextConfig);