import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/shop-categories";

// ENTERPRISE PATTERN: SECTION MODELS — hardcoded alongside Navbar; see the
// full comment block in `src/components/Navbar.tsx` for the section-models-
// vs-hardcoded-chrome tradeoff this pairs with (reusable `promo-slot`/
// `pdp-section` Builder section models vs. zero-editorial-risk code chrome).
// Same reasoning here: a marketer shouldn't be able to change brand/legal
// chrome that appears on every page underneath them.
//
// Copy/link structure below is sourced from the Builder `footer` model's
// "Global Footer" entry (id 2dc71245c3d2476da6f91456fdab2094) — that entry
// is the source of truth for this content, but per the hardcoded-chrome
// decision above, nothing in this app fetches it at runtime. Update both
// places if the copy changes.
const LINK_COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Shop",
    // Sourced from the shared SHOP_CATEGORIES list (see that file) so this
    // column can't drift out of sync with the navbar dropdown or the
    // /shop/[category] route the way it previously did (this column used to
    // hand-maintain its own, incomplete, four-item copy of the category
    // list).
    links: SHOP_CATEGORIES.map((category) => ({
      href: `/shop/${category.slug}`,
      label: category.label,
    })),
  },
  {
    heading: "Help",
    links: [
      { href: "/help", label: "Help Center" },
      { href: "/help/shipping-returns", label: "Shipping & Returns" },
      { href: "/help/how-do-i-find-my-size", label: "Size Guide" },
      { href: "/help/repair-guarantee", label: "Repair Guarantee" },
      { href: "/help/tracking-your-order", label: "Track Order" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about-fieldnote", label: "Our Story" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/stores", label: "Stores" },
      { href: "/pro", label: "Pro & Wholesale" },
      { href: "/careers", label: "Careers" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/accessibility", label: "Accessibility" },
      { href: "/card", label: "Card Agreement" },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://youtube.com", label: "YouTube" },
  { href: "https://strava.com", label: "Strava" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-sand">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-6 py-16 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <p className="font-display text-lg font-semibold text-surface">Fieldnote</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-sand/80">
            Technical outerwear and travel gear, field-tested by our own guides before it
            ships to you.
          </p>
        </div>
        {LINK_COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-sm font-semibold text-surface">{column.heading}</p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-sand/80 transition hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-surface/10">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 py-6 text-xs text-sand/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Fieldnote Outfitters, Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-accent"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
