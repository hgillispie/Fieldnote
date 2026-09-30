import { notFound } from "next/navigation";
import { fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";

export const revalidate = 60;

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;

  const article = await fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "article",
    query: {
      "data.slug": slug,
      "data.surface": "blog",
    },
  }).catch(() => null);

  if (!article) {
    notFound();
  }

  return (
    <main className="flex-1">
      <RenderBuilderContent content={article} model="article" />
    </main>
  );
}
