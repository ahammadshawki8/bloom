import path from "node:path";
import type { NextConfig } from "next";

// Try-on results are served by the backend (/results/:id); allow its host for next/image.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: apiUrl.protocol.replace(":", "") as "http" | "https", hostname: apiUrl.hostname, port: apiUrl.port, pathname: "/results/**" },
      { protocol: "https", hostname: "*.onrender.com", pathname: "/results/**" },
    ],
    dangerouslyAllowLocalIP: apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1",
  },
  turbopack: {
    // Monorepo: the shared domain package lives at ../shared
    root: path.resolve(import.meta.dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
