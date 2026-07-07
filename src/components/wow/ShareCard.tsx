"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import { SITE_URL } from "@/lib/seo";
import { overlayFade } from "@/lib/design/motion";

export function ShareCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-cyan/20 bg-bg-elevated/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                share nexus
              </span>
              <button onClick={onClose} aria-label="Close" className="text-text-faint hover:text-cyan">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 p-6">
              <div className="rounded-xl border border-cyan/20 bg-white p-3">
                <QRCodeSVG
                  value={SITE_URL}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#05070d"
                  level="M"
                />
              </div>

              <p className="text-center font-mono text-xs text-text-muted">
                Scan to open this AI portfolio on your phone
              </p>

              <button
                onClick={copy}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "copied" : SITE_URL.replace(/^https?:\/\//, "")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
