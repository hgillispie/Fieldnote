"use client";

import { EditorEmptyState } from "./EditorEmptyState";
import { SectionHeader } from "./SectionHeader";
import { SectionShell } from "./SectionShell";

type CategoryTilesColumns = "2" | "3" | "4";

interface CategoryTile {
  label?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
}

interface CategoryTilesProps {
  heading?: string;
  subheading?: string;
  linkLabel?: string;
  linkHref?: string;
  columns?: CategoryTilesColumns;
  tiles?: CategoryTile[];
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const COLUMN_CLASSES: Record<CategoryTilesColumns, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-2 lg:grid-cols-4",
};

export function CategoryTiles({
  heading,
  subheading,
  linkLabel,
  linkHref,
  columns = "3",
  tiles,
  attributes,
}: CategoryTilesProps) {
  const items = (tiles ?? []).filter((tile) => tile?.label && tile.href);

  if (items.length === 0) {
    return <EditorEmptyState attributes={attributes} message="Add category tiles in the options panel." />;
  }

  return (
    <SectionShell attributes={attributes} spacing="md">
      <SectionHeader
        heading={heading}
        subheading={subheading}
        linkLabel={linkLabel}
        linkHref={linkHref}
      />
      <div className={`grid gap-4 md:gap-6 ${COLUMN_CLASSES[columns]}`}>
        {items.map((tile, index) => (
          <a
            key={`${tile.href}-${index}`}
            href={tile.href}
            className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg bg-primary p-5 text-surface md:p-6"
          >
            {tile.image && (
              <img
                src={tile.image}
                alt={tile.imageAlt ?? ""}
                className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
            <h3 className="font-display text-xl leading-tight">{tile.label}</h3>
            {tile.description && (
              <p className="mt-1 text-sm text-surface/80">{tile.description}</p>
            )}
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
              Shop now
              <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                &rarr;
              </span>
            </span>
          </a>
        ))}
      </div>
    </SectionShell>
  );
}
