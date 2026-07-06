"use client";

import { motion } from "framer-motion";
import type { TimelineItem } from "@/lib/chat/types";

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative pl-5">
      {/* vertical rail */}
      <div className="absolute bottom-1 left-1 top-1 w-px bg-gradient-to-b from-cyan/50 via-line to-transparent" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <motion.div
            key={`${item.title}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="relative"
          >
            <span
              className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full bg-cyan"
              style={{ boxShadow: "var(--glow-cyan)" }}
            />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-sm font-semibold text-text">
                {item.title}
              </span>
              <span className="font-mono text-[11px] text-text-muted">
                · {item.subtitle}
              </span>
              {item.period && (
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-text-faint">
                  {item.period}
                </span>
              )}
            </div>
            {item.detail && (
              <p className="mt-0.5 text-xs text-text-muted">{item.detail}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
