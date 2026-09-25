import { rebuildIndex } from "@/lib/rag/indexer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Nightly re-index (vercel.json → crons). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without the secret configured the
 * route stays closed rather than letting anyone burn the embedding quota.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const report = await rebuildIndex();
    console.log("[cron/reindex]", JSON.stringify(report));
    return Response.json(report);
  } catch (err) {
    console.error("[cron/reindex]", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
