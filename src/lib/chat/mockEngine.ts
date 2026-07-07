import type {
  MessageComponent,
  MockAnswer,
  Retrieval,
  RetrievalHit,
} from "./types";
import { loadPortfolio } from "@/lib/data/repository";
import type { PortfolioData, Project, ProjectCategory } from "@/lib/data/types";

/**
 * Mock/offline RAG engine — keyword-routed answers generated from live
 * portfolio data (Supabase when configured, SEED otherwise via
 * loadPortfolio()). This is the deterministic fallback the real Gemini
 * generation path (lib/llm/provider.ts) uses when no API key is set; the
 * return shape (markdown + follow-ups) is what the UI always renders.
 */

function enabledProjects(data: PortfolioData): Project[] {
  return data.projects.filter((p) => p.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

function skillsByCategory(data: PortfolioData): Record<string, PortfolioData["skills"]> {
  const out: Record<string, PortfolioData["skills"]> = {};
  for (const s of data.skills) {
    if (!s.enabled) continue;
    (out[s.category] ??= []).push(s);
  }
  return out;
}

/** Parse a natural filter out of the query (category / status / complexity). */
function filterProjects(
  data: PortfolioData,
  query: string,
): { projects: Project[]; label: string } {
  const q = query.toLowerCase();
  let projects = enabledProjects(data);
  let label = "projects";

  const cat: [RegExp, ProjectCategory, string][] = [
    [/\bai\b|machine learning|\bml\b|rag/, "ai", "AI projects"],
    [/web|frontend|full[- ]?stack/, "web", "web projects"],
    [/data/, "data", "data projects"],
  ];
  for (const [re, c, l] of cat) {
    if (re.test(q)) {
      projects = projects.filter((p) => p.category === c);
      label = l;
      break;
    }
  }

  if (/production|production-ready|shipped/.test(q)) {
    projects = projects.filter((p) => p.status === "production");
    label = "production-ready projects";
  }
  if (/hardest|complex|difficult|challeng/.test(q)) {
    projects = [...projects].sort((a, b) => b.complexity - a.complexity).slice(0, 1);
    label = "most complex project";
  }

  return { projects, label };
}

function buildProjectsAnswer(data: PortfolioData, query: string): MockAnswer {
  const { projects, label } = filterProjects(data, query);
  if (projects.length === 0) {
    return {
      content: `I don't have any **${label}** in my knowledge base yet. Try *"show all projects"* or ask about my skills.`,
      followups: ["Show all projects", "What are your strongest skills?"],
    };
  }
  // The detailed cards are rendered as components (resolveComponents); the text
  // stays a short intro so the answer doesn't duplicate the cards.
  const intro =
    projects.length === 1
      ? `Here's my ${label}:`
      : `Here are my ${label} — ${projects.length} of them:`;
  return {
    content: intro,
    followups: [
      "Which project was the hardest?",
      "What are your strongest skills?",
      "Show your resume",
    ],
  };
}

function buildSkillsAnswer(data: PortfolioData): MockAnswer {
  const groups = skillsByCategory(data);
  const lines = Object.entries(groups)
    .map(([cat, skills]) => `- **${cat}** — ${skills.map((s) => s.name).join(", ")}`)
    .join("\n");

  return {
    content: `My strongest areas, by category:

${lines}

A tiny taste of how I wire a retriever:

\`\`\`python
def retrieve(query: str, k: int = 5) -> list[Chunk]:
    q_vec = embed(query)                      # 768-dim embedding
    hits = db.search(q_vec, top_k=k * 4)      # over-fetch
    return rerank(query, hits)[:k]            # cross-encoder rerank
\`\`\``,
    followups: ["Show all your AI projects", "What are you learning now?", "Show your resume"],
  };
}

function buildWhoAnswer(data: PortfolioData): MockAnswer {
  const { profile } = data;
  const top = enabledProjects(data)
    .slice(0, 2)
    .map((p) => `**${p.title}**`)
    .join(" and ");
  return {
    content: `I'm **${profile.name}** — ${profile.headline}.

${profile.bio}

Recent builds include ${top}.

> This very site is one of my projects: you're talking to a RAG agent that visualizes its own pipeline.`,
    followups: ["Show all your AI projects", "What are your strongest skills?", "Open your GitHub"],
  };
}

type Rule = { match: RegExp; answer: (data: PortfolioData) => MockAnswer };

/** Matches intent to connect/hire/collaborate — routed to lead capture + booking. */
const CONNECT_INTENT =
  /\b(hir(e|ing)|recruit(er|ing)|job opportunity|open to work|work together|collaborat|reach out|get in touch|contact you|connect|let'?s talk|schedule a call|book a call|interview)\b/i;

const RULES: Rule[] = [
  {
    match: CONNECT_INTENT,
    answer: () => ({
      content: `I'd love that. Leave your details below and Sai Teja will follow up directly — or grab a slot on his calendar if you'd rather talk right away.`,
      followups: ["Show all your AI projects", "What are your strongest skills?"],
    }),
  },
  { match: /who are you|about you|yourself|introduce/i, answer: buildWhoAnswer },
  { match: /project|built|portfolio|show.*work|production|hardest|complex/i, answer: (d) => buildProjectsAnswer(d, "") },
  { match: /skill|tech|stack|language|know|good at/i, answer: buildSkillsAnswer },
  {
    match: /intern|experience|job|work history/i,
    answer: (data) => ({
      content: data.experience
        .map((e) => `**${e.role}** · ${e.org}\n${e.summaryMd ?? ""}`)
        .join("\n\n") +
        "\n\n*(Detailed timeline shown below.)*",
      followups: ["What are your strongest skills?", "Show all your AI projects"],
    }),
  },
  {
    match: /hard|difficult|challeng/i,
    answer: (data) => {
      const hardest = [...enabledProjects(data)].sort((a, b) => b.complexity - a.complexity)[0];
      return {
        content: `The hardest was **${hardest.title}**.

${hardest.challengesMd ?? hardest.summary}

**What I took from it:** ${hardest.learningsMd ?? ""}`,
        followups: ["What are your strongest skills?", "Show all your AI projects"],
      };
    },
  },
  {
    match: /learning|currently|next|future/i,
    answer: () => ({
      content: `Right now I'm going deeper on:

- **Agentic systems** — tool use, planning, multi-step reasoning
- **Eval-driven development** — measuring AI quality like real software
- **Reranking & hybrid search** — squeezing relevance out of retrieval

Basically: making AI systems that are *measurably* good, not just demo-good.`,
      followups: ["What are your strongest skills?", "Show all your AI projects"],
    }),
  },
  {
    match: /resume|cv|download/i,
    answer: (data) => ({
      content: data.profile.resumeUrl
        ? `📄 Here's my résumé — download it below.`
        : `📄 My résumé hasn't been uploaded yet. Ask me anything about my projects or skills in the meantime.`,
      followups: ["Show all your AI projects", "What are your strongest skills?"],
    }),
  },
  {
    match: /github|repo|code|source/i,
    answer: () => ({
      content: `🔗 My **GitHub** holds the source for these projects. *"Open GitHub"* (also in the ⌘K palette) links straight to my profile, and each project answer carries a repo preview card.`,
      followups: ["Show all your AI projects", "What are your strongest skills?"],
    }),
  },
];

const FALLBACK: MockAnswer = {
  content: `Good question. I'm running on a **seed knowledge base** right now — the real retrieval pipeline (embeddings → vector search → grounded generation) goes live in a later phase.

Try one of these to see me in action:`,
  followups: ["Who are you?", "Show all your AI projects", "What are your strongest skills?"],
};

export async function generateMockAnswer(query: string): Promise<MockAnswer> {
  const data = await loadPortfolio();
  // Project queries get the smart filter (category/status/complexity).
  if (/project|built|portfolio|show.*work|production-ready/i.test(query)) {
    return buildProjectsAnswer(data, query);
  }
  const rule = RULES.find((r) => r.match.test(query));
  return rule ? rule.answer(data) : FALLBACK;
}

/* ── Tool resolution: which rich components to render with the answer ───────
   Mirrors how a tool-calling agent would return structured UI payloads. */

function buildRepoCards(data: PortfolioData) {
  return enabledProjects(data).map((p) => ({
    name: p.slug,
    description: p.summary,
    language: p.techStack[0],
    url: p.repoUrl || undefined,
    topics: p.techStack.slice(0, 4),
  }));
}

function buildResumeCard(data: PortfolioData) {
  const { profile, experience } = data;
  return {
    name: profile.name,
    headline: profile.headline,
    highlights: experience.flatMap((e) => e.highlights).slice(0, 4),
    downloadUrl: profile.resumeUrl || undefined,
  };
}

function buildTimeline(data: PortfolioData) {
  const exp = data.experience.map((e) => ({
    title: e.role,
    subtitle: e.org,
    period: [e.startDate, e.endDate].filter(Boolean).join(" – ") || "Ongoing",
    detail: e.summaryMd,
  }));
  const projectMilestones = enabledProjects(data).map((p) => ({
    title: p.title,
    subtitle: "Project",
    period: p.status === "production" ? "Shipped" : "In progress",
    detail: p.summary,
  }));
  return [...exp, ...projectMilestones];
}

export async function resolveComponents(query: string): Promise<MessageComponent[]> {
  const data = await loadPortfolio();
  const q = query.toLowerCase();

  if (CONNECT_INTENT.test(query)) {
    const calLink = data.profile.socials.cal ?? "";
    return [
      { kind: "lead_capture", query },
      { kind: "booking", calLink },
    ];
  }
  if (/resume|cv|download/.test(q)) {
    return [{ kind: "resume", resume: buildResumeCard(data) }];
  }
  if (/intern|experience|timeline|work history|career|journey/.test(q)) {
    return [{ kind: "timeline", items: buildTimeline(data) }];
  }
  if (/github|repo|repositor|source code/.test(q)) {
    return [{ kind: "repos", repos: buildRepoCards(data) }];
  }
  if (/project|built|portfolio|show.*work|production|hardest|complex|\bai\b|\bweb\b/.test(q)) {
    const { projects } = filterProjects(data, query);
    if (projects.length) return [{ kind: "projects", projects }];
  }
  return [];
}

/* ── Mock retrieval (drives the RAG visualization) ─────────────────────────
   Replaced by real pgvector search once retrieval is wired to Supabase; the
   numbers here are deterministic per-query so the same question looks
   consistent, and now reflect live project/skill data. */

/** Cheap deterministic hash so a given query yields stable mock scores. */
function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function mockRetrieval(query: string): Promise<Retrieval> {
  const data = await loadPortfolio();
  const sourcePool: { source: string; kind: RetrievalHit["kind"] }[] = [
    ...enabledProjects(data).map((p) => ({
      source: `README · ${p.slug}`,
      kind: "repo" as const,
    })),
    { source: "resume.pdf · experience", kind: "resume" },
    { source: "resume.pdf · skills", kind: "resume" },
    { source: "skill · retrieval-augmented-generation", kind: "skill" },
    { source: "skill · fastapi", kind: "skill" },
  ];

  const rand = seededRand(hashString(query) + 7);
  const candidates = 18 + Math.floor(rand() * 22);

  const shuffled = [...sourcePool].sort(() => rand() - 0.5).slice(0, 5);
  let score = 0.78 + rand() * 0.16;
  const hits: RetrievalHit[] = shuffled.map((s) => {
    const hit = { ...s, score: Math.round(score * 100) / 100 };
    score -= 0.04 + rand() * 0.06;
    return hit;
  });

  const repos = Array.from(
    new Set(
      hits
        .filter((h) => h.kind === "repo")
        .map((h) => h.source.replace("README · ", "")),
    ),
  );

  const top3 = hits.slice(0, 3).reduce((a, h) => a + h.score, 0) / 3;
  const confidence = Math.round(Math.min(98, top3 * 100 + 4));

  return {
    embeddingDims: 768,
    candidates,
    hits,
    repos: repos.length ? repos : ["nexus-portfolio"],
    contextTokens: 900 + Math.floor(rand() * 1400),
    confidence,
  };
}
