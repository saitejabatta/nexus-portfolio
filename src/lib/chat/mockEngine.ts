import type {
  MessageComponent,
  MockAnswer,
  Retrieval,
  RetrievalHit,
} from "./types";
import { SEED } from "@/lib/data/seed";
import {
  getEnabledProjects,
  getSkillsByCategory,
} from "@/lib/data/repository";
import type { Project, ProjectCategory } from "@/lib/data/types";

/**
 * Mock RAG engine — keyword-routed answers, now generated from the SEED content
 * (lib/data) so editing your projects/skills updates the chat automatically.
 * Phase 6 replaces `generateMockAnswer` with a real /api/chat call; the return
 * shape (markdown + follow-ups) stays identical so the UI never changes.
 */

/** Parse a natural filter out of the query (category / status / complexity). */
function filterProjects(query: string): { projects: Project[]; label: string } {
  const q = query.toLowerCase();
  let projects = getEnabledProjects();
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

function buildProjectsAnswer(query: string): MockAnswer {
  const { projects, label } = filterProjects(query);
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

function buildSkillsAnswer(): MockAnswer {
  const groups = getSkillsByCategory();
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

function buildWhoAnswer(): MockAnswer {
  const { profile } = SEED;
  const top = getEnabledProjects()
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

type Rule = { match: RegExp; answer: () => MockAnswer };

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
  { match: /project|built|portfolio|show.*work|production|hardest|complex/i, answer: () => buildProjectsAnswer("") },
  { match: /skill|tech|stack|language|know|good at/i, answer: buildSkillsAnswer },
  {
    match: /intern|experience|job|work history/i,
    answer: () => ({
      content: SEED.experience
        .map((e) => `**${e.role}** · ${e.org}\n${e.summaryMd ?? ""}`)
        .join("\n\n") +
        "\n\n*(Detailed timeline becomes a generated component once my resume is ingested in Phase 5.)*",
      followups: ["What are your strongest skills?", "Show all your AI projects"],
    }),
  },
  {
    match: /hard|difficult|challeng/i,
    answer: () => {
      const hardest = [...getEnabledProjects()].sort((a, b) => b.complexity - a.complexity)[0];
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
    answer: () => ({
      content: `📄 My résumé becomes a **downloadable PDF + an inline preview card** once it's uploaded through the admin panel (Phase 8) and ingested (Phase 5).

For now, ask me anything about my projects or skills and I'll answer directly.`,
      followups: ["Show all your AI projects", "What are your strongest skills?"],
    }),
  },
  {
    match: /github|repo|code|source/i,
    answer: () => ({
      content: `🔗 My **GitHub** holds the source for these projects. *"Open GitHub"* (also in the ⌘K palette) links straight to my profile, and each project answer carries a repo preview card.

Repository analysis + README understanding get wired in during the ingestion phase.`,
      followups: ["Show all your AI projects", "What are your strongest skills?"],
    }),
  },
];

const FALLBACK: MockAnswer = {
  content: `Good question. I'm running on a **seed knowledge base** right now — the real retrieval pipeline (embeddings → vector search → grounded generation) goes live in a later phase.

Try one of these to see me in action:`,
  followups: ["Who are you?", "Show all your AI projects", "What are your strongest skills?"],
};

export function generateMockAnswer(query: string): MockAnswer {
  // Project queries get the smart filter (category/status/complexity).
  if (/project|built|portfolio|show.*work|production-ready/i.test(query)) {
    return buildProjectsAnswer(query);
  }
  const rule = RULES.find((r) => r.match.test(query));
  return rule ? rule.answer() : FALLBACK;
}

/* ── Tool resolution: which rich components to render with the answer ───────
   Mirrors how a tool-calling agent would return structured UI payloads. */

function buildRepoCards() {
  return getEnabledProjects().map((p) => ({
    name: p.slug,
    description: p.summary,
    language: p.techStack[0],
    url: p.repoUrl || undefined,
    topics: p.techStack.slice(0, 4),
  }));
}

function buildResumeCard() {
  const { profile, experience } = SEED;
  return {
    name: profile.name,
    headline: profile.headline,
    highlights: experience.flatMap((e) => e.highlights).slice(0, 4),
    downloadUrl: undefined, // wired once a résumé PDF is uploaded (Phase 8)
  };
}

function buildTimeline() {
  const exp = SEED.experience.map((e) => ({
    title: e.role,
    subtitle: e.org,
    period: [e.startDate, e.endDate].filter(Boolean).join(" – ") || "Ongoing",
    detail: e.summaryMd,
  }));
  const projectMilestones = getEnabledProjects().map((p) => ({
    title: p.title,
    subtitle: "Project",
    period: p.status === "production" ? "Shipped" : "In progress",
    detail: p.summary,
  }));
  return [...exp, ...projectMilestones];
}

export function resolveComponents(query: string): MessageComponent[] {
  const q = query.toLowerCase();

  if (CONNECT_INTENT.test(query)) {
    const calLink = SEED.profile.socials.cal ?? "";
    return [
      { kind: "lead_capture", query },
      { kind: "booking", calLink },
    ];
  }
  if (/resume|cv|download/.test(q)) {
    return [{ kind: "resume", resume: buildResumeCard() }];
  }
  if (/intern|experience|timeline|work history|career|journey/.test(q)) {
    return [{ kind: "timeline", items: buildTimeline() }];
  }
  if (/github|repo|repositor|source code/.test(q)) {
    return [{ kind: "repos", repos: buildRepoCards() }];
  }
  if (/project|built|portfolio|show.*work|production|hardest|complex|\bai\b|\bweb\b/.test(q)) {
    const { projects } = filterProjects(query);
    if (projects.length) return [{ kind: "projects", projects }];
  }
  return [];
}

/* ── Mock retrieval (drives the RAG visualization) ─────────────────────────
   Replaced in Phase 6 by real pipeline events streamed over SSE. The numbers
   here are deterministic per-query so the same question looks consistent. */

const SOURCE_POOL: { source: string; kind: RetrievalHit["kind"] }[] = [
  ...getEnabledProjects().map((p) => ({
    source: `README · ${p.slug}`,
    kind: "repo" as const,
  })),
  { source: "resume.pdf · experience", kind: "resume" },
  { source: "resume.pdf · skills", kind: "resume" },
  { source: "skill · retrieval-augmented-generation", kind: "skill" },
  { source: "skill · fastapi", kind: "skill" },
];

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

export function mockRetrieval(query: string): Retrieval {
  const rand = seededRand(hashString(query) + 7);
  const candidates = 18 + Math.floor(rand() * 22);

  const shuffled = [...SOURCE_POOL].sort(() => rand() - 0.5).slice(0, 5);
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
