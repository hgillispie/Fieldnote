import type { Metadata } from "next";
import { DEMO_SEGMENTS, getDemoUserAttributes } from "@/lib/demo-targeting";
import { setDemoSegment } from "./actions";

export const metadata: Metadata = {
  title: "Demo switcher — Fieldnote",
  robots: { index: false, follow: false },
};

export default async function DemoSwitcherPage() {
  const active = await getDemoUserAttributes();
  const activeJson = JSON.stringify(active);
  const activeId = DEMO_SEGMENTS.find(
    (segment) => JSON.stringify(segment.attributes) === activeJson
  )?.id;

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

      <div className="mt-8 flex flex-col gap-3">
        {DEMO_SEGMENTS.map((segment) => (
          <form key={segment.id} action={setDemoSegment}>
            <input type="hidden" name="segmentId" value={segment.id} />
            <button
              type="submit"
              className="flex w-full flex-col gap-1 rounded-lg border border-sand bg-surface p-4 text-left transition hover:border-primary"
            >
              <span className="flex items-center justify-between font-display text-lg text-ink">
                {segment.label}
                {segment.id === activeId && (
                  <span className="text-xs font-medium uppercase text-success">
                    Active
                  </span>
                )}
              </span>
              <span className="text-sm text-slate">{segment.description}</span>
              {Object.keys(segment.attributes).length > 0 && (
                <code className="mt-1 text-xs text-slate">
                  {JSON.stringify(segment.attributes)}
                </code>
              )}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
