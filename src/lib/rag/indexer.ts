import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadPortfolio } from "@/lib/data/repository";
import { EMBED_DIMS, EMBED_MODEL, embedDocuments } from "./embed";

/**
 * Knowledge indexer: live portfolio content + GitHub READMEs + résumé
 * → documents → chunks → Gemini embeddings → pgvector.
 *
 * Rebuilds are blue/green: the new batch is fully written before the old one
 * is deleted, so the chat never queries a half-built (or empty) index.
 */

type SourceDoc = {
  sourceType: "profile" | "project" | "skill" | "experience" | "repo_readme" | "resume";
  sourceRef: string;
  title: string;
  content: string;
};

export type IndexReport = {
  documents: number;
  chunks: number;
  bySource: Record<string, number>;
  skipped: string[];
  model: string;
  ms: number;
};

export type IndexStats = {
  documents: number;
  chunks: number;
  bySource: Record<string, number>;
  lastIndexedAt: string | null;
};

const CHUNK_CHARS = 1200;
const README_CAP = 12_000;

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── chunking ────────────────────────────────────────────────
/** Pack paragraphs into ~CHUNK_CHARS chunks, carrying the last paragraph over for context. */
export function chunkText(text: string): string[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    // hard-split any single paragraph that's longer than a chunk
    .flatMap((p) =>
      p.length <= CHUNK_CHARS ? [p] : p.match(new RegExp(`[\\s\\S]{1,${CHUNK_CHARS}}(?=\\s|$)`, "g")) ?? [p],
    );

  const chunks: string[] = [];
  let current: string[] = [];
  let size = 0;
  for (const p of paras) {
    if (size + p.length > CHUNK_CHARS && current.length) {
      chunks.push(current.join("\n\n"));
      const carry = current[current.length - 1];
      current = carry.length < CHUNK_CHARS / 3 ? [carry] : [];
      size = current.reduce((a, c) => a + c.length, 0);
    }
    current.push(p);
    size += p.length;
  }
  if (current.length) chunks.push(current.join("\n\n"));
  return chunks;
}

// ── sources ─────────────────────────────────────────────────
function cleanMarkdown(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "") // inline HTML
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images / badges
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchReadme(repoUrl: string): Promise<string | null> {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) return null;
  const [, owner, repo] = m;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}/readme`, {
    headers: {
      accept: "application/vnd.github.raw+json",
      "user-agent": "nexus-indexer",
      ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) return null;
  return cleanMarkdown(await res.text()).slice(0, README_CAP);
}

export async function extractResumeText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`résumé fetch ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  const path = new URL(url).pathname.toLowerCase();
  const bytes = new Uint8Array(await res.arrayBuffer());

  if (type.includes("pdf") || path.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (type.includes("wordprocessingml") || path.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return value;
  }
  throw new Error("unsupported résumé format (use PDF or DOCX for indexing)");
}

