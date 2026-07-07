/** Content model — mirrors the Supabase schema (see supabase/migrations). */

export type Profile = {
  name: string;
  headline: string;
  bio: string;
  location?: string;
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
    website?: string;
    cal?: string; // Cal.com booking link, e.g. https://cal.com/username
  };
  systemPrompt?: string;
  resumeUrl?: string;
};

export type ProjectStatus = "production" | "wip" | "hackathon" | "archived";
export type ProjectCategory = "ai" | "web" | "data" | "tooling";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  descriptionMd?: string;
  liveUrl?: string;
  repoUrl?: string;
  techStack: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  complexity: number; // 1..5
  challengesMd?: string;
  learningsMd?: string;
  features?: string[];
  impactMd?: string;
  futureMd?: string;
  enabled: boolean;
  sortOrder: number;
};

export type Skill = {
  name: string;
  category: string;
  proficiency: number; // 1..5
  years?: number;
  enabled: boolean;
};

export type Experience = {
  org: string;
  role: string;
  startDate?: string;
  endDate?: string;
  summaryMd?: string;
  type: "internship" | "job" | "research";
  highlights: string[];
  sortOrder: number;
};

export type PortfolioData = {
  profile: Profile;
  projects: Project[];
  skills: Skill[];
  experience: Experience[];
};
