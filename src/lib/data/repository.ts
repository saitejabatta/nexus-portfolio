import { SEED } from "./seed";
import type {
  PortfolioData,
  Project,
  ProjectCategory,
  Skill,
} from "./types";

/**
 * Data access layer. Today it returns the local SEED so the site works with
 * zero infra. Once Supabase is provisioned, `loadPortfolio()` transparently
 * sources the same shape from the database — callers never change.
 */

/** Synchronous, client-safe content (the seed). */
export function getPortfolio(): PortfolioData {
  return SEED;
}

export function getEnabledProjects(): Project[] {
  return SEED.projects
    .filter((p) => p.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return getEnabledProjects().filter((p) => p.category === category);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return SEED.projects.find((p) => p.slug === slug);
}

export function getSkillsByCategory(): Record<string, Skill[]> {
  const out: Record<string, Skill[]> = {};
  for (const s of SEED.skills) {
    if (!s.enabled) continue;
    (out[s.category] ??= []).push(s);
  }
  return out;
}

/** Counts shown on the knowledge-base tiles. */
export function getKnowledgeStats() {
  return {
    repositories: SEED.projects.filter((p) => p.enabled).length,
    skills: SEED.skills.filter((s) => s.enabled).length,
    experience: SEED.experience.length,
  };
}

/**
 * Server-side loader (used once the RAG backend lands). Falls back to SEED
 * until Supabase credentials exist. Kept async so swapping in DB queries is a
 * drop-in change.
 */
export async function loadPortfolio(): Promise<PortfolioData> {
  // Phase 6: if (isSupabaseConfigured()) { ...query + map rows... }
  return SEED;
}
