import { SEED } from "./seed";
import type {
  Experience,
  PortfolioData,
  Project,
  ProjectCategory,
  Skill,
} from "./types";

/**
 * Data access layer.
 *
 * - Synchronous helpers (getPortfolio, getEnabledProjects, ...) return the
 *   local SEED — used by client components that need instant, no-fetch data
 *   (e.g. quick external links). They never touch the network.
 * - `loadPortfolio()` is the live source of truth: queries Supabase when
 *   configured (admin-editable content), falls back to SEED otherwise or on
 *   any failure. The RAG chat backend and the public /api/portfolio route
 *   both go through this.
 */

/** Synchronous, client-safe content (the seed — not the live DB). */
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

/** Counts shown on the knowledge-base tiles (seed-based, sync fallback). */
export function getKnowledgeStats() {
  return {
    repositories: SEED.projects.filter((p) => p.enabled).length,
    skills: SEED.skills.filter((s) => s.enabled).length,
    experience: SEED.experience.length,
  };
}

const isSupabaseServerConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

type ProjectRow = {
  slug: string;
  title: string;
  summary: string | null;
  description_md: string | null;
  live_url: string | null;
  repo_url: string | null;
  tech_stack: string[] | null;
  category: string;
  status: string;
  complexity: number;
  challenges_md: string | null;
  learnings_md: string | null;
  features: string[] | null;
  impact_md: string | null;
  future_md: string | null;
  enabled: boolean;
  sort_order: number;
};

type SkillRow = {
  name: string;
  category: string;
  proficiency: number;
  years: number | null;
  enabled: boolean;
};

type ExperienceRow = {
  org: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  summary_md: string | null;
  type: string;
  highlights: string[] | null;
  sort_order: number;
};

type ProfileRow = {
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  socials: Record<string, string> | null;
  system_prompt: string | null;
  resume_url: string | null;
};

function mapProject(r: ProjectRow): Project {
  return {
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? "",
    descriptionMd: r.description_md ?? undefined,
    liveUrl: r.live_url ?? undefined,
    repoUrl: r.repo_url ?? undefined,
    techStack: r.tech_stack ?? [],
    category: r.category as ProjectCategory,
    status: r.status as Project["status"],
    complexity: r.complexity,
    challengesMd: r.challenges_md ?? undefined,
    learningsMd: r.learnings_md ?? undefined,
    features: r.features ?? undefined,
    impactMd: r.impact_md ?? undefined,
    futureMd: r.future_md ?? undefined,
    enabled: r.enabled,
    sortOrder: r.sort_order,
  };
}

function mapSkill(r: SkillRow): Skill {
  return {
    name: r.name,
    category: r.category,
    proficiency: r.proficiency,
    years: r.years ?? undefined,
    enabled: r.enabled,
  };
}

function mapExperience(r: ExperienceRow): Experience {
  return {
    org: r.org,
    role: r.role,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    summaryMd: r.summary_md ?? undefined,
    type: r.type as Experience["type"],
    highlights: r.highlights ?? [],
    sortOrder: r.sort_order,
  };
}

/**
 * Server-side loader — the live source of truth. Queries Supabase when
 * configured; falls back to SEED on missing config or any query error so the
 * site (and chat) never hard-fails because of a database hiccup.
 */
export async function loadPortfolio(): Promise<PortfolioData> {
  if (!isSupabaseServerConfigured()) return SEED;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const [profileRes, projectsRes, skillsRes, experienceRes] = await Promise.all([
      supabase.from("profile").select("*").limit(1).maybeSingle(),
      supabase.from("projects").select("*").eq("enabled", true).order("sort_order"),
      supabase.from("skills").select("*").eq("enabled", true).order("sort_order"),
      supabase.from("experience").select("*").order("sort_order"),
    ]);

    if (!profileRes.data) return SEED; // nothing seeded yet — stay on SEED

    const p = profileRes.data as ProfileRow;
    return {
      profile: {
        name: p.name,
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        location: p.location ?? undefined,
        socials: (p.socials as PortfolioData["profile"]["socials"]) ?? {},
        systemPrompt: p.system_prompt ?? undefined,
        resumeUrl: p.resume_url ?? undefined,
      },
      projects: ((projectsRes.data as ProjectRow[]) ?? []).map(mapProject),
      skills: ((skillsRes.data as SkillRow[]) ?? []).map(mapSkill),
      experience: ((experienceRes.data as ExperienceRow[]) ?? []).map(mapExperience),
    };
  } catch (err) {
    console.error("[repository] loadPortfolio: Supabase query failed, using SEED:", err);
    return SEED;
  }
}
