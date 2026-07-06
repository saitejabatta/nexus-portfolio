"use client";

import { motion } from "framer-motion";
import { GitBranch, Star } from "lucide-react";
import type { RepoCard } from "@/lib/chat/types";

export function RepoPreview({ repo }: { repo: RepoCard }) {
  return (
    <motion.a
      href={repo.url || undefined}
      target={repo.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="block rounded-xl border border-line bg-bg-elevated/70 p-3.5 transition-colors hover:border-cyan/40"
    >
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-cyan" />
        <span className="font-mono text-sm text-text">{repo.name}</span>
        {typeof repo.stars === "number" && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-text-faint">
            <Star className="h-3 w-3" /> {repo.stars}
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-text-muted">{repo.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {repo.language && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
            <span className="h-2 w-2 rounded-full bg-cyan" />
            {repo.language}
          </span>
        )}
        {repo.topics.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[9px] text-text-faint"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.a>
  );
}
