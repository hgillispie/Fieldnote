"use client";

import DOMPurify from "isomorphic-dompurify";
import { EditorEmptyState } from "./EditorEmptyState";
import { SectionShell } from "./SectionShell";

interface PolicySection {
  heading?: string;
  body?: string;
}

interface PolicyDocumentProps {
  intro?: string;
  sections?: PolicySection[];
  showToc?: boolean;
  attributes?: Record<string, unknown>;
}

const PROSE_CLASSES =
  "text-base leading-relaxed text-ink [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_li]:mb-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PolicyDocument({ intro, sections, showToc = true, attributes }: PolicyDocumentProps) {
  const usedIds = new Set<string>();
  const items = (sections ?? [])
    .filter((section) => section?.heading && section.body)
    .map((section) => {
      const base = `section-${slugify(section.heading as string)}`;
      let id = base;
      for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
      usedIds.add(id);
      return { id, heading: section.heading as string, body: DOMPurify.sanitize(section.body as string) };
    });
  const safeIntro = intro ? DOMPurify.sanitize(intro) : "";

  if (items.length === 0 && !safeIntro.trim()) {
    return <EditorEmptyState attributes={attributes} message="Add sections in the options panel." />;
  }

  const withToc = showToc && items.length >= 3;

  return (
    <SectionShell attributes={attributes} spacing="md">
      <div className={withToc ? "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16" : ""}>
        {withToc && (
          <nav aria-label="On this page" className="mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">On this page</p>
              <ol className="mt-3 flex flex-col gap-2 border-l border-sand">
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="-ml-px block border-l border-transparent pl-4 text-sm text-slate transition hover:border-accent hover:text-ink"
                    >
                      {item.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        )}

        <div className="max-w-2xl">
          {safeIntro && (
            <div
              className={`${PROSE_CLASSES} text-lg text-slate`}
              dangerouslySetInnerHTML={{ __html: safeIntro }}
            />
          )}
          {items.map((item, index) => (
            <section
              key={item.id}
              aria-labelledby={item.id}
              className={index === 0 && !safeIntro ? "" : "mt-10 border-t border-sand pt-10"}
            >
              <h2 id={item.id} className="scroll-mt-24 font-display text-xl text-ink">
                {item.heading}
              </h2>
              <div
                className={`mt-4 ${PROSE_CLASSES}`}
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
            </section>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
