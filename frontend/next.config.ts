import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.VERCEL ? undefined : (process.env.NEXT_DIST_DIR || '.next_local'),
  turbopack: {
    root: process.env.VERCEL ? undefined : path.resolve(__dirname),
  },
  allowedDevOrigins: ["192.168.18.135:3000", "192.168.18.135"],
};

export default nextConfig;
