export const runtime = "nodejs";

/**
 * POST /api/analytics — record one event.
 * Persists to Supabase `events` when configured; otherwise accepts and no-ops
 * (the client keeps a local copy regardless). Never blocks the UI.
 */
export async function POST(req: Request) {
  let body: { type?: string; payload?: unknown; ts?: number; visitor?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!body?.type) return new Response(null, { status: 204 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Not configured — accept silently.
    return new Response(null, { status: 204 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    await supabase.from("events").insert({
      type: body.type,
      payload: { ...(body.payload as object), visitor: body.visitor },
    });
  } catch {
    // swallow — analytics must never surface errors to the visitor
  }
  return new Response(null, { status: 204 });
}
