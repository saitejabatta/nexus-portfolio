import type { Retrieval } from "@/lib/chat/types";
import { mockRetrieval } from "@/lib/chat/mockEngine";
import { getPortfolio } from "@/lib/data/repository";

/**
 * Retrieval layer. Returns the retrieval metadata (for the visualization) plus
 * an assembled context string (for grounded generation).
 *
 * - Online (Supabase + Gemini configured): embed query → pgvector cosine search
 *   over `chunks` → rerank → top-K. [wired in when creds exist]
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

/** Build a grounded context string from the seed (offline path). */
function offlineContext(): string {
  const { profile, projects, skills, experience } = getPortfolio();
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

async function onlineRetrieve(query: string): Promise<RetrievalResult> {
  // Lazy imports so the offline build never pulls these in.
  const { createClient } = await import("@supabase/supabase-js");
  const genai = await import("@google/generative-ai").catch(() => null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Embed the query with Gemini.
  if (!genai) throw new Error("Gemini SDK unavailable");
  const client = new genai.GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_EMBED_MODEL || "text-embedding-004",
  });
  const embed = await model.embedContent(query);
  const vector = embed.embedding.values;

  // 2. pgvector cosine search via an RPC (match_chunks) defined in Supabase.
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: vector,
    match_count: 8,
  });
  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const hits = rows.slice(0, 5).map((row) => ({
    source: String(row.source_ref ?? row.title ?? "chunk"),
    kind: (row.source_type as string)?.startsWith("repo")
      ? ("repo" as const)
      : (row.source_type as string) === "resume"
        ? ("resume" as const)
        : (row.source_type as string) === "skill"
          ? ("skill" as const)
          : ("project" as const),
    score: Number(row.similarity ?? 0),
  }));

  const context = rows
    .map((row) => String(row.content ?? ""))
    .join("\n\n---\n\n");

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
    } catch {
      // fall through to offline on any backend error
    }
  }
  return { retrieval: mockRetrieval(query), context: offlineContext() };
}
