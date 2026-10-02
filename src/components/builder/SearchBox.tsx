"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BUILDER_API_KEY } from "@/lib/builder-config";

export type SearchScope = "products" | "help";

interface SearchBoxProps {
  scope?: SearchScope;
  placeholder?: string;
  autoFocus?: boolean;
  attributes?: Record<string, unknown>;
}

interface SearchRecord {
  key: string;
  title: string;
  /** Extra text that is searched but only partially displayed. */
  body?: string;
  meta?: string;
  trailing?: string;
  href: string;
}

interface BuilderEntry<TData> {
  data?: TData;
}

interface ProductData {
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
  slug?: string;
}

interface ArticleData {
  title?: string;
  slug?: string;
  excerpt?: string;
}

function formatPrice(price?: number, currency?: string) {
  if (typeof price !== "number") return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(price);
}

function productRecord(data: ProductData & { name: string; slug: string }): SearchRecord {
  return {
    key: data.slug,
    title: data.name,
    meta: data.category,
    trailing: formatPrice(data.price, data.currency),
    href: `/products/${data.slug}`,
  };
}

function articleRecord(data: ArticleData & { title: string; slug: string }): SearchRecord {
  return {
    key: data.slug,
    title: data.title,
    body: data.excerpt,
    meta: data.excerpt,
    href: `/help/${data.slug}`,
  };
}

// Real, published catalog entries and help articles, used whenever the
// Builder fetch is unconfigured, empty, or fails.
const FALLBACK_RECORDS: Record<SearchScope, SearchRecord[]> = {
  products: [
    { name: "Cascade 3L Shell", category: "Outerwear", price: 389, slug: "cascade-3l-shell" },
    { name: "Traverse Mid GTX", category: "Footwear", price: 249, slug: "traverse-mid-gtx" },
    { name: "Longhaul 45L Pack", category: "Packs & Bags", price: 279, slug: "longhaul-45l-pack" },
    { name: "Merino 190 Crew", category: "Layers", price: 95, slug: "merino-190-crew" },
  ].map((product) => productRecord({ ...product, currency: "USD" })),
  help: [
    {
      title: "Shipping & Returns",
      slug: "shipping-returns",
      excerpt:
        "Free standard shipping over $75, and a 30-day return window on anything that doesn't work out.",
    },
    {
      title: "Tracking Your Order",
      slug: "tracking-your-order",
      excerpt:
        "Where to find your tracking number, what our shipping statuses mean, and what to do if a package seems stuck.",
    },
    {
      title: "How Do I Find My Size?",
      slug: "how-do-i-find-my-size",
      excerpt:
        "Every product page has a size chart under the fit details. Here's how to use it, and what to do if you're between sizes.",
    },
    {
      title: "Repair Guarantee",
      slug: "repair-guarantee",
      excerpt:
        "Every Fieldnote piece is covered by free repairs for as long as you own it. Here's what's covered and how to start a claim.",
    },
  ].map(articleRecord),
};

const SCOPE_COPY: Record<SearchScope, { placeholder: string; label: string; empty: string }> = {
  products: {
    placeholder: "Search jackets, packs, boots...",
    label: "Search products",
    empty: "Try a category like \u201cpacks\u201d or \u201cfootwear\u201d.",
  },
  help: {
    placeholder: "Search shipping, returns, sizing, repairs...",
    label: "Search help articles",
    empty: "Try \u201creturns\u201d, \u201csizing\u201d, \u201ctracking\u201d or \u201crepairs\u201d.",
  },
};

async function fetchRecords(scope: SearchScope): Promise<SearchRecord[]> {
  if (!BUILDER_API_KEY) return FALLBACK_RECORDS[scope];

  const params = new URLSearchParams({ apiKey: BUILDER_API_KEY, limit: "100" });
  let model: string;
  if (scope === "help") {
    model = "article";
    params.set("query.data.surface", "help");
    params.set("fields", "data.title,data.slug,data.excerpt");
  } else {
    model = "product";
    params.set("fields", "data.name,data.category,data.price,data.currency,data.slug");
  }

  const res = await fetch(`https://cdn.builder.io/api/v3/content/${model}?${params.toString()}`);
  if (!res.ok) throw new Error(`${model} fetch failed: ${res.status}`);
  const json: { results?: BuilderEntry<ProductData & ArticleData>[] } = await res.json();
  const entries = (json.results ?? []).map((entry) => entry.data);

  const records =
    scope === "help"
      ? entries
          .filter((d): d is ArticleData & { title: string; slug: string } => !!d?.title && !!d.slug)
          .map(articleRecord)
      : entries
          .filter((d): d is ProductData & { name: string; slug: string } => !!d?.name && !!d.slug)
          .map(productRecord);

  return records.length > 0 ? records : FALLBACK_RECORDS[scope];
}

const STOPWORDS = new Set(["a", "an", "and", "the", "my", "i", "do", "how", "to", "for", "of", "is", "what", "can", "your"]);

// The one place a query is turned into results. Each meaningful word is
// matched as a word prefix ("track" finds "Tracking"), title hits rank
// above body hits. Swapping to an Algolia-backed index later means
// replacing this function's body — inputs and markup don't change.
export function searchRecords(query: string, records: SearchRecord[]): SearchRecord[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !STOPWORDS.has(token));
  if (tokens.length === 0) return [];

  const scored = records.map((record) => {
    const titleWords = record.title.toLowerCase().split(/[^a-z0-9]+/);
    const bodyWords = `${record.meta ?? ""} ${record.body ?? ""}`.toLowerCase().split(/[^a-z0-9]+/);
    let score = 0;
    for (const token of tokens) {
      const stem =
        token.length > 5 && token.endsWith("ing")
          ? token.slice(0, -3)
          : token.length > 3 && token.endsWith("s")
            ? token.slice(0, -1)
            : token;
      const matches = (word: string) => word.startsWith(token) || word.startsWith(stem);
      if (titleWords.some(matches)) score += 3;
      else if (bodyWords.some(matches)) score += 1;
    }
    return { record, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.record);
}

export function SearchBox({
  scope = "products",
  placeholder,
  autoFocus,
  attributes,
}: SearchBoxProps) {
  const copy = SCOPE_COPY[scope] ?? SCOPE_COPY.products;
  const [records, setRecords] = useState<SearchRecord[]>(FALLBACK_RECORDS[scope] ?? []);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecords(scope)
      .then((result) => {
        if (!cancelled) setRecords(result);
      })
      .catch(() => {
        if (!cancelled) setRecords(FALLBACK_RECORDS[scope]);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => searchRecords(query, records), [query, records]);

  return (
    <div {...attributes} ref={containerRef} className="relative mx-auto w-full max-w-xl">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
          if (event.key === "Enter" && results[0]) window.location.assign(results[0].href);
        }}
        placeholder={placeholder?.trim() || copy.placeholder}
        aria-label={copy.label}
        className="w-full rounded-md border border-sand bg-surface py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition focus:border-primary"
      />
      {isOpen && query.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-sand bg-surface text-left shadow-lg">
          {results.length > 0 ? (
            <ul>
              {results.map((record) => (
                <li key={record.key}>
                  <a
                    href={record.href}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-surface-alt"
                  >
                    <span className="min-w-0">
                      <span className="block text-ink">{record.title}</span>
                      {record.meta && (
                        <span className="block truncate text-xs text-slate">{record.meta}</span>
                      )}
                    </span>
                    {record.trailing && (
                      <span className="shrink-0 text-slate">{record.trailing}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate">
              Nothing matches &ldquo;{query}&rdquo;. {copy.empty}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
