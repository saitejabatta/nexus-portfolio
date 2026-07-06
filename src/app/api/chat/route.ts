import { orchestrate } from "@/lib/rag/orchestrator";
import { encodeSSE } from "@/lib/rag/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat  { query: string }
 * Streams Server-Sent Events: pipeline stages → retrieval → tokens → done.
 * Same contract online (Supabase + Gemini) and offline (seed-based).
 */
export async function POST(req: Request) {
  let query = "";
  try {
    const body = await req.json();
    query = String(body?.query ?? "").slice(0, 2000);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!query.trim()) {
    return new Response("Empty query", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrate(query)) {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeSSE({
              type: "error",
              message: err instanceof Error ? err.message : "stream error",
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
