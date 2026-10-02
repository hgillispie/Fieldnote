"use client";

import { SECTION_TITLE_CLASSES } from "./SectionShell";

interface SectionHeaderProps {
  heading?: string;
  subheading?: string;
  linkLabel?: string;
  linkHref?: string;
}

/** Renders nothing unless the editor set at least a heading or a link. */
export function SectionHeader({ heading, subheading, linkLabel, linkHref }: SectionHeaderProps) {
  const showLink = Boolean(linkLabel?.trim() && linkHref?.trim());
  if (!heading && !subheading && !showLink) return null;

  return (
    <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="max-w-2xl">
        {heading && <h2 className={SECTION_TITLE_CLASSES}>{heading}</h2>}
        {subheading && <p className="mt-3 text-base text-slate">{subheading}</p>}
      </div>
      {showLink && (
        <a
          href={linkHref}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          {linkLabel}
          <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
            &rarr;
          </span>
        </a>
      )}
    </div>
  );
}
