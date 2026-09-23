import Link from "next/link";

// Hardcoded, not Builder-driven — deliberately. Structural chrome that every
// page shares is a code decision, not a marketer-editable one; this is the
// guardrail half of "Builder is not all-or-nothing," the same story the
// promo-slot model tells from the content side.
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
