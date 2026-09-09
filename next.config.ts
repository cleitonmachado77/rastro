import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid regenerating AGENTS.md / CLAUDE.md on every next dev start
  experimental: {},
};

export default nextConfig;
