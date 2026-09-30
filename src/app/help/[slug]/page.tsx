import { notFound } from "next/navigation";
import {
  fetchHelpArticle,
  resolveArticleWithMigrationDemo,
} from "@/lib/content-source";
import { resolveReference, type BuilderReference } from "@/lib/builder-refs";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";

// Same ISR policy as every other content route in this app — see
// src/app/page.tsx's caching comment block. Reading `searchParams` below
// (for the opt-in `?cms=legacy` demo) carries the same dynamic-rendering
// cost as the homepage's `?locale=` override — see that file's comment
// block for why that trade is made on a query-param basis rather than
// avoided altogether.
export const revalidate = 60;

interface HelpArticlePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cms?: string | string[] }>;
}

interface HelpAuthorData {
  name?: string;
  title?: string;
}

interface HelpArticleData {
  title?: string;
  excerpt?: string;
  author?: BuilderReference<HelpAuthorData>;
  topic?: BuilderReference<{ name?: string }>;
  readingMinutes?: number;
}

export default async function HelpArticlePage({
  params,
  searchParams,
}: HelpArticlePageProps) {
  const { slug } = await params;
  const { cms } = await searchParams;
  const rawCms = Array.isArray(cms) ? cms[0] : cms;

  // ENTERPRISE PATTERN: CONTENTFUL + BUILDER COEXISTENCE — explicit opt-in
  // demo path. See src/lib/content-source.ts's file-level comment block.
  // Only `?cms=legacy` reaches the mocked Contentful client; every other
  // request (the default, everyday case) resolves the real Builder article
  // below.
  if (rawCms === "legacy") {
    const article = await resolveArticleWithMigrationDemo(slug);

    if (!article) {
      notFound();
    }

    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Served from: {article.source} (pre-migration demo — remove
          `?cms=legacy` to see the real Builder-backed article)
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">{article.title}</h1>
        <p className="mt-1 text-sm text-slate">
          {article.authorName}
          {article.topicLabel ? ` · ${article.topicLabel}` : ""}
        </p>
        <div
          className="prose mt-6 max-w-none text-ink"
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />
      </main>
    );
  }

  const article = await fetchHelpArticle(slug);

  if (!article) {
    notFound();
  }

  const data = (article.data ?? {}) as HelpArticleData;
  const author = resolveReference(data.author);
  const topic = resolveReference(data.topic);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Served from: builder
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">{data.title}</h1>
      <p className="mt-1 text-sm text-slate">
        {author?.name}
        {author?.name && topic?.name ? ` · ${topic.name}` : topic?.name}
        {data.readingMinutes ? ` · ${data.readingMinutes} min read` : ""}
      </p>
      {data.excerpt && <p className="mt-4 text-base text-slate">{data.excerpt}</p>}

      <div className="prose mt-6 max-w-none text-ink">
        <RenderBuilderContent content={article} model="article" />
      </div>
    </main>
  );
}
