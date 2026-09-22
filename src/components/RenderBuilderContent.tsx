"use client";

import { Content, isPreviewing } from "@builder.io/sdk-react";
import type { BuilderContent } from "@builder.io/sdk-react";
import "@/builder-registry";
import { BUILDER_API_KEY } from "@/lib/builder-config";

interface RenderBuilderContentProps {
  content: BuilderContent | null;
  model: string;
}

/**
 * Every Builder-rendered page goes through this client wrapper. `<Content>`
 * cannot be a Server Component on this SDK (see CLAUDE.md) — this is the
 * one place that boundary lives, so pages themselves can stay server
 * components that fetch data and pass it in.
 */
export function RenderBuilderContent({
  content,
  model,
}: RenderBuilderContentProps) {
  if (!content && !isPreviewing()) {
    return null;
  }

  return <Content content={content} model={model} apiKey={BUILDER_API_KEY} />;
}
