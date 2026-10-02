"use client";

import { EditorEmptyState } from "./EditorEmptyState";
import { SectionShell } from "./SectionShell";

interface PullQuoteProps {
  quote?: string;
  attribution?: string;
  role?: string;
  attributes?: Record<string, unknown>;
}

export function PullQuote({ quote, attribution, role, attributes }: PullQuoteProps) {
  if (!quote?.trim()) {
    return <EditorEmptyState attributes={attributes} message="Add a quote in the options panel." />;
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      <figure className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <svg viewBox="0 0 32 24" aria-hidden="true" className="h-6 w-8 fill-accent">
          <path d="M0 24V14C0 6.3 4.2 1.6 12.5 0l1.2 2.6C9.3 4 7 6.6 6.7 10.4H12V24H0zm18 0V14c0-7.7 4.2-12.4 12.5-14l1.2 2.6c-4.4 1.4-6.7 4-7 7.8H30V24H18z" />
        </svg>
        <blockquote className="font-display text-xl leading-snug md:text-2xl">
          {quote}
        </blockquote>
        {(attribution || role) && (
          <figcaption className="text-sm">
            {attribution && <span className="font-medium">{attribution}</span>}
            {attribution && role && <span className="opacity-60"> &middot; </span>}
            {role && <span className="opacity-75">{role}</span>}
          </figcaption>
        )}
      </figure>
    </SectionShell>
  );
}
