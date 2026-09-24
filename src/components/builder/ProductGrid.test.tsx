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

  it("still falls back when no products are configured", () => {
    const html = renderToStaticMarkup(<ProductGrid source="builder" products={[]} />);
    expect(html).toContain("Cascade 3L Shell");
  });
});
