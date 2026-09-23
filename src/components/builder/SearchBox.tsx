"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BUILDER_API_KEY } from "@/lib/builder-config";

interface SearchProduct {
  name: string;
  category?: string;
  price?: number;
  currency?: string;
  slug: string;
}

interface SearchBoxProps {
  placeholder?: string;
  attributes?: Record<string, unknown>;
}

interface BuilderProductEntry {
  data?: {
    name?: string;
    category?: string;
    price?: number;
    currency?: string;
    slug?: string;
  };
}

// Real, non-lorem gear so search always has something to match against —
// used whenever the Builder `product` model fetch is unconfigured, empty,
// or fails. Same fallback discipline as ProductGrid/ProductCard.
const FALLBACK_PRODUCTS: SearchProduct[] = [
  { name: "Cascade 3L Shell", category: "Outerwear", price: 389, currency: "USD", slug: "cascade-3l-shell" },
  { name: "Traverse Mid GTX", category: "Footwear", price: 219, currency: "USD", slug: "traverse-mid-gtx" },
  { name: "Longhaul 45L Pack", category: "Packs", price: 259, currency: "USD", slug: "longhaul-45l-pack" },
  { name: "Basin Merino Tee", category: "Baselayers", price: 68, currency: "USD", slug: "basin-merino-tee" },
];

function formatPrice(price?: number, currency?: string) {
  if (typeof price !== "number") return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(price);
}

async function fetchProducts(): Promise<SearchProduct[]> {
  if (!BUILDER_API_KEY) return FALLBACK_PRODUCTS;

  const url = `https://cdn.builder.io/api/v3/content/product?apiKey=${BUILDER_API_KEY}&limit=100&fields=data.name,data.category,data.price,data.currency,data.slug`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`product fetch failed: ${res.status}`);

  const json: { results?: BuilderProductEntry[] } = await res.json();
  const entries = json.results ?? [];

  const products = entries
    .map((entry) => entry.data)
    .filter((data): data is NonNullable<typeof data> => !!data?.name && !!data.slug)
    .map((data) => ({
      name: data.name as string,
      category: data.category,
      price: data.price,
      currency: data.currency,
      slug: data.slug as string,
    }));

  return products.length > 0 ? products : FALLBACK_PRODUCTS;
}

// The one place a query is turned into results. Swapping to an
// Algolia-backed index later means replacing this function's body with an
// `index.search(query)` call — the component's inputs and markup don't
// need to change.
function searchProducts(query: string, products: SearchProduct[]): SearchProduct[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.category?.toLowerCase().includes(normalized),
    )
    .slice(0, 8);
}

export function SearchBox({
  placeholder = "Search jackets, packs, boots...",
  attributes,
}: SearchBoxProps) {
  const [products, setProducts] = useState<SearchProduct[]>(FALLBACK_PRODUCTS);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((result) => {
        if (!cancelled) setProducts(result);
      })
      .catch(() => {
        if (!cancelled) setProducts(FALLBACK_PRODUCTS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => searchProducts(query, products), [query, products]);

  return (
    <div {...attributes} ref={containerRef} className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        placeholder={placeholder}
        aria-label="Search products"
        className="w-full rounded-md border border-sand bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      {isOpen && query.trim() && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-sand bg-surface shadow-lg">
          {results.length > 0 ? (
            <ul>
              {results.map((product) => (
                <li key={product.slug}>
                  <a
                    href={`/products/${product.slug}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-surface-alt"
                  >
                    <span>
                      <span className="text-ink">{product.name}</span>
                      {product.category && (
                        <span className="ml-2 text-slate">{product.category}</span>
                      )}
                    </span>
                    {formatPrice(product.price, product.currency) && (
                      <span className="text-slate">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate">
              No gear matches &ldquo;{query}&rdquo;. Try a category like &ldquo;packs&rdquo; or &ldquo;footwear&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
