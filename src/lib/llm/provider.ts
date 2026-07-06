import { generateMockAnswer } from "@/lib/chat/mockEngine";
import { getPortfolio } from "@/lib/data/repository";

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

async function* geminiStream(
  query: string,
  context: string,
): AsyncIterable<string> {
  const genai = await import("@google/generative-ai");
  const client = new genai.GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    systemInstruction:
      getPortfolio().profile.systemPrompt ??
      "You are NEXUS, an AI portfolio agent. Answer grounded in the provided context. Be concise, technical, and honest about uncertainty.",
  });

  const prompt = `Use ONLY the context below to answer as the portfolio owner.\n\n<context>\n${context}\n</context>\n\nQuestion: ${query}`;
  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const t = chunk.text();
    if (t) yield t;
  }
}

export async function generate(
  query: string,
  context: string,
): Promise<GenerationResult> {
  if (hasGemini()) {
    // Follow-ups are still seed-derived for now (cheap + reliable).
    const { followups } = generateMockAnswer(query);
    return { tokens: geminiStream(query, context), followups: followups ?? [] };
  }

  const { content, followups } = generateMockAnswer(query);
  return { tokens: fromArray(tokenize(content)), followups: followups ?? [] };
}
