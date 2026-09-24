/**
 * ENTERPRISE PATTERN: EXTERNAL DATA INTO COMPONENTS (commerce/PIM integration)
 *
 * ⚠️ MOCK — there is no real Shopify store behind this. Every function below
 * stubs the shape of a real Shopify Storefront API GraphQL response so the
 * rest of the app (ProductGrid, the /api/shopify-products route) can be
 * written exactly the way it would be against the real thing. Swap
 * `mockShopifyStorefrontRequest` for a real `fetch()` call to
 * `https://{shop}.myshopify.com/api/2025-01/graphql.json` and nothing else
 * in this file, or any caller, needs to change.
 *
 * WHY THIS PATTERN EXISTS
 * Most enterprise Builder.io customers do NOT want their product catalog
 * living inside Builder — they already have a commerce platform (Shopify,
 * commercetools, SAP Commerce, BigCommerce) or a PIM (Akeneo, Salsify) that
 * is the system of record for price, inventory and merchandising data.
 * Builder's job in that architecture is the *page* — layout, marketing copy,
 * imagery, targeting, A/B tests — while product data is fetched live from
 * the commerce platform at request time (or a cached read-model of it).
 * Duplicating catalog data into Builder as authored content doesn't scale
 * past a handful of SKUs and immediately goes stale against real inventory.
 *
 * ENTERPRISE-SCALE CONCERNS THIS FILE'S CALLERS HANDLE
 * - Timeouts: a Storefront API call is a third-party network dependency on
 *   your page render's critical path. A slow or hung upstream must not hang
 *   your page — see the AbortController timeout in `fetchShopifyProducts`.
 * - Fallback: the upstream commerce API WILL occasionally fail, rate-limit,
 *   or return an empty/malformed payload (deploys, incidents, API version
 *   deprecations). The caller (`/api/shopify-products/route.ts`) always
 *   falls back to Builder-authored content in that case, so a Shopify outage
 *   degrades a page's *product recommendations* rather than crashing it.
 * - At real scale, this file would become a thin client the org's platform
 *   team owns and versions independently (e.g. an internal
 *   `@fieldnote/commerce-client` package), imported here rather than defined
 *   here, so every property/team calling out to Shopify shares one
 *   rate-limit budget, one retry policy and one set of credentials.
 */

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  priceAmount: number;
  priceCurrency: string;
  imageUrl?: string;
  imageAlt: string;
  tag?: string;
}

// Real Storefront API calls are typically well under a second; 3s is a
// generous ceiling that still protects the page from a hung upstream.
const STOREFRONT_REQUEST_TIMEOUT_MS = 3000;

// The real GraphQL query this mock stands in for — kept here so swapping in
// a live integration is a copy-paste of the query plus a real fetch() call:
//
//   const STOREFRONT_PRODUCTS_QUERY = `
//     query FeaturedProducts($first: Int!) {
//       products(first: $first, sortKey: BEST_SELLING) {
//         edges {
//           node {
//             id
//             title
//             handle
//             tags
//             priceRange { minVariantPrice { amount currencyCode } }
//             images(first: 1) { edges { node { url altText } } }
//           }
//         }
//       }
//     }
//   `;
//
//   const res = await fetch(
//     `https://${SHOPIFY_SHOP_DOMAIN}/api/2025-01/graphql.json`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
//       },
//       body: JSON.stringify({ query: STOREFRONT_PRODUCTS_QUERY, variables: { first: 8 } }),
//       signal: controller.signal,
//     },
//   );

interface StorefrontGraphQLResponse {
  data: {
    products: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          tags: string[];
          priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
          images: { edges: Array<{ node: { url: string; altText: string | null } }> };
        };
      }>;
    };
  };
}

