"use client";

import { useEffect, useState } from "react";
import { EditorEmptyState } from "./EditorEmptyState";
import { SECTION_HEADING_CLASSES, SectionShell } from "./SectionShell";

type TestimonialsLayout = "grid" | "carousel";

interface Testimonial {
  quote: string;
  authorName: string;
  authorRole?: string;
  avatar?: string;
}

interface TestimonialsProps {
  heading?: string;
  layout?: TestimonialsLayout;
  testimonials?: Testimonial[];
  attributes?: Record<string, unknown>;
}

const AUTOPLAY_INTERVAL_MS = 6000;

export function Testimonials({
  heading,
  layout = "grid",
  testimonials,
  attributes,
}: TestimonialsProps) {
  const items = (testimonials ?? []).filter((item) => item?.quote && item.authorName);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentIndex = activeIndex % items.length;

  useEffect(() => {
    if (layout !== "carousel" || isPaused || items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [layout, isPaused, items.length]);

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  if (items.length === 0) {
    return <EditorEmptyState attributes={attributes} message="Add testimonials in the options panel." />;
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      {heading && <h2 className={SECTION_HEADING_CLASSES}>{heading}</h2>}

      {layout === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {items.map((item, index) => (
            <TestimonialCard key={`${item.authorName}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative"
        >
          <TestimonialCard item={items[currentIndex]} />

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
              className="rounded-full border border-sand p-2 text-ink hover:bg-surface-alt"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>

            <div className="flex gap-2">
              {items.map((item, index) => (
                <button
                  key={`${item.authorName}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === currentIndex}
                  className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-accent" : "bg-sand"}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next testimonial"
              className="rounded-full border border-sand p-2 text-ink hover:bg-surface-alt"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-5 rounded-lg border border-sand bg-surface p-6 md:p-8">
      <blockquote className="text-base leading-relaxed text-ink">&ldquo;{item.quote}&rdquo;</blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        {item.avatar ? (
          <img
            src={item.avatar}
            alt={item.authorName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-sm font-medium text-slate">
            {item.authorName.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-ink">{item.authorName}</p>
          {item.authorRole && <p className="text-xs text-slate">{item.authorRole}</p>}
        </div>
      </figcaption>
    </figure>
  );
}
