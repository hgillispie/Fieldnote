import Link from "next/link";

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
//   HARDCODED CHROME (this file, and `Footer.tsx` — plain Server Components,
//   no Builder registration, no `{...attributes}`, rendered directly in
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
  { href: "/pro", label: "Pro" },
  { href: "/card", label: "Card" },
];

export function Navbar() {
  return (
    <header className="border-b border-sand bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl text-ink">
          Fieldnote
        </Link>
        <nav className="flex gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
