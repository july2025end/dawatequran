import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? undefined : (process.env.NEXT_DIST_DIR || '.next_local'),
  turbopack: {
    root: process.env.VERCEL ? undefined : path.resolve(__dirname),
  },
  // Development only: devices on the local network (phones, iPads, this Mac by IP) may load the dev server.
  allowedDevOrigins: ["192.168.18.104", "192.168.18.135", "192.168.*.*", "*.local"],
  // The admin and attendance portals are reached by address only; keep them out of search results.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/dashboard/:path*", headers: noindex },
      { source: "/dashboard", headers: noindex },
      { source: "/attendance", headers: noindex },
    ];
  },
};

export default nextConfig;
