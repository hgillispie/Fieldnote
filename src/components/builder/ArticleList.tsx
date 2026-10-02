"use client";

import { useEffect, useState } from "react";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { resolveReference, type BuilderReference } from "@/lib/builder-refs";
import { EditorEmptyState } from "./EditorEmptyState";

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

// Only surfaces with a detail route are linkable. Pro articles have no
// /pro/<slug> route, so they're left out rather than rendered as dead links.
const SURFACE_BASE: Partial<Record<ArticleSurface, string>> = {
  help: "/help",
  blog: "/blog",
};

// Mirrors real, published help and blog articles so a failed fetch still
// links somewhere that resolves.
const FALLBACK_ARTICLES: GridArticle[] = [
  {
    title: "Shipping & Returns",
    slug: "shipping-returns",
    excerpt:
      "Free standard shipping over $75, and a 30-day return window on anything that doesn't work out.",
    surface: "help",
  },
  {
    title: "How Do I Find My Size?",
    slug: "how-do-i-find-my-size",
    excerpt:
      "Every product page has a size chart under the fit details. Here's how to use it, and what to do if you're between sizes.",
    surface: "help",
  },
  {
    title: "Repair Guarantee",
    slug: "repair-guarantee",
    excerpt:
      "Every Fieldnote piece is covered by free repairs for as long as you own it. Here's what's covered and how to start a claim.",
    surface: "help",
  },
  {
    title: "How We Test Every Shell Before It Ships",
    slug: "how-we-test-every-shell",
    excerpt: "A season on real trails, in real rain, before any shell gets a SKU.",
    surface: "blog",
  },
  {
    title: "Layering 101: What Actually Keeps You Warm",
    slug: "layering-101",
    excerpt: "Base, mid, shell: what each layer does, and the mistakes that leave you cold.",
    surface: "blog",
  },
  {
    title: "The Case for Repairing Gear Instead of Replacing It",
    slug: "repair-instead-of-replace",
    excerpt: "Why a lifetime repair guarantee is the most honest sustainability claim we can make.",
    surface: "blog",
  },
];

function fallbackFor(surface: SurfaceFilter): GridArticle[] {
  return surface === "all"
    ? FALLBACK_ARTICLES
    : FALLBACK_ARTICLES.filter((article) => article.surface === surface);
}

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
  if (!BUILDER_API_KEY) return fallbackFor(surface);

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

  return articles.length > 0 ? articles : fallbackFor(surface);
}

export function ArticleList({
  source = "manual",
  heading,
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
        if (!cancelled) setFetchedItems(fallbackFor(surface));
      });
    return () => {
      cancelled = true;
    };
  }, [source, surface, topic?.id]);

  const manualItems = toGridArticles(articles ?? []);
  const items = (
    source === "manual"
      ? manualItems.length > 0
        ? manualItems
        : fallbackFor("all")
      : fetchedItems ?? fallbackFor(surface)
  ).filter((article) => SURFACE_BASE[article.surface]);

  if (items.length === 0) {
    return <EditorEmptyState attributes={attributes} message="No linkable articles for this selection." />;
  }

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
