"use client";

import type { ReactElement } from "react";

export type IconCardIcon = "compass" | "mountain" | "shield" | "truck" | "leaf" | "tag";

interface IconCardProps {
  icon?: IconCardIcon;
  title?: string;
  description?: string;
  attributes?: Record<string, unknown>;
}

// Inline SVGs, not files, so a freshly-dragged-in card always shows
// something real with zero external dependency (same icon set as
// FeatureCards, kept as its own small copy here since IconCard is a
// standalone atomic component, not a list/array-based one).
const ICONS: Record<IconCardIcon, ReactElement> = {
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-6 2 2-6 6-2z" />
    </svg>
  ),
  mountain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 19l6-10 4 6 2-3 6 7H3z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="12" height="9" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M11 3H4v7l10 10 7-7L11 3z" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function IconCard({
  icon = "compass",
  title = "Built for the trail",
  description = "A short description of this feature or benefit, ready to repeat inside a Columns or Box layout.",
  attributes,
}: IconCardProps) {
  return (
    <div
      {...attributes}
      className="flex flex-col gap-3 rounded-lg border border-sand bg-surface p-6 md:p-8"
    >
      <div className="h-10 w-10 text-accent">{ICONS[icon]}</div>
      <h3 className="font-display text-base text-ink">{title}</h3>
      <p className="text-sm text-slate">{description}</p>
    </div>
  );
}
