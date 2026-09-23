import { NextResponse } from "next/server";
import { fetchEntries } from "@builder.io/sdk-react";
import { fetchShopifyProducts } from "@/lib/commerce/shopify";
import { BUILDER_API_KEY } from "@/lib/builder-config";

// ENTERPRISE PATTERN: EXTERNAL DATA INTO COMPONENTS (Shopify-style), server side
//
// This route is the server-side half of the pattern documented in
// `src/lib/commerce/shopify.ts`. It exists as a Next.js Route Handler
// (rather than fetching Shopify directly from the browser) for three
// reasons that matter at enterprise scale:
//
//   1. Credentials never reach the client. A real Storefront API call needs
//      an access token; a Route Handler runs server-side, so the token stays
//      out of the bundle and out of devtools' Network tab.
//   2. One place to enforce the timeout + fallback contract. `ProductGrid`
//      (a client component, since it's rendered inside Builder's `<Content>`
//      — see AGENTS.md on why Builder components here can't be RSCs) just
//      calls `fetch(apiUrl)` like it would for any other JSON API. It doesn't
//      need to know or care that "apiUrl" might be backed by Shopify, a PIM,
//      or a hand-rolled Builder fallback — that decision is centralized here.
//   3. Response shape normalization. Shopify's GraphQL shape (`gid://...`
//      ids, `priceRange.minVariantPrice`, `edges`/`node` connections) is
//      normalized here into the flat `{ name, price, currency, image,
//      imageAlt, href, badge }` shape every product-rendering component in
//      this app already expects — so swapping the upstream commerce platform
//      later (Shopify → commercetools, say) only touches this one file.
//
// FALLBACK STRATEGY — why you almost always want one in production
// A commerce platform's API is a dependency you don't control the uptime of.
// If Shopify has an incident, or this specific query starts erroring after a
// Storefront API version bump, the failure mode here is "the grid shows
// Builder-authored products instead of live ones" — never a broken page, a
// loading spinner that never resolves, or a 500. That's a deliberate
// trade-off: slightly-stale/generic product data beats a broken storefront,
// especially on a homepage or landing page where the products shown are
// "featured picks," not a cart or checkout flow where stale data is
// unacceptable for a different reason (you'd want a hard failure there, not
// a silent fallback — this pattern is for merchandising surfaces, not
// transactional ones).
export async function GET() {
  try {
    const products = await fetchShopifyProducts();

    if (products.length === 0) {
      throw new Error("Shopify Storefront API returned zero products");
    }

    return NextResponse.json(
      products.map((product) => ({
        name: product.title,
        price: product.priceAmount,
        currency: product.priceCurrency,
        image: product.imageUrl,
        imageAlt: product.imageAlt,
        href: `/products/${product.handle}`,
        badge: product.tag === "best-seller" ? "Best Seller" : product.tag === "new-arrival" ? "New" : undefined,
      })),
    );
  } catch (error) {
    console.error(
      "Shopify Storefront API call failed — falling back to Builder-authored product content:",
      error,
    );

    // Fallback: the same `product` model ProductCard/ProductGrid already
    // know how to render, queried directly via the server-side `fetchEntries`
    // call rather than routed through Builder content authoring. This is the
    // "degrade to Builder content" half of the pattern — if the external
    // commerce API is down, editors' own product entries stand in for it.
    const fallback = await fetchEntries({
      apiKey: BUILDER_API_KEY,
      model: "product",
      limit: 4,
      omit: "data.blocks",
    }).catch(() => []);

    return NextResponse.json(
      fallback
        .filter((entry) => entry.data?.name && typeof entry.data?.price === "number")
        .map((entry) => ({
          name: entry.data?.name,
          price: entry.data?.price,
          currency: entry.data?.currency ?? "USD",
          image: entry.data?.images?.[0]?.image,
          imageAlt: entry.data?.name,
          href: entry.data?.slug ? `/products/${entry.data.slug}` : "/shop",
          badge: entry.data?.badges?.[0]?.badge,
        })),
    );
  }
}
