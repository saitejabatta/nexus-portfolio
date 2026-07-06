"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { Message, PipelineRun, Retrieval, StageId, StageStatus } from "./types";
import { STAGES } from "./types";
import { parseSSE } from "@/lib/rag/events";
import { track } from "@/lib/analytics";

type ChatContextValue = {
  messages: Message[];
  isStreaming: boolean;
  hasStarted: boolean;
  send: (text: string) => void;
  regenerate: () => void;
  clear: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyRetrieval = (): Retrieval => ({
  embeddingDims: 768,
  candidates: 0,
  hits: [],
  repos: [],
  contextTokens: 0,
  confidence: 0,
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  /** Stream an answer for `query` into a fresh assistant message via /api/chat. */
  const runAnswer = useCallback(async (query: string) => {
    const id = uid();
    const pipeline: PipelineRun = {
      status: "running",
      retrieval: emptyRetrieval(),
      stages: STAGES.map((s) => ({ id: s.id, status: "pending" as StageStatus })),
    };

    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", content: "", streaming: true, pipeline, createdAt: Date.now() },
    ]);
    setIsStreaming(true);

    const patch = (fn: (m: Message) => Message) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));

    const setStage = (sid: StageId, status: StageStatus) =>
      patch((m) =>
        m.pipeline
          ? {
              ...m,
              pipeline: {
                ...m.pipeline,
                stages: m.pipeline.stages.map((s) =>
                  s.id === sid ? { ...s, status } : s,
                ),
              },
            }
          : m,
      );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSSE(buffer);
        buffer = rest;

        for (const ev of events) {
          switch (ev.type) {
            case "stage":
              setStage(ev.stage, ev.status);
              break;
            case "retrieval":
              patch((m) =>
                m.pipeline ? { ...m, pipeline: { ...m.pipeline, retrieval: ev.retrieval } } : m,
              );
              break;
            case "component":
              patch((m) => ({
                ...m,
                components: [...(m.components ?? []), ev.component],
              }));
              break;
            case "token":
              patch((m) => ({ ...m, content: m.content + ev.token }));
              break;
            case "followups":
              patch((m) => ({ ...m, followups: ev.followups }));
              break;
            case "done":
              patch((m) => ({
                ...m,
                streaming: false,
                pipeline: m.pipeline ? { ...m.pipeline, status: "done" } : m.pipeline,
              }));
              break;
            case "error":
              patch((m) => ({
                ...m,
                streaming: false,
                content:
                  m.content ||
                  `⚠️ ${ev.message}. The pipeline hit an error — try again.`,
                pipeline: m.pipeline ? { ...m.pipeline, status: "done" } : m.pipeline,
              }));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        patch((m) => ({
          ...m,
          streaming: false,
          content: m.content || "⚠️ Couldn't reach the RAG backend. Try again.",
          pipeline: m.pipeline ? { ...m.pipeline, status: "done" } : m.pipeline,
        }));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      lastQueryRef.current = trimmed;
      track("query_asked", { query: trimmed });
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: trimmed, createdAt: Date.now() },
      ]);
      void runAnswer(trimmed);
    },
    [isStreaming, runAnswer],
  );

  const regenerate = useCallback(() => {
    if (isStreaming || !lastQueryRef.current) return;
    setMessages((prev) => {
      const lastAssistant = [...prev].reverse().find((m) => m.role === "assistant");
      return lastAssistant ? prev.filter((m) => m.id !== lastAssistant.id) : prev;
    });
    void runAnswer(lastQueryRef.current);
  }, [isStreaming, runAnswer]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([]);
    lastQueryRef.current = "";
    track("conversation_cleared");
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isStreaming,
        hasStarted: messages.length > 0,
        send,
        regenerate,
        clear,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within <ChatProvider>");
  return ctx;
}
