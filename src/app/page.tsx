import { fetchOneEntry } from "@builder.io/sdk-react";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { builderFetch } from "@/lib/builder-fetch";

// ENTERPRISE PATTERN: SERVER-SIDE RENDERING
//
// `HomePage` is a React Server Component (no "use client", no hooks) that
// fetches Builder content with an `await` directly in the component body —
// the Next.js App Router pattern for server data fetching. The actual
// Builder-content render (`RenderBuilderContent` → `<Content>`) is a Client
// Component boundary one level down (see that file's own comment block) —
// so this page does the expensive, SEO/Core-Web-Vitals-sensitive work
// (network fetch, HTML generation) on the server, and only the interactive
// leaf nodes (accordions, forms, carousels) ship as client JS. At enterprise
// scale, with dozens of content-heavy marketing pages competing for Lighthouse
// scores and crawl budget, this split is what keeps Time-to-First-Byte and
// Largest-Contentful-Paint low regardless of how many interactive components
// a page's editors drop in — the HTML for text/images/layout is already
// server-rendered before any client JS runs.
//
// ENTERPRISE PATTERN: CACHING (ISR vs. force-dynamic)
// `export const revalidate = 60` puts this route on Incremental Static
// Regeneration: Next.js serves a cached HTML response and revalidates it in
// the background at most once every 60 seconds, rather than re-rendering on
// every request (`force-dynamic`, banned everywhere in this app except the
// runtime error boundary — see AGENTS.md). Builder's own CDN/edge cache
// (`staleCacheSeconds`, default one day) already absorbs most of the load
// upstream of this; the Next.js `revalidate` window is a second, tighter
// bound specifically so a content edit shows up on the live site within a
// minute instead of up to a day later. At the traffic levels a real
// enterprise storefront sees (thousands of req/s on a homepage), skipping
// ISR in favor of `force-dynamic` would mean every single request pays a
// full Builder API round-trip — a very different cost and latency profile,
// and a very different blast radius if Builder's API has a slow moment.
//
// THE CACHING/TARGETING TENSION THIS ROUTE DELIBERATELY DOES NOT SOLVE
// This fetch's `userAttributes` is hardcoded to `{ urlPath: "/" }` — it does
// NOT forward the per-visitor targeting attributes that `src/middleware.ts`
// resolves from the signed session cookie on every request (customerTier,
// lifecycleStage, hasProAccount, market — see that file and
// `src/lib/demo-targeting.ts`). That's intentional, not an oversight: reading
// `cookies()` or `headers()` inside a Server Component forces that route into
// fully dynamic rendering (Next.js's own rule, not a Builder one), which
// would take this route off ISR entirely — trading a 60-second-stale cached
// homepage for a full server round-trip on every single request, for every
// visitor, personalized or not.
//
// The three real options an enterprise team weighs here (see
// `src/app/demo-switcher/page.tsx` for a worked example of the first one):
//   1. Confine personalized/dynamic rendering to routes that are already
//      dynamic for other reasons (e.g. a route that reads cookies anyway),
//      and keep high-traffic canonical routes like "/" on ISR, static and
//      anonymous. Personalization there happens client-side post-hydration
//      instead (fetch a personalized variant after the static shell loads).
//   2. Shrink `revalidate` and cache-bust (Next's `revalidateTag`/
//      `revalidatePath`, or Builder's own webhook-triggered purge) on the
//      specific attribute combinations that actually change content, rather
//      than making the whole route dynamic.
//   3. Move personalization to the edge: middleware or an edge function
//      rewrites the request to a per-segment cached variant
//      (`/?segment=vip`) before it hits the origin, so the CDN can still
//      cache each segment's response independently instead of caching
//      nothing at all.
// This route takes option 1's "keep it static" half; `/demo-switcher`
// demonstrates the personalized-fetch half safely, precisely because that
// route already pays the dynamic-rendering cost for its own reasons.
export const revalidate = 60;

export default async function HomePage() {
  // ENTERPRISE PATTERN: EXTERNAL DATA INTO COMPONENTS — the Builder-content
  // equivalent of the Shopify fallback in `/api/shopify-products/route.ts`.
  // Fails soft: a Builder CDN hiccup degrades to an empty render, never a
  // crashed page. Every data-bound fetch in this app follows this shape.
  const content = await fetchOneEntry({
    apiKey: BUILDER_API_KEY,
    model: "homepage",
    userAttributes: {
      urlPath: "/",
    },
    fetch: builderFetch,
  }).catch((error) => {
    console.error("Failed to fetch homepage content from Builder:", error);
    return null;
  });

  return (
    <main className="flex-1">
      <RenderBuilderContent content={content} model="homepage" />
    </main>
  );
}
