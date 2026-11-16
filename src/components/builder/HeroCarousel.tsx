"use client";

import { useCallback, useEffect, useState } from "react";
import { isEditing } from "@builder.io/sdk-react";
import { SectionShell } from "./SectionShell";

export type HeroCarouselContentPosition = "center" | "left" | "right";

export interface HeroCarouselSlide {
  contentPosition?: HeroCarouselContentPosition;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
  imageAlt?: string;
}

export interface HeroCarouselProps {
  slides?: HeroCarouselSlide[];
  autoplay?: boolean;
  intervalSeconds?: number;
  attributes?: Record<string, unknown>;
}

const DEFAULT_INTERVAL_SECONDS = 6;

// Side positions keep the copy off the middle of the photo and swap the flat
// scrim for a gradient, so the subject (e.g. the card) stays bright. On small
// screens the copy drops to the bottom with a bottom-up gradient instead.
const SLIDE_ALIGN_CLASSES: Record<HeroCarouselContentPosition, string> = {
  center: "items-center justify-center",
  left: "items-end justify-center md:items-center md:justify-start",
  right: "items-end justify-center md:items-center md:justify-end",
};

const SLIDE_HEIGHT_CLASSES: Record<HeroCarouselContentPosition, string> = {
  center: "min-h-[480px] md:min-h-[560px]",
  left: "min-h-[560px]",
  right: "min-h-[560px]",
};

const SLIDE_OVERLAY_CLASSES: Record<HeroCarouselContentPosition, string> = {
  center: "bg-ink/45",
  left: "bg-gradient-to-t from-ink/85 via-ink/25 to-transparent md:bg-gradient-to-r md:from-ink/80 md:via-ink/30 md:to-transparent",
  right: "bg-gradient-to-t from-ink/85 via-ink/25 to-transparent md:bg-gradient-to-l md:from-ink/80 md:via-ink/30 md:to-transparent",
};

const SLIDE_COPY_CLASSES: Record<HeroCarouselContentPosition, string> = {
  center: "max-w-2xl items-center text-center",
  left: "max-w-2xl items-center text-center md:max-w-md md:items-start md:px-14 md:text-left",
  right: "max-w-2xl items-center text-center md:max-w-md md:items-start md:px-14 md:text-left",
};

const SLIDE_VISIBILITY_CLASSES = {
  active: "opacity-100",
  inactive: "pointer-events-none opacity-0",
} as const;

const SLIDE_IMAGE_CLASSES = {
  active: "scale-100",
  inactive: "scale-110",
} as const;

const DOT_CLASSES = {
  active: "h-2 w-7 bg-surface",
  inactive: "h-2 w-2 bg-surface/50 hover:bg-surface/80",
} as const;

const CONTROL_BUTTON_CLASSES =
  "flex h-10 w-10 items-center justify-center rounded-full bg-ink/40 text-surface transition hover:bg-ink/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface";

export function HeroCarousel({
  slides = [],
  autoplay = true,
  intervalSeconds = DEFAULT_INTERVAL_SECONDS,
  attributes,
}: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);

  const count = slides.length;
  const playing = autoplay && motionAllowed && !interacting && !userPaused && count > 1;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches && !isEditing());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const delay = Math.max(2, intervalSeconds) * 1000;
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), delay);
    return () => window.clearInterval(id);
  }, [playing, intervalSeconds, count, active]);

  const go = useCallback(
    (index: number) => setActive(((index % count) + count) % count),
    [count],
  );

  if (count === 0) return null;

  const current = Math.min(active, count - 1);

  return (
    <SectionShell attributes={attributes} spacing="md">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured"
        className="relative isolate overflow-hidden rounded-lg text-surface"
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocus={() => setInteracting(true)}
        onBlur={() => setInteracting(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(current - 1);
          if (event.key === "ArrowRight") go(current + 1);
        }}
      >
        <div className="grid" aria-live={playing ? "off" : "polite"}>
          {slides.map((slide, index) => {
            const isActive = index === current;
            const showCta = Boolean(slide.ctaLabel?.trim() && slide.ctaHref?.trim());
            const Heading = index === 0 ? "h1" : "h2";
            const position = slide.contentPosition ?? "center";

            return (
              <div
                key={index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                aria-hidden={!isActive}
                inert={!isActive}
                className={`relative col-start-1 row-start-1 flex transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
                  SLIDE_HEIGHT_CLASSES[position]
                } ${SLIDE_ALIGN_CLASSES[position]} ${
                  isActive ? SLIDE_VISIBILITY_CLASSES.active : SLIDE_VISIBILITY_CLASSES.inactive
                }`}
              >
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.imageAlt ?? ""}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transition-none ${
                      isActive ? SLIDE_IMAGE_CLASSES.active : SLIDE_IMAGE_CLASSES.inactive
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ink to-primary" />
                )}
                <div className={`absolute inset-0 ${SLIDE_OVERLAY_CLASSES[position]}`} />

                <div
                  className={`relative z-10 flex flex-col gap-5 px-6 py-16 transition-all duration-700 ease-out motion-reduce:transition-none md:gap-6 ${
                    SLIDE_COPY_CLASSES[position]
                  } ${isActive ? "translate-y-0" : "translate-y-3"}`}
                >
                  {slide.eyebrow && (
                    <span className="text-sm font-medium uppercase tracking-wide text-accent">
                      {slide.eyebrow}
                    </span>
                  )}
                  {slide.heading && (
                    <Heading className="font-display text-3xl leading-tight md:text-4xl">
                      {slide.heading}
                    </Heading>
                  )}
                  {slide.subheading && (
                    <p className="text-lg text-surface/90">{slide.subheading}</p>
                  )}
                  {showCta && (
                    <a
                      href={slide.ctaHref}
                      className="mt-2 inline-flex items-center rounded-md bg-accent px-7 py-3.5 text-sm font-medium text-surface transition hover:opacity-90"
                    >
                      {slide.ctaLabel}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(current - 1)}
              className={`absolute left-3 top-1/2 z-20 -translate-y-1/2 ${CONTROL_BUTTON_CLASSES}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(current + 1)}
              className={`absolute right-3 top-1/2 z-20 -translate-y-1/2 ${CONTROL_BUTTON_CLASSES}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-3">
              {autoplay && motionAllowed && (
                <button
                  type="button"
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  onClick={() => setUserPaused((p) => !p)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/40 text-surface transition hover:bg-ink/60"
                >
                  {userPaused ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M7 4l13 8-13 8V4z" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}${slide.heading ? `: ${slide.heading}` : ""}`}
                    aria-current={index === current}
                    onClick={() => go(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === current ? DOT_CLASSES.active : DOT_CLASSES.inactive
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SectionShell>
  );
}
