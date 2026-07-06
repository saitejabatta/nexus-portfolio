"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/lib/chat/ChatProvider";
import { Message } from "./Message";

export function MessageList() {
  const { messages, send, regenerate } = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as tokens stream in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-6"
    >
      {messages.map((m, i) => (
        <Message
          key={m.id}
          message={m}
          isLast={i === messages.length - 1}
          onRegenerate={regenerate}
          onFollowup={send}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
