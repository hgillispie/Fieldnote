"use client";

import DOMPurify from "isomorphic-dompurify";
import { EditorEmptyState } from "./EditorEmptyState";

type RichTextWidth = "narrow" | "default" | "wide";

interface RichTextProps {
  content?: string;
  width?: RichTextWidth;
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const WIDTH_CLASSES: Record<RichTextWidth, string> = {
  narrow: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-5xl",
};

export function RichText({
  content,
  width = "default",
  attributes,
}: RichTextProps) {
  const safeHtml = content ? DOMPurify.sanitize(content) : "";

  if (!safeHtml.trim()) {
    return <EditorEmptyState attributes={attributes} message="Add copy in the options panel." />;
  }

  return (
    <div {...attributes}>
      <div
        className={`mx-auto w-full font-body leading-relaxed text-ink [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-lg [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 ${WIDTH_CLASSES[width]}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}
