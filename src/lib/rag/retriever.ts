import type { Retrieval } from "@/lib/chat/types";
import { mockRetrieval } from "@/lib/chat/mockEngine";
import { loadPortfolio } from "@/lib/data/repository";

/**
 * Retrieval layer. Returns the retrieval metadata (for the visualization) plus
 * an assembled context string (for grounded generation).
 *
 * - Online (Supabase + Gemini configured): embed query → pgvector cosine search
 *   over `chunks` → top-K (index built by src/lib/rag/indexer.ts).
 * - Offline: deterministic mock retrieval over the seed content, so the full
 *   pipeline + visualization run with zero infra.
 */

export type RetrievalResult = {
  retrieval: Retrieval;
  context: string;
};

const isOnline = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.GEMINI_API_KEY,
  );

/** Build a grounded context string from live portfolio data (offline retrieval path). */
async function offlineContext(): Promise<string> {
  const { profile, projects, skills, experience } = await loadPortfolio();
  const parts = [
    `# Profile\n${profile.name} — ${profile.headline}\n${profile.bio}`,
    `# Projects\n${projects
      .map((p) => `- ${p.title} (${p.status}): ${p.summary} [${p.techStack.join(", ")}]`)
      .join("\n")}`,
    `# Skills\n${skills.map((s) => s.name).join(", ")}`,
    `# Experience\n${experience.map((e) => `${e.role} @ ${e.org}: ${e.summaryMd ?? ""}`).join("\n")}`,
  ];
  return parts.join("\n\n");
}

const KIND: Record<string, Retrieval["hits"][number]["kind"]> = {
  repo_readme: "repo",
  resume: "resume",
  experience: "resume",
  profile: "resume",
  skill: "skill",
};

async function onlineRetrieve(query: string): Promise<RetrievalResult> {
  // Lazy imports so the offline build never pulls these in.
  const { createClient } = await import("@supabase/supabase-js");
  const { embedQuery } = await import("./embed");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Embed the query (same model + dims as the indexer — see embed.ts).
  const [vector, { profile }] = await Promise.all([embedQuery(query), loadPortfolio()]);

  // 2. pgvector cosine search via the match_chunks RPC.
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: vector,
    match_count: 8,
  });
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  // Empty index (never built / mid-migration) → let the caller fall back.
  if (!rows.length) throw new Error("knowledge index is empty");

  const hits = rows.slice(0, 5).map((row) => ({
    source: String(row.source_ref ?? row.title ?? "chunk"),
    kind: KIND[String(row.source_type)] ?? ("project" as const),
    score: Number(row.similarity ?? 0),
  }));

  // A compact identity header keeps basics ("who are you?") answerable even
  // when the top-k chunks are all project detail.
  const header = `# Portfolio owner\n${profile.name} — ${profile.headline}`;
  const context = [
    header,
    ...rows.map((row) => `[${row.source_type}: ${row.source_ref}]\n${String(row.content ?? "")}`),
  ].join("\n\n---\n\n");

  const top3 = hits.slice(0, 3).reduce((a, h) => a + h.score, 0) / Math.max(1, Math.min(3, hits.length));
  return {
    retrieval: {
      embeddingDims: vector.length,
      candidates: rows.length,
      hits,
      repos: hits.filter((h) => h.kind === "repo").map((h) => h.source),
      contextTokens: Math.round(context.split(/\s+/).length * 1.3),
      confidence: Math.round(Math.min(98, top3 * 100 + 4)),
    },
    context,
  };
}

export async function retrieve(query: string): Promise<RetrievalResult> {
  if (isOnline()) {
    try {
      return await onlineRetrieve(query);
    } catch (err) {
      // fall through to offline on any backend error — but say why in the logs
      console.warn("[retrieve] online path failed, using offline:", (err as Error).message);
    }
  }
  return { retrieval: await mockRetrieval(query), context: await offlineContext() };
}
