import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchEntries, fetchOneEntry } from "@builder.io/sdk-react";
import { builderFetch } from "@/lib/builder-fetch";
import { BUILDER_API_KEY } from "@/lib/builder-config";
import { RenderBuilderContent } from "@/components/RenderBuilderContent";
import { ShopSortControl } from "@/components/ShopSortControl";
import { SHOP_CATEGORIES, getShopCategory } from "@/lib/shop-categories";
import { firstBadge, type ProductBadges } from "@/lib/product-badges";

/**
 * ENTERPRISE PATTERN: NOT EVERYTHING IS BUILDER CONTENT
 *
 * This route replaces what used to be seven separate Builder `page`
 * entries — "Shop — Jackets", "Shop — Footwear", "Shop — Accessories", and
 * so on — that were really one template wearing seven different hats. Each
 * one had an identical Hero + ProductGrid shape and differed only in a
 * heading string and which `product` entries it referenced by ID. That's
 * exactly the kind of content that *looks* like it needs a content team's
 * flexibility but is actually a parameterized view over structured data: the
 * category, the sort order, and the product query are a routing and
 * filtering concern, not an editorial one. Collapsing it into one dynamic
 * segment (`[category]`) is the same move as using a database table instead
 * of a spreadsheet per row.
 *
 * This is the direct counterpart to the PDP's own "not all-or-nothing"
 * story (see the `promo-slot` fetch below, and `Navbar.tsx`'s comment block
 * on section models): most of THIS page is hardcoded React — the header,
 * the sort control, the grid markup, the product query — because a content
 * editor has no reason to touch sort order or a Builder query any more than
 * they'd hand-edit a SQL WHERE clause. The one thing this template exposes
 * to the content team is a single named slot, fetched by `slotId` below,
 * the same way a real PLP might carry one merchandising tile a marketer
 * controls while engineering owns everything else on the page.
 *
 * Compare this to `src/app/[...slug]/page.tsx`'s fully Builder-owned
 * `landing-page`/`page` models — that's the opposite end of the same
 * spectrum, for pages where the content team SHOULD own the whole canvas
 * (a campaign page, a one-off editorial page). Picking which end of that
 * spectrum a given surface belongs on is a per-surface decision, not a
 * platform limitation either way.
 */
export const revalidate = 60;

interface ShopCategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
}

interface ProductListItem {
  name?: string;
  price?: number;
  currency?: string;
  slug?: string;
  images?: Array<{ image?: string }>;
  badges?: ProductBadges;
}

const SORT_VALUES = ["featured", "price-asc", "price-desc", "name"] as const;
type SortValue = (typeof SORT_VALUES)[number];

function normalizeSort(value: string | string[] | undefined): SortValue {
  const first = Array.isArray(value) ? value[0] : value;
  return (SORT_VALUES as readonly string[]).includes(first ?? "")
    ? (first as SortValue)
    : "featured";
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

// Every known category/slug combination is known at build time — no reason
// to make Next.js discover these via the catch-all or guess at runtime.
export function generateStaticParams() {
  return SHOP_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: ShopCategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getShopCategory(slug);

  if (!category) {
    return { title: "Shop — Fieldnote" };
  }

  return {
    title: `${category.label} — Fieldnote`,
    description: category.blurb,
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: ShopCategoryPageProps) {
  const { category: slug } = await params;
  const category = getShopCategory(slug);

  if (!category) {
    notFound();
  }

  const sort = normalizeSort((await searchParams).sort);

  // The query itself is the other half of "not Builder content": which
  // products show up here is a filter over the `product` data model, run
  // directly against Builder's content API — not a hand-picked, hand-
  // maintained list of references living inside a page entry that someone
  // has to remember to update every time the catalog changes.
  const entries = await fetchEntries({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "product",
    limit: 100,
    omit: "data.blocks",
  }).catch(() => []);

  let products: ProductListItem[] = entries
    .map((entry) => entry.data as ProductListItem | undefined)
    .filter((data): data is ProductListItem => !!data?.name && typeof data.price === "number")
    .filter((data) =>
      category.categoryValue
        ? (data as { category?: string }).category === category.categoryValue
        : (data.badges ?? []).some(
            (badge) => (typeof badge === "string" ? badge : badge?.badge) === category.badge,
          ),
    );

  // Hardcoded, deterministic sort — see `ShopSortControl.tsx`'s comment for
  // why this is a code concern rather than an editorial one.
  if (sort === "price-asc") {
    products = [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sort === "price-desc") {
    products = [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else if (sort === "name") {
    products = [...products].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }

  // The one piece of this page a content editor actually owns: a single
  // reusable `promo-slot` entry (slotId `plp-tile`), the same entry shown
  // on every category page rather than copy-pasted into seven. Edit it
  // once in Builder, it updates everywhere this slot is rendered.
  const promoSlot = await fetchOneEntry({
    fetch: builderFetch,
    apiKey: BUILDER_API_KEY,
    model: "promo-slot",
    query: { "data.slotId": "plp-tile" },
    enrich: true,
  }).catch(() => null);

  return (
    <main className="flex-1">
      <div className="border-b border-sand bg-surface-alt">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link href="/shop" className="text-sm text-slate hover:text-ink">
            &larr; All gear
          </Link>
          <h1 className="mt-2 font-display text-3xl text-ink">{category.label}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate">{category.blurb}</p>
        </div>
      </div>

      {promoSlot && (
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <RenderBuilderContent content={promoSlot} model="promo-slot" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
          <ShopSortControl value={sort} />
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-slate">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <a
                key={product.slug}
                href={`/products/${product.slug}`}
                className="group block overflow-hidden rounded-lg border border-sand bg-surface"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-alt">
                  {product.images?.[0]?.image ? (
                    <img
                      src={product.images[0].image}
                      alt={product.name ?? ""}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-alt to-sand px-4 text-center text-sm text-slate">
                      {product.name}
                    </div>
                  )}
                  {firstBadge(product.badges) && (
                    <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-medium text-surface">
                      {firstBadge(product.badges)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 p-5">
                  <h3 className="font-display text-base text-ink">{product.name}</h3>
                  <p className="text-sm text-slate">
                    {formatPrice(product.price ?? 0, product.currency ?? "USD")}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
