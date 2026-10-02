"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import DOMPurify from "isomorphic-dompurify";
import { EditorEmptyState } from "./EditorEmptyState";

type AccordionBehavior = "single" | "multiple";

interface AccordionListItem {
  question?: string;
  answer?: string;
}

interface AccordionProps {
  heading?: string;
  behavior?: AccordionBehavior;
  items?: AccordionListItem[];
  attributes?: Record<string, unknown>;
}

export function Accordion({
  heading,
  behavior = "single",
  items,
  attributes,
}: AccordionProps) {
  const validItems = (items ?? []).filter(
    (item): item is Required<AccordionListItem> => !!item.question && !!item.answer,
  );

  if (validItems.length === 0) {
    return <EditorEmptyState attributes={attributes} message="Add questions in the options panel." />;
  }

  const rootProps =
    behavior === "multiple"
      ? { type: "multiple" as const }
      : { type: "single" as const, collapsible: true };

  return (
    <div {...attributes}>
      {heading && (
        <h2 className="mb-6 font-display text-2xl text-ink">{heading}</h2>
      )}
      <RadixAccordion.Root {...rootProps} className="divide-y divide-sand border-y border-sand">
        {validItems.map((item, index) => (
          <RadixAccordion.Item
            key={`${item.question}-${index}`}
            value={`item-${index}`}
            className="group"
          >
            <RadixAccordion.Header>
              <RadixAccordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-left font-display text-base text-ink">
                <span>{item.question}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-slate transition-transform group-data-[state=open]:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </RadixAccordion.Trigger>
            </RadixAccordion.Header>
            <RadixAccordion.Content className="overflow-hidden text-sm text-slate data-[state=closed]:animate-none">
              <div
                className="pb-4 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer) }}
              />
            </RadixAccordion.Content>
          </RadixAccordion.Item>
        ))}
      </RadixAccordion.Root>
    </div>
  );
}
