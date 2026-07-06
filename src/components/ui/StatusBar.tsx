"use client";

import { Cpu, Command } from "lucide-react";

type StatusBarProps = {
  onOpenPalette: () => void;
};

/** Fixed top bar: brand mark + system status + command-palette hint. */
export function StatusBar({ onOpenPalette }: StatusBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-cyan" />
        <span className="font-display text-sm font-semibold tracking-widest text-text">
          NEXUS
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-text-faint sm:inline">
          / sai teja
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-cyan" />
          online
        </span>
        <button
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
        >
          <Command className="h-3 w-3" />
          <span className="hidden sm:inline">K</span>
        </button>
      </div>
    </header>
  );
}
