import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXUS — Sai Teja · AI Engineer",
    short_name: "NEXUS",
    description:
      "An AI portfolio you can talk to. Ask anything and watch the RAG pipeline think in real time.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#05070d",
    orientation: "portrait-primary",
    categories: ["portfolio", "productivity", "developer"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
