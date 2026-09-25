import { serviceClient } from "@/lib/rag/indexer";

/**
 * Server-side admin check for API routes. The browser sends its Supabase access
 * token as a Bearer header; we verify it with Supabase (not just decode it) and
 * require the same `app_metadata.role = 'admin'` claim that RLS's is_admin() uses.
 */
export async function requireAdmin(req: Request): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return false;
  return (data.user.app_metadata as Record<string, unknown>)?.role === "admin";
}
