"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, GitBranch, Layers } from "lucide-react";
import type { Project } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; cls: string }> = {
  production: { label: "Production", cls: "text-cyan border-cyan/40 bg-cyan/10" },
  wip: { label: "In progress", cls: "text-amber border-amber/40 bg-amber/10" },
  hackathon: { label: "Hackathon", cls: "text-purple border-purple/40 bg-purple/10" },
  archived: { label: "Archived", cls: "text-text-faint border-line bg-white/5" },
};

const CATEGORY: Record<string, string> = {
  ai: "AI",
  web: "Web",
  data: "Data",
  tooling: "Tooling",
};

export function ProjectCard({ project: p }: { project: Project }) {
  const status = STATUS[p.status] ?? STATUS.wip;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl border border-line bg-bg-elevated/70 p-4 transition-colors hover:border-cyan/40"
    >
      {/* glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 30px rgba(34,211,238,0.06)" }} />

      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan">
              {CATEGORY[p.category] ?? p.category}
            </span>
            <span className="flex items-center gap-1 text-text-faint">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-1 rounded-full",
                    i < p.complexity ? "bg-cyan" : "bg-white/10",
                  )}
                />
              ))}
            </span>
          </div>
          <h4 className="mt-1 font-display text-base font-semibold text-text">
            {p.title}
          </h4>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px]", status.cls)}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-text-muted">{p.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.techStack.slice(0, 6).map((t) => (
          <span
            key={t}
            className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-text-muted"
          >
            {t}
          </span>
        ))}
      </div>

      {(p.liveUrl || p.repoUrl) && (
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
          {p.liveUrl && (
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline"
            >
              <ArrowUpRight className="h-3 w-3" /> live demo
            </a>
          )}
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-[11px] text-text-muted hover:text-cyan"
            >
              <GitBranch className="h-3 w-3" /> source
            </a>
          )}
        </div>
      )}

      {!p.liveUrl && !p.repoUrl && (
        <div className="mt-3 flex items-center gap-1 border-t border-line pt-3 font-mono text-[10px] text-text-faint">
          <Layers className="h-3 w-3" /> links added via admin
        </div>
      )}
    </motion.div>
  );
}
