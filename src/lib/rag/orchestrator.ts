import type { StageId } from "@/lib/chat/types";
import type { RagEvent } from "./events";
import { retrieve } from "./retriever";
import { generate } from "@/lib/llm/provider";
import { resolveComponents } from "@/lib/chat/mockEngine";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Per-stage dwell so the visualization reads clearly (skipped when fast). */
const DWELL: Partial<Record<StageId, number>> = {
  query: 200,
  embed: 320,
  search: 480,
  chunks: 520,
  rerank: 300,
  sources: 300,
  assemble: 280,
};

/**
 * Runs the RAG pipeline and yields SSE events in the order the visualizer
 * expects. Retrieval happens during embed/search; generation streams during
 * the `generate` stage. Works identically online and offline.
 */
export async function* orchestrate(query: string): AsyncGenerator<RagEvent> {
  try {
    const stage = async function* (
      id: StageId,
    ): AsyncGenerator<RagEvent> {
      yield { type: "stage", stage: id, status: "active" };
      await sleep(DWELL[id] ?? 0);
      yield { type: "stage", stage: id, status: "done" };
    };

    yield* stage("query");
    yield* stage("embed");

    // Vector search → retrieval metadata + grounded context.
    yield { type: "stage", stage: "search", status: "active" };
    const { retrieval, context } = await retrieve(query);
    await sleep(DWELL.search ?? 0);
    yield { type: "stage", stage: "search", status: "done" };
    yield { type: "retrieval", retrieval };

    yield* stage("chunks");
    yield* stage("rerank");

    // Linking sources surfaces the rich tool-call components (cards/timelines).
    yield { type: "stage", stage: "sources", status: "active" };
    for (const component of await resolveComponents(query)) {
      yield { type: "component", component };
    }
    await sleep(DWELL.sources ?? 0);
    yield { type: "stage", stage: "sources", status: "done" };

    yield* stage("assemble");

    // Generation.
    yield { type: "stage", stage: "generate", status: "active" };
    const { tokens, followups } = await generate(query, context);
    for await (const token of tokens) {
      yield { type: "token", token };
    }
    yield { type: "stage", stage: "generate", status: "done" };
    yield { type: "followups", followups };
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "pipeline error",
    };
  }
}
