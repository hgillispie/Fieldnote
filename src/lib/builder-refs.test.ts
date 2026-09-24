import { describe, expect, it } from "vitest";
import { resolveReference } from "./builder-refs";

// Recorded verbatim from the live Builder Content API for the `homepage`
// entry's ProductGrid — the shape a `reference` input actually arrives in.
const LIVE_REFERENCE = {
  "@type": "@builder.io/core:Reference",
  id: "06731601bffa45f4892c4b5ad13c726c",
  model: "product",
  value: {
    id: "06731601bffa45f4892c4b5ad13c726c",
    name: "Cascade 3L Shell",
    data: {
      name: "Cascade 3L Shell",
      price: 389,
      slug: "cascade-3l-shell",
      images: [
        {
          image:
            "https://cdn.builder.io/api/v1/image/assets%2F3a593c5220b04d469e25606e2987ebc0%2Fc3315582135048928ae156b3ee7b8b59",
        },
      ],
    },
  },
};

interface ProductData {
  name?: string;
  images?: Array<{ image?: string }>;
}

describe("resolveReference", () => {
  it("reads fields from a resolved reference's nested value.data", () => {
    const data = resolveReference<ProductData>(LIVE_REFERENCE);
    expect(data?.name).toBe("Cascade 3L Shell");
    expect(data?.images?.[0]?.image).toContain("cdn.builder.io");
  });

  it("does not read the reference's own empty data field", () => {
    expect(LIVE_REFERENCE).not.toHaveProperty("data");
  });

  it("falls back to top-level data for directly-fetched entries", () => {
    const entry = { data: { name: "Traverse Mid GTX" } };
    expect(resolveReference<ProductData>(entry)?.name).toBe("Traverse Mid GTX");
  });

  it("returns undefined for an unresolved or missing reference", () => {
    expect(resolveReference(null)).toBeUndefined();
    expect(resolveReference(undefined)).toBeUndefined();
    expect(
      resolveReference({ "@type": "@builder.io/core:Reference", id: "x", model: "product" }),
    ).toBeUndefined();
  });
});
