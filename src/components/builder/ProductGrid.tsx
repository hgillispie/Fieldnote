"use client";

// ENTERPRISE PATTERN: EXTERNAL DATA INTO COMPONENTS (Shopify-style)
//
// This component supports three data sources, chosen per-instance by the
// content editor via the `source` input (registered in
// `src/builder-registry.ts`):
//   - "builder"  — a `list` of `reference` fields to the `product` model,
//                  resolved server-side by Builder's own content API.
//   - "shopify"  — live commerce data. `apiUrl` defaults to
//                  `/api/shopify-products`, a Next.js Route Handler that
//                  calls a (clearly mocked) Shopify Storefront API on the
//                  server, with a timeout and a fallback to Builder content
//                  baked in — see `src/app/api/shopify-products/route.ts`
//                  and `src/lib/commerce/shopify.ts` for that half.
//   - "api"      — the same client-fetch code path as "shopify", pointed at
//                  any other JSON endpoint (a PIM, a different commerce
//                  platform, an internal BFF) via a custom `apiUrl`.
//
// WHY THIS COMPONENT FETCHES CLIENT-SIDE, NOT SERVER-SIDE, FOR THOSE SOURCES
// `ProductGrid` is a Builder-registered component rendered inside `<Content>`,
// which is a Client Component on this SDK (see AGENTS.md / CLAUDE.md — Gen 2
// `@builder.io/sdk-react` cannot register React Server Components, unlike
// `sdk-react-nextjs`'s `isRSC: true` mode). So the *actual* server-side work
// — calling the commerce API, applying the timeout, falling back to Builder
// content on failure — happens in the Route Handler this component's `fetch`
// call hits, not inside this component itself. This is the realistic shape
// for a Builder integration where a page has some server-fetched Builder
// content and some client-side-editable interactive blocks side by side.
//
// At real enterprise scale (50+ components, multiple brands sharing this
// library), this data-fetching concern is usually factored out further: a
// shared `useProductSource(source, apiUrl)` hook in a `@fieldnote/commerce`
// package, so every product-rendering component (grid, carousel, PDP
// recommendations, cart upsell) shares one fetch/cache/fallback
// implementation instead of each reimplementing it.
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

interface ReferencedProduct {
  data?: {
    name?: string;
    price?: number;
    currency?: string;
    slug?: string;
    images?: Array<{ image?: string }>;
    badges?: Array<{ badge?: string }>;
  };
}

interface BuilderListItem {
  product?: ReferencedProduct | null;
}

interface ProductGridProps {
  source?: ProductGridSource;
  columns?: ProductGridColumns;
  heading?: string;
  products?: BuilderListItem[];
  apiUrl?: string;
  attributes?: Record<string, unknown>;
}

// Static lookup map only, per the no-interpolated-Tailwind-classes rule.
const COLUMN_CLASSES: Record<ProductGridColumns, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// ENTERPRISE PATTERN: EXTERNAL DATA INTO COMPONENTS — client-side fallback
// This is the *second* fallback layer, distinct from the server-side
// fallback in `/api/shopify-products/route.ts`. That route already falls
// back to Builder-authored `product` entries if Shopify fails; this constant
// is the last-resort layer in case even that request never completes (e.g.
// the client is offline, or `apiUrl` is misconfigured/blank). Two fallback
// layers sounds redundant until you've been paged for a homepage that
// rendered nothing because a single upstream had a bad day — defense in
// depth on a page's most-visible, highest-traffic component is a deliberate
// choice, not overengineering.
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

function toGridProducts(items: BuilderListItem[]): GridProduct[] {
  return items
    .map((item) => item.product?.data)
    .filter(
      (data): data is NonNullable<typeof data> =>
        !!data?.name && typeof data.price === "number",
    )
    .map((data) => ({
      name: data.name as string,
      price: data.price as number,
      currency: data.currency ?? "USD",
      image: data.images?.[0]?.image,
      imageAlt: data.name as string,
      href: data.slug ? `/products/${data.slug}` : "/shop",
      badge: data.badges?.[0]?.badge,
    }));
}

function fromApiResponse(data: unknown): GridProduct[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (item): item is { name: string; price: number; href: string } & Record<string, unknown> =>
        typeof item?.name === "string" &&
        typeof item?.price === "number" &&
        typeof item?.href === "string",
    )
    .map((item) => ({
      name: item.name,
      price: item.price,
      currency: typeof item.currency === "string" ? item.currency : "USD",
      image: typeof item.image === "string" ? item.image : undefined,
      imageAlt: typeof item.imageAlt === "string" ? item.imageAlt : item.name,
      href: item.href,
      badge: typeof item.badge === "string" ? item.badge : undefined,
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
        const items = fromApiResponse(data);
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
