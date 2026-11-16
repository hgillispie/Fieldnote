import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroCarousel } from "./HeroCarousel";

const SLIDES = [
  { heading: "One", imageAlt: "a", ctaLabel: "Go", ctaHref: "/one" },
  { heading: "Two", imageAlt: "b", ctaLabel: "Learn more", ctaHref: "/card" },
  { heading: "Three", imageAlt: "c", ctaLabel: "Orphan label" },
];

describe("HeroCarousel", () => {
  it("renders every slide, with only the first as the h1", () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={SLIDES} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/<h2/g)).toHaveLength(2);
    expect(html).toContain('href="/card"');
  });

  it("renders no CTA when a slide only sets a label", () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={SLIDES} />);
    expect(html).not.toContain("Orphan label");
  });

  it("renders slide indicators and arrows for multiple slides", () => {
    const html = renderToStaticMarkup(<HeroCarousel slides={SLIDES} />);
    expect(html).toContain('aria-label="Next slide"');
    expect(html.match(/aria-label="Go to slide/g)).toHaveLength(3);
  });

  it("omits controls for a single slide and renders nothing when empty", () => {
    expect(renderToStaticMarkup(<HeroCarousel slides={SLIDES.slice(0, 1)} />)).not.toContain(
      "Next slide",
    );
    expect(renderToStaticMarkup(<HeroCarousel slides={[]} />)).toBe("");
  });
});
