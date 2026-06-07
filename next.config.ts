import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  watchOptions: {
    ignored: ['/home/z/my-project/dev*.log', '/tmp/**'],
  },
};

export default nextConfig;
