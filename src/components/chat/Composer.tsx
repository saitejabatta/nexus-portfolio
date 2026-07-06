"use client";

import { useState } from "react";
import { Send, Terminal, Trash2 } from "lucide-react";
import { useChat } from "@/lib/chat/ChatProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function Composer({ showClear = false }: { showClear?: boolean }) {
  const { send, clear, isStreaming, hasStarted } = useChat();
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    send(value);
    setValue("");
  };

  return (
    <div className="w-full">
      <GlassPanel className="flex items-center gap-3 rounded-full px-5 py-3">
        <Terminal className="h-4 w-4 shrink-0 text-cyan" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={isStreaming ? "NEXUS is responding…" : "Ask me anything…"}
          disabled={isStreaming}
          className="flex-1 bg-transparent font-mono text-sm text-text placeholder:text-text-faint focus:outline-none disabled:opacity-60"
          aria-label="Chat input"
        />
        {showClear && hasStarted && (
          <button
            onClick={clear}
            aria-label="Clear chat"
            className="text-text-faint transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={submit}
          disabled={isStreaming || !value.trim()}
          aria-label="Send"
          className="text-cyan transition-transform hover:scale-110 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </GlassPanel>
    </div>
  );
}
