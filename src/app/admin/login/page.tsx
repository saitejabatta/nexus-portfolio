"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Lock, LogIn } from "lucide-react";
import { adminSignIn, useAdminAuth } from "@/lib/admin/useAdminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) router.replace("/admin");
  }, [loading, isAdmin, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminSignIn(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-cyan/20 bg-bg-elevated/80 p-6"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan">
            <Cpu className="h-5 w-5" />
          </div>
          <h1 className="font-display text-lg font-semibold text-text">
            NEXUS Admin
          </h1>
          <p className="font-mono text-[11px] text-text-faint">
            sign in to manage your portfolio
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            className="w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-danger">
            <Lock className="h-3 w-3" /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 font-mono text-sm text-cyan transition-colors hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          {submitting ? "signing in…" : "sign in"}
        </button>
      </form>
    </main>
  );
}
