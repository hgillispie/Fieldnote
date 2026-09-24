import type { Metadata } from "next";
import { fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { DEMO_SEGMENTS, getDemoUserAttributes } from "@/lib/demo-targeting";
import { PersonaButtons } from "./PersonaButtons";
import { BUILDER_API_KEY } from "@/lib/builder-config";

// Excluded from search/sitemap — this is an internal demo tool, not a real
// page, and should never be indexed or linked from anywhere in the app.
export const metadata: Metadata = {
  title: "Demo switcher — Fieldnote",
  robots: { index: false, follow: false },
};

export default async function DemoSwitcherPage() {
  const active = await getDemoUserAttributes();
  const activeJson = JSON.stringify(active);
  const activeId = DEMO_SEGMENTS.find(
    (segment) => JSON.stringify(segment.attributes) === activeJson,
  )?.id;

  // ENTERPRISE PATTERN: TARGETING + CACHING, wired end-to-end
  //
  // This page already reads `cookies()` (via `getDemoUserAttributes`), so
  // it's already fully dynamic — there is no ISR cost to protect here, unlike
  // the homepage (see `src/app/page.tsx`'s caching comment block). That makes
  // this the one safe place in the app to demonstrate what a *targeted*
  // Builder fetch actually looks like: the same `userAttributes` object this
  // page already resolved for the "Active" badge above is passed straight
  // into `fetchOneEntry`, and Builder's own targeting engine resolves
  // whichever variation matches server-side — no client-side re-fetch, no
  // flash of untargeted content.
  const targetedContent = await fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "homepage",
    userAttributes: { urlPath: "/", ...active },
  }).catch(() => null);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">
        Internal tool
      </p>
      <h1 className="mt-2 font-display text-3xl">Demo switcher</h1>
      <p className="mt-2 text-slate">
        Set the targeting attributes for this browser, then reload the homepage
        as that segment. Not indexed, not linked from anywhere in the app.
      </p>

      <PersonaButtons segments={DEMO_SEGMENTS} activeId={activeId} />

      <div className="mt-10 rounded-lg border border-sand bg-surface-alt p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">
          userAttributes sent to Builder on this request
        </p>
        <code className="mt-2 block text-xs text-ink">
          {JSON.stringify({ urlPath: "/", ...active }, null, 2)}
        </code>
        <p className="mt-3 text-xs text-slate">
          {targetedContent
            ? "Builder resolved a homepage entry for these attributes."
            : "No published homepage entry resolved for these attributes (expected on a fresh space with only draft content)."}
        </p>
      </div>
    </main>
  );
}
