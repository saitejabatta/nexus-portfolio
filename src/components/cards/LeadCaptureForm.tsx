"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Mail, Send } from "lucide-react";
import { track } from "@/lib/analytics";

export function LeadCaptureForm({ query }: { query?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async () => {
    if (!name.trim() || !email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, query }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
      track("lead_captured");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan"
      >
        <Check className="h-4 w-4 shrink-0" />
        Thanks, {name.split(" ")[0]} — Sai Teja will reach out to {email} soon.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-cyan/20 bg-bg-elevated/70 p-4"
    >
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cyan">
        <Mail className="h-3.5 w-3.5" />
        let&apos;s connect
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          type="email"
          className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What are you hiring for / what would you like to discuss? (optional)"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint focus:border-cyan/50 focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between">
        {status === "error" && (
          <span className="font-mono text-[11px] text-danger">
            Something went wrong — try again?
          </span>
        )}
        <button
          onClick={submit}
          disabled={!name.trim() || !email.trim() || status === "sending"}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "sending" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {status === "sending" ? "sending…" : "send"}
        </button>
      </div>
    </motion.div>
  );
}
