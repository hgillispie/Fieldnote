import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductGrid } from "./ProductGrid";

const IMAGE_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F3a593c5220b04d469e25606e2987ebc0%2Fc3315582135048928ae156b3ee7b8b59";

// The exact shape the live `homepage` entry's ProductGrid `products` list
// arrives in: a Builder reference whose entry is nested under `value`.
const products = [
  {
    product: {
      "@type": "@builder.io/core:Reference",
      id: "06731601bffa45f4892c4b5ad13c726c",
      model: "product",
      value: {
        id: "06731601bffa45f4892c4b5ad13c726c",
        name: "Cascade 3L Shell",
        data: {
          name: "Cascade 3L Shell",
          price: 389,
          currency: "USD",
          slug: "cascade-3l-shell",
          images: [{ image: IMAGE_URL }],
        },
      },
    },
  },
];

// Recorded from the live `homepage` entry. Deliberately a product that is NOT
// in FALLBACK_PRODUCTS, so a fallback render can't pass these assertions.
const PARKA_IMAGE = "https://images.pexels.com/photos/4273239/pexels-photo-4273239.jpeg";

const liveParka = [
  {
    product: {
      "@type": "@builder.io/core:Reference",
      id: "e3c0d3947b9b4d779d0c7b4efea23d1c",
      model: "product",
      value: {
        id: "e3c0d3947b9b4d779d0c7b4efea23d1c",
        data: {
          name: "Ridgeline Down Parka",
          price: 549,
          currency: "USD",
          slug: "ridgeline-down-parka",
          images: [{ image: PARKA_IMAGE }],
          badges: ["Limited"],
        },
      },
    },
  },
];

const unresolved = [
  { product: { "@type": "@builder.io/core:Reference", id: "draft", model: "product" } },
];

describe("ProductGrid", () => {
  it("renders the referenced product's real image", () => {
    const html = renderToStaticMarkup(
      <ProductGrid source="builder" products={products} />,
    );
    expect(html).toContain(IMAGE_URL);
    expect(html).toContain("Cascade 3L Shell");
    expect(html).toContain("$389.00");
  });

  it("does not fall back to the placeholder when a reference resolves", () => {
    const html = renderToStaticMarkup(
      <ProductGrid source="builder" products={products} />,
    );
    expect(html).not.toContain("bg-gradient-to-br from-surface-alt to-sand");
  });

  it("renders a live non-fallback product with its image and string badge", () => {
    const html = renderToStaticMarkup(<ProductGrid source="builder" products={liveParka} />);
    expect(html).toContain("Ridgeline Down Parka");
    expect(html).toContain(PARKA_IMAGE);
    expect(html).toContain("/products/ridgeline-down-parka");
    expect(html).toContain(">Limited<");
    expect(html).not.toContain("Basin Merino Tee");
  });

  it("falls back when a reference arrives unresolved, e.g. a draft entry", () => {
    const html = renderToStaticMarkup(<ProductGrid source="builder" products={unresolved} />);
    expect(html).toContain("Basin Merino Tee");
  });

  it("still falls back when no products are configured", () => {
    const html = renderToStaticMarkup(<ProductGrid source="builder" products={[]} />);
    expect(html).toContain("Cascade 3L Shell");
  });
});
