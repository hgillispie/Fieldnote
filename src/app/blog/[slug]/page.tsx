import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOneEntry } from "@builder.io/sdk-react";
import type { BuilderContent } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { resolveReference, type BuilderReference } from "@/lib/builder-refs";

export const revalidate = 60;

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

interface ArticleAuthorData {
  name?: string;
  title?: string;
  avatar?: string;
  bio?: string;
}

interface FaqPair {
  question?: string;
  answer?: string;
}

type ArticleEntityType = "Article" | "FAQPage" | "HowTo" | "Product";

interface ArticleData {
  title?: string;
  slug?: string;
  excerpt?: string;
  heroImage?: string;
  heroImageAlt?: string;
  author?: BuilderReference<ArticleAuthorData>;
  publishedAt?: string | number;
  readingMinutes?: number;
  tags?: Array<{ tag?: string }>;
  hideImage?: boolean;
  fullPage?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  answerSummary?: string;
  faqPairs?: FaqPair[];
  entityType?: ArticleEntityType;
  jsonLd?: string;
}

// React.cache dedupes this within a single request lifecycle, so
// generateMetadata and the page component share one Builder round-trip
// instead of paying for two.
const fetchBlogArticle = cache(async (slug: string): Promise<BuilderContent | null> => {
  return fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "article",
    query: {
      "data.slug": slug,
      "data.surface": "blog",
    },
    enrich: true,
  }).catch(() => null);
});

function buildJsonLd(data: ArticleData, author: ArticleAuthorData | undefined) {
  if (data.jsonLd) {
    try {
      return JSON.parse(data.jsonLd);
    } catch {
      // Fall through to the constructed schema below if the stored JSON-LD is invalid.
    }
  }

  const publishedDate = data.publishedAt ? new Date(data.publishedAt) : null;

  if (data.entityType === "FAQPage" && data.faqPairs && data.faqPairs.length > 0) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faqPairs.map((pair) => ({
        "@type": "Question",
        name: pair.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: pair.answer,
        },
      })),
    };
  }

  const blogPosting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.excerpt,
    image: data.heroImage,
    author: {
      "@type": "Person",
      name: author?.name,
    },
    ...(publishedDate ? { datePublished: publishedDate.toISOString() } : {}),
  };

  if (data.faqPairs && data.faqPairs.length > 0) {
    return [
      blogPosting,
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.faqPairs.map((pair) => ({
          "@type": "Question",
          name: pair.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: pair.answer,
          },
        })),
      },
    ];
  }

  return blogPosting;
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchBlogArticle(slug);

  if (!article) {
    return { title: "Article not found" };
  }

  const data = (article.data ?? {}) as ArticleData;
  const title = data.seoTitle ?? data.title;
  const description = data.seoDescription ?? data.excerpt;
  const ogImage = data.ogImage ?? data.heroImage;

  return {
    title,
    description,
    ...(data.canonical ? { alternates: { canonical: data.canonical } } : {}),
    robots: { index: !data.noindex },
    ...(ogImage ? { openGraph: { images: [ogImage] } } : {}),
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;

  const article = await fetchBlogArticle(slug);

  if (!article) {
    notFound();
  }

  const data = (article.data ?? {}) as ArticleData;
  const author = resolveReference(data.author);
  const fullPage = data.fullPage ?? false;

  if (fullPage) {
    return (
      <main className="flex-1">
        <RenderBuilderContent content={article} model="article" />
      </main>
    );
  }

  const jsonLd = buildJsonLd(data, author);
  const publishedDate = data.publishedAt ? new Date(data.publishedAt) : null;
  const showHeroImage = !data.hideImage && !!data.heroImage;

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/blog" className="text-sm text-slate hover:text-ink">
          &larr; Back to Field notes
        </Link>

        {showHeroImage && (
          <div className="mt-6 aspect-[16/9] overflow-hidden rounded-lg border border-sand bg-surface-alt">
            <img
              src={data.heroImage}
              alt={data.heroImageAlt ?? data.title ?? ""}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h1 className="mt-6 font-display text-4xl text-ink">{data.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate">
          {author?.avatar && (
            <img
              src={author.avatar}
              alt={author.name ?? ""}
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          {author?.name && <span>{author.name}</span>}
          {author?.name && author?.title && <span>&middot;</span>}
          {author?.title && <span>{author.title}</span>}
          {(author?.name || author?.title) && publishedDate && <span>&middot;</span>}
          {publishedDate && (
            <span>
              {publishedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {publishedDate && data.readingMinutes && <span>&middot;</span>}
          {data.readingMinutes && <span>{data.readingMinutes} min read</span>}
        </div>

        {data.tags && data.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.tags.map(
              (tagItem, index) =>
                tagItem.tag && (
                  <span
                    key={`${tagItem.tag}-${index}`}
                    className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-slate"
                  >
                    {tagItem.tag}
                  </span>
                ),
            )}
          </div>
        )}
      </article>

      <RenderBuilderContent content={article} model="article" />
    </main>
  );
}
