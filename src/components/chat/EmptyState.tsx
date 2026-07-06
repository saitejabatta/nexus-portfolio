"use client";

import { motion } from "framer-motion";
import { Database, FileText, GitBranch, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { fadeRise, stagger } from "@/lib/design/motion";
import { useChat } from "@/lib/chat/ChatProvider";
import { getKnowledgeStats } from "@/lib/data/repository";
import { track } from "@/lib/analytics";
import { Composer } from "./Composer";

const stats = getKnowledgeStats();
const KB = [
  { icon: GitBranch, label: "Projects", value: `${stats.repositories} indexed`, tone: "text-cyan" },
  { icon: FileText, label: "Resume", value: "ready", tone: "text-blue" },
  { icon: Database, label: "Vector store", value: "pgvector", tone: "text-purple" },
  { icon: Sparkles, label: "Skills", value: `${stats.skills} nodes`, tone: "text-cyan" },
] as const;

const SUGGESTED = [
  "Who are you?",
  "Show AI projects",
  "Strongest skills?",
  "Tell me about your internships",
];

export function EmptyState() {
  const { send } = useChat();

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24">
      <motion.div
        variants={stagger(0.1, 0.12)}
        initial="hidden"
        animate="show"
        className="w-full max-w-2xl text-center"
      >
        <motion.p
          variants={fadeRise}
          className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan/80"
        >
          an AI portfolio you can talk to
        </motion.p>

        <motion.h1
          variants={fadeRise}
          className="font-display text-6xl font-bold leading-tight text-text text-glow-cyan sm:text-7xl"
        >
          NEXUS
        </motion.h1>

        <motion.p
          variants={fadeRise}
          className="mx-auto mt-4 max-w-md text-balance text-text-muted"
        >
          Ask anything. Watch the retrieval pipeline think — embeddings, vector
          search, and grounded generation, live.
        </motion.p>

        <motion.div
          variants={fadeRise}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {KB.map((item) => (
            <GlassPanel key={item.label} className="p-3 text-left">
              <item.icon className={cn("h-4 w-4", item.tone)} />
              <div className="mt-2 text-[11px] uppercase tracking-wider text-text-faint">
                {item.label}
              </div>
              <div className="font-mono text-xs text-text">{item.value}</div>
            </GlassPanel>
          ))}
        </motion.div>

        <motion.div
          variants={fadeRise}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {SUGGESTED.map((p) => (
            <button
              key={p}
              onClick={() => {
                track("suggestion_clicked", { prompt: p });
                send(p);
              }}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-cyan/50 hover:text-cyan hover:shadow-[var(--glow-cyan)]"
            >
              {p}
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeRise} className="mx-auto mt-5 max-w-xl">
          <Composer />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-text-faint">
            phase 2 · chat online · mock knowledge base
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
