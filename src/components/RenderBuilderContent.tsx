"use client";

import { Content, isPreviewing } from "@builder.io/sdk-react";
import type { BuilderContent } from "@builder.io/sdk-react";
import { CUSTOM_COMPONENTS } from "@/builder-registry";
import { BUILDER_API_KEY } from "@/lib/builder-config";

interface RenderBuilderContentProps {
  content: BuilderContent | null;
  model: string;
  locale?: string;
}

/**
 * ENTERPRISE PATTERN: SERVER-SIDE RENDERING (the RSC/client split)
 *
 * Every Builder-rendered page goes through this client wrapper. `<Content>`
 * cannot be a Server Component on this SDK (see CLAUDE.md) — this is the
 * one place that boundary lives, so pages themselves can stay server
 * components that fetch data and pass it in.
 *
 * Concretely: `src/app/page.tsx` is a Server Component that does the
 * network fetch (`fetchOneEntry`) and never ships that fetch logic, or the
 * Builder API key resolution, to the client bundle. It passes the already-
 * resolved `content` JSON down as a prop to this one Client Component, which
 * is the *only* place `"use client"` and the Builder SDK's client-rendering
 * machinery are pulled in. Every other page in this app (and every future
 * page/landing-page/article route — see `src/app/[...slug]/page.tsx`)
 * follows the same shape: Server Component fetches → this wrapper renders.
 *
 * Why this boundary placement matters at enterprise scale: if `<Content>`
 * were imported directly into every page instead of behind one wrapper,
 * every one of those pages would need its own `"use client"` boundary
 * (or worse, the whole tree above it would become client-rendered by
 * accident), inflating the client JS bundle and pushing Core Web Vitals
 * metrics (LCP, INP) in the wrong direction on every single route. Centralizing
 * the boundary here means adding a new content-backed page is "fetch server-
 * side, pass to this component" — the RSC/client split is enforced by the
 * file structure, not by every future engineer remembering to get it right.
 */
export function RenderBuilderContent({
  content,
  model,
  locale,
}: RenderBuilderContentProps) {
  if (!content && !isPreviewing()) {
    return null;
  }

  return (
    <Content
      content={content}
      model={model}
      apiKey={BUILDER_API_KEY}
      customComponents={CUSTOM_COMPONENTS}
      locale={locale}
    />
  );
}
