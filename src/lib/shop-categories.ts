// ENTERPRISE PATTERN: ONE SOURCE OF TRUTH FOR A SLUG FAMILY
//
// Before this file existed, "which shop categories exist, what do we call
// them, and what URL do they live at" was answered three different places —
// a hardcoded array in `Navbar.tsx`, a second (drifted, incomplete) copy in
// `Footer.tsx`, and seven nearly-identical Builder `page` entries (one per
// category) that differed only in heading text and which products they
// referenced. That's three places to update, and three places that can
// silently disagree, every time a category is renamed or added.
//
// This is also the fix for a specific content-modeling mistake: those seven
// Builder pages were never really seven different *pages* — they were one
// page template with a category parameter. A content editor doesn't own
// sort order, the product query, or which URL pattern category pages live
// at; that's an engineering concern, same as cart or checkout logic. So the
// template is a real Next.js dynamic route (`src/app/shop/[category]/
// page.tsx`) driven entirely by this file, and the only thing left for a
// content editor to own on that template is the single `promo-slot` entry
// (slotId `plp-tile`) it renders — the same "one named band, not the whole
// page" pattern `pdp-upper` is meant to demonstrate on a product page.
//
// `categoryValue` is the exact string stored in the `product` model's
// `category` enum (see `src/app/products/[slug]/page.tsx`). `New Arrivals`
// isn't a real category on any product — it's a curated cross-category
// filter on the `badges` field — so it's the one entry with
// `categoryValue: null` and `badge: "New"` instead.
export interface ShopCategory {
  slug: string;
  label: string;
  /** Exact value of `product.category` this slug filters on, or `null` for
   * the curated "New Arrivals" badge-based filter. */
  categoryValue: string | null;
  /** Set only for the badge-filtered curated category. */
  badge?: string;
  blurb: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    slug: "jackets",
    label: "Jackets & Shells",
    categoryValue: "Outerwear",
    blurb: "Rain shells, down parkas and softshells for real weather.",
  },
  {
    slug: "packs",
    label: "Packs & Bags",
    categoryValue: "Packs & Bags",
    blurb: "Daypacks, travel duffels and expedition packs.",
  },
  {
    slug: "footwear",
    label: "Footwear",
    categoryValue: "Footwear",
    blurb: "Hiking boots, trail runners and camp shoes.",
  },
  {
    slug: "layers",
    label: "Layering",
    categoryValue: "Layers",
    blurb: "Merino base layers, fleece and insulated mid-layers.",
  },
  {
    slug: "accessories",
    label: "Accessories",
    categoryValue: "Accessories",
    blurb: "Hats, socks, gaiters and the small gear that makes the big gear work better.",
  },
  {
    slug: "camp-travel",
    label: "Camp & Travel",
    categoryValue: "Camp & Travel",
    blurb: "Tents, sleeping bags, cook sets and more.",
  },
  {
    slug: "new",
    label: "New Arrivals",
    categoryValue: null,
    badge: "New",
    blurb: "The newest gear across every category, just landed.",
  },
];

export function getShopCategory(slug: string): ShopCategory | undefined {
  return SHOP_CATEGORIES.find((category) => category.slug === slug);
}
