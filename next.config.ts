import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database and Anthropic clients must stay server-side.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
