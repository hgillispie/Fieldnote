"use client";

import "./globals.css";

// A real error boundary regardless of the Next.js 16 /_global-error build
// bug documented in CLAUDE.md (npm run build fails prerendering this route
// with a useContext-on-null crash, upstream and unfixed as of this
// writing). Neither this file's existence nor force-dynamic below actually
// avoids that crash — both were tried and confirmed not to help. Kept as
// force-dynamic anyway since a runtime crash boundary has no reason to be
// statically cached, but the build failure itself is tracked separately,
// not solved by anything in this file.
export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-ink">
        <h1 className="font-display text-2xl">Something went wrong on our end</h1>
        <p className="max-w-md text-sm text-slate">
          The page hit an unexpected error. Reload to try again, or head back to the homepage.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
