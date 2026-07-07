/**
 * Privacy-first analytics. No PII, no cookies, no third parties.
 * - Events are kept in a local ring buffer (localStorage) for the in-app
 *   dashboard, AND fire-and-forget POSTed to /api/analytics.
 * - Server persists to Supabase `events` when configured; otherwise no-ops.
 * An anonymous, rotating visitor id groups a session without identifying anyone.
 */

export type AnalyticsEvent =
  | "query_asked"
  | "suggestion_clicked"
  | "project_card_clicked"
  | "repo_clicked"
  | "resume_action"
  | "terminal_opened"
  | "constellation_opened"
  | "palette_opened"
  | "share_opened"
  | "lead_captured"
  | "booking_clicked"
  | "conversation_cleared";

export type TrackedEvent = {
  type: AnalyticsEvent;
  payload?: Record<string, unknown>;
  ts: number;
};

const LS_EVENTS = "nexus:events";
const LS_VISITOR = "nexus:visitor";
const MAX_EVENTS = 500;

function visitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(LS_VISITOR);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(LS_VISITOR, id);
  }
  return id;
}

export function track(type: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const event: TrackedEvent = { type, payload, ts: Date.now() };

  // 1. Local ring buffer (powers the in-app dashboard offline).
  try {
    const raw = localStorage.getItem(LS_EVENTS);
    const list: TrackedEvent[] = raw ? JSON.parse(raw) : [];
    list.push(event);
    if (list.length > MAX_EVENTS) list.splice(0, list.length - MAX_EVENTS);
    localStorage.setItem(LS_EVENTS, JSON.stringify(list));
  } catch {
    /* storage full / unavailable — ignore */
  }

  // 2. Fire-and-forget to the server (persists when Supabase is configured).
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, visitor: visitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* offline — local buffer still has it */
  }
}

export function getLocalEvents(): TrackedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_EVENTS) || "[]");
  } catch {
    return [];
  }
}

export function clearLocalEvents() {
  if (typeof window !== "undefined") localStorage.removeItem(LS_EVENTS);
}
