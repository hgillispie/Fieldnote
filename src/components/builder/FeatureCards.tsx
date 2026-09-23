"use client";

import type { ReactElement } from "react";

type FeatureCardsColumns = "2" | "3" | "4";
type FeatureCardIcon = "compass" | "mountain" | "shield" | "truck" | "leaf" | "tag";

interface FeatureCard {
  icon?: FeatureCardIcon;
  image?: string;
  title: string;
  description: string;
  linkLabel?: string;
  linkHref?: string;
}

interface FeatureCardsProps {
  heading?: string;
  columns?: FeatureCardsColumns;
  cards?: FeatureCard[];
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const COLUMN_CLASSES: Record<FeatureCardsColumns, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// Inline SVGs, not files, so a freshly-dragged-in card always shows
// something real with zero external dependency.
const ICONS: Record<FeatureCardIcon, ReactElement> = {
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

// Real, non-lorem Fieldnote copy so the block never looks empty — used
// whenever the `cards` list input is unset or empty.
const FALLBACK_CARDS: FeatureCard[] = [
  {
    icon: "shield",
    title: "Lifetime repair guarantee",
    description:
      "Every Fieldnote piece is backed by free repairs for as long as you own it — rips, zippers, seams, all of it.",
  },
  {
    icon: "truck",
    title: "Free shipping over $75",
    description:
      "Standard shipping is free on orders over $75, with expedited options at checkout for trip-week orders.",
  },
  {
    icon: "mountain",
    title: "Field-tested, not lab-tested",
    description:
      "Every product spends a season with our guides on real trails before it ships to you.",
  },
  {
    icon: "leaf",
    title: "Recycled and repairable materials",
    description:
      "Recycled shells, responsibly sourced down, and parts designed to be replaced instead of thrown out.",
    linkLabel: "Our materials",
    linkHref: "/sustainability",
  },
];

export function FeatureCards({
  heading = "Why gear up with Fieldnote",
  columns = "3",
  cards,
  attributes,
}: FeatureCardsProps) {
  const items = cards && cards.length > 0 ? cards : FALLBACK_CARDS;

  return (
    <div {...attributes}>
      {heading && (
        <h2 className="mb-6 font-display text-2xl text-ink">{heading}</h2>
      )}
      <div className={`grid gap-6 ${COLUMN_CLASSES[columns]}`}>
        {items.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className="flex flex-col gap-3 rounded-lg border border-sand bg-surface p-6"
          >
            {card.image ? (
              <img
                src={card.image}
                alt=""
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <div className="h-10 w-10 text-accent">
                {ICONS[card.icon ?? "compass"]}
              </div>
            )}
            <h3 className="font-display text-base text-ink">{card.title}</h3>
            <p className="text-sm text-slate">{card.description}</p>
            {card.linkLabel && card.linkHref && (
              <a
                href={card.linkHref}
                className="mt-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {card.linkLabel}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
