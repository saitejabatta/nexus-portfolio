import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "Under the hood",
  description:
    "How this AI portfolio actually works: the live SSE pipeline a question travels through, the retrieval and generation calls, and the database boundary that guards admin edits.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Under the hood · NEXUS",
    description:
      "How a question travels through NEXUS — the live pipeline, retrieval, generation, and the security boundary behind the admin panel.",
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "Under the hood · NEXUS",
    description:
      "How a question travels through NEXUS — the live pipeline, retrieval, generation, and the security boundary behind the admin panel.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
