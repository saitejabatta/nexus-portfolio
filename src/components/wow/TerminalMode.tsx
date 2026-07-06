"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getEnabledProjects, getPortfolio, getSkillsByCategory } from "@/lib/data/repository";

type Line = { kind: "in" | "out" | "sys"; text: string };

const BANNER = [
  "NEXUS terminal v1.0 — type 'help' for commands",
  "",
];

function runCommand(raw: string): { lines: string[]; action?: () => void } {
  const [cmd, ...rest] = raw.trim().split(/\s+/);
  const arg = rest.join(" ");
  const { profile } = getPortfolio();

  switch (cmd.toLowerCase()) {
    case "":
      return { lines: [] };
    case "help":
      return {
        lines: [
          "available commands:",
          "  whoami            who is Sai Teja",
          "  projects          list projects",
          "  skills            list skills by category",
          "  experience        work history",
          "  ask <question>    ask the AI directly",
          "  open <github|linkedin|resume>",
          "  clear             clear the screen",
          "  exit              close terminal",
        ],
      };
    case "whoami":
      return { lines: [`${profile.name} — ${profile.headline}`, profile.bio] };
    case "projects":
      return {
        lines: getEnabledProjects().map(
          (p) => `  ${p.slug.padEnd(22)} ${p.status.padEnd(12)} ${p.title}`,
        ),
      };
    case "skills":
      return {
        lines: Object.entries(getSkillsByCategory()).map(
          ([cat, s]) => `  ${cat.padEnd(14)} ${s.map((x) => x.name).join(", ")}`,
        ),
      };
    case "experience":
      return {
        lines: getPortfolio().experience.map((e) => `  ${e.role} @ ${e.org}`),
      };
    case "ask":
      if (!arg) return { lines: ["usage: ask <question>"] };
      return {
        lines: [`→ routing "${arg}" to the AI…`],
        action: () =>
          window.dispatchEvent(new CustomEvent("nexus:prompt", { detail: arg })),
      };
    case "open": {
      const map: Record<string, string | undefined> = {
        github: profile.socials.github,
        linkedin: profile.socials.linkedin,
        resume: undefined,
      };
      const target = map[arg.toLowerCase()];
      if (arg.toLowerCase() === "resume")
        return { lines: ["résumé download wires up once a PDF is uploaded (admin)."] };
      if (!target) return { lines: [`unknown target: ${arg || "(none)"}`] };
      return {
        lines: [`opening ${arg}…`],
        action: () => window.open(target, "_blank"),
      };
    }
    case "clear":
      return { lines: ["__CLEAR__"] };
    case "exit":
      return { lines: ["__EXIT__"] };
    default:
      return { lines: [`command not found: ${cmd} (try 'help')`] };
  }
}

export function TerminalMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Reset the screen when opened — adjusted during render (React's
  // documented pattern for reacting to a value change) rather than in an
  // effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setLines(BANNER.map((t) => ({ kind: "sys" as const, text: t })));
  }

  // Focusing the input is a genuine external-system side effect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const submit = () => {
    const raw = value;
    const { lines: out, action } = runCommand(raw);
    setHistory((h) => [...h, raw]);
    setHIdx(-1);
    setValue("");

    if (out[0] === "__CLEAR__") return setLines([]);
    if (out[0] === "__EXIT__") return onClose();

    setLines((prev) => [
      ...prev,
      { kind: "in", text: raw },
      ...out.map((t) => ({ kind: "out" as const, text: t })),
    ]);
    action?.();
    if (action && raw.startsWith("ask")) onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") return submit();
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1);
      if (history[idx] !== undefined) {
        setHIdx(idx);
        setValue(history[idx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = hIdx + 1;
      if (idx >= history.length) {
        setHIdx(-1);
        setValue("");
      } else {
        setHIdx(idx);
        setValue(history[idx]);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="scanline relative flex h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-cyan/25 bg-[#04060c]/95"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan/70" />
              <span className="ml-2 font-mono text-[11px] text-text-faint">
                nexus@portfolio — terminal
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.kind === "in"
                      ? "text-text"
                      : l.kind === "sys"
                        ? "text-cyan"
                        : "text-text-muted"
                  }
                >
                  {l.kind === "in" ? (
                    <span>
                      <span className="text-cyan">nexus@portfolio</span>
                      <span className="text-text-faint">:~$ </span>
                      {l.text}
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{l.text || " "}</span>
                  )}
                </div>
              ))}
              <div className="flex items-center">
                <span className="text-cyan">nexus@portfolio</span>
                <span className="text-text-faint">:~$ </span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKey}
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent text-text caret-cyan focus:outline-none"
                  aria-label="Terminal input"
                />
              </div>
              <div ref={endRef} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
