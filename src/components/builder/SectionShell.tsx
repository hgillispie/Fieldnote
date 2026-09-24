"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The single vertical-rhythm scale for the site. Page-level blocks are
 * dropped straight onto a model's `blocks` list (the homepage does exactly
 * this — Hero, ProductGrid, FeatureCards, Testimonials are all top-level
 * siblings with no `Section` around them), so the spacing has to live in the
 * blocks themselves rather than only in `Section`.
 */
export type SectionWidth = "narrow" | "default" | "wide" | "full";
export type SectionSpacing = "none" | "sm" | "md" | "lg";

// Static lookup maps only, per the no-interpolated-Tailwind-classes rule.
export const SECTION_WIDTH_CLASSES: Record<SectionWidth, string> = {
  narrow: "max-w-2xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

export const SECTION_SPACING_CLASSES: Record<SectionSpacing, string> = {
  none: "py-0",
  sm: "py-8 md:py-10",
  md: "py-12 md:py-16 lg:py-20",
  lg: "py-16 md:py-24 lg:py-32",
};

export const SECTION_GUTTER_CLASSES = "px-4 sm:px-6 lg:px-8";

/** Shared heading treatment so every section's title sits on the same rhythm. */
export const SECTION_HEADING_CLASSES =
  "mb-8 font-display text-2xl text-ink md:mb-10 md:text-3xl";

const InsideSectionContext = createContext(false);

/** `Section` wraps its children in this so nested blocks drop their own container. */
export function SectionBoundary({ children }: { children: ReactNode }) {
  return (
    <InsideSectionContext.Provider value={true}>{children}</InsideSectionContext.Provider>
  );
}

interface SectionShellProps {
  width?: SectionWidth;
  spacing?: SectionSpacing;
  /** Extra classes for the inner container, not the outer band. */
  className?: string;
  attributes?: Record<string, unknown>;
  children: ReactNode;
}

export function SectionShell({
  width = "default",
  spacing = "md",
  className,
  attributes,
  children,
}: SectionShellProps) {
  // Inside a `Section`, that component already supplies the band, container
  // and padding — adding a second set here would double every gutter.
  const nested = useContext(InsideSectionContext);

  if (nested) {
    return (
      <div {...attributes} className={className}>
        {children}
      </div>
    );
  }

  const inner = [
    "mx-auto w-full",
    SECTION_WIDTH_CLASSES[width],
    SECTION_GUTTER_CLASSES,
    SECTION_SPACING_CLASSES[spacing],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section {...attributes}>
      <div className={inner}>{children}</div>
    </section>
  );
}
