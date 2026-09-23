"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import DOMPurify from "isomorphic-dompurify";

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

// Real, non-lorem Fieldnote shipping/returns copy so the accordion never
// looks empty — used whenever the `items` list input is unset or empty.
const FALLBACK_ITEMS: Required<AccordionListItem>[] = [
  {
    question: "What's your return policy?",
    answer:
      "<p>Unworn gear can be returned within 60 days for a full refund. Worn gear that fails on the trail is covered by our lifetime repair guarantee instead of a return \u2014 <a href=\"/help\">contact us</a> and we'll sort out a repair or replacement.</p>",
  },
  {
    question: "How long does shipping take?",
    answer:
      "<p>Standard shipping arrives in 3\u20135 business days and is free on orders over $75. Expedited 2-day shipping is available at checkout if you're packing for a trip this week.</p>",
  },
  {
    question: "How do I find my size?",
    answer:
      "<p>Every product page has a size chart under the fit details. If you're between sizes, we generally recommend sizing up for layering room \u2014 our <a href=\"/help\">size guide</a> covers each category in more depth.</p>",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "<p>Yes \u2014 we ship to over 30 countries. Duties and import taxes are calculated at checkout so there are no surprise charges on delivery.</p>",
  },
];

export function Accordion({
  heading = "Shipping & returns",
  behavior = "single",
  items,
  attributes,
}: AccordionProps) {
  const validItems = (items ?? []).filter(
    (item): item is Required<AccordionListItem> => !!item.question && !!item.answer,
  );
  const resolvedItems = validItems.length > 0 ? validItems : FALLBACK_ITEMS;

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
        {resolvedItems.map((item, index) => (
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