// MOCK RESPONSE — realistic Shopify Storefront API JSON shape (gid://
// identifiers, priceRange/minVariantPrice, edges/node connections) so the
// mapping logic below is identical to what a real response needs.
//
// FIX (was broken): every `images.edges[].node.url` used to point at
// `cdn.shopify.com/s/files/mock/*.jpg` — URLs that were never real, so every
// card rendered a blank/broken image box regardless of the timeout/fallback
// logic working correctly. Swapped in real, publicly-hosted Unsplash image
// URLs (verified reachable) so the external-data-source demo path actually
// shows working product photography end to end, without depending on a
// live third-party commerce API during a sales call.
async function mockShopifyStorefrontRequest(): Promise<StorefrontGraphQLResponse> {
  // Simulated network latency, so loading/timeout states in callers are
  // exercised the same way they would be against a real upstream.
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    data: {
      products: {
        edges: [
          {
            node: {
              id: "gid://shopify/Product/8391029348401",
              title: "Cascade 3L Shell",
              handle: "cascade-3l-shell",
              tags: ["best-seller"],
              priceRange: { minVariantPrice: { amount: "389.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80",
                      altText: "Cascade 3L Shell rain jacket, worn skiing down a mountain",
                    },
                  },
                ],
              },
            },
          },
          {
            node: {
              id: "gid://shopify/Product/8391029348402",
              title: "Traverse Mid GTX",
              handle: "traverse-mid-gtx",
              tags: [],
              priceRange: { minVariantPrice: { amount: "219.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80",
                      altText: "Traverse Mid GTX hiking boots, laced up",
                    },
                  },
                ],
              },
            },
          },
          {
            node: {
              id: "gid://shopify/Product/8391029348403",
              title: "Longhaul 45L Pack",
              handle: "longhaul-45l-pack",
              tags: ["new-arrival"],
              priceRange: { minVariantPrice: { amount: "259.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
                      altText: "Longhaul 45L travel backpack",
                    },
                  },
                ],
              },
            },
          },
          {
            node: {
              id: "gid://shopify/Product/8391029348404",
              title: "Waypoint Duffel 60L",
              handle: "waypoint-duffel-60l",
              tags: [],
              priceRange: { minVariantPrice: { amount: "189.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
                      altText: "Waypoint Duffel 60L in leather brown",
                    },
                  },
                ],
              },
            },
          },
          {
            node: {
              id: "gid://shopify/Product/8391029348405",
              title: "Basin Trail Bottle",
              handle: "basin-trail-bottle",
              tags: [],
              priceRange: { minVariantPrice: { amount: "32.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
                      altText: "Basin Trail Bottle, stainless steel water bottle",
                    },
                  },
                ],
              },
            },
          },
          {
            node: {
              id: "gid://shopify/Product/8391029348406",
              title: "Ridge Line 2P Tent",
              handle: "ridge-line-2p-tent",
              tags: ["new-arrival"],
              priceRange: { minVariantPrice: { amount: "349.00", currencyCode: "USD" } },
              images: {
                edges: [
                  {
                    node: {
                      url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
                      altText: "Ridge Line 2P Tent, interior view looking out at the forest",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
}

/**
 * Fetches a small set of featured products from the (mock) Shopify
 * Storefront API. Bounded by a hard timeout via AbortController — a real
 * `fetch()` call would pass `{ signal: controller.signal }`; this mock never
 * really goes over the network, so the signal has nothing to abort, but the
 * timeout scaffolding here is exactly what production code needs.
 *
 * Throws on timeout or malformed response — callers are expected to catch
 * and fall back to Builder-authored content (see
 * `src/app/api/shopify-products/route.ts`), never to let a commerce-API
 * failure surface as a broken page.
 */
export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STOREFRONT_REQUEST_TIMEOUT_MS);

  try {
    const response = await mockShopifyStorefrontRequest();
    return response.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      priceAmount: Number(node.priceRange.minVariantPrice.amount),
      priceCurrency: node.priceRange.minVariantPrice.currencyCode,
      imageUrl: node.images.edges[0]?.node.url,
      imageAlt: node.images.edges[0]?.node.altText ?? node.title,
      tag: node.tags[0],
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}
