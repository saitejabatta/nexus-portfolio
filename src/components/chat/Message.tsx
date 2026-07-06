"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Cpu, RefreshCw, User } from "lucide-react";
import type { Message as MessageType } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";
import { RagPipeline } from "@/components/rag/RagPipeline";
import { MessageComponents } from "@/components/cards/MessageComponents";
import { track } from "@/lib/analytics";

type Props = {
  message: MessageType;
  isLast: boolean;
  onRegenerate: () => void;
  onFollowup: (text: string) => void;
};

export function Message({ message, isLast, onRegenerate, onFollowup }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
          isUser
            ? "border-line bg-white/5 text-text-muted"
            : "border-cyan/30 bg-cyan/10 text-cyan",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
      </div>

      <div className={cn("min-w-0 max-w-[85%]", isUser && "text-right")}>
        {isUser ? (
          <div className="inline-block rounded-2xl rounded-tr-sm border border-line bg-white/[0.04] px-4 py-2.5 text-left font-mono text-sm text-text">
            {message.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm">
            {message.pipeline && <RagPipeline pipeline={message.pipeline} />}
            {message.content ? (
              <Markdown content={message.content} />
            ) : (
              !message.pipeline && <ThinkingDots />
            )}
            {message.streaming && message.content && (
              <span className="caret ml-0.5 inline-block text-cyan">▋</span>
            )}

            {message.components && message.components.length > 0 && (
              <MessageComponents components={message.components} />
            )}

            {/* Actions (only when finished streaming) */}
            {!message.streaming && message.content && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={copy}
                  className="flex items-center gap-1 font-mono text-[11px] text-text-faint transition-colors hover:text-cyan"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "copied" : "copy"}
                </button>
                {isLast && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 font-mono text-[11px] text-text-faint transition-colors hover:text-cyan"
                  >
                    <RefreshCw className="h-3 w-3" />
                    regenerate
                  </button>
                )}
              </div>
            )}

            {/* Follow-up suggestions */}
            {!message.streaming && message.followups && message.followups.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {message.followups.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      track("suggestion_clicked", { prompt: f, source: "followup" });
                      onFollowup(f);
                    }}
                    className="rounded-full border border-line px-3 py-1.5 text-left font-mono text-xs text-text-muted transition-all hover:border-cyan/50 hover:text-cyan hover:shadow-[var(--glow-cyan)]"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
