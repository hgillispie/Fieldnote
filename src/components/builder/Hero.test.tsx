import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Hero } from "./Hero";
import { TextHero } from "./HeroVariants";

describe("Hero", () => {
  it("renders no CTA when the entry never set one", () => {
    const html = renderToStaticMarkup(
      <Hero variant="text" eyebrow="Legal" heading="Terms of Service" subheading="Last updated January 2026" />,
    );
    expect(html).toContain("Terms of Service");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("Shop the collection");
  });

  it("renders no CTA when only one of label/link is set", () => {
    expect(renderToStaticMarkup(<Hero heading="Careers" ctaLabel="See roles" />)).not.toContain("<a");
    expect(renderToStaticMarkup(<Hero heading="Careers" ctaHref="/careers" />)).not.toContain("<a");
  });

  it("renders the CTA exactly as configured", () => {
    const html = renderToStaticMarkup(
      <Hero heading="Gear for the long way round" ctaLabel="Shop the collection" ctaHref="/shop" />,
    );
    expect(html).toContain('href="/shop"');
    expect(html).toContain("Shop the collection");
  });

  it("invents no heading or subheading copy", () => {
    const html = renderToStaticMarkup(<Hero variant="text" />);
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("Gear for the long way round");
    expect(html).not.toContain("Technical outerwear");
  });

  it("minimal variant is text-only even if an image is set", () => {
    const html = renderToStaticMarkup(
      <Hero variant="minimal" heading="Privacy Policy" heroImage="https://example.com/x.jpg" />,
    );
    expect(html).toContain("Privacy Policy");
    expect(html).not.toContain("<img");
  });

  it("fixed-variant wrappers share the same no-default behavior", () => {
    const html = renderToStaticMarkup(<TextHero heading="Help Center" />);
    expect(html).not.toContain("<a");
  });
});
