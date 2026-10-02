import { describe, expect, it } from "vitest";
import { searchRecords } from "./SearchBox";

const helpArticles = [
  {
    key: "shipping-returns",
    title: "Shipping & Returns",
    body: "Free standard shipping over $75, and a 30-day return window.",
    href: "/help/shipping-returns",
  },
  {
    key: "tracking-your-order",
    title: "Tracking Your Order",
    body: "Where to find your tracking number.",
    href: "/help/tracking-your-order",
  },
  {
    key: "how-do-i-find-my-size",
    title: "How Do I Find My Size?",
    body: "Every product page has a size chart.",
    href: "/help/how-do-i-find-my-size",
  },
];

const products = [
  { key: "squall", title: "Squall Rain Jacket", meta: "Outerwear", href: "/products/squall-rain-jacket" },
  { key: "longhaul", title: "Longhaul 45L Pack", meta: "Packs & Bags", href: "/products/longhaul-45l-pack" },
];

describe("searchRecords", () => {
  it("matches natural help queries by word prefix", () => {
    expect(searchRecords("track my order", helpArticles)[0].key).toBe("tracking-your-order");
    expect(searchRecords("return policy", helpArticles)[0].key).toBe("shipping-returns");
    expect(searchRecords("sizing", helpArticles).map((r) => r.key)).toContain("how-do-i-find-my-size");
  });

  it("tolerates plurals and matches categories", () => {
    expect(searchRecords("jackets", products)[0].key).toBe("squall");
    expect(searchRecords("packs", products)[0].key).toBe("longhaul");
  });

  it("returns nothing for stopword-only or empty queries", () => {
    expect(searchRecords("", helpArticles)).toEqual([]);
    expect(searchRecords("how do i", helpArticles)).toEqual([]);
  });
});
