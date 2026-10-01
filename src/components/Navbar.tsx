"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEMO_LOCALE_OPTIONS } from "@/lib/locale";

// ENTERPRISE PATTERN: SECTION MODELS — the "keep it in code" side of the
// tradeoff
//
// Hardcoded, not Builder-driven — deliberately. Structural chrome that every
// page shares is a code decision, not a marketer-editable one; this is the
// guardrail half of "Builder is not all-or-nothing," the same story the
// promo-slot model tells from the content side.
//
// This app's `nav` and `footer` *content models* still exist in the Builder
// space (`component`-kind, i.e. section models — same category as
// `homepage`, `promo-slot`, `pdp-section`) but nothing in this codebase
// fetches them. That split is the point of this comment, not an oversight:
//
//   SECTION MODELS (Builder-driven, `uiBlocks`-backed, editor-insertable):
//     - `homepage` — mounted once, at `/`. A section model rather than a
//       `page` model because it has no URL-routing fields of its own; a page
//       model owns SEO/routing metadata a homepage-singleton doesn't need.
//     - `promo-slot` — small, *reusable* blocks with a `slotId` enum
//       (`pdp-upper`, `plp-tile`, `cart-upsell`, `global-banner`) that get
//       dropped into many different pages/PDPs by reference. This is where
//       section models earn their name: the same promo entry can be reused
//       across hundreds of product pages without copy-pasting content, and a
//       marketer can update the entry once to change it everywhere it's
//       referenced.
//     - `pdp-section` — below-the-fold PDP content, similarly reusable
//       across many product detail pages.
//     Tradeoff: maximum editorial flexibility (any block, any layout, per
//     entry) at the cost of zero structural guarantees — nothing stops an
//     editor from doing something layout-breaking inside a `uiBlocks` field
//     short of the `childRequirements` guardrails individual components
//     define (see `Section`'s anti-self-nesting rule).
//
//   HARDCODED CHROME (this file, and `Footer.tsx` — plain components, no
//   Builder registration, no `{...attributes}`, rendered directly in
//   `src/app/layout.tsx` so every route gets them automatically):
//     Tradeoff: zero editorial flexibility (a marketer cannot add/remove a
//     nav link without a code change and a deploy) in exchange for total
//     structural and brand-governance certainty. For chrome that appears on
//     every single page of a regulated or brand-sensitive property, "a
//     marketer can't accidentally break this" is worth more than "a marketer
//     can self-serve edit this." Hunter's framing on this build, verbatim in
//     intent: "you wouldn't want marketers changing those things."
//
//   Why not split the difference with a `nav-config` *data* model instead?
//   That model does exist in this space (fully localized nav labels + mega-
//   menu structure) as exactly that middle ground — structured, editable
//   *content* (labels, hrefs) without `uiBlocks`' unbounded layout freedom.
//   It's unused by this app for the same reason as `nav`/`footer`: this
//   build's deliberate call was full code ownership of chrome, not partial.
//   A real org would very plausibly land on `nav-config` instead of this
//   file being fully hardcoded — worth flagging to a prospect as the
//   available middle tier, not just the two extremes shown here.
//
// At real org scale (multiple brands, multiple teams), this decision is
// typically made per-surface, not globally: a marketing team might own
// campaign-landing-page chrome as full section models, while a platform
// team locks down the primary nav/footer across every brand exactly like
// this file does, specifically so no single content editor can take down
// global navigation on a high-traffic property.
const NAV_LINKS = [
  { href: "/help", label: "Help" },
  { href: "/blog", label: "Blog" },
  { href: "/pro", label: "Pro" },
  { href: "/card", label: "Card" },
];

// Mirrors the `product.category` enum in `src/app/products/[slug]/page.tsx`
// (`ProductCategory`), plus one curated, non-category filter ("New
// Arrivals") -- same split `Footer.tsx`'s "Shop" column already uses.
// Kept here as a single source so the navbar dropdown, the mobile
// accordion, and the footer don't drift out of sync as categories change.
const SHOP_CATEGORIES = [
  { href: "/shop/jackets", label: "Jackets & Shells" },
  { href: "/shop/packs", label: "Packs & Bags" },
  { href: "/shop/footwear", label: "Footwear" },
  { href: "/shop/layers", label: "Layering" },
  { href: "/shop/accessories", label: "Accessories" },
  { href: "/shop/camp-travel", label: "Camp & Travel" },
  { href: "/shop/new", label: "New Arrivals" },
];

