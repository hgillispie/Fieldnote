"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

// ENTERPRISE PATTERN: SECTION MODELS — the "keep it in code" side, again
//
// Sort order on a category listing page is real, working interactivity —
// not a mock — but it is deliberately NOT a Builder input. A content editor
// has no reason to add a sort mode or change the default; this is query and
// UI logic that lives in the codebase, same as the cart and checkout logic
// nothing in this app routes through Builder either. See
// `src/app/shop/[category]/page.tsx` for the server-side half (reading
// `?sort=` and ordering the already-fetched product list).
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
] as const;

interface ShopSortControlProps {
  value: string;
}

export function ShopSortControl({ value }: ShopSortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate">
      Sort
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-md border border-sand bg-surface px-2 py-1.5 text-ink"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
