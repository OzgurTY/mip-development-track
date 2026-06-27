import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a parent pnpm-lock.yaml exists above this project,
  // so Next would otherwise infer the wrong root.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
