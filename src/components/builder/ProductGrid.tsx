"use client";

import { useEffect, useState } from "react";

type ProductGridSource = "builder" | "shopify" | "api";
type ProductGridColumns = "2" | "3" | "4";

interface GridProduct {
  name: string;
  price: number;
  currency: string;
  image?: string;
  imageAlt: string;
  href: string;
  badge?: string;
}

interface BuilderListProduct {
  name?: string;
  price?: number;
  currency?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  badge?: string;
}

interface ProductGridProps {
  source?: ProductGridSource;
  columns?: ProductGridColumns;
  heading?: string;
  products?: BuilderListProduct[];
  apiUrl?: string;
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const COLUMN_CLASSES: Record<ProductGridColumns, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// Real, non-lorem gear so the grid never looks empty — used whenever a
// remote source (Shopify/API) fails, returns nothing, or hasn't been
// configured, and whenever the Builder-sourced list is empty.
const FALLBACK_PRODUCTS: GridProduct[] = [
  {
    name: "Cascade 3L Shell",
    price: 389,
    currency: "USD",
    imageAlt: "Cascade 3L Shell rain jacket in forest green",
    href: "/products/cascade-3l-shell",
    badge: "Best Seller",
  },
  {
    name: "Traverse Mid GTX",
    price: 219,
    currency: "USD",
    imageAlt: "Traverse Mid GTX hiking boots",
    href: "/products/traverse-mid-gtx",
  },
  {
    name: "Longhaul 45L Pack",
    price: 259,
    currency: "USD",
    imageAlt: "Longhaul 45L travel backpack",
    href: "/products/longhaul-45l-pack",
    badge: "New",
  },
  {
    name: "Basin Merino Tee",
    price: 68,
    currency: "USD",
    imageAlt: "Basin Merino wool t-shirt",
    href: "/products/basin-merino-tee",
  },
];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

function toGridProducts(items: BuilderListProduct[]): GridProduct[] {
  return items
    .filter((item) => item.name && typeof item.price === "number" && item.href)
    .map((item) => ({
      name: item.name as string,
      price: item.price as number,
      currency: item.currency ?? "USD",
      image: item.image,
      imageAlt: item.imageAlt ?? (item.name as string),
      href: item.href as string,
      badge: item.badge,
    }));
}

export function ProductGrid({
  source = "builder",
  columns = "3",
  heading = "Shop the collection",
  products,
  apiUrl,
  attributes,
}: ProductGridProps) {
  // "builder" resolves the list input passed in directly; "shopify"/"api"
  // fetch client-side from `apiUrl`. Either path falls back to
  // FALLBACK_PRODUCTS so the grid never renders empty if the source is
  // unconfigured, empty, or fails.
  const [remoteItems, setRemoteItems] = useState<GridProduct[] | null>(null);

  useEffect(() => {
    if (source === "builder" || !apiUrl) {
      return;
    }

    let cancelled = false;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`${source} request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const items = toGridProducts(Array.isArray(data) ? data : []);
        setRemoteItems(items.length > 0 ? items : null);
      })
      .catch(() => {
        if (!cancelled) setRemoteItems(null);
      });

    return () => {
      cancelled = true;
    };
  }, [source, apiUrl]);

  const builderItems = toGridProducts(products ?? []);
  const items =
    source === "builder"
      ? builderItems.length > 0
        ? builderItems
        : FALLBACK_PRODUCTS
      : remoteItems ?? FALLBACK_PRODUCTS;

  return (
    <div {...attributes}>
      {heading && (
        <h2 className="mb-6 font-display text-2xl text-ink">{heading}</h2>
      )}
      <div className={`grid gap-6 ${COLUMN_CLASSES[columns]}`}>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group block overflow-hidden rounded-lg border border-sand bg-surface"
          >
            <div className="relative aspect-square overflow-hidden bg-surface-alt">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-alt to-sand px-4 text-center text-sm text-slate">
                  {item.name}
                </div>
              )}
              {item.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-medium text-surface">
                  {item.badge}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 p-4">
              <h3 className="font-display text-base text-ink">{item.name}</h3>
              <p className="text-sm text-slate">
                {formatPrice(item.price, item.currency)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
