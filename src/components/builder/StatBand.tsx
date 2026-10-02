"use client";

import { EditorEmptyState } from "./EditorEmptyState";
import { SectionShell } from "./SectionShell";

interface Stat {
  value?: string;
  label?: string;
}

interface StatBandProps {
  heading?: string;
  stats?: Stat[];
  attributes?: Record<string, unknown>;
}

// Keyed by item count so the row always fills evenly at desktop width.
const COLUMN_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function StatBand({ heading, stats, attributes }: StatBandProps) {
  const items = (stats ?? []).filter((stat) => stat?.value && stat.label).slice(0, 4);

  if (items.length === 0) {
    return <EditorEmptyState attributes={attributes} message="Add stats in the options panel." />;
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      {heading && (
        <h2 className="mb-8 text-sm font-medium uppercase tracking-wide opacity-75 md:mb-10">
          {heading}
        </h2>
      )}
      <dl className={`grid gap-x-8 gap-y-10 ${COLUMN_CLASSES[items.length]}`}>
        {items.map((stat, index) => (
          <div key={`${stat.label}-${index}`} className="border-t-2 border-accent pt-5">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="font-display text-3xl leading-none md:text-4xl">{stat.value}</dd>
            <dd className="mt-3 max-w-[16rem] text-sm leading-relaxed opacity-75">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}
