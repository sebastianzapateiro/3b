import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@las3b/db", "@las3b/shared"],
  poweredByHeader: false,
};

export default nextConfig;
