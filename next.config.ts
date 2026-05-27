import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Temporarily disable Turbopack for the build to avoid RSC parsing issues
    // with the current large client component + Server Actions setup.
    // We can re-enable later once the code is split.
    turbo: false,
  },
};

export default nextConfig;
