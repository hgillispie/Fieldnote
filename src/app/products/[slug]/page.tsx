import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOneEntry } from "@builder.io/sdk-react";
import type { BuilderContent } from "@builder.io/sdk-react";
import DOMPurify from "isomorphic-dompurify";
import { builderFetch } from "@/lib/builder-fetch";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { firstBadge, type ProductBadges } from "@/lib/product-badges";
import { resolveLocalizedValue } from "@/lib/builder-refs";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface ProductImage {
  image?: string;
}

interface ProductColor {
  name?: string;
  hex?: string;
  swatchImage?: string;
}

interface ProductSize {
  size?: string;
}

type ProductCategory =
  | "Outerwear"
  | "Packs & Bags"
  | "Footwear"
  | "Layers"
  | "Accessories"
  | "Camp & Travel";

interface ProductData {
  sku?: string;
  name?: string;
  slug?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  images?: ProductImage[];
  category?: ProductCategory;
  colors?: ProductColor[];
  sizes?: ProductSize[];
  badges?: ProductBadges;
  description?: string | Record<string, string>;
  shortDescription?: string | Record<string, string>;
  materials?: string | Record<string, string>;
  inStock?: boolean;
}

// React.cache dedupes this within a single request lifecycle, so
// generateMetadata and the page component share one Builder round-trip
// instead of paying for two.
const fetchProduct = cache(async (slug: string): Promise<BuilderContent | null> => {
  return fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "product",
    query: {
      "data.slug": slug,
    },
    enrich: true,
  }).catch(() => null);
});

const fetchPdpSection = cache(async (productId: string): Promise<BuilderContent | null> => {
  return fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "pdp-section",
    query: {
      "data.previewProduct.id": productId,
    },
    enrich: true,
  }).catch(() => null);
});

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const data = (product.data ?? {}) as ProductData;
  const image = data.images?.[0]?.image;

  return {
    title: data.name,
    description: resolveLocalizedValue(data.shortDescription),
    ...(image ? { openGraph: { images: [image] } } : {}),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const data = (product.data ?? {}) as ProductData;
  const currency = data.currency ?? "USD";
  const price = data.price ?? 0;
  const hasCompareAtPrice =
    typeof data.compareAtPrice === "number" && data.compareAtPrice > price;
  const badge = firstBadge(data.badges);
  const images = data.images?.filter((item) => !!item.image) ?? [];
  const inStock = data.inStock ?? true;

  const pdpSection = product.id ? await fetchPdpSection(product.id) : null;
  const shortDescription = resolveLocalizedValue(data.shortDescription);
  const materials = resolveLocalizedValue(data.materials);
  const description = resolveLocalizedValue(data.description);
  const safeDescription = description ? DOMPurify.sanitize(description) : null;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/shop" className="text-sm text-slate hover:text-ink">
          &larr; Back to shop
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-sand bg-surface-alt">
              {images[0]?.image ? (
                <img
                  src={images[0].image}
                  alt={data.name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate">
                  {data.name}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(1).map((item, index) => (
                  <div
                    key={`${item.image}-${index}`}
                    className="aspect-square overflow-hidden rounded-md border border-sand bg-surface-alt"
                  >
                    <img
                      src={item.image}
                      alt={data.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {data.category && (
                  <span className="text-xs font-medium uppercase tracking-wide text-slate">
                    {data.category}
                  </span>
                )}
                {badge && (
                  <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-surface">
                    {badge}
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl text-ink">{data.name}</h1>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xl text-ink">{formatPrice(price, currency)}</span>
                {hasCompareAtPrice && (
                  <span className="text-sm text-slate line-through">
                    {formatPrice(data.compareAtPrice as number, currency)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium">
                {inStock ? (
                  <span className="text-success">In stock</span>
                ) : (
                  <span className="text-danger">Out of stock</span>
                )}
              </p>
            </div>

            {shortDescription && (
              <p className="text-base text-slate">{shortDescription}</p>
            )}

            <ProductPurchasePanel
              colors={data.colors ?? []}
              sizes={data.sizes ?? []}
              inStock={inStock}
            />

            {safeDescription && (
              <div
                className="prose max-w-none text-sm text-ink"
                dangerouslySetInnerHTML={{ __html: safeDescription }}
              />
            )}

            {materials && (
              <div>
                <p className="text-sm font-semibold text-ink">Materials</p>
                <p className="mt-1 text-sm text-slate">{materials}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {pdpSection && (
        <RenderBuilderContent content={pdpSection} model="pdp-section" />
      )}
    </main>
  );
}
