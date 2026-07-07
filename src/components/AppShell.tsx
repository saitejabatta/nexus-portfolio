"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { BootSequence } from "@/components/boot/BootSequence";
import { CommandPalette } from "@/components/command/CommandPalette";
import { StatusBar } from "@/components/ui/StatusBar";
import { SkillConstellation } from "@/components/wow/SkillConstellation";
import { TerminalMode } from "@/components/wow/TerminalMode";
import { ShareCard } from "@/components/wow/ShareCard";
import { track } from "@/lib/analytics";

// 3D background is client-only (no SSR) and lazy so it never blocks first paint.
const NeuralBackground = dynamic(
  () =>
    import("@/components/three/NeuralBackground").then(
      (m) => m.NeuralBackground,
    ),
  { ssr: false },
);

const BOOT_KEY = "nexus:booted";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(false);
  const [ready, setReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [constellationOpen, setConstellationOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Decide whether to run the boot sequence (once per browser session).
  // Deliberately deferred to an effect: sessionStorage is browser-only, so
  // reading it during render would produce a server/client hydration mismatch.
  useEffect(() => {
    const alreadyBooted = sessionStorage.getItem(BOOT_KEY) === "1";
    /* eslint-disable react-hooks/set-state-in-effect --
       one-time post-mount flag synced from a browser-only API; see comment above. */
    if (alreadyBooted) {
      setReady(true);
    } else {
      setBooting(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keyboard shortcuts: ⌘K palette, ` terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => {
          if (!o) track("palette_opened");
          return !o;
        });
      }
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (e.key === "`" && !typing) {
        e.preventDefault();
        setTerminalOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Open the wow overlays from the command palette.
  useEffect(() => {
    const openTerminal = () => {
      track("terminal_opened");
      setTerminalOpen(true);
    };
    const openConstellation = () => {
      track("constellation_opened");
      setConstellationOpen(true);
    };
    const openShare = () => {
      track("share_opened");
      setShareOpen(true);
    };
    window.addEventListener("nexus:open-terminal", openTerminal);
    window.addEventListener("nexus:open-constellation", openConstellation);
    window.addEventListener("nexus:open-share", openShare);
    return () => {
      window.removeEventListener("nexus:open-terminal", openTerminal);
      window.removeEventListener("nexus:open-constellation", openConstellation);
      window.removeEventListener("nexus:open-share", openShare);
    };
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem(BOOT_KEY, "1");
    setBooting(false);
    setReady(true);
  };

  return (
    <>
      <AnimatePresence>
        {booting && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      {/* Background stack (back → front): neural net, grid, readability scrim */}
      <NeuralBackground />
      <div className="pointer-events-none fixed inset-0 -z-10 nexus-grid opacity-30" />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 85% at 50% 40%, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.78) 55%, rgba(5,7,13,0.92) 100%)",
        }}
      />

      <StatusBar
        onOpenPalette={() => {
          track("palette_opened");
          setPaletteOpen(true);
        }}
      />

      <main
        id="nexus-main"
        className="relative z-10 transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
      >
        {children}
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <TerminalMode open={terminalOpen} onClose={() => setTerminalOpen(false)} />
      <SkillConstellation
        open={constellationOpen}
        onClose={() => setConstellationOpen(false)}
      />
      <ShareCard open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
