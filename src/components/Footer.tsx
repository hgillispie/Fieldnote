import Link from "next/link";

// ENTERPRISE PATTERN: SECTION MODELS — hardcoded alongside Navbar; see the
// full comment block in `src/components/Navbar.tsx` for the section-models-
// vs-hardcoded-chrome tradeoff this pairs with (reusable `promo-slot`/
// `pdp-section` Builder section models vs. zero-editorial-risk code chrome).
// Same reasoning here: a marketer shouldn't be able to change brand/legal
// chrome that appears on every page underneath them.
export function Footer() {
  return (
    <footer className="border-t border-sand bg-surface-alt">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-lg text-ink">Fieldnote</p>
          <p className="mt-1 text-sm text-slate">Gear for the long way round.</p>
        </div>
        <nav className="flex gap-6">
          <Link href="/help" className="text-sm text-slate transition hover:text-ink">
            Help
          </Link>
          <Link href="/pro" className="text-sm text-slate transition hover:text-ink">
            Pro
          </Link>
          <Link href="/card" className="text-sm text-slate transition hover:text-ink">
            Card
          </Link>
        </nav>
      </div>
      <div className="border-t border-sand px-6 py-4 text-center text-xs text-slate">
        © {new Date().getFullYear()} Fieldnote. All rights reserved.
      </div>
    </footer>
  );
}
