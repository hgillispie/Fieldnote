import { describe, expect, it } from "vitest";
import { BUILDER_API_KEY } from "./builder-config";

describe("builder-config", () => {
  it("reads the Builder public API key from the environment", () => {
    expect(typeof BUILDER_API_KEY).toBe("string");
  });
});
