import { notFound } from "next/navigation";
import { fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";

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
// A small, explicit allowlist of supported locale prefixes, each mapped to
// the "locale group default" it falls back to if a page hasn't been
// translated into that exact locale yet. This mirrors Builder's own locale-
// group concept (e.g. an "ar-*" group defaulting to `ar-AE`) at the
// application-routing layer, for the one thing Builder's own locale
// fallback doesn't cover automatically: which URL prefix maps to which
// locale code in the first place.
//
// FULL FALLBACK CHAIN: requested locale -> locale group default -> space default
// Example: a visitor requests `/ar-SA/sale` (Saudi Arabic). `ar-SA` isn't in
// `SUPPORTED_LOCALES` below, but it shares the `ar` group, whose default is
// `ar-AE`. If `fetchOneEntry({ locale: "ar-AE", ... })` still returns nothing
// (that specific page was never translated even into the group default), the
// final fallback is the space default locale (`Default` — Builder's own
// term for "the locale a space's content was authored in before any
// localization was added"), passed as `locale: undefined` so the SDK returns
// whatever the base entry has. A visitor always sees *something* in this
// chain; worst case, they see the space-default-locale version of a page
// that hasn't been translated into their language yet, never a blank page.
const LOCALE_GROUP_DEFAULTS: Record<string, string> = {
  "fr-fr": "fr-FR",
  "fr-ca": "fr-FR",
  "ar-ae": "ar-AE",
  "ar-sa": "ar-AE",
  "en-us": "Default",
};

function resolveLocaleFromFirstSegment(segment: string | undefined): {
  locale: string | undefined;
  consumedSegment: boolean;
} {
  if (!segment) return { locale: undefined, consumedSegment: false };
  const normalized = segment.toLowerCase();
  const groupDefault = LOCALE_GROUP_DEFAULTS[normalized];
  if (!groupDefault) return { locale: undefined, consumedSegment: false };
  // "Default" is Builder's own sentinel for the space's base locale — pass
  // `undefined` rather than the literal string so `fetchOneEntry` resolves
  // the un-localized entry instead of looking for a locale named "Default".
  return { locale: groupDefault === "Default" ? undefined : groupDefault, consumedSegment: true };
}

// Same ISR policy as the homepage (see src/app/page.tsx) — no
// force-dynamic, applied uniformly across every page/landing-page URL this
// route resolves rather than decided per-entry.
export const revalidate = 60;

interface CatchAllPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const { locale, consumedSegment } = resolveLocaleFromFirstSegment(slug[0]);
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
    userAttributes: { urlPath },
    locale,
  }).catch(() => null);

  const content =
    landingPage ??
    (await fetchOneEntry({
      fetch: builderFetch,
      apiKey: BUILDER_API_KEY,
      model: "page",
      userAttributes: { urlPath },
      locale,
    }).catch(() => null));

  if (!content) {
    notFound();
  }

  const model = landingPage ? "landing-page" : "page";

  return (
    <main className="flex-1">
      <RenderBuilderContent content={content} model={model} />
    </main>
  );
}
