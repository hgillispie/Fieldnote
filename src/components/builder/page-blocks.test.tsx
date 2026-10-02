import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Accordion } from "./Accordion";
import { CategoryTiles } from "./CategoryTiles";
import { FeatureCards } from "./FeatureCards";
import { PolicyDocument } from "./PolicyDocument";
import { RichText } from "./RichText";
import { StoreList } from "./StoreList";
import { Testimonials } from "./Testimonials";

describe("empty content renders nothing on the live site", () => {
  it.each([
    ["FeatureCards", <FeatureCards key="f" cards={[]} />],
    ["Testimonials", <Testimonials key="t" testimonials={[]} />],
    ["Accordion", <Accordion key="a" items={[]} />],
    ["RichText", <RichText key="r" content="" />],
    ["CategoryTiles", <CategoryTiles key="c" tiles={[]} />],
    ["StoreList", <StoreList key="s" stores={[]} />],
    ["PolicyDocument", <PolicyDocument key="p" sections={[]} />],
  ])("%s", (_name, element) => {
    expect(renderToStaticMarkup(element)).toBe("");
  });
});

describe("PolicyDocument", () => {
  const sections = [
    { heading: "Use of this site", body: "<p>Lawful use only.</p>" },
    { heading: "Orders and pricing", body: "<p>Prices in USD.</p><script>alert(1)</script>" },
    { heading: "Returns", body: '<p>See <a href="/help/shipping-returns">Shipping &amp; Returns</a>.</p>' },
  ];

  it("builds an anchored table of contents", () => {
    const html = renderToStaticMarkup(<PolicyDocument sections={sections} />);
    expect(html).toContain('href="#section-use-of-this-site"');
    expect(html).toContain('id="section-orders-and-pricing"');
    expect(html).toContain("On this page");
  });

  it("sanitizes section HTML", () => {
    const html = renderToStaticMarkup(<PolicyDocument sections={sections} />);
    expect(html).not.toContain("<script");
    expect(html).toContain('href="/help/shipping-returns"');
  });

  it("skips the table of contents for short documents", () => {
    const html = renderToStaticMarkup(<PolicyDocument sections={sections.slice(0, 2)} />);
    expect(html).not.toContain("On this page");
  });
});

describe("StoreList", () => {
  it("renders real directions and call links grouped by region", () => {
    const html = renderToStaticMarkup(
      <StoreList
        stores={[
          { name: "Fieldnote Portland", region: "Pacific Northwest", address: "1420 NW Everett St", city: "Portland, OR", phone: "(503) 555-0142", flagship: true },
          { name: "Fieldnote London", region: "Europe", address: "42 Carnaby St", city: "London" },
        ]}
      />,
    );
    expect(html).toContain("Pacific Northwest");
    expect(html).toContain("Europe");
    expect(html).toContain('href="tel:5035550142"');
    expect(html).toContain("https://www.google.com/maps/search/?api=1&amp;query=Fieldnote%20Portland");
    expect(html).toContain("Flagship");
  });
});
