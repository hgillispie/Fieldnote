// `product.badges` is `list<text>`: live entries store plain strings, but
// Builder's list editor can also emit `{ badge }` objects, so accept both.
export type ProductBadges = Array<string | { badge?: string }>;

export function firstBadge(badges: ProductBadges | null | undefined): string | undefined {
  const first = badges?.[0];
  return (typeof first === "string" ? first : first?.badge) || undefined;
}
