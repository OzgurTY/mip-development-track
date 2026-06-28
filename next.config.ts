import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a parent pnpm-lock.yaml exists above this project,
  // so Next would otherwise infer the wrong root.
  turbopack: { root: process.cwd() },
  experimental: {
    // Default Server Action body limit is 1 MB; infra file uploads (certs,
    // config, .ovpn, PDFs, Word docs) can be larger. uploadAttachment caps at
    // 20 MB, so allow a little headroom over that.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
