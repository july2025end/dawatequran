import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next_local',
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
