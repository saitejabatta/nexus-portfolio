"use client";

import { useEffect } from "react";

/**
 * Initializes PostHog (session replay + product analytics) only when
 * NEXT_PUBLIC_POSTHOG_KEY is configured. Free tier: 1M events/mo. No-ops
 * entirely otherwise — this sits alongside, not instead of, the built-in
 * privacy-first analytics (lib/analytics.ts).
 */
export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
