"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdminAuthState = {
  loading: boolean;
  session: Session | null;
  isAdmin: boolean;
};

/** True if a Supabase session's JWT carries the admin role claim (set by scripts/create-admin.mjs). */
function sessionIsAdmin(session: Session | null): boolean {
  if (!session) return false;
  const meta = session.user.app_metadata as Record<string, unknown> | undefined;
  return meta?.role === "admin";
}

/** Client-side auth state for the /admin dashboard. Redirects are the caller's job. */
export function useAdminAuth(): AdminAuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no Supabase configured, nothing to await
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, isAdmin: sessionIsAdmin(session) };
}

export async function adminSignIn(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function adminSignOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase?.auth.signOut();
}
