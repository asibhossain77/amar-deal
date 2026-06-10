import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['localhost', '127.0.0.1', '0.0.0.0', '21.0.10.34', '21.0.14.24', '21.0.14.116'],
};

export default nextConfig;
