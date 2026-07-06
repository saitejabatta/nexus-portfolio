"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getSkillsByCategory } from "@/lib/data/repository";
import { overlayFade } from "@/lib/design/motion";

const W = 760;
const H = 560;
const CX = W / 2;
const CY = H / 2;

const CAT_COLOR = ["#22d3ee", "#3b82f6", "#a855f7", "#f59e0b", "#22d3ee"];

type Node = {
  name: string;
  x: number;
  y: number;
  color: string;
  hubX: number;
  hubY: number;
  size: number;
};

/** Deterministic radial knowledge-graph: core → category hubs → skill nodes. */
function useLayout() {
  return useMemo(() => {
    const groups = Object.entries(getSkillsByCategory());
    const hubs: { cat: string; x: number; y: number; color: string }[] = [];
    const nodes: Node[] = [];

    const hubR = 150;
    groups.forEach(([cat, skills], gi) => {
      const a = (gi / groups.length) * Math.PI * 2 - Math.PI / 2;
      const hubX = CX + Math.cos(a) * hubR;
      const hubY = CY + Math.sin(a) * hubR;
      const color = CAT_COLOR[gi % CAT_COLOR.length];
      hubs.push({ cat, x: hubX, y: hubY, color });

      const spokeR = 78;
      skills.forEach((s, si) => {
        const spread = Math.PI * 1.1;
        const base = a - spread / 2;
        const sa =
          skills.length === 1 ? a : base + (si / (skills.length - 1)) * spread;
        nodes.push({
          name: s.name,
          x: hubX + Math.cos(sa) * spokeR,
          y: hubY + Math.sin(sa) * spokeR,
          color,
          hubX,
          hubY,
          size: 4 + (s.proficiency ?? 3),
        });
      });
    });

    return { hubs, nodes };
  }, []);
}

export function SkillConstellation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { hubs, nodes } = useLayout();

  const ask = (skill: string) => {
    window.dispatchEvent(
      new CustomEvent("nexus:prompt", { detail: `Tell me about ${skill}` }),
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan/20 bg-bg-elevated/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                skill constellation · click a node to explore
              </span>
              <button onClick={onClose} aria-label="Close" className="text-text-faint hover:text-cyan">
                <X className="h-4 w-4" />
              </button>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              {/* core → hubs */}
              {hubs.map((h) => (
                <line key={`ch-${h.cat}`} x1={CX} y1={CY} x2={h.x} y2={h.y}
                  stroke="rgba(34,211,238,0.18)" strokeWidth="1" />
              ))}
              {/* hub → skills */}
              {nodes.map((n) => (
                <line key={`hs-${n.name}`} x1={n.hubX} y1={n.hubY} x2={n.x} y2={n.y}
                  stroke={`${n.color}33`} strokeWidth="0.8" />
              ))}

              {/* core */}
              <circle cx={CX} cy={CY} r="9" fill="#a855f7"
                style={{ filter: "drop-shadow(0 0 8px #a855f7)" }} />
              <text x={CX} y={CY + 24} textAnchor="middle"
                className="fill-text-faint font-mono" style={{ fontSize: 9 }}>
                SKILLS
              </text>

              {/* hubs */}
              {hubs.map((h) => (
                <g key={`hub-${h.cat}`}>
                  <circle cx={h.x} cy={h.y} r="5" fill={h.color}
                    style={{ filter: `drop-shadow(0 0 5px ${h.color})` }} />
                  <text x={h.x} y={h.y - 12} textAnchor="middle"
                    className="fill-text-muted font-mono" style={{ fontSize: 9 }}>
                    {h.cat}
                  </text>
                </g>
              ))}

              {/* skill nodes */}
              {nodes.map((n, i) => (
                <g key={n.name} className="cursor-pointer"
                  onClick={() => ask(n.name)}>
                  <motion.circle
                    cx={n.x} cy={n.y} r={n.size} fill={n.color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1, opacity: 1,
                      cx: [n.x, n.x + Math.sin(i) * 3, n.x],
                      cy: [n.y, n.y + Math.cos(i) * 3, n.y],
                    }}
                    transition={{
                      scale: { delay: 0.2 + i * 0.02 },
                      cx: { duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" },
                      cy: { duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" },
                    }}
                    style={{ filter: `drop-shadow(0 0 4px ${n.color})` }}
                    className="transition-all hover:brightness-150"
                  />
                  <text x={n.x} y={n.y + n.size + 11} textAnchor="middle"
                    className="pointer-events-none fill-text-muted font-mono"
                    style={{ fontSize: 8.5 }}>
                    {n.name.length > 20 ? n.name.slice(0, 18) + "…" : n.name}
                  </text>
                </g>
              ))}
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
