import { getPortfolio } from "@/lib/data/repository";

/** Canonical site URL. Set NEXT_PUBLIC_SITE_URL in production (Vercel domain). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://nexus-pi-ochre.vercel.app"; // TODO: swap to a custom domain when purchased

/** JSON-LD Person + WebSite structured data for rich search results. */
export function personJsonLd() {
  const { profile, skills } = getPortfolio();
  const { github, linkedin, website } = profile.socials;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.bio,
    jobTitle: profile.headline,
    url: SITE_URL,
    knowsAbout: skills.map((s) => s.name),
    sameAs: [github, linkedin, website].filter(Boolean),
    email: profile.socials.email,
  };
}
