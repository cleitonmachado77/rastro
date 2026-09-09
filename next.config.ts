import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Inclui o SQLite e o schema no bundle das Serverless Functions na Vercel
  outputFileTracingIncludes: {
    "/**": ["./prisma/**"],
  },
};

export default nextConfig;
