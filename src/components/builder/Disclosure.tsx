"use client";

import DOMPurify from "isomorphic-dompurify";

interface LocalizedValue {
  "@type"?: string;
  Default?: string;
  [locale: string]: string | undefined;
}

interface ReferencedDisclosure {
  data?: {
    key?: string;
    body?: string | LocalizedValue;
    jurisdiction?: string;
    effectiveDate?: string | number;
    reviewedBy?: string;
    version?: string;
  };
}

interface DisclosureProps {
  disclosure?: ReferencedDisclosure | null;
  collapsed?: boolean;
  label?: string;
  attributes?: Record<string, unknown>;
}

// Real regulatory-register copy in the seed spec's own style — dense,
// specific, dated — used whenever the `disclosure` reference doesn't
// resolve. Mirrors the seed spec's `apr-variable` (US) entry.
const FALLBACK_DISCLOSURE = {
  key: "apr-variable",
  body:
    "<p>Variable Annual Percentage Rate (APR) for purchases ranges from 19.99% to 27.99%, based on your creditworthiness at account opening. This APR will vary with the market based on the Prime Rate published in the <em>Wall Street Journal</em> on the last business day of each calendar quarter.</p>",
  jurisdiction: "US",
  effectiveDate: "2026-01-01",
  reviewedBy: "Fieldnote Legal & Compliance",
  version: "v1.2",
};

function resolveLocalizedValue(value: string | LocalizedValue | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.Default ?? Object.values(value).find((v) => typeof v === "string") ?? "";
}

function formatDate(value: string | number | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function Disclosure({
  disclosure,
  collapsed = true,
  label = "View important disclosures",
  attributes,
}: DisclosureProps) {
  const resolved = disclosure?.data;
  const bodyHtml = resolveLocalizedValue(resolved?.body) || FALLBACK_DISCLOSURE.body;
  const jurisdiction = resolved?.jurisdiction ?? FALLBACK_DISCLOSURE.jurisdiction;
  const effectiveDate = formatDate(resolved?.effectiveDate ?? FALLBACK_DISCLOSURE.effectiveDate);
  const version = resolved?.version ?? FALLBACK_DISCLOSURE.version;
  const safeHtml = DOMPurify.sanitize(bodyHtml);

  const fineprint = (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate">
      {jurisdiction && <span>Jurisdiction: {jurisdiction}</span>}
      {effectiveDate && <span>Effective {effectiveDate}</span>}
      {version && <span>{version}</span>}
    </div>
  );

  const content = (
    <>
      <div
        className="text-xs leading-relaxed text-slate [&_a]:text-accent [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {fineprint}
    </>
  );

  return (
    <div {...attributes}>
      {collapsed ? (
        <details className="rounded-md border border-sand bg-surface-alt px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-ink">
            {label}
          </summary>
          <div className="mt-3">{content}</div>
        </details>
      ) : (
        <div className="rounded-md border border-sand bg-surface-alt px-4 py-3">
          {content}
        </div>
      )}
    </div>
  );
}
