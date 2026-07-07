import { loadPortfolio } from "@/lib/data/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/portfolio — public read of the live portfolio data (Supabase or SEED). */
export async function GET() {
  const data = await loadPortfolio();
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
  });
}
