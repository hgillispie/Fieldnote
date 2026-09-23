import { notFound } from "next/navigation";
import { resolveArticle, MIGRATED_TO_BUILDER } from "@/lib/content-source";

// Same ISR policy as every other content route in this app — see
// src/app/page.tsx's caching comment block.
export const revalidate = 60;

interface HelpArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params;
  const article = await resolveArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Visible only so this demo makes the coexistence pattern obvious in
          the browser, not just in code — a real build would drop this once
          the migration story doesn't need to be shown live on a sales call.
          Toggle `MIGRATED_TO_BUILDER.article` in src/lib/content-source.ts
          to see this switch to "builder" with no other code change. */}
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Served from: {article.source} {!MIGRATED_TO_BUILDER.article && "(pre-migration)"}
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
