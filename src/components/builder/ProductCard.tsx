"use client";

import { resolveReference, type BuilderReference } from "@/lib/builder-refs";

type ProductCardSource = "product" | "static";

interface ProductData {
  name?: string;
  price?: number;
  currency?: string;
  slug?: string;
  images?: Array<{ image?: string }>;
  badges?: Array<{ badge?: string }>;
}

interface ProductCardProps {
  source?: ProductCardSource;
  product?: BuilderReference<ProductData> | null;
  staticName?: string;
  staticPrice?: number;
  staticCurrency?: string;
  staticImage?: string;
  staticImageAlt?: string;
  staticHref?: string;
  staticBadge?: string;
  attributes?: Record<string, unknown>;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export function ProductCard({
  source = "static",
  product,
  staticName = "Cascade 3L Shell",
  staticPrice = 389,
  staticCurrency = "USD",
  staticImage,
  staticImageAlt = "Cascade 3L Shell rain jacket in forest green",
  staticHref = "/products/cascade-3l-shell",
  staticBadge = "Best Seller",
  attributes,
}: ProductCardProps) {
  // "product" pulls live data from a referenced `product` entry; "static"
  // (the default) uses the fields below — this is the fallback every
  // data-bound component needs, since the referenced entry may not resolve.
  const resolved = source === "product" ? resolveReference(product) : undefined;

  const name = resolved?.name ?? staticName;
  const price = resolved?.price ?? staticPrice;
  const currency = resolved?.currency ?? staticCurrency;
  const href = resolved?.slug ? `/products/${resolved.slug}` : staticHref;
  const image = resolved?.images?.[0]?.image ?? staticImage;
  const badge = resolved?.badges?.[0]?.badge ?? staticBadge;
  const imageAlt = resolved?.name ?? staticImageAlt;

  return (
    <a
      {...attributes}
      href={href}
      className="group block overflow-hidden rounded-lg border border-sand bg-surface"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-alt">
        {image ? (
          <img
            src={image}
            alt={imageAlt}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-alt to-sand px-4 text-center text-sm text-slate">
            {name}
          </div>
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-medium text-surface">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-display text-base text-ink">{name}</h3>
        <p className="text-sm text-slate">{formatPrice(price, currency)}</p>
      </div>
    </a>
  );
}
