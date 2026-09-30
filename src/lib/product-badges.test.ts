import { describe, expect, it } from "vitest";
import { firstBadge } from "./product-badges";

describe("firstBadge", () => {
  it("reads plain string badges, the shape live product entries use", () => {
    expect(firstBadge(["Best Seller", "New"])).toBe("Best Seller");
  });

  it("reads object-shaped badges", () => {
    expect(firstBadge([{ badge: "New" }])).toBe("New");
  });

  it("returns undefined for empty or missing badges", () => {
    expect(firstBadge([])).toBeUndefined();
    expect(firstBadge(undefined)).toBeUndefined();
    expect(firstBadge([""])).toBeUndefined();
  });
});
