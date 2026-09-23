import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, decodeDemoSession } from "@/lib/demo-session";

/**
 * ENTERPRISE PATTERN: TARGETING (reading attributes on every request)
 *
 * This file is Next.js 16's renamed `middleware.ts` → `proxy.ts` file
 * convention (the exported function is renamed `middleware` → `proxy` to
 * match — see AGENTS.md's warning that this Next.js version has real
 * breaking changes from what training data expects). Proxy runs on every
 * matched request before any route handler or page component — including
 * requests for statically cached/ISR pages — and, as of this Next.js
 * version, defaults to the **Node.js runtime** rather than the old Edge
 * runtime, which is what makes using Node's `crypto` module in
 * `src/lib/demo-session.ts` (HMAC signing) work here without any extra
 * runtime configuration.
 *
 * That makes this the right place to do cheap, request-wide work like "read
 * the session cookie and make its attributes available downstream," and the
 * wrong place to do anything expensive: proxy runs far more often than any
 * individual page re-renders, so slow logic here is a global latency tax on
 * the whole site.
 *
 * This proxy verifies the signed demo-session cookie (see
 * `src/lib/demo-session.ts` for why it's signed) and forwards the resulting
 * attributes as plain request headers (`x-fn-*`). Downstream Server
 * Components and Route Handlers that are *already* dynamic for their own
 * reasons (e.g. `src/app/demo-switcher/page.tsx`, which reads `cookies()`
 * anyway) can read those headers via `headers()` and pass them straight into
 * a Builder `fetchOneEntry`/`fetchEntries` call as `userAttributes`, without
 * each of them re-implementing cookie parsing and HMAC verification.
 *
 * IMPORTANT — this proxy forwarding headers does NOT, by itself, make any
 * page dynamic or bypass ISR. Proxy runs regardless of a route's caching
 * mode. It's only the *page* choosing to call `headers()`/`cookies()` that
 * opts that specific route out of static rendering — see the caching
 * comment block in `src/app/page.tsx` for why the homepage deliberately does
 * NOT do that, even though these headers are available to it.
 */
export function proxy(request: NextRequest) {
  const attributes = decodeDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

  const headers = new Headers(request.headers);
  headers.set("x-fn-customer-tier", attributes.customerTier ?? "");
  headers.set("x-fn-lifecycle-stage", attributes.lifecycleStage ?? "");
  headers.set("x-fn-has-pro-account", String(attributes.hasProAccount ?? false));
  headers.set("x-fn-market", attributes.market ?? "");
  headers.set("x-fn-campaign-source", attributes.campaignSource ?? "");
  headers.set("x-fn-device", attributes.device ?? "");

  return NextResponse.next({ request: { headers } });
}

// Skip static assets and Next.js internals — running this on every image
// and JS chunk request would be pure overhead with nothing to forward.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
