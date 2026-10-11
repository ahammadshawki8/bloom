import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bloom: try your next hair before you need it",
    short_name: "Bloom",
    description: "Make a hair passport, try matched wigs, head wraps and brows on your own face, and choose together.",
    start_url: "/studio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf6f2",
    theme_color: "#fbf6f2",
    categories: ["beauty", "lifestyle", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Fitting room", url: "/studio/try", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Your looks", url: "/studio/saved", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
