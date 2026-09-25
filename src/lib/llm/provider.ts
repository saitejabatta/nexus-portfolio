import { generateMockAnswer } from "@/lib/chat/mockEngine";
import { loadPortfolio } from "@/lib/data/repository";

/**
 * Generation adapter. One interface, swappable backends:
 *  - online: Gemini Flash (grounded on retrieved context), token streaming
 *  - offline: seed-driven answer from the mock engine, tokenized
 *
 * Default provider is Gemini (free tier). Set LLM_PROVIDER to switch later;
 * Claude (claude-haiku-4-5) can be added here without touching callers.
 */

export type GenerationResult = {
  tokens: AsyncIterable<string>;
  followups: string[];
};

const hasGemini = () => Boolean(process.env.GEMINI_API_KEY);

function tokenize(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? [text];
}

async function* fromArray(tokens: string[]): AsyncIterable<string> {
  for (const t of tokens) yield t;
}

// Tried in order. Gemini 2.5 is legacy (access-restricted, frequent 503s),
// so it's only the last resort. GEMINI_MODEL, if set, goes first.
const MODEL_CHAIN = () =>
  [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ].filter((m, i, all): m is string => !!m && all.indexOf(m) === i);

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class GeminiHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** One streaming call over REST (SSE). Yields answer text, skipping thought parts. */
async function* streamOnce(
  model: string,
  system: string,
  prompt: string,
): AsyncIterable<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new GeminiHttpError(res.status, (await res.text()).slice(0, 200));
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const evt = JSON.parse(line.slice(5)) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const text = (evt.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && p.text)
        .map((p) => p.text)
        .join("");
      if (text) yield text;
    }
  }
}

/**
 * Resilient generation: retry transient errors with backoff, fall through the
 * model chain, and — if every model is down — answer from the offline grounded
 * path rather than showing the visitor an error.
 */
async function* geminiStream(
  query: string,
  context: string,
): AsyncIterable<string> {
  const { profile } = await loadPortfolio();
  const system =
    profile.systemPrompt ??
    "You are NEXUS, an AI portfolio agent. Answer grounded in the provided context. Be concise, technical, and honest about uncertainty.";
  const prompt = `Use ONLY the context below to answer as the portfolio owner.\n\n<context>\n${context}\n</context>\n\nQuestion: ${query}`;

  for (const model of MODEL_CHAIN()) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let emitted = false;
      try {
        for await (const t of streamOnce(model, system, prompt)) {
          emitted = true;
          yield t;
        }
        return;
      } catch (err) {
        // Mid-answer failure: the visitor already has a partial answer — end cleanly.
        if (emitted) return;
        const status = err instanceof GeminiHttpError ? err.status : 0;
        console.warn(`[generate] ${model} attempt ${attempt + 1} failed:`, status || (err as Error).message);
        if (!RETRYABLE.has(status) || attempt === 2) break; // next model
        await sleep(400 * 3 ** attempt);
      }
    }
  }

  console.warn("[generate] all Gemini models failed — answering from retrieved sources");
  yield* fromArray(tokenize(await sourcesOnlyAnswer(query, context)));
}

/**
 * Outage answer. Retrieval already ran, so quote the best-matching chunks
 * verbatim (still grounded, just not synthesized). Offline context has no
 * chunk separators, so it falls back to the keyword answer.
 */
async function sourcesOnlyAnswer(query: string, context: string): Promise<string> {
  const chunks = context.split("\n\n---\n\n").slice(1, 3); // [0] is the identity header
  if (!chunks.length) return (await generateMockAnswer(query)).content;

  const quoted = chunks.map((chunk) => {
    const [label, ...body] = chunk.split("\n");
    const source = label.replace(/^\[|\]$/g, "").replace(/^[a-z_]+: /, "");
    const text = body.join(" ").replace(/\s+/g, " ").trim();
    return `**${source}**\n> ${text.length > 420 ? `${text.slice(0, 420)}…` : text}`;
  });
  return `My language model is briefly unavailable, so here are the most relevant passages from my knowledge base, unedited:\n\n${quoted.join("\n\n")}\n\nAsk again in a moment for a full answer.`;
}

export async function generate(
  query: string,
  context: string,
): Promise<GenerationResult> {
  if (hasGemini()) {
    // Follow-ups are still seed-derived for now (cheap + reliable).
    const { followups } = await generateMockAnswer(query);
    return { tokens: geminiStream(query, context), followups: followups ?? [] };
  }

  const { content, followups } = await generateMockAnswer(query);
  return { tokens: fromArray(tokenize(content)), followups: followups ?? [] };
}
