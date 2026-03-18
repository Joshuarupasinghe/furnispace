import type { NextConfig } from "next";

const r2PublicHost = (() => {
  const value = process.env.R2_PUBLIC_URL?.trim()
  if (!value) return null

  try {
    return new URL(value).hostname
  } catch {
    return null
  }
})()

const r2DevHost = process.env.R2_BUCKET_NAME ? `${process.env.R2_BUCKET_NAME}.r2.dev` : null

const imageHosts = [
  "localhost",
  "images.unsplash.com",
  "source.unsplash.com",
  r2PublicHost,
  r2DevHost,
].filter((host): host is string => Boolean(host))

const nextConfig: NextConfig = {
  // Allow large file uploads for 3D model OBJ/GLB files (can exceed the 10 MB default)
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      ...imageHosts
        .filter((host) => host !== "localhost")
        .map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;