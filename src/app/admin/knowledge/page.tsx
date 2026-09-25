"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock, Database, Layers, RefreshCw } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import type { IndexReport, IndexStats } from "@/lib/rag/indexer";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  profile: "Profile",
  project: "Projects",
  skill: "Skill groups",
  experience: "Experience",
  repo_readme: "GitHub READMEs",
  resume: "Résumé",
};

export default function KnowledgePage() {
  const { session } = useAdminAuth();
  const token = session?.access_token;
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [report, setReport] = useState<IndexReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(
    async <T,>(method: "GET" | "POST"): Promise<T> => {
      const res = await fetch("/api/admin/knowledge", {
        method,
        headers: { authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      return body as T;
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    api<IndexStats>("GET")
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [api, token]);

  const rebuild = async () => {
    setBusy(true);
    setError(null);
    try {
      setReport(await api<IndexReport>("POST"));
      setStats(await api<IndexStats>("GET"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const empty = stats && stats.chunks === 0;

  return (
    <main className="relative mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">Knowledge index</h1>
          <p className="font-mono text-[11px] text-text-faint">
            what the chat retrieves from · rebuilt nightly, or on demand
          </p>
        </div>
        <button
          onClick={rebuild}
          disabled={busy || !token}
          className="flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-[11px] text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} />
          {busy ? "rebuilding…" : "Rebuild index"}
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-4 font-mono text-[12px] text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {empty && !report && (
        <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-[13px] text-amber-200">
          The index is empty, so the chat is answering from the offline fallback. Click{" "}
          <b>Rebuild index</b> to turn on real vector retrieval.
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat icon={Database} label="Documents" value={stats?.documents ?? "—"} />
        <Stat icon={Layers} label="Chunks" value={stats?.chunks ?? "—"} />
        <Stat
          icon={Clock}
          label="Last indexed"
          value={stats?.lastIndexedAt ? new Date(stats.lastIndexedAt).toLocaleString() : "never"}
          small
        />
      </div>

      {stats && Object.keys(stats.bySource).length > 0 && (
        <section className="glass mb-6 rounded-xl p-5">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-text-faint">
            Sources
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Object.entries(stats.bySource).map(([k, n]) => (
              <li key={k} className="flex justify-between font-mono text-[12px] text-text-muted">
                <span>{SOURCE_LABELS[k] ?? k}</span>
                <span className="text-cyan">{n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report && (
        <section className="glass rounded-xl p-5">
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-faint">
            Last rebuild
          </h2>
          <p className="font-mono text-[12px] text-text-muted">
            {report.documents} documents → {report.chunks} chunks · {report.model} ·{" "}
            {(report.ms / 1000).toFixed(1)}s
          </p>
          {report.skipped.length > 0 && (
            <ul className="mt-3 space-y-1">
              {report.skipped.map((s) => (
                <li key={s} className="font-mono text-[11px] text-amber-300/80">
                  skipped · {s}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  small?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <Icon className="h-4 w-4 text-cyan" />
      <div
        className={cn(
          "mt-2 font-display font-semibold text-text",
          small ? "text-[13px] leading-6" : "text-2xl",
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-faint">{label}</div>
    </div>
  );
}
