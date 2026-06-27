import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@neondatabase/serverless"],
};

export default nextConfig;
