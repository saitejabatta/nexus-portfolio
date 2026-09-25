import { requireAdmin } from "@/lib/admin/requireAdmin";
import { indexStats, rebuildIndex } from "@/lib/rag/indexer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 });

/** Index health for the admin Knowledge page. */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    return Response.json(await indexStats());
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** Rebuild the vector index from live content. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    return Response.json(await rebuildIndex());
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
