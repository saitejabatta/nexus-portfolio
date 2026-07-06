"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { easeNexus } from "@/lib/design/motion";

type BootLine = { text: string; delay: number; accent?: boolean };

const LINES: BootLine[] = [
  { text: "NEXUS BIOS v1.0 — initializing", delay: 250 },
  { text: "› power-on self test ……………… ok", delay: 450 },
  { text: "› loading neural core ………………… ok", delay: 700 },
  { text: "› mounting knowledge base", delay: 950 },
  { text: "    • repositories ……………… linked", delay: 1150 },
  { text: "    • resume index ……………… linked", delay: 1350 },
  { text: "    • skill graph …………………… linked", delay: 1550 },
  { text: "› establishing RAG pipeline …… ok", delay: 1850 },
  { text: "› NEXUS online.", delay: 2150, accent: true },
];

const TOTAL = 2600;

type Props = { onComplete: () => void };

export function BootSequence({ onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onComplete();
  };

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      finish();
      return;
    }

    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleCount(i + 1), line.delay),
    );

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / TOTAL, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const end = setTimeout(finish, TOTAL + 350);

    // Skip on any key or click
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-base px-6"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: easeNexus } }}
    >
      <div className="pointer-events-none absolute inset-0 nexus-grid opacity-60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Glitch-in logo */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.6em", filter: "blur(6px)" }}
          animate={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: easeNexus }}
          className="mb-6 text-center font-display text-4xl font-bold text-cyan text-glow-cyan"
        >
          NEXUS
        </motion.h1>

        <div className="min-h-[200px] space-y-1 font-mono text-[13px] leading-relaxed">
          {LINES.slice(0, visibleCount).map((line) => (
            <motion.p
              key={line.text}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={line.accent ? "text-cyan" : "text-text-muted"}
            >
              {line.text}
              {line.accent && <span className="caret ml-1 text-cyan">▋</span>}
            </motion.p>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-cyan"
            style={{ width: `${progress * 100}%`, boxShadow: "var(--glow-cyan)" }}
          />
        </div>
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-text-faint">
          press any key to skip
        </p>
      </motion.div>
    </motion.div>
  );
}
