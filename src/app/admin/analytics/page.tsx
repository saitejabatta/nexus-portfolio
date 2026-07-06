"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  MessageSquare,
  MousePointerClick,
  Trash2,
} from "lucide-react";
import {
  clearLocalEvents,
  getLocalEvents,
  type AnalyticsEvent,
  type TrackedEvent,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

const LABELS: Record<AnalyticsEvent, string> = {
  query_asked: "Queries asked",
  suggestion_clicked: "Suggestions clicked",
  project_card_clicked: "Project cards clicked",
  repo_clicked: "Repos opened",
  resume_action: "Résumé actions",
  terminal_opened: "Terminal opened",
  constellation_opened: "Constellation opened",
  palette_opened: "Palette opened",
  conversation_cleared: "Chats cleared",
};

export default function AnalyticsPage() {
  const [events, setEvents] = useState<TrackedEvent[]>([]);

  // Deferred to an effect: localStorage is browser-only, so reading it during
  // render would produce a server/client hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount load, see comment above
    setEvents(getLocalEvents());
  }, []);

  const stats = useMemo(() => {
    const byType = new Map<string, number>();
    const questions = new Map<string, number>();
    for (const e of events) {
      byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
      if (e.type === "query_asked" && typeof e.payload?.query === "string") {
        const q = e.payload.query as string;
        questions.set(q, (questions.get(q) ?? 0) + 1);
      }
    }
    const topQuestions = [...questions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxType = Math.max(1, ...byType.values());
    return { byType, topQuestions, maxType, total: events.length };
  }, [events]);

  const reset = () => {
    clearLocalEvents();
    setEvents([]);
  };

  return (
    <main className="relative mx-auto min-h-dvh max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-cyan"
          >
            <ArrowLeft className="h-3 w-3" /> back to NEXUS
          </Link>
          <h1 className="font-display text-2xl font-semibold text-text">
            Analytics
          </h1>
          <p className="font-mono text-[11px] text-text-faint">
            privacy-first · local session view · admin auth lands in Phase 8
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-text-muted hover:border-danger/50 hover:text-danger"
        >
          <Trash2 className="h-3 w-3" /> reset
        </button>
      </div>

      {/* Top-line stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Activity} label="Total events" value={stats.total} />
        <Stat icon={MessageSquare} label="Queries" value={stats.byType.get("query_asked") ?? 0} />
        <Stat
          icon={MousePointerClick}
          label="Interactions"
          value={
            (stats.byType.get("suggestion_clicked") ?? 0) +
            (stats.byType.get("project_card_clicked") ?? 0) +
            (stats.byType.get("repo_clicked") ?? 0)
          }
        />
        <Stat
          icon={Activity}
          label="Features used"
          value={
            (stats.byType.get("terminal_opened") ?? 0) +
            (stats.byType.get("constellation_opened") ?? 0) +
            (stats.byType.get("palette_opened") ?? 0)
          }
        />
      </div>

      {stats.total === 0 ? (
        <div className="glass rounded-xl p-8 text-center font-mono text-sm text-text-muted">
          No events yet. Go ask NEXUS a few questions, then come back.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Event breakdown */}
          <section className="glass rounded-xl p-5">
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-faint">
              event breakdown
            </h2>
            <div className="space-y-2.5">
              {([...stats.byType.entries()] as [AnalyticsEvent, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-text-muted">
                      {LABELS[type] ?? type}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-cyan"
                        style={{
                          width: `${(count / stats.maxType) * 100}%`,
                          boxShadow: "var(--glow-cyan)",
                        }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-xs text-text">{count}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Top questions */}
          <section className="glass rounded-xl p-5">
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-faint">
              top questions
            </h2>
            {stats.topQuestions.length === 0 ? (
              <p className="text-xs text-text-faint">No queries yet.</p>
            ) : (
              <ol className="space-y-2">
                {stats.topQuestions.map(([q, n], i) => (
                  <li key={q} className="flex items-center gap-3 text-sm">
                    <span className={cn("font-mono text-xs", i === 0 ? "text-cyan" : "text-text-faint")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-text-muted">{q}</span>
                    <span className="font-mono text-xs text-text-faint">×{n}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <Icon className="h-4 w-4 text-cyan" />
      <div className="mt-2 font-display text-2xl font-semibold text-text">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
        {label}
      </div>
    </div>
  );
}
