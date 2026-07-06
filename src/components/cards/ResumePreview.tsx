"use client";

import { motion } from "framer-motion";
import { Check, Download, FileText } from "lucide-react";
import type { ResumeCard } from "@/lib/chat/types";

export function ResumePreview({ resume }: { resume: ResumeCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-cyan/20 bg-bg-elevated/70"
    >
      <div className="flex items-center gap-3 border-b border-line bg-cyan/[0.04] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold text-text">
            {resume.name}
          </div>
          <div className="font-mono text-[11px] text-text-muted">{resume.headline}</div>
        </div>
        <button
          disabled={!resume.downloadUrl}
          onClick={() => resume.downloadUrl && window.open(resume.downloadUrl, "_blank")}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-[11px] text-cyan transition-colors hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3 w-3" />
          {resume.downloadUrl ? "download" : "upload pending"}
        </button>
      </div>
      <ul className="space-y-1.5 px-4 py-3">
        {resume.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-sm text-text-muted">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
            {h}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
