import { ArticleList } from "@/components/builder/ArticleList";

export const revalidate = 60;

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">Field notes</h1>
      <div className="mt-8">
        <ArticleList source="surface" surface="blog" heading="" columns="3" />
      </div>
    </main>
  );
}
