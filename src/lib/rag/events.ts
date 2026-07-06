import type { MessageComponent, Retrieval, StageId } from "@/lib/chat/types";

/**
 * The SSE contract between /api/chat and the frontend. These events drive the
 * RAG pipeline visualization (Phase 3) and the streamed answer — the exact same
 * events whether retrieval is real (Supabase + Gemini) or the offline path.
 */
export type RagEvent =
  | { type: "stage"; stage: StageId; status: "active" | "done" }
  | { type: "retrieval"; retrieval: Retrieval }
  | { type: "component"; component: MessageComponent }
  | { type: "token"; token: string }
  | { type: "followups"; followups: string[] }
  | { type: "done" }
  | { type: "error"; message: string };

/** Encode one event as an SSE frame. */
export function encodeSSE(event: RagEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parse a chunk of SSE text into events. Maintains a buffer across calls via the
 * returned leftover string (SSE frames may split across network chunks).
 */
export function parseSSE(buffer: string): { events: RagEvent[]; rest: string } {
  const events: RagEvent[] = [];
  const frames = buffer.split("\n\n");
  const rest = frames.pop() ?? ""; // last segment may be incomplete

  for (const frame of frames) {
    const dataLine = frame
      .split("\n")
      .find((l) => l.startsWith("data:"));
    if (!dataLine) continue;
    try {
      events.push(JSON.parse(dataLine.slice(5).trim()) as RagEvent);
    } catch {
      // ignore malformed frame
    }
  }
  return { events, rest };
}
