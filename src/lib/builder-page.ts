import { fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { BUILDER_API_KEY } from "@/lib/builder-config";

// Priority order: a time-boxed landing-page overrides any other page model at
// the same URL while it is live.
export const PAGE_MODELS = [
  "landing-page",
  "shop",
  "help-center",
  "legal",
  "home-page",
  "sandbox",
  "page",
] as const;

export type PageModel = (typeof PAGE_MODELS)[number];

export async function fetchPageEntry(
  userAttributes: Record<string, string | undefined>,
  locale?: string,
) {
  const results = await Promise.all(
    PAGE_MODELS.map((model) =>
      fetchOneEntry({
        fetch: builderFetch,
        apiKey: BUILDER_API_KEY,
        model,
        userAttributes,
        ...(locale ? { locale } : {}),
        enrich: true,
      }).catch(() => null),
    ),
  );

  const index = results.findIndex((entry) => !!entry);

  if (index === -1) return null;

  return { content: results[index], model: PAGE_MODELS[index] };
}
