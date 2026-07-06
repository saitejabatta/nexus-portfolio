"use client";

import { motion } from "framer-motion";

/** Small radial gauge — color shifts cyan(high) → amber(mid) → red(low). */
export function ConfidenceMeter({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;

  const color =
    value >= 75 ? "var(--color-cyan)" : value >= 50 ? "var(--color-amber)" : "var(--color-danger)";

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="leading-tight">
        <div className="font-mono text-sm font-semibold" style={{ color }}>
          {value}%
        </div>
        <div className="text-[9px] uppercase tracking-widest text-text-faint">
          confidence
        </div>
      </div>
    </div>
  );
}
