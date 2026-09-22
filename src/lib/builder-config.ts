/**
 * Single source of truth for the Builder Public API key. Gen 2's
 * `@builder.io/sdk-react` takes `apiKey` per call rather than a global
 * `builder.init()` — centralizing it here is what stands in for that.
 * The old build called `builder.init()` in 13 separate places.
 */
export const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY ?? "";

if (!BUILDER_API_KEY && typeof window === "undefined") {
  console.warn(
    "NEXT_PUBLIC_BUILDER_API_KEY is not set — Builder content will not load."
  );
}
