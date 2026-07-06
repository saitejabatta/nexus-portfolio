import { getPortfolio } from "@/lib/data/repository";

/** Canonical site URL. Set NEXT_PUBLIC_SITE_URL in production (Vercel domain). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://nexus-portfolio.vercel.app"; // TODO: real domain

/** JSON-LD Person + WebSite structured data for rich search results. */
export function personJsonLd() {
  const { profile, skills } = getPortfolio();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.bio,
    jobTitle: profile.headline,
    url: SITE_URL,
    knowsAbout: skills.map((s) => s.name),
    sameAs: Object.values(profile.socials).filter(Boolean),
    email: profile.socials.email,
  };
}
