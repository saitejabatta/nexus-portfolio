/**
 * Gemini embeddings over REST. One module for both sides of retrieval, so the
 * indexer and the query path can never drift onto different models.
 *
 * Default model: gemini-embedding-2. It's Matryoshka-trained, so we request 768
 * dims to match the `vector(768)` column. v2 has no task_type field — the
 * query/document asymmetry is expressed as text prefixes instead. v1
 * (gemini-embedding-001) still works via GEMINI_EMBED_MODEL and uses task_type.
 * The two models' vector spaces are incompatible: changing the model means
 * rebuilding the index (the indexer stamps the model on every document).
 *
 * We re-normalize defensively — cosine ranking doesn't care, but the
 * similarity scores we display do.
 */

export const EMBED_DIMS = 768;
export const EMBED_MODEL = () => process.env.GEMINI_EMBED_MODEL || "gemini-embedding-2";
const MODEL = EMBED_MODEL;
const usesPrefixes = () => !/embedding-00\d|text-embedding/.test(MODEL());
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const BATCH = 100; // API max per batchEmbedContents call

type TaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${MODEL()}:${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

function request(text: string, taskType: TaskType, title?: string) {
  const base = { model: `models/${MODEL()}`, output_dimensionality: EMBED_DIMS };
  if (usesPrefixes()) {
    const framed =
      taskType === "RETRIEVAL_QUERY"
        ? `task: search result | query: ${text}`
        : `title: ${title ?? "none"} | text: ${text}`;
    return { ...base, content: { parts: [{ text: framed }] } };
  }
  return {
    ...base,
    content: { parts: [{ text }] },
    task_type: taskType,
    ...(title ? { title } : {}),
  };
}

export async function embedQuery(text: string): Promise<number[]> {
  const out = await call<{ embedding: { values: number[] } }>(
    "embedContent",
    request(text, "RETRIEVAL_QUERY"),
  );
  return normalize(out.embedding.values);
}

export async function embedDocuments(
  docs: { text: string; title?: string }[],
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const out = await call<{ embeddings: { values: number[] }[] }>(
      "batchEmbedContents",
      { requests: slice.map((d) => request(d.text, "RETRIEVAL_DOCUMENT", d.title)) },
    );
    vectors.push(...out.embeddings.map((e) => normalize(e.values)));
  }
  return vectors;
}
