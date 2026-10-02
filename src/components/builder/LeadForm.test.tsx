import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadForm } from "./LeadForm";

describe("LeadForm", () => {
  it("renders the configured submit label", () => {
    const html = renderToStaticMarkup(<LeadForm heading="Ready to apply?" ctaLabel="Check my rate" />);
    expect(html).toContain("Check my rate");
    expect(html).not.toContain("Request trade pricing");
  });

  it("falls back to neutral copy, never another surface's", () => {
    const html = renderToStaticMarkup(<LeadForm />);
    expect(html).toContain(">Submit<");
    expect(html).not.toContain("Pro");
    expect(html).not.toContain("trade pricing");
    expect(html).not.toContain("<h2");
  });

  it("gives each Builder block unique, render-stable field ids", () => {
    const html = renderToStaticMarkup(
      <>
        <LeadForm ctaLabel="One" attributes={{ "builder-id": "builder-a" }} />
        <LeadForm ctaLabel="Two" attributes={{ "builder-id": "builder-b" }} />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
