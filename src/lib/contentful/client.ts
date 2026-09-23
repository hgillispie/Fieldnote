/**
 * ⚠️ MOCK — there is no real Contentful space behind this client. No
 * `contentful` SDK is installed and no network call is made. Every function
 * below returns a stubbed response shaped exactly like Contentful's real
 * Delivery API JSON (the `sys`/`fields` envelope, `sys.contentType.sys.id`,
 * linked-entry `sys.type: "Link"` references) so the coexistence logic in
 * `src/lib/content-source.ts` is written exactly the way it would be against
 * a real space. Swapping this for a real integration means installing
 * `contentful`, calling `createClient({ space, accessToken }).getEntries(...)`,
 * and nothing downstream of this file needs to change shape.
 *
 * See `src/lib/content-source.ts` for the full "strangler fig" migration
 * pattern this file is one half of.
 */

export interface ContentfulEntry<Fields> {
  sys: {
    id: string;
    type: "Entry";
    contentType: { sys: { id: string } };
    createdAt: string;
    updatedAt: string;
  };
  fields: Fields;
}

export interface ContentfulArticleFields {
  title: string;
  slug: string;
  body: string;
  authorName: string;
  topicLabel: string;
}

// Realistic-looking mock content, keyed by slug — stands in for a real
// `client.getEntries({ content_type: "article", "fields.slug": slug })` call.
const MOCK_ARTICLE_ENTRIES: Record<string, ContentfulEntry<ContentfulArticleFields>> = {
  "choosing-a-rain-shell": {
    sys: {
      id: "4x1a2FvWqQ8oW6q0aYh3Zt",
      type: "Entry",
      contentType: { sys: { id: "article" } },
      createdAt: "2025-03-11T14:02:00.000Z",
      updatedAt: "2025-11-02T09:41:00.000Z",
    },
    fields: {
      title: "How to choose a rain shell that actually keeps you dry",
      slug: "choosing-a-rain-shell",
      body:
        "<p>Waterproof rating and breathability trade off against each other more than most buyers expect. This guide walks through 3-layer vs. 2.5-layer construction, taped seams, and how to read a hydrostatic-head number so you can pick the right shell for how you actually plan to use it — commuting in a light drizzle is a very different job than a multi-day traverse in sustained rain.</p>",
      authorName: "Priya Nandan",
      topicLabel: "Buying Guides",
    },
  },
  "packing-for-a-week-long-trip": {
    sys: {
      id: "6bZp9k2N0dR4wT1xLq7Yc",
      type: "Entry",
      contentType: { sys: { id: "article" } },
      createdAt: "2025-05-20T10:15:00.000Z",
      updatedAt: "2025-09-18T16:22:00.000Z",
    },
    fields: {
      title: "A week, one carry-on: our packing list for long trips",
      slug: "packing-for-a-week-long-trip",
      body:
        "<p>Everything in this list fits into a 45L pack with room for souvenirs. The short version: pack for a laundry cycle every 3-4 days, not for every possible day of the trip, and prioritize pieces that layer with each other rather than single-purpose items.</p>",
      authorName: "Diego Fuentes",
      topicLabel: "Travel Tips",
    },
  },
};

/**
 * MOCK — simulates `contentfulClient.getEntries({ content_type, "fields.slug": slug })`
 * with realistic latency. Returns `null` for a 404-equivalent (no entry for
 * that slug), mirroring how the real SDK returns an empty `items` array
 * rather than throwing.
 */
export async function getContentfulEntryBySlug(
  slug: string,
): Promise<ContentfulEntry<ContentfulArticleFields> | null> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return MOCK_ARTICLE_ENTRIES[slug] ?? null;
}
