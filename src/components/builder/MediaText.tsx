"use client";

import DOMPurify from "isomorphic-dompurify";
import { EditorEmptyState } from "./EditorEmptyState";
import { SectionShell } from "./SectionShell";

type MediaTextImagePosition = "left" | "right";

interface MediaTextProps {
  eyebrow?: string;
  heading?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: MediaTextImagePosition;
  linkLabel?: string;
  linkHref?: string;
  attributes?: Record<string, unknown>;
}

const IMAGE_ORDER_CLASSES: Record<MediaTextImagePosition, string> = {
  left: "",
  right: "md:order-last",
};

// Text colors inherit (with opacity for secondary copy) so the block reads
// correctly on both light and dark Container backgrounds.
const PROSE_CLASSES =
  "text-base leading-relaxed opacity-85 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1";

export function MediaText({
  eyebrow,
  heading,
  body,
  image,
  imageAlt,
  imagePosition = "left",
  linkLabel,
  linkHref,
  attributes,
}: MediaTextProps) {
  const safeBody = body ? DOMPurify.sanitize(body) : "";
  const showLink = Boolean(linkLabel?.trim() && linkHref?.trim());

  if (!heading && !safeBody.trim()) {
    return <EditorEmptyState attributes={attributes} message="Add a heading and copy in the options panel." />;
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        {image && (
          <div className={`overflow-hidden rounded-lg ${IMAGE_ORDER_CLASSES[imagePosition]}`}>
            <img
              src={image}
              alt={imageAlt ?? ""}
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex max-w-xl flex-col gap-4">
          {eyebrow && (
            <span className="text-sm font-medium uppercase tracking-wide text-accent">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h2 className="font-display text-2xl leading-tight md:text-3xl">{heading}</h2>
          )}
          {safeBody && (
            <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: safeBody }} />
          )}
          {showLink && (
            <a
              href={linkHref}
              className="group mt-1 inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:text-accent hover:underline"
            >
              {linkLabel}
              <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
