"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/lib/chat/ChatProvider";
import { EmptyState } from "./EmptyState";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatExperience() {
  const { hasStarted, send } = useChat();

  // Prompts dispatched from the command palette feed straight into the chat.
  useEffect(() => {
    const onPrompt = (e: Event) => send((e as CustomEvent<string>).detail);
    window.addEventListener("nexus:prompt", onPrompt);
    return () => window.removeEventListener("nexus:prompt", onPrompt);
  }, [send]);

  return (
    <AnimatePresence mode="wait">
      {!hasStarted ? (
        <motion.div key="empty" exit={{ opacity: 0 }}>
          <EmptyState />
        </motion.div>
      ) : (
        <motion.div
          key="thread"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-dvh flex-col"
        >
          {/* Scrollable conversation */}
          <div className="flex-1 overflow-y-auto pt-24">
            <MessageList />
          </div>

          {/* Sticky composer */}
          <div className="sticky bottom-0 border-t border-line bg-bg-base/70 px-4 py-4 backdrop-blur-md">
            <div className="mx-auto max-w-3xl">
              <Composer showClear />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
