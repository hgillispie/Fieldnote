"use client";

import { useTransition } from "react";
import type { DemoSegment } from "@/lib/demo-targeting";

interface PersonaButtonsProps {
  segments: DemoSegment[];
  activeId: string | undefined;
}

/**
 * ENTERPRISE PATTERN: REAL CUSTOMER SEGMENT / TIER SIMULATION (the client half)
 *
 * Each button POSTs its persona's attributes to `/api/demo-session`, which
 * signs them into a cookie (see `src/lib/demo-session.ts`), then reloads the
 * page so the new cookie takes effect on the next request — through
 * `src/middleware.ts` and this page's own server-side read alike. A full
 * reload rather than client-side state is deliberate: it's the simplest way
 * to prove the *server* actually saw and trusted the new session, not just
 * that a button click updated some local React state.
 */
export function PersonaButtons({ segments, activeId }: PersonaButtonsProps) {
  const [isPending, startTransition] = useTransition();

  function selectSegment(segment: DemoSegment) {
    startTransition(async () => {
      await fetch("/api/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(segment.attributes),
      });
      window.location.reload();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {segments.map((segment) => (
        <button
          key={segment.id}
          type="button"
          disabled={isPending}
          onClick={() => selectSegment(segment)}
          className="flex w-full flex-col gap-1 rounded-lg border border-sand bg-surface p-4 text-left transition hover:border-primary disabled:opacity-60"
        >
          <span className="flex items-center justify-between font-display text-lg text-ink">
            {segment.label}
            {segment.id === activeId && (
              <span className="text-xs font-medium uppercase text-success">Active</span>
            )}
          </span>
          <span className="text-sm text-slate">{segment.description}</span>
          {Object.keys(segment.attributes).length > 0 && (
            <code className="mt-1 text-xs text-slate">{JSON.stringify(segment.attributes)}</code>
          )}
        </button>
      ))}
    </div>
  );
}
