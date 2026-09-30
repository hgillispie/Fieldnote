import { cache } from "react";
import { fetchOneEntry } from "@builder.io/sdk-react";
import type { BuilderContent } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import DOMPurify from "isomorphic-dompurify";
import { getContentfulEntryBySlug } from "@/lib/contentful/client";
import { BUILDER_API_KEY } from "@/lib/builder-config";

/**
 * ENTERPRISE PATTERN: CONTENTFUL + BUILDER COEXISTENCE ("strangler fig" migration)
 *
 * This is the exact situation an enterprise customer is in when they have
 * 6+ months left on a Contentful contract and want to migrate to Builder
 * incrementally, content-type by content-type, instead of a risky big-bang
 * cutover where every page changes CMS on the same release. The "strangler
 * fig" name comes from the plant: new growth (Builder) gradually wraps
 * around and eventually replaces the old structure (Contentful) while both
 * are alive and load-bearing at the same time — nothing gets ripped out
 * until its replacement is already carrying real traffic.
 *
 * DEFAULT BEHAVIOR: BUILDER IS THE SOURCE OF TRUTH, FULL STOP
 * `fetchHelpArticle(slug)` — the function `/help/[slug]` calls by default —
 * only ever reads the real `article` model in Builder (surface="help"). It
 * does not consult the mocked Contentful client at all. This app's entire
 * point is demonstrating Builder as the CMS, so a real, published Builder
 * article must resolve by slug reliably and by default; nothing is allowed
 * to silently intercept that and serve stale/mocked content instead. It
 * returns the raw `BuilderContent` entry (not a flattened shape) because a
 * real article's body lives in its `blocks` tree, rendered through
 * `<RenderBuilderContent>` — there is no flat `body` string field to read.
 *
 * THE STRANGLER-FIG DEMO IS A SEPARATE, EXPLICIT, OPT-IN PATH
 * `resolveArticleWithMigrationDemo(slug)` is the function that reproduces
 * the old, pre-migration behavior — for a content type not yet flagged as
 * migrated, it reads the mocked Contentful client instead of Builder — but
 * it only runs when a caller explicitly asks for it. `src/app/help/[slug]
 * /page.tsx` wires this up behind an explicit `?cms=legacy` query param, so
 * the coexistence story is still fully demoable live (visiting
 * `/help/choosing-a-rain-shell?cms=legacy` shows the pre-migration
 * Contentful-backed render) without that path ever winning for an arbitrary
 * slug that a visitor reaches through a normal link.
 *
 * WHY NOT MIGRATE EVERYTHING AT ONCE (the demo this preserves)
 * A big-bang cutover means every content type's editors, templates, and
 * governance rules have to be ready on the same day, and any single content
 * type not being ready blocks the whole migration. Content-type-by-content-
 * type migration lets a team ship the easiest, lowest-risk content type
 * first, prove the pattern in production, and only then move on to the next
 * type — while the Contentful contract keeps serving everything that hasn't
 * moved yet, with zero downtime and zero "flag day" risk. `MIGRATED_TO_BUILDER`
 * below still models that per-content-type flag for the opt-in demo path;
 * it no longer gates the default, everyday resolution every other page in
 * this app depends on.
 */
export const MIGRATED_TO_BUILDER: Record<string, boolean> = {
  // Only consulted by `resolveArticleWithMigrationDemo`, i.e. only when a
  // caller explicitly opts into the legacy-CMS demo path (see above).
  article: false,
};

// React.cache dedupes this within a single request lifecycle, matching the
// pattern `src/app/blog/[slug]/page.tsx` uses for the same model.
export const fetchHelpArticle = cache(
  async (slug: string): Promise<BuilderContent | null> => {
    return fetchOneEntry({
      fetch: builderFetch,
      apiKey: BUILDER_API_KEY,
      model: "article",
      query: {
        "data.slug": slug,
        "data.surface": "help",
      },
      enrich: true,
    }).catch(() => null);
  },
);

export interface ResolvedArticle {
  title: string;
  slug: string;
  bodyHtml: string;
  authorName: string;
  topicLabel: string;
  source: "contentful" | "builder";
}

async function resolveArticleFromContentful(slug: string): Promise<ResolvedArticle | null> {
  const entry = await getContentfulEntryBySlug(slug);
  if (!entry) return null;

  return {
    title: entry.fields.title,
    slug: entry.fields.slug,
    bodyHtml: entry.fields.body,
    authorName: entry.fields.authorName,
    topicLabel: entry.fields.topicLabel,
    source: "contentful",
  };
}

/**
 * Only reachable from `resolveArticleWithMigrationDemo` once
 * `MIGRATED_TO_BUILDER.article` is flipped to `true` — i.e. not on any path
 * exercised by default. Kept flattening to a `body` string for parity with
 * the Contentful shape this demo is contrasting against; real Builder
 * articles store their body in `blocks` instead (see `fetchHelpArticle`
 * above), so this intentionally simplified branch only reflects an entry's
 * structured fields, not its block content.
 */
async function resolveArticleFromBuilder(slug: string): Promise<ResolvedArticle | null> {
  const entry = await fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "article",
    query: { "data.slug": slug },
    enrich: true,
  }).catch((error) => {
    console.error("Failed to fetch article from Builder:", error);
    return null;
  });

  if (!entry?.data) return null;

  return {
    title: entry.data.title ?? "",
    slug: entry.data.slug ?? slug,
    bodyHtml: entry.data.excerpt ?? "",
    authorName: entry.data.author?.value?.data?.name ?? "Fieldnote",
    topicLabel: entry.data.topic?.value?.data?.name ?? "",
    source: "builder",
  };
}

/**
 * The explicit, opt-in strangler-fig demo path — see the file-level comment
 * block above. Only called when a caller (currently: the `?cms=legacy` query
 * param on `/help/[slug]`) deliberately asks to see the pre-migration
 * behavior. Routes to Contentful or Builder based on
 * `MIGRATED_TO_BUILDER.article`, exactly like the old default used to.
 */
export async function resolveArticleWithMigrationDemo(
  slug: string,
): Promise<ResolvedArticle | null> {
  const resolved = MIGRATED_TO_BUILDER.article
    ? await resolveArticleFromBuilder(slug)
    : await resolveArticleFromContentful(slug);

  if (!resolved) return null;

  return { ...resolved, bodyHtml: DOMPurify.sanitize(resolved.bodyHtml) };
}
