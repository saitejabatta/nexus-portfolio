"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { track } from "@/lib/analytics";

export function BookingCard({ calLink }: { calLink: string }) {
  if (!calLink) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl border border-line bg-bg-elevated/70 px-4 py-3 font-mono text-xs text-text-faint"
      >
        <CalendarClock className="h-4 w-4 shrink-0" />
        Direct scheduling link coming soon — use the contact form above in the
        meantime.
      </motion.div>
    );
  }

  return (
    <motion.a
      href={calLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("booking_clicked")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 transition-colors hover:bg-cyan/20"
    >
      <CalendarClock className="h-5 w-5 shrink-0 text-cyan" />
      <div className="min-w-0">
        <div className="font-mono text-sm text-cyan">Book a call directly</div>
        <div className="truncate font-mono text-[11px] text-text-muted">
          {calLink.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </motion.a>
  );
}
