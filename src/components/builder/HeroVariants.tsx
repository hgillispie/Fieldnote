"use client";

import { Hero, type HeroProps } from "./Hero";

/**
 * Thin wrappers around `Hero` with `variant` hard-coded, so a content editor
 * dragging in "Text Hero" / "Image Hero" / "Split Hero" from the insert menu
 * never sees a variant dropdown - the choice is made by which component they
 * dragged in, not by a field. All three render through the exact same `Hero`
 * logic; only the fixed `variant` differs. Registered alongside the original
 * `Hero` (which keeps its `variant` input) in src/builder-registry.ts for
 * backward compatibility with existing content.
 */
type HeroVariantProps = Omit<HeroProps, "variant">;

export function TextHero(props: HeroVariantProps) {
  return <Hero {...props} variant="text" />;
}

export function ImageHero(props: HeroVariantProps) {
  return <Hero {...props} variant="image" />;
}

export function SplitHero(props: HeroVariantProps) {
  return <Hero {...props} variant="split" />;
}
