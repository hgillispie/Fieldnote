import { fetchOneEntry } from "@builder.io/sdk-react";
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
 * HOW THIS WORKS HERE
 * `MIGRATED_TO_BUILDER` is a per-content-type flag. For any content type
 * where the flag is `false`, this resolver reads from the (mocked)
 * Contentful Delivery API client in `src/lib/contentful/client.ts`. Flip a
 * single entry to `true` once that content type's editors have been trained
 * on Builder, its content has been backfilled, and its templates have been
 * rebuilt as Builder models/components — and every page using this resolver
 * starts reading from Builder instead, with no other code change. Nothing
 * about the calling page (`src/app/help/[slug]/page.tsx`) needs to know or
 * care which system actually served the content; it only ever sees the
 * normalized `ResolvedArticle` shape below.
 *
 * WHY NOT MIGRATE EVERYTHING AT ONCE
 * A big-bang cutover means every content type's editors, templates, and
 * governance rules have to be ready on the same day, and any single content
 * type not being ready blocks the whole migration. Content-type-by-content-
 * type migration lets a team ship the easiest, lowest-risk content type
 * first (often a marketing landing page type, rarely a regulated/legal
 * content type), prove the pattern in production, and only then move on to
 * the next type — while the Contentful contract keeps serving everything
 * that hasn't moved yet, with zero downtime and zero "flag day" risk.
 *
 * RUNNING BOTH PLATFORMS SIDE BY SIDE, AND EVENTUALLY DECOMMISSIONING CONTENTFUL
 * In a real migration:
 *   1. Both CMSs' content APIs are live and queried by the app simultaneously
 *      (exactly what this file does), gated by this same kind of flag map —
 *      usually backed by a real feature-flag service (LaunchDarkly, a config
 *      table) rather than a hardcoded object, so flipping a content type's
 *      migration status doesn't require a deploy.
 *   2. Content for a given type is backfilled into Builder (bulk import via
 *      the Content API, or the CMS MCP tooling this repo itself uses) before
 *      its flag flips, so there's no gap where content exists in neither
 *      system.
 *   3. Once every content type's flag is `true`, the Contentful-reading code
 *      paths (this file's `false` branch, and `src/lib/contentful/client.ts`
 *      itself) are deleted, and the Contentful contract is let lapse or
 *      formally decommissioned. Nothing about this file needs to be rewritten
 *      to reach that end state — it's deleted, not refactored, once its job
 *      is done.
 */
export const MIGRATED_TO_BUILDER: Record<string, boolean> = {
  // Flip to `true` once the help-center article template and its editors
  // have moved over — the resolver below will start reading the `article`
  // Builder model instead, with zero changes needed in
  // `src/app/help/[slug]/page.tsx`.
  article: false,
};

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

async function resolveArticleFromBuilder(slug: string): Promise<ResolvedArticle | null> {
  const entry = await fetchOneEntry({
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
    bodyHtml: entry.data.body ?? "",
    authorName: entry.data.author?.value?.data?.name ?? "Fieldnote",
    topicLabel: entry.data.topic?.value?.data?.name ?? "",
    source: "builder",
  };
}

/**
 * The one function a page calls — routes to Contentful or Builder based on
 * `MIGRATED_TO_BUILDER.article`, and always returns sanitized HTML in
 * `bodyHtml` regardless of which system it came from (Contentful's rich text
 * needs the same DOMPurify treatment as Builder's `richText` fields — see
 * `.builder/rules/components.mdc`'s `dangerouslySetInnerHTML` rule).
 */
export async function resolveArticle(slug: string): Promise<ResolvedArticle | null> {
  const resolved = MIGRATED_TO_BUILDER.article
    ? await resolveArticleFromBuilder(slug)
    : await resolveArticleFromContentful(slug);

  if (!resolved) return null;

  return { ...resolved, bodyHtml: DOMPurify.sanitize(resolved.bodyHtml) };
}
