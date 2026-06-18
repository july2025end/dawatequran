import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.VERCEL ? undefined : '.next_local',
  turbopack: {
    root: process.env.VERCEL ? undefined : path.resolve(__dirname),
  },
};

export default nextConfig;
