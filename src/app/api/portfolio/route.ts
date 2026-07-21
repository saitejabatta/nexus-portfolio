import { loadPortfolio } from "@/lib/data/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/portfolio — public read of the live portfolio data (Supabase or SEED). */
export async function GET() {
  const data = await loadPortfolio();
  return Response.json(data, {
    // max-age=0 keeps browsers revalidating (admin edits show up on reload);
    // s-maxage lets the CDN absorb traffic for 30s.
    headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" },
  });
}
