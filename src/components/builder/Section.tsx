"use client";

import type { ReactNode } from "react";

type SectionWidth = "narrow" | "default" | "wide" | "full";
type SectionPadding = "none" | "sm" | "md" | "lg";
type SectionBackground = "surface" | "surfaceAlt" | "primary" | "sand";

interface SectionProps {
  width?: SectionWidth;
  padding?: SectionPadding;
  background?: SectionBackground;
  attributes?: Record<string, unknown>;
  children?: ReactNode;
}

// Static lookup maps only, per the no-interpolated-Tailwind-classes rule.
const WIDTH_CLASSES: Record<SectionWidth, string> = {
  narrow: "max-w-2xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

const PADDING_CLASSES: Record<SectionPadding, string> = {
  none: "py-0",
  sm: "py-6",
  md: "py-12",
  lg: "py-24",
};

const BACKGROUND_CLASSES: Record<SectionBackground, string> = {
  surface: "bg-surface text-ink",
  surfaceAlt: "bg-surface-alt text-ink",
  primary: "bg-primary text-surface",
  sand: "bg-sand text-ink",
};

export function Section({
  width = "default",
  padding = "md",
  background = "surface",
  attributes,
  children,
}: SectionProps) {
  return (
    <section {...attributes} className={BACKGROUND_CLASSES[background]}>
      <div
        className={`mx-auto w-full px-6 ${WIDTH_CLASSES[width]} ${PADDING_CLASSES[padding]}`}
      >
        {children}
      </div>
    </section>
  );
}