async function collectSources(skipped: string[]): Promise<SourceDoc[]> {
  const { profile, projects, skills, experience } = await loadPortfolio();
  const docs: SourceDoc[] = [];

  docs.push({
    sourceType: "profile",
    sourceRef: "profile",
    title: `About ${profile.name}`,
    content: [
      `${profile.name} — ${profile.headline}`,
      profile.location ? `Based in ${profile.location}.` : "",
      profile.bio,
      Object.entries(profile.socials ?? {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  for (const p of projects) {
    docs.push({
      sourceType: "project",
      sourceRef: p.title,
      title: p.title,
      content: [
        `Project: ${p.title} (${p.status}, ${p.category})`,
        p.summary,
        p.techStack.length ? `Tech stack: ${p.techStack.join(", ")}` : "",
        p.descriptionMd,
        p.features?.length ? `Features:\n${p.features.map((f) => `- ${f}`).join("\n")}` : "",
        p.challengesMd && `Challenges:\n${p.challengesMd}`,
        p.learningsMd && `Learnings:\n${p.learningsMd}`,
        p.impactMd && `Impact:\n${p.impactMd}`,
        p.liveUrl && `Live: ${p.liveUrl}`,
        p.repoUrl && `Repo: ${p.repoUrl}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
  }

  const byCategory = new Map<string, string[]>();
  for (const s of skills) {
    const line = `${s.name} (proficiency ${s.proficiency}/5${s.years ? `, ${s.years} yrs` : ""})`;
    byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), line]);
  }
  for (const [category, lines] of byCategory) {
    docs.push({
      sourceType: "skill",
      sourceRef: `skills:${category}`,
      title: `${category} skills`,
      content: `Skills — ${category}:\n${lines.map((l) => `- ${l}`).join("\n")}`,
    });
  }

  for (const e of experience) {
    docs.push({
      sourceType: "experience",
      sourceRef: `${e.role} @ ${e.org}`,
      title: `${e.role} @ ${e.org}`,
      content: [
        `${e.role} at ${e.org} (${e.type}${e.startDate ? `, ${e.startDate} – ${e.endDate ?? "present"}` : ""})`,
        e.summaryMd,
        e.highlights.length ? e.highlights.map((h) => `- ${h}`).join("\n") : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
  }

  const repos = [...new Set(projects.map((p) => p.repoUrl).filter((u): u is string => !!u))];
  const readmes = await Promise.all(repos.map((u) => fetchReadme(u).catch(() => null)));
  repos.forEach((url, i) => {
    const ref = url.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const text = readmes[i];
    if (text) docs.push({ sourceType: "repo_readme", sourceRef: ref, title: `${ref} README`, content: text });
    else skipped.push(`README unavailable: ${ref}`);
  });

  if (profile.resumeUrl) {
    try {
      const text = (await extractResumeText(profile.resumeUrl)).trim();
      if (text) docs.push({ sourceType: "resume", sourceRef: "résumé", title: `${profile.name} — résumé`, content: text });
      else skipped.push("résumé: no extractable text (scanned image?)");
    } catch (err) {
      skipped.push(`résumé: ${(err as Error).message}`);
    }
  } else {
    skipped.push("résumé: none uploaded");
  }

  return docs.filter((d) => d.content.trim());
}

// ── build ───────────────────────────────────────────────────
export async function rebuildIndex(): Promise<IndexReport> {
  const started = Date.now();
  const supabase = serviceClient();
  const skipped: string[] = [];
  const batch = crypto.randomUUID();

  const sources = await collectSources(skipped);
  const pieces = sources.flatMap((doc, d) =>
    chunkText(doc.content).map((content) => ({ d, content, title: doc.title })),
  );
  const vectors = await embedDocuments(pieces.map((p) => ({ text: p.content, title: p.title })));
  if (vectors.some((v) => v.length !== EMBED_DIMS)) {
    throw new Error(`embedding size mismatch (expected ${EMBED_DIMS})`);
  }

  const { data: inserted, error: docErr } = await supabase
    .from("documents")
    .insert(
      sources.map((s) => ({
        source_type: s.sourceType,
        source_ref: s.sourceRef,
        title: s.title,
        raw_content: s.content,
        metadata: { batch, model: EMBED_MODEL() },
      })),
    )
    .select("id");
  if (docErr || !inserted) throw new Error(`documents insert: ${docErr?.message}`);

  const rows = pieces.map((p, i) => ({
    document_id: inserted[p.d].id,
    content: p.content,
    token_count: Math.round(p.content.split(/\s+/).length * 1.3),
    metadata: { batch },
    embedding: vectors[i],
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("chunks").insert(rows.slice(i, i + 200));
    if (error) {
      // roll back this batch; the previous index stays live
      await supabase.from("documents").delete().eq("metadata->>batch", batch);
      throw new Error(`chunks insert: ${error.message}`);
    }
  }

  // Swap: drop every older batch (chunks cascade).
  const { error: swapErr } = await supabase
    .from("documents")
    .delete()
    .or(`metadata->>batch.is.null,metadata->>batch.neq.${batch}`);
  if (swapErr) throw new Error(`swap: ${swapErr.message}`);

  const bySource: Record<string, number> = {};
  for (const s of sources) bySource[s.sourceType] = (bySource[s.sourceType] ?? 0) + 1;

  return {
    documents: sources.length,
    chunks: rows.length,
    bySource,
    skipped,
    model: EMBED_MODEL(),
    ms: Date.now() - started,
  };
}

export async function indexStats(): Promise<IndexStats> {
  const supabase = serviceClient();
  const [{ data: docs }, { count }] = await Promise.all([
    supabase.from("documents").select("source_type, updated_at"),
    supabase.from("chunks").select("id", { count: "exact", head: true }),
  ]);
  const bySource: Record<string, number> = {};
  let last: string | null = null;
  for (const d of docs ?? []) {
    bySource[d.source_type] = (bySource[d.source_type] ?? 0) + 1;
    if (!last || d.updated_at > last) last = d.updated_at;
  }
  return { documents: docs?.length ?? 0, chunks: count ?? 0, bySource, lastIndexedAt: last };
}
