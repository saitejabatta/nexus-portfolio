/**
 * Supabase browser client (singleton).
 *
 * Phase 0: the client is wired but the project may not have credentials yet.
 * It reads public env vars and lazily constructs the client so the app boots
 * cleanly even before Supabase is provisioned. Real queries land in Phase 4+.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Not provisioned yet — callers should handle a null client gracefully.
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

/** True once Supabase credentials are present in the environment. */
export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
