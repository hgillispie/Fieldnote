import { fetchOneEntry } from "@builder.io/sdk-react";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";

// ISR, not force-dynamic — the old build hit the CDN fresh on every
// request with zero caching. Builder's own edge cache (staleCacheSeconds,
// default one day) does the heavy lifting; this just bounds how stale the
// Next.js cache itself can get.
export const revalidate = 60;

export default async function HomePage() {
  // Fails soft: a Builder CDN hiccup degrades to an empty render, never a
  // crashed page. Every data-bound fetch in this app follows this shape.
  const content = await fetchOneEntry({
    apiKey: BUILDER_API_KEY,
    model: "homepage",
    userAttributes: {
      urlPath: "/",
    },
  }).catch((error) => {
    console.error("Failed to fetch homepage content from Builder:", error);
    return null;
  });

  return (
    <main className="flex-1">
      <RenderBuilderContent content={content} model="homepage" />
    </main>
  );
}