const CART_ITEM_COUNT = 2;

function MarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 20 10 5l3 6 3-4 5 13" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4.2-6 7.5-6s6 2 7.5 6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1.2 11.02a2 2 0 0 1-2 1.98H9.2a2 2 0 0 1-2-1.98L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Demo-only: switches the `?locale=` query param so a live sales demo can
// change locale without hand-editing the URL. Isolated in its own
// `Suspense` boundary (below) since `useSearchParams` requires one.
function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("locale") ?? "";

  function handleChange(event: { target: { value: string } }) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("locale", value);
    } else {
      params.delete("locale");
    }
    const query = params.toString();
    router.push(pathname + (query ? "?" + query : ""));
  }

  return (
    <select
      aria-label="Locale"
      value={current}
      onChange={handleChange}
      className="rounded-full border border-surface/20 bg-primary px-2 py-1 text-xs font-medium text-sand/90 transition hover:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {DEMO_LOCALE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value} className="text-ink">
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopMobileOpen, setShopMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-primary text-sand transition-shadow ${
        scrolled ? "shadow-lg shadow-black/20" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-surface"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-accent">
            <MarkIcon />
          </span>
          <span className="font-display text-xl font-semibold uppercase tracking-wide">
            Fieldnote
          </span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8">
          <div className="group relative">
            <Link
              href="/shop"
              className="flex items-center gap-1 text-sm font-medium tracking-wide text-sand/90 transition hover:text-accent"
            >
              Shop
              <ChevronIcon />
            </Link>
            {/* Hover-and-focus dropdown, CSS-only -- no JS state needed on
                desktop since a plain `group-hover`/`group-focus-within`
                panel covers both mouse and keyboard without a click
                handler that would also have to manage outside-click
                dismissal. The invisible `pt-3` spacer keeps the panel
                reachable by mouse across the gap instead of closing the
                moment the cursor leaves the link. */}
            <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="min-w-56 rounded-lg border border-surface/10 bg-primary py-2 shadow-xl shadow-black/30">
                {SHOP_CATEGORIES.map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    className="block px-4 py-2 text-sm text-sand/90 transition hover:bg-surface/10 hover:text-accent"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wide text-sand/90 transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
          <button
            type="button"
            aria-label="Search"
            className="hidden rounded-full p-2 text-sand/90 transition hover:bg-surface/10 hover:text-accent sm:inline-flex"
          >
            <SearchIcon />
          </button>
          <Link
            href="/account"
            aria-label="Account"
            className="rounded-full p-2 text-sand/90 transition hover:bg-surface/10 hover:text-accent"
          >
            <AccountIcon />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-full p-2 text-sand/90 transition hover:bg-surface/10 hover:text-accent"
          >
            <CartIcon />
            {CART_ITEM_COUNT > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-surface">
                {CART_ITEM_COUNT}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="ml-1 rounded-full p-2 text-sand/90 transition hover:bg-surface/10 hover:text-accent md:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-surface/10 bg-primary md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-6 py-3">
            <div className="border-b border-surface/10 pb-1">
              <div className="flex items-center justify-between">
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium tracking-wide text-sand/90 transition hover:text-accent"
                >
                  Shop
                </Link>
                <button
                  type="button"
                  aria-label={shopMobileOpen ? "Collapse shop categories" : "Expand shop categories"}
                  aria-expanded={shopMobileOpen}
                  onClick={() => setShopMobileOpen((open) => !open)}
                  className="p-2.5 text-sand/90 transition hover:text-accent"
                >
                  <span
                    className={`block transition-transform duration-150 ${shopMobileOpen ? "rotate-180" : ""}`}
                  >
                    <ChevronIcon />
                  </span>
                </button>
              </div>
              {shopMobileOpen && (
                <div className="flex flex-col pb-2 pl-3">
                  {SHOP_CATEGORIES.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      onClick={() => setMobileOpen(false)}
                      className="py-2 text-sm text-sand/80 transition hover:text-accent"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm font-medium tracking-wide text-sand/90 transition hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
