"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type Props = { active: boolean; candidates: number; hitCount: number };

/** Animated vector-space view: candidate points converge; top-K hits glow. */
export function VectorSearch({ active, candidates, hitCount }: Props) {
  const points = useMemo(() => {
    const n = Math.min(Math.max(candidates, 16), 30);
    return Array.from({ length: n }, (_, i) => {
      const isHit = i < hitCount;
      const angle = (i / n) * Math.PI * 2 + (i % 3);
      // scattered start
      const sr = 30 + (i % 7) * 6;
      const start = { x: 60 + Math.cos(angle) * sr, y: 60 + Math.sin(angle) * sr * 0.7 };
      // converged target: hits pull in close, misses drift out + dim
      const tr = isHit ? 16 + (i % 3) * 6 : 48 + (i % 5) * 5;
      const target = { x: 60 + Math.cos(angle) * tr, y: 60 + Math.sin(angle) * tr * 0.7 };
      return { isHit, start, target, delay: i * 0.025 };
    });
  }, [candidates, hitCount]);

  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
      {/* hit connectors */}
      {points
        .filter((p) => p.isHit)
        .map((p, i) => (
          <motion.line
            key={`l-${i}`}
            x1="60"
            y1="60"
            x2={active ? p.target.x : p.start.x}
            y2={active ? p.target.y : p.start.y}
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="0.6"
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ delay: 0.3 + p.delay }}
          />
        ))}

      {/* candidate points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          r={p.isHit ? 2.6 : 1.4}
          initial={{ cx: p.start.x, cy: p.start.y, opacity: 0.5 }}
          animate={{
            cx: active ? p.target.x : p.start.x,
            cy: active ? p.target.y : p.start.y,
            opacity: active ? (p.isHit ? 1 : 0.25) : 0.5,
          }}
          transition={{ duration: 0.7, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          fill={p.isHit ? "var(--color-cyan)" : "var(--color-text-faint)"}
          style={p.isHit ? { filter: "drop-shadow(0 0 3px var(--color-cyan))" } : undefined}
        />
      ))}

      {/* query node */}
      <circle cx="60" cy="60" r="3.4" fill="var(--color-purple)" style={{ filter: "drop-shadow(0 0 5px var(--color-purple))" }} />
    </svg>
  );
}
