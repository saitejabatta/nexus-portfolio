"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Download,
  GitBranch,
  Link2,
  MessageSquare,
  QrCode,
  Search,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dialogPop, overlayFade } from "@/lib/design/motion";
import { getPortfolio } from "@/lib/data/repository";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Ask" | "Actions";
  run: () => void;
};

/** Fire a prompt into the chat experience (wired live in Phase 2). */
function emitPrompt(text: string) {
  window.dispatchEvent(new CustomEvent("nexus:prompt", { detail: text }));
}

const PROMPTS = [
  "Who are you?",
  "Show all your AI projects",
  "What are your strongest skills?",
  "Tell me about your internships",
  "Which project was the hardest?",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(
    () => [
      ...PROMPTS.map(
        (p, i): Command => ({
          id: `ask-${i}`,
          label: p,
          icon: i === 0 ? MessageSquare : Sparkles,
          group: "Ask",
          run: () => emitPrompt(p),
        }),
      ),
      {
        id: "github",
        label: "Open GitHub",
        hint: "external",
        icon: GitBranch,
        group: "Actions",
        run: () => window.open(getPortfolio().profile.socials.github, "_blank"),
      },
      {
        id: "linkedin",
        label: "Open LinkedIn",
        hint: "external",
        icon: Link2,
        group: "Actions",
        run: () => window.open(getPortfolio().profile.socials.linkedin, "_blank"),
      },
      {
        id: "resume",
        label: "Download résumé",
        hint: "pdf",
        icon: Download,
        group: "Actions",
        run: () => emitPrompt("Show your resume"),
      },
      {
        id: "constellation",
        label: "Open skill constellation",
        hint: "graph",
        icon: Sparkles,
        group: "Actions",
        run: () => window.dispatchEvent(new CustomEvent("nexus:open-constellation")),
      },
      {
        id: "terminal",
        label: "Open terminal mode",
        hint: "` key",
        icon: Terminal,
        group: "Actions",
        run: () => window.dispatchEvent(new CustomEvent("nexus:open-terminal")),
      },
      {
        id: "share",
        label: "Share NEXUS (QR code)",
        hint: "share",
        icon: QrCode,
        group: "Actions",
        run: () => window.dispatchEvent(new CustomEvent("nexus:open-share")),
      },
      {
        id: "analytics",
        label: "View analytics",
        hint: "admin",
        icon: BarChart3,
        group: "Actions",
        run: () => {
          window.location.href = "/admin/analytics";
        },
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Reset query/active when opened — adjusted during render (React's documented
  // pattern for "reset state when a value changes") rather than in an effect,
  // so it applies before the reopened dialog ever paints.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  // Focusing the input is a genuine external-system side effect, so it stays
  // in an effect — it just doesn't call setState.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Keep active index in range as the query changes (same render-phase pattern).
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActive(0);
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) {
        cmd.run();
        onClose();
      }
    }
  };

  const groups = ["Ask", "Actions"] as const;
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            variants={dialogPop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan/20 bg-bg-elevated/95 shadow-[0_8px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            onKeyDown={onKeyDown}
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything or run a command…"
                className="flex-1 bg-transparent font-mono text-sm text-text placeholder:text-text-faint focus:outline-none"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-faint">
                esc
              </kbd>
            </div>

            <div className="max-h-[44vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center font-mono text-sm text-text-faint">
                  no matching commands
                </p>
              )}
              {groups.map((group) => {
                const items = filtered.filter((c) => c.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-1">
                    <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-text-faint">
                      {group}
                    </p>
                    {items.map((cmd) => {
                      flatIndex += 1;
                      const isActive = flatIndex === active;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onMouseEnter={() => setActive(flatIndex)}
                          onClick={() => {
                            cmd.run();
                            onClose();
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            isActive
                              ? "bg-cyan/10 text-cyan"
                              : "text-text-muted hover:bg-white/5",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {cmd.hint && (
                            <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
                              {cmd.hint}
                            </span>
                          )}
                          {isActive && <ArrowRight className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
