"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronDown,
  FileText,
  Hash,
  Layers,
  ListFilter,
  type LucideIcon,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import type { PipelineRun, StageId } from "@/lib/chat/types";
import { STAGES } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { VectorSearch } from "./VectorSearch";
import { ConfidenceMeter } from "./ConfidenceMeter";

const ICONS: Record<StageId, LucideIcon> = {
  query: MessageSquare,
  embed: Hash,
  search: Search,
  chunks: Layers,
  rerank: ListFilter,
  sources: FileText,
  assemble: Boxes,
  generate: Sparkles,
};

const KIND_COLOR: Record<string, string> = {
  repo: "text-cyan",
  resume: "text-blue",
  project: "text-purple",
  skill: "text-amber",
};

export function RagPipeline({ pipeline }: { pipeline: PipelineRun }) {
  const { stages, retrieval, status } = pipeline;
  const running = status === "running";
  const [expanded, setExpanded] = useState(true);

  // Auto-collapse to the summary once the run finishes — adjusted during
  // render (React's documented pattern for reacting to a value change)
  // rather than in an effect.
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "done") setExpanded(false);
  }

  const stageStatus = (id: StageId) =>
    stages.find((s) => s.id === id)?.status ?? "pending";

  const searchReached = ["active", "done"].includes(stageStatus("search"));
  const chunksReached = ["active", "done"].includes(stageStatus("chunks"));
  const confidenceReady =
    stageStatus("assemble") === "done" || status === "done";

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-cyan/15 bg-bg-elevated/60 backdrop-blur-sm">
      {/* Header / summary bar */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          {running ? "RAG pipeline · running" : "RAG pipeline"}
        </span>

        {!running && (
          <span className="hidden font-mono text-[11px] text-text-faint sm:inline">
            {retrieval.hits.length} chunks · {retrieval.repos.length} repos · ~
            {retrieval.contextTokens} tok
          </span>
        )}

        <span className="ml-auto flex items-center gap-3">
          {confidenceReady && !running && (
            <span
              className="font-mono text-[11px]"
              style={{
                color:
                  retrieval.confidence >= 75
                    ? "var(--color-cyan)"
                    : retrieval.confidence >= 50
                      ? "var(--color-amber)"
                      : "var(--color-danger)",
              }}
            >
              {retrieval.confidence}%
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-faint transition-transform",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* Stage stepper (always visible) */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-3 pb-2">
        {STAGES.map((s, i) => {
          const st = stageStatus(s.id);
          const Icon = ICONS[s.id];
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={
                    st === "active"
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.8, repeat: st === "active" ? Infinity : 0 }}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
                    st === "done" && "border-cyan/40 bg-cyan/10 text-cyan",
                    st === "active" &&
                      "border-cyan bg-cyan/20 text-cyan shadow-[var(--glow-cyan)]",
                    st === "pending" && "border-line bg-white/[0.02] text-text-faint",
                  )}
                >
                  <Icon className="h-3 w-3" />
                </motion.div>
                <span
                  className={cn(
                    "hidden font-mono text-[10px] md:inline",
                    st === "pending" ? "text-text-faint" : "text-text-muted",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="mx-1 h-px w-3 overflow-hidden bg-white/5 md:w-4">
                  <motion.div
                    className="h-full bg-cyan"
                    initial={{ width: "0%" }}
                    animate={{ width: st === "done" ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expandable detail panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line"
          >
            <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              {/* Vector space */}
              <div className="flex flex-col items-center">
                <VectorSearch
                  active={searchReached}
                  candidates={retrieval.candidates}
                  hitCount={retrieval.hits.length}
                />
                <span className="font-mono text-[10px] text-text-faint">
                  {retrieval.candidates} candidates → {retrieval.hits.length} hits
                </span>
              </div>

              {/* Retrieved chunks */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
                  retrieved chunks
                </p>
                {retrieval.hits.map((h, i) => (
                  <motion.div
                    key={h.source}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{
                      opacity: chunksReached ? 1 : 0.2,
                      x: chunksReached ? 0 : -6,
                    }}
                    transition={{ delay: chunksReached ? i * 0.08 : 0 }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] uppercase",
                        KIND_COLOR[h.kind],
                      )}
                    >
                      {h.kind}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-muted">
                      {h.source}
                    </span>
                    <div className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-cyan"
                        initial={{ width: 0 }}
                        animate={{ width: chunksReached ? `${h.score * 100}%` : 0 }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-[10px] text-text-faint">
                      {h.score.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Confidence */}
              {confidenceReady && (
                <div className="flex justify-center sm:block">
                  <ConfidenceMeter value={retrieval.confidence} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
