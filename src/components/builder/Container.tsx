"use client";

import type { ReactNode } from "react";
import {
  SECTION_GUTTER_CLASSES,
  SECTION_SPACING_CLASSES,
  SECTION_WIDTH_CLASSES,
  SectionBoundary,
  type SectionSpacing,
  type SectionWidth,
} from "./SectionShell";

type ContainerBackground = "surface" | "surfaceAlt" | "primary" | "sand";

export interface ContainerProps {
  width?: SectionWidth;
  padding?: SectionSpacing;
  background?: ContainerBackground;
  attributes?: Record<string, unknown>;
  children?: ReactNode;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const BACKGROUND_CLASSES: Record<ContainerBackground, string> = {
  surface: "bg-surface text-ink",
  surfaceAlt: "bg-surface-alt text-ink",
  primary: "bg-primary text-surface",
  sand: "bg-sand text-ink",
};

// Registered in src/builder-registry.ts as "Container".
export function Container({
  width = "default",
  padding = "md",
  background = "surface",
  attributes,
  children,
}: ContainerProps) {
  return (
    <section {...attributes} className={BACKGROUND_CLASSES[background]}>
      <div
        className={`mx-auto w-full ${SECTION_GUTTER_CLASSES} ${SECTION_WIDTH_CLASSES[width]} ${SECTION_SPACING_CLASSES[padding]}`}
      >
        <SectionBoundary>{children}</SectionBoundary>
      </div>
    </section>
  );
}
