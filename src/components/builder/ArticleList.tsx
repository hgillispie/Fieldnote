"use client";

import { useEffect, useState } from "react";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { resolveReference, type BuilderReference } from "@/lib/builder-refs";

type ArticleListSource = "manual" | "surface";
type ArticleListColumns = "2" | "3" | "4";
type ArticleSurface = "help" | "blog" | "pro";
type SurfaceFilter = ArticleSurface | "all";

interface GridArticle {
  title: string;
  slug: string;
  excerpt?: string;
  heroImage?: string;
  heroImageAlt?: string;
  authorName?: string;
  surface: ArticleSurface;
  readingMinutes?: number;
}

interface ReferencedAuthor {
  data?: { name?: string };
}

interface ReferencedTopic {
  id?: string;
}

interface ArticleData {
  title?: string;
  slug?: string;
  excerpt?: string;
  heroImage?: string;
  heroImageAlt?: string;
  author?: ReferencedAuthor;
  surface?: ArticleSurface;
  readingMinutes?: number;
}

interface BuilderListItem {
  article?: BuilderReference<ArticleData> | null;
}

interface ArticleListProps {
  source?: ArticleListSource;
  heading?: string;
  columns?: ArticleListColumns;
  articles?: BuilderListItem[];
  surface?: SurfaceFilter;
  topic?: ReferencedTopic | null;
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const COLUMN_CLASSES: Record<ArticleListColumns, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const SURFACE_BASE: Record<ArticleSurface, string> = {
  help: "/help",
  blog: "/blog",
  pro: "/pro",
};

// Real, non-lorem Fieldnote articles across all three surfaces so the list
// never renders empty — used whenever the manual list is empty, or the
// surface-filtered fetch is unconfigured, empty, or fails.
const FALLBACK_ARTICLES: GridArticle[] = [
  {
    title: "How to choose the right rain shell for your climate",
    slug: "choosing-a-rain-shell",
    excerpt:
      "3-layer, 2.5-layer, or waterproof-breathable coating — what actually matters depends on where you're hiking.",
    authorName: "Fieldnote Gear Team",
    surface: "help",
    readingMinutes: 6,
  },
  {
    title: "Six weeks on the Pacific Crest Trail",
    slug: "six-weeks-on-the-pacific-crest-trail",
    excerpt:
      "What survived, what didn't, and the three pieces of gear our guide repacked every single night.",
    authorName: "Maren Osei",
    surface: "blog",
    readingMinutes: 9,
  },
  {
    title: "Bulk ordering and trade pricing for outfitters",
    slug: "bulk-ordering-for-outfitters",
    excerpt:
      "How guide services and rental shops set up a Fieldnote Pro account and place standing seasonal orders.",
    authorName: "Fieldnote Pro Team",
    surface: "pro",
    readingMinutes: 4,
  },
  {
    title: "Returns, repairs, and our lifetime guarantee explained",
    slug: "returns-and-repairs-explained",
    excerpt:
      "What's covered, what to expect at the repair bench, and how to start a claim without waiting on hold.",
    authorName: "Fieldnote Gear Team",
    surface: "help",
    readingMinutes: 5,
  },
];

function toGridArticles(items: BuilderListItem[]): GridArticle[] {
  return items
    .map((item) => resolveReference(item.article))
    .filter(
      (data): data is NonNullable<typeof data> => !!data?.title && !!data.slug,
    )
    .map((data) => ({
      title: data.title as string,
      slug: data.slug as string,
      excerpt: data.excerpt,
      heroImage: data.heroImage,
      heroImageAlt: data.heroImageAlt,
      authorName: resolveReference(data.author)?.name,
      surface: data.surface ?? "blog",
      readingMinutes: data.readingMinutes,
    }));
}

interface ApiArticleEntry {
  data?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    heroImage?: string;
    heroImageAlt?: string;
    surface?: ArticleSurface;
    readingMinutes?: number;
    author?: { value?: { data?: { name?: string } }; data?: { name?: string } };
  };
}

async function fetchSurfaceArticles(
  surface: SurfaceFilter,
  topicId?: string,
): Promise<GridArticle[]> {
  if (!BUILDER_API_KEY) return FALLBACK_ARTICLES;

  const params = new URLSearchParams({
    apiKey: BUILDER_API_KEY,
    limit: "12",
    omit: "data.blocks",
    includeRefs: "true",
    fields:
      "data.title,data.slug,data.excerpt,data.heroImage,data.heroImageAlt,data.surface,data.readingMinutes,data.author",
  });
  if (surface !== "all") params.set("query.data.surface", surface);
  if (topicId) params.set("query.data.topic.id", topicId);

  const res = await fetch(`https://cdn.builder.io/api/v3/content/article?${params.toString()}`);
  if (!res.ok) throw new Error(`article fetch failed: ${res.status}`);

  const json: { results?: ApiArticleEntry[] } = await res.json();
  const entries = json.results ?? [];

  const articles = entries
    .map((entry) => entry.data)
    .filter((data): data is NonNullable<typeof data> => !!data?.title && !!data.slug)
    .map((data) => ({
      title: data.title as string,
      slug: data.slug as string,
      excerpt: data.excerpt,
      heroImage: data.heroImage,
      heroImageAlt: data.heroImageAlt,
      authorName: resolveReference(data.author)?.name,
      surface: data.surface ?? "blog",
      readingMinutes: data.readingMinutes,
    }));

  return articles.length > 0 ? articles : FALLBACK_ARTICLES;
}

export function ArticleList({
  source = "manual",
  heading = "From the field",
  columns = "3",
  articles,
  surface = "all",
  topic,
  attributes,
}: ArticleListProps) {
  const [fetchedItems, setFetchedItems] = useState<GridArticle[] | null>(null);

  useEffect(() => {
    if (source !== "surface") return;

    let cancelled = false;
    fetchSurfaceArticles(surface, topic?.id)
      .then((result) => {
        if (!cancelled) setFetchedItems(result);
      })
      .catch(() => {
        if (!cancelled) setFetchedItems(FALLBACK_ARTICLES);
      });
    return () => {
      cancelled = true;
    };
  }, [source, surface, topic?.id]);

  const manualItems = toGridArticles(articles ?? []);
  const items =
    source === "manual"
      ? manualItems.length > 0
        ? manualItems
        : FALLBACK_ARTICLES
      : fetchedItems ?? FALLBACK_ARTICLES;

  return (
    <div {...attributes}>
      {heading && (
        <h2 className="mb-6 font-display text-2xl text-ink">{heading}</h2>
      )}
      <div className={`grid gap-6 ${COLUMN_CLASSES[columns]}`}>
        {items.map((article) => (
          <a
            key={article.slug}
            href={`${SURFACE_BASE[article.surface]}/${article.slug}`}
            className="group block overflow-hidden rounded-lg border border-sand bg-surface"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-alt">
              {article.heroImage ? (
                <img
                  src={article.heroImage}
                  alt={article.heroImageAlt ?? article.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-alt to-sand px-4 text-center text-sm text-slate">
                  {article.title}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 p-4">
              <h3 className="font-display text-base text-ink">{article.title}</h3>
              {article.excerpt && (
                <p className="text-sm text-slate">{article.excerpt}</p>
              )}
              <div className="flex gap-2 text-xs text-slate">
                {article.authorName && <span>{article.authorName}</span>}
                {article.authorName && article.readingMinutes && <span>&middot;</span>}
                {article.readingMinutes && <span>{article.readingMinutes} min read</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
