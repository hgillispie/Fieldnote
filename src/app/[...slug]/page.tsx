import { notFound } from "next/navigation";
import { fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import {
  resolveLocaleFromFirstSegment,
  resolveRequestedLocale,
} from "@/lib/locale";

/**
 * ENTERPRISE PATTERN: MULTIPLE PAGE MODEL TYPES
 *
 * This is the catch-all route for every URL that isn't handled by a more
 * specific route file. Next.js App Router always prefers a more specific
 * route over a catch-all, so this file only ever runs for paths that don't
 * match `src/app/page.tsx` ("/"), `src/app/help/[slug]/page.tsx`, or
 * `src/app/demo-switcher/page.tsx`.
 *
 * FULL ROUTING TABLE FOR THIS APP
 *
 *   Path                          Handler                          Model(s)
 *   ---------------------------   ------------------------------   -----------------
 *   /                             src/app/page.tsx                 homepage (singleton, ISR)
 *   /demo-switcher                src/app/demo-switcher/page.tsx    n/a (internal tool)
 *   /help/:slug                   src/app/help/[slug]/page.tsx      article (surface="help"),
 *                                                                   strangler-fig'd against
 *                                                                   a mock Contentful client
 *                                                                   — see that file
 *   /:locale?/*                   src/app/[...slug]/page.tsx (here) landing-page, then page
 *
 * WHY landing-page AND page ARE SEPARATE MODELS INSTEAD OF ONE GENERIC "page"
 * A single catch-all "page" model, with every field optional, is the fastest
 * thing to ship and the worst thing to govern once more than one team is
 * publishing through it. Splitting by intent buys three things a generic
 * model can't:
 *
 *   1. Different REQUIRED fields. `landing-page` requires a campaign end
 *      date and a `campaignCode` — Builder's content-required-field
 *      validation can enforce "a campaign page cannot publish without an
 *      end date" at the schema level. A generic `page` model has no such
 *      concept and would need custom validation code (or, more likely,
 *      would just let campaign pages go live with no expiry, which is
 *      exactly the kind of stale-forever landing page real orgs accumulate
 *      hundreds of).
 *   2. Different GOVERNANCE rules. A regulated org can attach a "Legal
 *      Review required before publish" workflow rule to `landing-page`
 *      (marketing campaigns often need compliance sign-off) without
 *      forcing every generic informational page through the same review
 *      gate — or the reverse, gate `page` (which might include long-lived
 *      policy/help content) more strictly than fast-moving campaign pages.
 *      One model can't have two different governance policies attached to
 *      two different "kinds" of its own entries.
 *   3. Different CACHING needs. A campaign landing page tied to a paid
 *      traffic spike is a much better candidate for a short `revalidate`
 *      window (or a cache purge webhook on publish) than a policy page that
 *      changes twice a year — see the caching pattern block in
 *      `src/app/page.tsx`. Modeling them separately means a future
 *      per-model caching policy is a one-line change to this file's model
 *      resolution order, not a runtime `if (isCampaign)` branch threaded
 *      through a single generic page's render path.
 *
 * `article` (help/blog/pro surfaces) is split out further still, into its
 * own route, specifically because it layers a *third* concern — the
 * Contentful/Builder migration flag — on top of routing. See
 * `src/app/help/[slug]/page.tsx`.
 *
 * RESOLUTION ORDER
 * `landing-page` is checked first, `page` second. Campaign pages are time-
 * boxed and typically override a generic page at the same path during a
 * promotion window (e.g. a seasonal `/sale` landing page temporarily
 * replacing an evergreen `/sale` info page) — checking the more specific,
 * shorter-lived model first is what makes that override behavior work
 * without either model needing to know the other exists.
 */

// ENTERPRISE PATTERN: LOCALIZATION
//
// Locale resolution (URL-prefix allowlist + the requested -> group-default ->
// space-default fallback chain) lives in `src/lib/locale.ts`, shared with
// `src/app/page.tsx`, so both routes fall back identically — see that file
// for the full fallback-chain explanation.
//
// `?locale=` ALWAYS WINS OVER THE URL PREFIX
// `resolveRequestedLocale` below checks the query param first — this is the
// live-demo override: `/help/returns?locale=ar-AE` switches locale via the
// query string even though `/help/returns` has no `/ar-AE/` prefix segment.

// Reading `searchParams` (for the `?locale=` override) carries the same
// dynamic-rendering cost as the homepage's own locale override — see that
// file's comment block. Applied uniformly across every page/landing-page URL
// this route resolves rather than decided per-entry.
export const revalidate = 60;

interface CatchAllPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ locale?: string | string[] }>;
}

export default async function CatchAllPage({
  params,
  searchParams,
}: CatchAllPageProps) {
  const { slug } = await params;
  const { locale: queryLocale } = await searchParams;
  const { locale: pathLocale, consumedSegment } =
    resolveLocaleFromFirstSegment(slug[0]);
  const locale = resolveRequestedLocale(queryLocale, pathLocale);
  const pathSegments = consumedSegment ? slug.slice(1) : slug;

  if (pathSegments.length === 0) {
    notFound();
  }

  const urlPath = `/${pathSegments.join("/")}`;

  // ENTERPRISE PATTERN: MULTIPLE PAGE MODEL TYPES — resolution order
  // landing-page first (time-boxed campaign override), page second (the
  // generic catch-all). Both calls fail soft to `null`, matching every other
  // Builder fetch in this app.
  const landingPage = await fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "landing-page",
    userAttributes: { urlPath, locale },
    locale,
  }).catch(() => null);

  const content =
    landingPage ??
    (await fetchOneEntry({
      fetch: builderFetch,
      apiKey: BUILDER_API_KEY,
      model: "page",
      userAttributes: { urlPath, locale },
      locale,
    }).catch(() => null));

  if (!content) {
    notFound();
  }

  const model = landingPage ? "landing-page" : "page";

  return (
    <main className="flex-1">
      <RenderBuilderContent content={content} model={model} locale={locale} />
    </main>
  );
}
